-- ====================================================================
-- RouteRescue AI - PostgreSQL Schema Migration: 000001_initial_schema
-- Production-grade schema with UUIDs, constraints, and timestamps
-- ====================================================================

-- Enable pgcrypto or uuid-ossp for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 2. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    default_objective TEXT NOT NULL DEFAULT 'balance_time_distance'
        CHECK (default_objective IN ('minimize_distance', 'balance_time_distance', 'prioritize_urgent', 'balance_workload')),
    distance_unit TEXT NOT NULL DEFAULT 'km' CHECK (distance_unit IN ('km','mi')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 3. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    capacity NUMERIC NOT NULL CHECK (capacity > 0),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','active','unavailable','maintenance')),
    operating_cost_per_km NUMERIC CHECK (operating_cost_per_km IS NULL OR operating_cost_per_km >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Delivery Stops
CREATE TABLE IF NOT EXISTS delivery_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    demand NUMERIC NOT NULL DEFAULT 1 CHECK (demand >= 0),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    earliest_service_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    service_duration_minutes INTEGER NOT NULL DEFAULT 5 CHECK (service_duration_minutes >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','assigned','in_transit','completed','cancelled')),
    tracking_token TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_deadline_after_earliest CHECK (
        earliest_service_at IS NULL OR deadline_at IS NULL OR deadline_at >= earliest_service_at
    )
);

CREATE INDEX IF NOT EXISTS idx_delivery_stops_user_id ON delivery_stops(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_status ON delivery_stops(status);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_priority ON delivery_stops(priority);
CREATE INDEX IF NOT EXISTS idx_delivery_stops_tracking_token ON delivery_stops(tracking_token);

CREATE TRIGGER update_delivery_stops_updated_at
BEFORE UPDATE ON delivery_stops
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Optimization Runs
CREATE TABLE IF NOT EXISTS optimization_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    calculation_mode TEXT NOT NULL CHECK (calculation_mode IN ('live','estimated','simulated','demo')),
    input_snapshot JSONB NOT NULL,
    baseline_metrics JSONB NOT NULL,
    optimized_metrics JSONB NOT NULL,
    result_snapshot JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running','completed','failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_optimization_runs_user_id ON optimization_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_optimization_runs_created_at ON optimization_runs(created_at DESC);

-- 6. Route Assignments
CREATE TABLE IF NOT EXISTS route_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    total_distance_km NUMERIC NOT NULL DEFAULT 0 CHECK (total_distance_km >= 0),
    estimated_duration_minutes NUMERIC NOT NULL DEFAULT 0 CHECK (estimated_duration_minutes >= 0),
    utilization_percent NUMERIC CHECK (utilization_percent IS NULL OR (utilization_percent >= 0 AND utilization_percent <= 100)),
    route_geometry JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_assignments_run_id ON route_assignments(run_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_user_id ON route_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_vehicle_id ON route_assignments(vehicle_id);

-- 7. Route Stops
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES route_assignments(id) ON DELETE CASCADE,
    delivery_stop_id UUID REFERENCES delivery_stops(id) ON DELETE SET NULL,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 0),
    estimated_arrival_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_assignment_sequence UNIQUE (assignment_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_route_stops_assignment_id ON route_stops(assignment_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_delivery_stop_id ON route_stops(delivery_stop_id);

-- 8. Disruption Scenarios
CREATE TABLE IF NOT EXISTS disruption_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    baseline_run_id UUID NOT NULL REFERENCES optimization_runs(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('traffic','road_closure','vehicle_breakdown','urgent_delivery')),
    configuration JSONB NOT NULL,
    result_snapshot JSONB,
    calculation_mode TEXT NOT NULL CHECK (calculation_mode IN ('estimated','simulated','demo')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disruption_scenarios_user_id ON disruption_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_disruption_scenarios_baseline ON disruption_scenarios(baseline_run_id);

-- 9. AI Advisories
CREATE TABLE IF NOT EXISTS ai_advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    run_id UUID REFERENCES optimization_runs(id) ON DELETE SET NULL,
    scenario_id UUID REFERENCES disruption_scenarios(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    response JSONB NOT NULL,
    provider TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_advisories_user_id ON ai_advisories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_advisories_created_at ON ai_advisories(created_at DESC);
