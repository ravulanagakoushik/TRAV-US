import {
  OptimizationRun,
  DisruptionScenario,
  Vehicle,
  DeliveryStop,
  Depot,
} from '../types/index.js';
import { optimizeRoutes } from './routingEngine.js';

export interface SimulationParams {
  scenario: DisruptionScenario;
  baselineRun: OptimizationRun;
  vehicles: Vehicle[];
  stops: DeliveryStop[];
  depot: Depot;
}

export function executeScenarioSimulation(params: SimulationParams): {
  revisedRun: OptimizationRun;
  metricDeltas: {
    distanceDiffKm: number;
    durationDiffMinutes: number;
    newlyAtRiskCount: number;
    reassignedStopsCount: number;
  };
  changedAssignments: {
    vehicleId: string;
    vehicleName: string;
    originalStopsCount: number;
    newStopsCount: number;
    statusNote: string;
  }[];
} {
  const { scenario, baselineRun, vehicles, stops, depot } = params;
  const config = scenario.configuration;

  let activeVehicles = [...vehicles];
  let activeStops = [...stops];
  let congestionMultiplier = 1.0;
  let closedAreaBounds = config.closedAreaBounds;

  switch (scenario.scenarioType) {
    case 'traffic':
      congestionMultiplier = config.congestionMultiplier || 1.8;
      break;

    case 'road_closure':
      // Handled by closedAreaBounds
      break;

    case 'vehicle_breakdown':
      if (config.breakdownVehicleId) {
        // Mark broken vehicle as unavailable
        activeVehicles = activeVehicles.map((v) =>
          v.id === config.breakdownVehicleId
            ? { ...v, status: 'unavailable' }
            : v
        );
      }
      break;

    case 'urgent_delivery':
      if (config.urgentStop) {
        const newStop: DeliveryStop = {
          id: `stop-urgent-${Date.now()}`,
          userId: baselineRun.userId,
          label: config.urgentStop.label || 'Urgent Hospital Medical Supply Dispatch',
          latitude: config.urgentStop.latitude ?? depot.latitude,
          longitude: config.urgentStop.longitude ?? depot.longitude,
          demand: config.urgentStop.demand || 2,
          priority: 'urgent',
          serviceDurationMinutes: config.urgentStop.serviceDurationMinutes || 10,
          deadlineAt: config.urgentStop.deadlineAt || new Date(Date.now() + 90 * 60000).toISOString(),
          status: 'pending',
          trackingToken: `TRK-URGENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        activeStops.push(newStop);
      }
      break;
  }

  // Optimize with disruption constraints applied
  const optimizedResult = optimizeRoutes({
    depot,
    vehicles: activeVehicles,
    stops: activeStops,
    objective: baselineRun.objective,
    balanceWorkload: baselineRun.inputSnapshot.balanceWorkload,
    prioritizeUrgent: true,
    congestionMultiplier,
    closedAreaBounds,
  });

  const revisedRunId = `run-revised-${Date.now()}`;
  const revisedRun: OptimizationRun = {
    id: revisedRunId,
    userId: baselineRun.userId,
    objective: baselineRun.objective,
    calculationMode: 'simulated',
    inputSnapshot: {
      depot,
      vehicleCount: activeVehicles.filter((v) => v.status === 'available' || v.status === 'active').length,
      deliveryCount: activeStops.length,
      balanceWorkload: baselineRun.inputSnapshot.balanceWorkload,
      prioritizeUrgent: true,
    },
    baselineMetrics: baselineRun.optimizedMetrics, // Old plan is the comparative baseline
    optimizedMetrics: optimizedResult.optimizedMetrics,
    assignments: optimizedResult.assignments,
    unassignedStops: optimizedResult.unassignedStops,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  // Calculate delta metrics
  const oldMetrics = baselineRun.optimizedMetrics;
  const newMetrics = revisedRun.optimizedMetrics;

  const distanceDiffKm = Math.round((newMetrics.totalDistanceKm - oldMetrics.totalDistanceKm) * 100) / 100;
  const durationDiffMinutes = Math.round(newMetrics.totalDurationMinutes - oldMetrics.totalDurationMinutes);
  const newlyAtRiskCount = Math.max(0, newMetrics.atRiskDeliveriesCount - oldMetrics.atRiskDeliveriesCount);

  // Track reassigned stops count
  let reassignedStopsCount = 0;
  const oldStopVehicleMap = new Map<string, string>();
  for (const a of baselineRun.assignments) {
    for (const s of a.stops) {
      oldStopVehicleMap.set(s.deliveryStopId, a.vehicleId);
    }
  }

  const changedAssignments = [];
  for (const newAssign of revisedRun.assignments) {
    const oldAssign = baselineRun.assignments.find((a) => a.vehicleId === newAssign.vehicleId);
    const originalCount = oldAssign ? oldAssign.stopsCount : 0;
    
    let vehicleReassigned = 0;
    for (const s of newAssign.stops) {
      const prevVehicle = oldStopVehicleMap.get(s.deliveryStopId);
      if (prevVehicle && prevVehicle !== newAssign.vehicleId) {
        vehicleReassigned++;
        reassignedStopsCount++;
      }
    }

    let statusNote = 'Unchanged';
    if (newAssign.vehicleId === config.breakdownVehicleId) {
      statusNote = 'Vehicle offline due to breakdown (reassigned)';
    } else if (vehicleReassigned > 0) {
      statusNote = `Absorbed ${vehicleReassigned} rerouted stops from disrupted vehicles`;
    } else if (newAssign.stopsCount !== originalCount) {
      statusNote = `Schedule adjusted: ${newAssign.stopsCount} stops`;
    }

    changedAssignments.push({
      vehicleId: newAssign.vehicleId,
      vehicleName: newAssign.vehicleName,
      originalStopsCount: originalCount,
      newStopsCount: newAssign.stopsCount,
      statusNote,
    });
  }

  return {
    revisedRun,
    metricDeltas: {
      distanceDiffKm,
      durationDiffMinutes,
      newlyAtRiskCount,
      reassignedStopsCount,
    },
    changedAssignments,
  };
}
