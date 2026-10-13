import {
  Vehicle,
  DeliveryStop,
  Depot,
  OptimizationObjective,
  OptimizationRun,
  VehicleRouteAssignment,
  RouteStopAssignment,
  PlanMetrics,
  CalculationMode,
} from '../types/index.js';
import {
  estimateRoadDistanceKm,
  estimateTravelMinutes,
  generateRoadPathGeometry,
} from './distance.js';

export interface RouteOptimizationOptions {
  depot: Depot;
  vehicles: Vehicle[];
  stops: DeliveryStop[];
  objective: OptimizationObjective;
  balanceWorkload?: boolean;
  prioritizeUrgent?: boolean;
  maxRouteDurationMinutes?: number;
  congestionMultiplier?: number;
  closedAreaBounds?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
}

/**
 * Checks if a coordinate is within a blocked/closed traffic area.
 */
function isCoordinateClosed(
  lat: number,
  lng: number,
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  if (!bounds) return false;
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

/**
 * 2-opt local search optimization to improve stop sequence order for a vehicle.
 */
function twoOptOptimize(
  stops: DeliveryStop[],
  depot: Depot,
  congestionMultiplier: number
): DeliveryStop[] {
  if (stops.length <= 2) return [...stops];

  let bestRoute = [...stops];
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  const calculateTotalDistance = (route: DeliveryStop[]) => {
    let dist = 0;
    let prev = { latitude: depot.latitude, longitude: depot.longitude };
    for (const s of route) {
      dist += estimateRoadDistanceKm(prev, { latitude: s.latitude, longitude: s.longitude });
      prev = { latitude: s.latitude, longitude: s.longitude };
    }
    dist += estimateRoadDistanceKm(prev, { latitude: depot.latitude, longitude: depot.longitude });
    return dist;
  };

  let bestDistance = calculateTotalDistance(bestRoute);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let k = i + 1; k < bestRoute.length; k++) {
        // Reverse sub-sequence between i and k
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, k + 1).reverse(),
          ...bestRoute.slice(k + 1),
        ];

        const newDist = calculateTotalDistance(newRoute);
        if (newDist < bestDistance - 0.05) {
          bestRoute = newRoute;
          bestDistance = newDist;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return bestRoute;
}

/**
 * Computes baseline naive assignment plan for rigorous comparison against optimized plan.
 */
function computeBaselinePlan(
  depot: Depot,
  eligibleVehicles: Vehicle[],
  stops: DeliveryStop[],
  congestionMultiplier: number
): { assignments: VehicleRouteAssignment[]; unassigned: { stop: DeliveryStop; reason: string }[] } {
  // Naive approach: sequentially assigns stops to first available vehicle until full
  const assignments: VehicleRouteAssignment[] = [];
  const unassigned: { stop: DeliveryStop; reason: string }[] = [];

  let currentVehicleIdx = 0;
  const vehicleAssignedStops: Map<string, DeliveryStop[]> = new Map();
  const vehicleDemands: Map<string, number> = new Map();

  for (const v of eligibleVehicles) {
    vehicleAssignedStops.set(v.id, []);
    vehicleDemands.set(v.id, 0);
  }

  for (const stop of stops) {
    let assigned = false;
    for (let i = 0; i < eligibleVehicles.length; i++) {
      const vIdx = (currentVehicleIdx + i) % eligibleVehicles.length;
      const v = eligibleVehicles[vIdx];
      const curDemand = vehicleDemands.get(v.id) || 0;

      if (curDemand + stop.demand <= v.capacity) {
        vehicleAssignedStops.get(v.id)!.push(stop);
        vehicleDemands.set(v.id, curDemand + stop.demand);
        assigned = true;
        currentVehicleIdx = (vIdx + 1) % eligibleVehicles.length;
        break;
      }
    }

    if (!assigned) {
      unassigned.push({ stop, reason: 'Exceeded fleet vehicle capacity' });
    }
  }

  // Build assignments without 2-opt
  for (const v of eligibleVehicles) {
    const stopsList = vehicleAssignedStops.get(v.id) || [];
    const assignment = buildVehicleAssignment(
      v,
      stopsList,
      depot,
      congestionMultiplier,
      'baseline'
    );
    assignments.push(assignment);
  }

  return { assignments, unassigned };
}

/**
 * Builds vehicle assignment details, timetable, and route geometry.
 */
function buildVehicleAssignment(
  vehicle: Vehicle,
  orderedStops: DeliveryStop[],
  depot: Depot,
  congestionMultiplier: number,
  runId: string
): VehicleRouteAssignment {
  const routeStops: RouteStopAssignment[] = [];
  const routeGeometry = [];

  let currentLoc = { latitude: depot.latitude, longitude: depot.longitude };
  let currentMinutes = 0; // Relative minutes from start of shift (8:00 AM)
  let totalDistanceKm = 0;
  let totalDemand = 0;

  const baseShiftStart = new Date();
  baseShiftStart.setHours(8, 0, 0, 0);

  routeGeometry.push({
    latitude: depot.latitude,
    longitude: depot.longitude,
    isDepot: true,
  });

  for (let i = 0; i < orderedStops.length; i++) {
    const stop = orderedStops[i];
    const distToStop = estimateRoadDistanceKm(currentLoc, {
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    const travelMins = estimateTravelMinutes(distToStop, congestionMultiplier);

    totalDistanceKm += distToStop;
    currentMinutes += travelMins;

    const arrivalDate = new Date(baseShiftStart.getTime() + currentMinutes * 60000);
    const serviceMins = stop.serviceDurationMinutes || 5;
    const departureDate = new Date(arrivalDate.getTime() + serviceMins * 60000);

    // Evaluate delay risk
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskReason: string | undefined = undefined;

    if (stop.deadlineAt) {
      const deadline = new Date(stop.deadlineAt);
      const bufferMinutes = (deadline.getTime() - arrivalDate.getTime()) / 60000;
      if (bufferMinutes < 0) {
        riskLevel = 'high';
        riskReason = `Arrival ${Math.abs(Math.round(bufferMinutes))}m after deadline (${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
      } else if (bufferMinutes < 15) {
        riskLevel = 'medium';
        riskReason = `Tight time buffer (${Math.round(bufferMinutes)}m margin before deadline)`;
      }
    }

    // Geometry interpolation
    const stepGeometry = generateRoadPathGeometry(currentLoc, {
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    routeGeometry.push(...stepGeometry.slice(1));

    routeStops.push({
      id: `rs-${vehicle.id}-${i}`,
      assignmentId: `ra-${vehicle.id}`,
      deliveryStopId: stop.id,
      deliveryStop: stop,
      sequenceNumber: i + 1,
      estimatedArrivalAt: arrivalDate.toISOString(),
      estimatedDepartureAt: departureDate.toISOString(),
      distanceFromPreviousKm: distToStop,
      travelMinutesFromPrevious: travelMins,
      riskLevel,
      riskReason,
    });

    totalDemand += stop.demand;
    currentMinutes += serviceMins;
    currentLoc = { latitude: stop.latitude, longitude: stop.longitude };
  }

  // Return to depot leg
  if (orderedStops.length > 0) {
    const returnDist = estimateRoadDistanceKm(currentLoc, {
      latitude: depot.latitude,
      longitude: depot.longitude,
    });
    const returnMins = estimateTravelMinutes(returnDist, congestionMultiplier);
    totalDistanceKm += returnDist;
    currentMinutes += returnMins;

    const returnGeometry = generateRoadPathGeometry(currentLoc, {
      latitude: depot.latitude,
      longitude: depot.longitude,
    });
    routeGeometry.push(...returnGeometry.slice(1));
  }

  const utilizationPercent =
    vehicle.capacity > 0
      ? Math.min(100, Math.round((totalDemand / vehicle.capacity) * 1000) / 10)
      : 0;

  return {
    id: `ra-${vehicle.id}`,
    runId,
    userId: vehicle.userId,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleType: vehicle.vehicleType,
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    estimatedDurationMinutes: Math.round(currentMinutes),
    utilizationPercent,
    totalDemandDelivered: totalDemand,
    stopsCount: orderedStops.length,
    stops: routeStops,
    routeGeometry,
    status: totalDemand > vehicle.capacity ? 'infeasible' : 'active',
  };
}

/**
 * Calculates aggregate summary metrics for a plan.
 */
export function calculatePlanMetrics(assignments: VehicleRouteAssignment[]): PlanMetrics {
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let totalDemand = 0;
  let activeVehiclesCount = 0;
  let assignedStopsCount = 0;
  let atRiskDeliveriesCount = 0;

  let utilizationSum = 0;

  for (const a of assignments) {
    if (a.stopsCount > 0) {
      activeVehiclesCount++;
      totalDistanceKm += a.totalDistanceKm;
      totalDurationMinutes += a.estimatedDurationMinutes;
      totalDemand += a.totalDemandDelivered;
      assignedStopsCount += a.stopsCount;
      utilizationSum += a.utilizationPercent;

      for (const s of a.stops) {
        if (s.riskLevel === 'high' || s.riskLevel === 'medium') {
          atRiskDeliveriesCount++;
        }
      }
    }
  }

  const averageUtilizationPercent =
    activeVehiclesCount > 0
      ? Math.round((utilizationSum / activeVehiclesCount) * 10) / 10
      : 0;

  // Realistic fuel & emissions estimation
  // Average van/truck fuel consumption: ~10.5 L / 100km
  const estimatedFuelLiters = Math.round(((totalDistanceKm * 10.5) / 100) * 10) / 10;
  // Diesel emission factor: ~2.68 kg CO2 / L
  const estimatedCo2Kg = Math.round(estimatedFuelLiters * 2.68 * 10) / 10;
  // Fuel + driver cost estimated at ~$1.85 / km
  const estimatedCostUsd = Math.round(totalDistanceKm * 1.85);

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalDurationMinutes: Math.round(totalDurationMinutes),
    averageUtilizationPercent,
    activeVehiclesCount,
    assignedStopsCount,
    unassignedStopsCount: 0,
    atRiskDeliveriesCount,
    estimatedFuelLiters,
    estimatedCo2Kg,
    estimatedCostUsd,
  };
}

/**
 * Main Deterministic Route Optimizer
 */
export function optimizeRoutes(options: RouteOptimizationOptions): {
  baselineMetrics: PlanMetrics;
  optimizedMetrics: PlanMetrics;
  assignments: VehicleRouteAssignment[];
  unassignedStops: { stop: DeliveryStop; reason: string }[];
  calculationMode: CalculationMode;
} {
  const {
    depot,
    vehicles,
    stops,
    objective,
    balanceWorkload = true,
    prioritizeUrgent = true,
    congestionMultiplier = 1.0,
    closedAreaBounds,
  } = options;

  // 1. Filter eligible vehicles
  const eligibleVehicles = vehicles.filter(
    (v) => v.status === 'available' || v.status === 'active'
  );

  if (eligibleVehicles.length === 0) {
    return {
      baselineMetrics: calculatePlanMetrics([]),
      optimizedMetrics: calculatePlanMetrics([]),
      assignments: [],
      unassignedStops: stops.map((s) => ({
        stop: s,
        reason: 'No available vehicles in fleet',
      })),
      calculationMode: 'estimated',
    };
  }

  // 2. Separate closed stops if road closure exists
  const feasibleStops: DeliveryStop[] = [];
  const unassignedStops: { stop: DeliveryStop; reason: string }[] = [];

  for (const s of stops) {
    if (isCoordinateClosed(s.latitude, s.longitude, closedAreaBounds)) {
      unassignedStops.push({
        stop: s,
        reason: 'Stop is located inside restricted road closure perimeter',
      });
    } else {
      feasibleStops.push(s);
    }
  }

  // 3. Compute baseline plan for comparison
  const baselineResult = computeBaselinePlan(
    depot,
    eligibleVehicles,
    feasibleStops,
    congestionMultiplier
  );
  const baselineMetrics = calculatePlanMetrics(baselineResult.assignments);
  baselineMetrics.unassignedStopsCount =
    baselineResult.unassigned.length + unassignedStops.length;

  // 4. Sort and prioritize stops based on chosen objective
  let prioritizedStops = [...feasibleStops];

  if (objective === 'prioritize_urgent' || prioritizeUrgent) {
    // Sort urgent stops first, then high, normal, low
    const priorityWeight: Record<string, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    prioritizedStops.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      // Secondary: deadline urgency
      if (a.deadlineAt && b.deadlineAt) {
        return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
      }
      return 0;
    });
  }

  // 5. Cluster & Assign stops to vehicles (Capacity-constrained Clarke-Wright / Best-Fit)
  const vehicleBuckets: Map<string, DeliveryStop[]> = new Map();
  const vehicleCurrentLoads: Map<string, number> = new Map();

  for (const v of eligibleVehicles) {
    vehicleBuckets.set(v.id, []);
    vehicleCurrentLoads.set(v.id, 0);
  }

  // Capacity threshold per vehicle for workload balancing
  const totalFleetCapacity = eligibleVehicles.reduce((acc, v) => acc + v.capacity, 0);
  const totalDemand = prioritizedStops.reduce((acc, s) => acc + s.demand, 0);
  const targetLoadRatio = Math.min(0.9, totalDemand / Math.max(1, totalFleetCapacity));

  for (const stop of prioritizedStops) {
    let bestVehicle: Vehicle | null = null;
    let minScore = Infinity;

    for (const v of eligibleVehicles) {
      const currentLoad = vehicleCurrentLoads.get(v.id) || 0;
      if (currentLoad + stop.demand > v.capacity) {
        continue; // Exceeds hard vehicle capacity constraint
      }

      // Proximity score: distance from last assigned stop or depot
      const assigned = vehicleBuckets.get(v.id) || [];
      const lastLoc =
        assigned.length > 0
          ? {
              latitude: assigned[assigned.length - 1].latitude,
              longitude: assigned[assigned.length - 1].longitude,
            }
          : { latitude: depot.latitude, longitude: depot.longitude };

      const distKm = estimateRoadDistanceKm(lastLoc, {
        latitude: stop.latitude,
        longitude: stop.longitude,
      });

      let score = distKm;

      if (objective === 'balance_workload' || balanceWorkload) {
        // Penalize vehicles that already carry high relative load
        const loadRatio = currentLoad / v.capacity;
        score += loadRatio * 15;
      }

      if (objective === 'minimize_distance') {
        // Pure distance minimization
        score = distKm;
      }

      if (score < minScore) {
        minScore = score;
        bestVehicle = v;
      }
    }

    if (bestVehicle) {
      vehicleBuckets.get(bestVehicle.id)!.push(stop);
      const newLoad = (vehicleCurrentLoads.get(bestVehicle.id) || 0) + stop.demand;
      vehicleCurrentLoads.set(bestVehicle.id, newLoad);
    } else {
      unassignedStops.push({
        stop,
        reason: 'Fleet capacity constraint exceeded across all available vehicles',
      });
    }
  }

  // 6. Sequence each vehicle's stops using 2-opt local search optimization
  const optimizedAssignments: VehicleRouteAssignment[] = [];

  for (const v of eligibleVehicles) {
    const rawStops = vehicleBuckets.get(v.id) || [];
    let orderedStops = rawStops;

    if (rawStops.length > 1) {
      // 2-opt search
      orderedStops = twoOptOptimize(rawStops, depot, congestionMultiplier);
    }

    const assignment = buildVehicleAssignment(
      v,
      orderedStops,
      depot,
      congestionMultiplier,
      'run-opt'
    );
    optimizedAssignments.push(assignment);
  }

  const optimizedMetrics = calculatePlanMetrics(optimizedAssignments);
  optimizedMetrics.unassignedStopsCount = unassignedStops.length;

  return {
    baselineMetrics,
    optimizedMetrics,
    assignments: optimizedAssignments,
    unassignedStops,
    calculationMode: 'estimated',
  };
}
