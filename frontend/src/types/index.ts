export type VehicleStatus = 'available' | 'active' | 'unavailable' | 'maintenance';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'completed' | 'cancelled';
export type OptimizationObjective = 
  | 'minimize_distance' 
  | 'balance_time_distance' 
  | 'prioritize_urgent' 
  | 'balance_workload';

export type CalculationMode = 'live' | 'estimated' | 'simulated' | 'demo';
export type ScenarioType = 'traffic' | 'road_closure' | 'vehicle_breakdown' | 'urgent_delivery';
export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface Vehicle {
  id: string;
  userId: string;
  name: string;
  vehicleType: string;
  capacity: number;
  latitude: number;
  longitude: number;
  status: VehicleStatus;
  operatingCostPerKm?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryStop {
  id: string;
  userId?: string;
  label: string;
  latitude: number;
  longitude: number;
  demand: number;
  priority: PriorityLevel;
  earliestServiceAt?: string;
  deadlineAt?: string;
  serviceDurationMinutes: number;
  status: DeliveryStatus;
  trackingToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Depot {
  label: string;
  latitude: number;
  longitude: number;
}

export interface RouteWaypoint {
  latitude: number;
  longitude: number;
  stopId?: string;
  isDepot?: boolean;
}

export interface RouteStopAssignment {
  id: string;
  assignmentId: string;
  deliveryStopId: string;
  deliveryStop: DeliveryStop;
  sequenceNumber: number;
  estimatedArrivalAt: string;
  estimatedDepartureAt: string;
  distanceFromPreviousKm: number;
  travelMinutesFromPrevious: number;
  riskLevel: RiskLevel;
  riskReason?: string;
}

export interface VehicleRouteAssignment {
  id: string;
  runId: string;
  userId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  utilizationPercent: number;
  totalDemandDelivered: number;
  stopsCount: number;
  stops: RouteStopAssignment[];
  routeGeometry: RouteWaypoint[];
  status: 'active' | 'completed' | 'infeasible';
}

export interface PlanMetrics {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  averageUtilizationPercent: number;
  activeVehiclesCount: number;
  assignedStopsCount: number;
  unassignedStopsCount: number;
  atRiskDeliveriesCount: number;
  estimatedFuelLiters: number;
  estimatedCo2Kg: number;
  estimatedCostUsd: number;
}

export interface OptimizationRun {
  id: string;
  userId: string;
  objective: OptimizationObjective;
  calculationMode: CalculationMode;
  inputSnapshot: {
    depot: Depot;
    vehicleCount: number;
    deliveryCount: number;
    balanceWorkload: boolean;
    prioritizeUrgent: boolean;
  };
  baselineMetrics: PlanMetrics;
  optimizedMetrics: PlanMetrics;
  assignments: VehicleRouteAssignment[];
  unassignedStops: {
    stop: DeliveryStop;
    reason: string;
  }[];
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface DisruptionScenario {
  id: string;
  userId: string;
  baselineRunId: string;
  name: string;
  scenarioType: ScenarioType;
  configuration: {
    congestionMultiplier?: number;
    closedAreaBounds?: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    };
    breakdownVehicleId?: string;
    urgentStop?: Partial<DeliveryStop>;
    description: string;
  };
  revisedRun?: OptimizationRun;
  metricDeltas?: {
    distanceDiffKm: number;
    durationDiffMinutes: number;
    newlyAtRiskCount: number;
    reassignedStopsCount: number;
  };
  calculationMode: CalculationMode;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface AIAdvisory {
  id: string;
  userId: string;
  runId?: string;
  scenarioId?: string;
  question: string;
  response: Record<string, any>;
  provider: 'gemini' | 'fallback_rules_engine';
  createdAt: string;
}

export interface DashboardSummary {
  kpis: {
    totalVehicles: number;
    activeVehicles: number;
    totalStops: number;
    pendingStops: number;
    urgentStops: number;
    totalDistanceKm: number;
    totalDurationMinutes: number;
    averageUtilization: number;
    atRiskDeliveries: number;
    co2SavedKg: number;
    costSavingsUsd: number;
  };
  latestRun: OptimizationRun | null;
  recentRuns: OptimizationRun[];
  recentScenarios: DisruptionScenario[];
  alerts: {
    id: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    message: string;
    timestamp: string;
  }[];
  vehicleWorkloads: {
    vehicleId: string;
    name: string;
    vehicleType: string;
    capacity: number;
    deliveredDemand: number;
    stopsCount: number;
    utilizationPercent: number;
  }[];
}
