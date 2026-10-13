-- ====================================================================
-- RouteRescue AI - PostgreSQL Row Level Security (RLS) Policies
-- Strict isolation ensuring no user can access another user's fleet
-- ====================================================================

-- 1. Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. User Preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles"
    ON vehicles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
    ON vehicles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
    ON vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Delivery Stops
ALTER TABLE delivery_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery stops"
    ON delivery_stops FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery stops"
    ON delivery_stops FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own delivery stops"
    ON delivery_stops FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own delivery stops"
    ON delivery_stops FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Optimization Runs
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own optimization runs"
    ON optimization_runs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimization runs"
    ON optimization_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimization runs"
    ON optimization_runs FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Route Assignments
ALTER TABLE route_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own route assignments"
    ON route_assignments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own route assignments"
    ON route_assignments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own route assignments"
    ON route_assignments FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Route Stops (Checked via assignment ownership)
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own route stops"
    ON route_stops FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM route_assignments ra
            WHERE ra.id = route_stops.assignment_id
              AND ra.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own route stops"
    ON route_stops FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM route_assignments ra
            WHERE ra.id = route_stops.assignment_id
              AND ra.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own route stops"
    ON route_stops FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM route_assignments ra
            WHERE ra.id = route_stops.assignment_id
              AND ra.user_id = auth.uid()
        )
    );

-- 8. Disruption Scenarios
ALTER TABLE disruption_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disruption scenarios"
    ON disruption_scenarios FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own disruption scenarios"
    ON disruption_scenarios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own disruption scenarios"
    ON disruption_scenarios FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own disruption scenarios"
    ON disruption_scenarios FOR DELETE
    USING (auth.uid() = user_id);

-- 9. AI Advisories
ALTER TABLE ai_advisories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ai advisories"
    ON ai_advisories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai advisories"
    ON ai_advisories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai advisories"
    ON ai_advisories FOR DELETE
    USING (auth.uid() = user_id);
