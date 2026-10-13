import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { fleetRepository, DEFAULT_DEPOT } from '../repositories/fleetRepository.js';
import { optimizeRoutes } from '../optimization/routingEngine.js';
import { OptimizationRun } from '../types/index.js';

export const demoRouter = Router();

demoRouter.use(authenticateToken);

// POST /api/demo/seed
demoRouter.post('/seed', async (req: AuthenticatedRequest, res: Response) => {
  const seeded = fleetRepository.seedDemoData(req.userId!);
  
  // Also pre-compute an initial optimization run so dashboard & 3D city have rich active routes immediately!
  const optResult = optimizeRoutes({
    depot: DEFAULT_DEPOT,
    vehicles: seeded.vehicles,
    stops: seeded.stops,
    objective: 'balance_time_distance',
    balanceWorkload: true,
    prioritizeUrgent: true,
  });

  const run: OptimizationRun = {
    id: `run-demo-${Date.now()}`,
    userId: req.userId!,
    objective: 'balance_time_distance',
    calculationMode: 'demo',
    inputSnapshot: {
      depot: DEFAULT_DEPOT,
      vehicleCount: seeded.vehicles.length,
      deliveryCount: seeded.stops.length,
      balanceWorkload: true,
      prioritizeUrgent: true,
    },
    baselineMetrics: optResult.baselineMetrics,
    optimizedMetrics: optResult.optimizedMetrics,
    assignments: optResult.assignments,
    unassignedStops: optResult.unassignedStops,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  await fleetRepository.saveOptimizationRun(req.userId!, run);

  res.json({
    success: true,
    message: 'Demo dataset initialized with 6 vehicles, 18 stops, and baseline route dispatch.',
    vehiclesCount: seeded.vehicles.length,
    stopsCount: seeded.stops.length,
    initialRun: run,
  });
});

// POST /api/demo/reset
demoRouter.post('/reset', async (req: AuthenticatedRequest, res: Response) => {
  fleetRepository.resetDemoData(req.userId!);
  res.json({
    success: true,
    message: 'Demo fleet state has been cleanly reset to default seed scenario.',
  });
});
