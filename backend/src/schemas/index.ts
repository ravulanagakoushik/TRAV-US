import { z } from 'zod';

// Geographic coordinates validator
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

export const VehicleStatusEnum = z.enum(['available', 'active', 'unavailable', 'maintenance']);
export const PriorityLevelEnum = z.enum(['low', 'normal', 'high', 'urgent']);
export const DeliveryStatusEnum = z.enum(['pending', 'assigned', 'in_transit', 'completed', 'cancelled']);
export const OptimizationObjectiveEnum = z.enum([
  'minimize_distance',
  'balance_time_distance',
  'prioritize_urgent',
  'balance_workload',
]);
export const CalculationModeEnum = z.enum(['live', 'estimated', 'simulated', 'demo']);
export const ScenarioTypeEnum = z.enum(['traffic', 'road_closure', 'vehicle_breakdown', 'urgent_delivery']);
export const RiskLevelEnum = z.enum(['low', 'medium', 'high', 'unknown']);

// Vehicles
export const VehicleCreateSchema = z.object({
  name: z.string().min(1, 'Vehicle name is required').max(100),
  vehicleType: z.string().min(1, 'Vehicle type is required').max(50),
  capacity: z.number().positive('Capacity must be greater than 0'),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  status: VehicleStatusEnum.default('available'),
  operatingCostPerKm: z.number().min(0, 'Operating cost cannot be negative').optional(),
});

export const VehicleUpdateSchema = VehicleCreateSchema.partial();

// Delivery Stops
const DeliveryStopBaseSchema = z.object({
  label: z.string().min(1, 'Destination label is required').max(150),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  demand: z.number().min(0, 'Demand cannot be negative').default(1),
  priority: PriorityLevelEnum.default('normal'),
  earliestServiceAt: z.string().datetime().optional().nullable(),
  deadlineAt: z.string().datetime().optional().nullable(),
  serviceDurationMinutes: z.number().min(0, 'Service duration cannot be negative').default(5),
  status: DeliveryStatusEnum.default('pending'),
});

export const DeliveryStopCreateSchema = DeliveryStopBaseSchema.refine(
  (data) => {
    if (data.earliestServiceAt && data.deadlineAt) {
      return new Date(data.deadlineAt) >= new Date(data.earliestServiceAt);
    }
    return true;
  },
  {
    message: 'Deadline cannot precede earliest service time',
    path: ['deadlineAt'],
  }
);

export const DeliveryStopUpdateSchema = DeliveryStopBaseSchema.partial();

// Optimization
export const DepotSchema = z.object({
  label: z.string().min(1).default('Central Distribution Hub'),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

export const OptimizationRequestSchema = z.object({
  depot: DepotSchema.optional(),
  vehicleIds: z.array(z.string().uuid()).optional(),
  stopIds: z.array(z.string().uuid()).optional(),
  objective: OptimizationObjectiveEnum.default('balance_time_distance'),
  balanceWorkload: z.boolean().default(true),
  prioritizeUrgent: z.boolean().default(true),
  maxRouteDurationMinutes: z.number().positive().optional(),
});

export const RouteEstimateRequestSchema = z.object({
  origin: z.object({ latitude: latitudeSchema, longitude: longitudeSchema }),
  destination: z.object({ latitude: latitudeSchema, longitude: longitudeSchema }),
  congestionMultiplier: z.number().min(0.5).max(5.0).default(1.0),
});

// Disruption Simulator
export const DisruptionScenarioSchema = z.object({
  name: z.string().min(1, 'Scenario name is required').max(100),
  baselineRunId: z.string().uuid('Valid baseline optimization run ID is required'),
  scenarioType: ScenarioTypeEnum,
  configuration: z.object({
    congestionMultiplier: z.number().min(1.0).max(5.0).optional(),
    closedAreaBounds: z.object({
      minLat: latitudeSchema,
      maxLat: latitudeSchema,
      minLng: longitudeSchema,
      maxLng: longitudeSchema,
    }).optional(),
    breakdownVehicleId: z.string().uuid().optional(),
    urgentStop: z.object({
      label: z.string().min(1),
      latitude: latitudeSchema,
      longitude: longitudeSchema,
      demand: z.number().min(0).default(1),
      priority: PriorityLevelEnum.default('urgent'),
      deadlineAt: z.string().datetime().optional(),
      serviceDurationMinutes: z.number().min(0).default(10),
    }).optional(),
    description: z.string().max(500).default(''),
  }),
});

// AI Advisor Structured Schemas (Section 15)
export const AIAdviceRequestSchema = z.object({
  question: z.string().min(3).max(500),
  runId: z.string().uuid().optional(),
  scenarioId: z.string().uuid().optional(),
  taskType: z.enum([
    'route_explanation',
    'disruption_analysis',
    'delivery_risk_assessment',
    'fleet_balancing',
    'management_summary',
    'general_query'
  ]).default('general_query'),
});

export const RouteExplanationSchema = z.object({
  summary: z.string().min(1),
  key_factors: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  limitations: z.array(z.string()),
  next_actions: z.array(z.string()),
});

export const DisruptionAnalysisSchema = z.object({
  summary: z.string().min(1),
  affected_vehicles: z.array(z.string()),
  affected_deliveries: z.array(z.string()),
  metric_changes: z.array(
    z.object({
      metric: z.string(),
      before: z.string(),
      after: z.string(),
      explanation: z.string(),
    })
  ),
  risks: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const DeliveryRiskAssessmentSchema = z.object({
  summary: z.string().min(1),
  at_risk_deliveries: z.array(
    z.object({
      delivery_id: z.string(),
      risk_level: RiskLevelEnum,
      reason: z.string(),
      recommended_action: z.string(),
    })
  ),
  data_gaps: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const FleetBalancingSchema = z.object({
  summary: z.string().min(1),
  imbalances: z.array(z.string()),
  recommendations: z.array(
    z.object({
      vehicle_id: z.string(),
      suggested_action: z.string(),
      reason: z.string(),
    })
  ),
  constraints: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const ManagementSummarySchema = z.object({
  headline: z.string().min(1),
  operational_summary: z.string().min(1),
  important_metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      unit: z.string(),
    })
  ),
  main_risks: z.array(z.string()),
  recommended_next_steps: z.array(z.string()),
  data_quality_notes: z.array(z.string()),
});

// User Profile & Preferences
export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100),
});

export const PreferencesSchema = z.object({
  defaultObjective: OptimizationObjectiveEnum,
  distanceUnit: z.enum(['km', 'mi']),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});
