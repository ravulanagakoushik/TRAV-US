import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { fleetRepository } from '../repositories/fleetRepository.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticateToken);

// GET /api/dashboard/summary
dashboardRouter.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  const vehicles = await fleetRepository.getVehicles(userId);
  const stops = await fleetRepository.getStops(userId);
  const runs = await fleetRepository.getOptimizationRuns(userId);
  const scenarios = await fleetRepository.getScenarios(userId);

  const activeVehicles = vehicles.filter((v) => v.status === 'available' || v.status === 'active');
  const pendingStops = stops.filter((s) => s.status === 'pending');
  const urgentStops = stops.filter((s) => s.priority === 'urgent');

  // Latest run metrics
  const latestRun = runs.length > 0 ? runs[0] : null;
  const metrics = latestRun?.optimizedMetrics || {
    totalDistanceKm: 0,
    totalDurationMinutes: 0,
    averageUtilizationPercent: 0,
    activeVehiclesCount: activeVehicles.length,
    assignedStopsCount: stops.length,
    unassignedStopsCount: 0,
    atRiskDeliveriesCount: 0,
    estimatedFuelLiters: 0,
    estimatedCo2Kg: 0,
    estimatedCostUsd: 0,
  };

  // Recent operational alerts
  const alerts = [];
  if (urgentStops.length > 0) {
    alerts.push({
      id: 'alert-urgent-1',
      type: 'warning',
      title: 'High Priority Stops Scheduled',
      message: `${urgentStops.length} stops marked as urgent require prioritized morning departure windows.`,
      timestamp: new Date().toISOString(),
    });
  }

  if (metrics.atRiskDeliveriesCount > 0) {
    alerts.push({
      id: 'alert-risk-1',
      type: 'danger',
      title: 'Delivery Delay Warning',
      message: `${metrics.atRiskDeliveriesCount} stops are at risk of exceeding customer delivery deadlines under current route plan.`,
      timestamp: new Date().toISOString(),
    });
  }

  alerts.push({
    id: 'alert-opt-1',
    type: 'info',
    title: 'Fleet Status Active',
    message: `${activeVehicles.length} of ${vehicles.length} vehicles operational and ready for automated dispatch.`,
    timestamp: new Date().toISOString(),
  });

  // Workload distribution data for charts
  const vehicleWorkloads = vehicles.map((v) => {
    const assignment = latestRun?.assignments.find((a) => a.vehicleId === v.id);
    return {
      vehicleId: v.id,
      name: v.name,
      vehicleType: v.vehicleType,
      capacity: v.capacity,
      deliveredDemand: assignment ? assignment.totalDemandDelivered : 0,
      stopsCount: assignment ? assignment.stopsCount : 0,
      utilizationPercent: assignment ? assignment.utilizationPercent : 0,
    };
  });

  res.json({
    success: true,
    summary: {
      kpis: {
        totalVehicles: vehicles.length,
        activeVehicles: activeVehicles.length,
        totalStops: stops.length,
        pendingStops: pendingStops.length,
        urgentStops: urgentStops.length,
        totalDistanceKm: metrics.totalDistanceKm,
        totalDurationMinutes: metrics.totalDurationMinutes,
        averageUtilization: metrics.averageUtilizationPercent,
        atRiskDeliveries: metrics.atRiskDeliveriesCount,
        co2SavedKg: Math.round(metrics.estimatedCo2Kg * 0.18 * 10) / 10,
        costSavingsUsd: Math.round(metrics.estimatedCostUsd * 0.15),
      },
      latestRun,
      recentRuns: runs.slice(0, 5),
      recentScenarios: scenarios.slice(0, 5),
      alerts,
      vehicleWorkloads,
    },
  });
});
