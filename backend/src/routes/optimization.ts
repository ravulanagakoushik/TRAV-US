import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { computeRateLimiter } from '../middleware/rateLimiter.js';
import { fleetRepository, DEFAULT_DEPOT } from '../repositories/fleetRepository.js';
import {
  OptimizationRequestSchema,
  RouteEstimateRequestSchema,
} from '../schemas/index.js';
import { optimizeRoutes } from '../optimization/routingEngine.js';
import {
  estimateRoadDistanceKm,
  estimateTravelMinutes,
  generateRoadPathGeometry,
} from '../optimization/distance.js';
import { OptimizationRun } from '../types/index.js';

export const optimizationRouter = Router();

optimizationRouter.use(authenticateToken);

// POST /api/routing/estimate
optimizationRouter.post('/routing/estimate', (req: AuthenticatedRequest, res: Response) => {
  const { origin, destination, congestionMultiplier } = RouteEstimateRequestSchema.parse(req.body);
  const distanceKm = estimateRoadDistanceKm(origin, destination);
  const durationMinutes = estimateTravelMinutes(distanceKm, congestionMultiplier);
  const pathGeometry = generateRoadPathGeometry(origin, destination);

  res.json({
    success: true,
    estimate: {
      distanceKm,
      durationMinutes,
      mode: 'road_routing_estimate',
      pathGeometry,
    },
  });
});

// POST /api/optimization/preview (Calculates without persisting run)
optimizationRouter.post('/optimization/preview', computeRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const options = OptimizationRequestSchema.parse(req.body);
  const depot = options.depot || DEFAULT_DEPOT;

  const allVehicles = await fleetRepository.getVehicles(req.userId!);
  const allStops = await fleetRepository.getStops(req.userId!);

  const selectedVehicles = options.vehicleIds
    ? allVehicles.filter((v) => options.vehicleIds!.includes(v.id))
    : allVehicles;
  const selectedStops = options.stopIds
    ? allStops.filter((s) => options.stopIds!.includes(s.id))
    : allStops;

  const result = optimizeRoutes({
    depot,
    vehicles: selectedVehicles,
    stops: selectedStops,
    objective: options.objective,
    balanceWorkload: options.balanceWorkload,
    prioritizeUrgent: options.prioritizeUrgent,
    maxRouteDurationMinutes: options.maxRouteDurationMinutes,
  });

  res.json({
    success: true,
    preview: {
      depot,
      objective: options.objective,
      baselineMetrics: result.baselineMetrics,
      optimizedMetrics: result.optimizedMetrics,
      assignments: result.assignments,
      unassignedStops: result.unassignedStops,
      calculationMode: result.calculationMode,
    },
  });
});

// POST /api/optimization/runs (Calculates and saves run permanently)
optimizationRouter.post('/optimization/runs', computeRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const options = OptimizationRequestSchema.parse(req.body);
  const depot = options.depot || DEFAULT_DEPOT;

  const allVehicles = await fleetRepository.getVehicles(req.userId!);
  const allStops = await fleetRepository.getStops(req.userId!);

  const selectedVehicles = options.vehicleIds
    ? allVehicles.filter((v) => options.vehicleIds!.includes(v.id))
    : allVehicles;
  const selectedStops = options.stopIds
    ? allStops.filter((s) => options.stopIds!.includes(s.id))
    : allStops;

  const result = optimizeRoutes({
    depot,
    vehicles: selectedVehicles,
    stops: selectedStops,
    objective: options.objective,
    balanceWorkload: options.balanceWorkload,
    prioritizeUrgent: options.prioritizeUrgent,
    maxRouteDurationMinutes: options.maxRouteDurationMinutes,
  });

  const run: OptimizationRun = {
    id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: req.userId!,
    objective: options.objective,
    calculationMode: result.calculationMode,
    inputSnapshot: {
      depot,
      vehicleCount: selectedVehicles.length,
      deliveryCount: selectedStops.length,
      balanceWorkload: options.balanceWorkload,
      prioritizeUrgent: options.prioritizeUrgent,
    },
    baselineMetrics: result.baselineMetrics,
    optimizedMetrics: result.optimizedMetrics,
    assignments: result.assignments,
    unassignedStops: result.unassignedStops,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  const saved = await fleetRepository.saveOptimizationRun(req.userId!, run);

  res.status(201).json({
    success: true,
    run: saved,
  });
});

// GET /api/optimization/runs
optimizationRouter.get('/optimization/runs', async (req: AuthenticatedRequest, res: Response) => {
  const runs = await fleetRepository.getOptimizationRuns(req.userId!);
  res.json({
    success: true,
    count: runs.length,
    runs,
  });
});

// GET /api/optimization/runs/:id
optimizationRouter.get('/optimization/runs/:id', async (req: AuthenticatedRequest, res: Response) => {
  const run = await fleetRepository.getOptimizationRunById(req.userId!, req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Not Found', message: 'Optimization run not found' });
    return;
  }
  res.json({ success: true, run });
});
