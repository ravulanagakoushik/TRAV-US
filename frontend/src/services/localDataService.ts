import {
  Vehicle,
  DeliveryStop,
  OptimizationRun,
  DisruptionScenario,
  Depot,
  VehicleRouteAssignment,
  RouteStopAssignment,
  PlanMetrics,
  OptimizationObjective,
} from '../types/index.js';

export const DEFAULT_DEPOT: Depot = {
  label: 'Central Metro Fulfillment Depot',
  latitude: 37.778,
  longitude: -122.4075,
};

// Seed dataset generator for vehicles and stops
export function createDefaultVehicles(): Vehicle[] {
  return [
    {
      id: 'veh-01',
      userId: 'demo-fleet-operator-01',
      name: 'EcoTransit EV-Van Alpha',
      vehicleType: 'Electric Cargo Van',
      capacity: 35,
      latitude: 37.778,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 0.95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-02',
      userId: 'demo-fleet-operator-01',
      name: 'Sprinter Cargo Bravo',
      vehicleType: 'High-Roof Diesel Van',
      capacity: 45,
      latitude: 37.778,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 1.45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-03',
      userId: 'demo-fleet-operator-01',
      name: 'Urban Express Charlie',
      vehicleType: 'Medium Transit Van',
      capacity: 30,
      latitude: 37.778,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 1.15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-04',
      userId: 'demo-fleet-operator-01',
      name: 'ColdChain MedTrans Delta',
      vehicleType: 'Refrigerated Pharma Van',
      capacity: 25,
      latitude: 37.778,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 1.75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-05',
      userId: 'demo-fleet-operator-01',
      name: 'Heavy Hauler Echo',
      vehicleType: 'Heavy Freight Box Truck',
      capacity: 70,
      latitude: 37.778,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 2.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'veh-06',
      userId: 'demo-fleet-operator-01',
      name: 'Rapid Dispatch Fox',
      vehicleType: 'Compact City Van',
      capacity: 20,
      latitude: 37.778,
      longitude: -122.4075,
      status: 'available',
      operatingCostPerKm: 0.85,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function createDefaultStops(): DeliveryStop[] {
  const now = Date.now();
  return [
    {
      id: 'stop-01',
      userId: 'demo-fleet-operator-01',
      label: 'Financial District Financial Tower - Suite 400',
      latitude: 37.792,
      longitude: -122.401,
      demand: 4,
      priority: 'high',
      serviceDurationMinutes: 12,
      status: 'pending',
      trackingToken: 'TRK-SF-1001',
      deadlineAt: new Date(now + 120 * 60000).toISOString(),
    },
    {
      id: 'stop-02',
      userId: 'demo-fleet-operator-01',
      label: 'St. Mary Regional Medical Hospital - Emergency Pharmacy',
      latitude: 37.781,
      longitude: -122.413,
      demand: 2,
      priority: 'urgent',
      serviceDurationMinutes: 15,
      status: 'pending',
      trackingToken: 'TRK-SF-1002',
      deadlineAt: new Date(now + 75 * 60000).toISOString(),
    },
    {
      id: 'stop-03',
      userId: 'demo-fleet-operator-01',
      label: 'SoMa Tech Campus - Hardware Lab Dock B',
      latitude: 37.779,
      longitude: -122.399,
      demand: 6,
      priority: 'normal',
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-SF-1003',
      deadlineAt: new Date(now + 240 * 60000).toISOString(),
    },
    {
      id: 'stop-04',
      userId: 'demo-fleet-operator-01',
      label: 'Embarcadero Center Waterfront - Suite 12B',
      latitude: 37.795,
      longitude: -122.398,
      demand: 3,
      priority: 'normal',
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-SF-1004',
      deadlineAt: new Date(now + 180 * 60000).toISOString(),
    },
    {
      id: 'stop-05',
      userId: 'demo-fleet-operator-01',
      label: 'Union Square Retail Flagship Store',
      latitude: 37.787,
      longitude: -122.407,
      demand: 8,
      priority: 'high',
      serviceDurationMinutes: 20,
      status: 'pending',
      trackingToken: 'TRK-SF-1005',
      deadlineAt: new Date(now + 150 * 60000).toISOString(),
    },
    {
      id: 'stop-06',
      userId: 'demo-fleet-operator-01',
      label: 'Mission District Culinary Collective',
      latitude: 37.761,
      longitude: -122.419,
      demand: 5,
      priority: 'normal',
      serviceDurationMinutes: 15,
      status: 'pending',
      trackingToken: 'TRK-SF-1006',
      deadlineAt: new Date(now + 300 * 60000).toISOString(),
    },
    {
      id: 'stop-07',
      userId: 'demo-fleet-operator-01',
      label: 'Nob Hill Luxury Residence Concierge',
      latitude: 37.792,
      longitude: -122.415,
      demand: 2,
      priority: 'low',
      serviceDurationMinutes: 8,
      status: 'pending',
      trackingToken: 'TRK-SF-1007',
      deadlineAt: new Date(now + 360 * 60000).toISOString(),
    },
    {
      id: 'stop-08',
      userId: 'demo-fleet-operator-01',
      label: 'North Beach Artisan Roastery & Cafe',
      latitude: 37.801,
      longitude: -122.409,
      demand: 4,
      priority: 'normal',
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-SF-1008',
      deadlineAt: new Date(now + 210 * 60000).toISOString(),
    },
    {
      id: 'stop-09',
      userId: 'demo-fleet-operator-01',
      label: 'Fisherman Wharf Seafood Wholesale Co.',
      latitude: 37.808,
      longitude: -122.416,
      demand: 7,
      priority: 'high',
      serviceDurationMinutes: 18,
      status: 'pending',
      trackingToken: 'TRK-SF-1009',
      deadlineAt: new Date(now + 160 * 60000).toISOString(),
    },
    {
      id: 'stop-10',
      userId: 'demo-fleet-operator-01',
      label: 'Pacific Heights Executive Estate',
      latitude: 37.791,
      longitude: -122.434,
      demand: 2,
      priority: 'normal',
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-SF-1010',
      deadlineAt: new Date(now + 270 * 60000).toISOString(),
    },
    {
      id: 'stop-11',
      userId: 'demo-fleet-operator-01',
      label: 'Civic Center Municipal Archives',
      latitude: 37.779,
      longitude: -122.418,
      demand: 3,
      priority: 'normal',
      serviceDurationMinutes: 12,
      status: 'pending',
      trackingToken: 'TRK-SF-1011',
      deadlineAt: new Date(now + 200 * 60000).toISOString(),
    },
    {
      id: 'stop-12',
      userId: 'demo-fleet-operator-01',
      label: 'Potrero Hill BioTech Innovation Hub',
      latitude: 37.759,
      longitude: -122.398,
      demand: 4,
      priority: 'urgent',
      serviceDurationMinutes: 14,
      status: 'pending',
      trackingToken: 'TRK-SF-1012',
      deadlineAt: new Date(now + 90 * 60000).toISOString(),
    },
    {
      id: 'stop-13',
      userId: 'demo-fleet-operator-01',
      label: 'Castro Health & Wellness Clinic',
      latitude: 37.761,
      longitude: -122.435,
      demand: 3,
      priority: 'high',
      serviceDurationMinutes: 12,
      status: 'pending',
      trackingToken: 'TRK-SF-1013',
      deadlineAt: new Date(now + 140 * 60000).toISOString(),
    },
    {
      id: 'stop-14',
      userId: 'demo-fleet-operator-01',
      label: 'Marina Green Clean Energy Lab',
      latitude: 37.803,
      longitude: -122.437,
      demand: 5,
      priority: 'normal',
      serviceDurationMinutes: 15,
      status: 'pending',
      trackingToken: 'TRK-SF-1014',
      deadlineAt: new Date(now + 310 * 60000).toISOString(),
    },
    {
      id: 'stop-15',
      userId: 'demo-fleet-operator-01',
      label: 'Mission Bay Pediatric Care Annex',
      latitude: 37.769,
      longitude: -122.392,
      demand: 2,
      priority: 'urgent',
      serviceDurationMinutes: 12,
      status: 'pending',
      trackingToken: 'TRK-SF-1015',
      deadlineAt: new Date(now + 80 * 60000).toISOString(),
    },
    {
      id: 'stop-16',
      userId: 'demo-fleet-operator-01',
      label: 'Rincon Hill Sky Tower Delivery Bay',
      latitude: 37.786,
      longitude: -122.393,
      demand: 4,
      priority: 'normal',
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-SF-1016',
      deadlineAt: new Date(now + 220 * 60000).toISOString(),
    },
    {
      id: 'stop-17',
      userId: 'demo-fleet-operator-01',
      label: 'Telegraph Hill Residential Compound',
      latitude: 37.802,
      longitude: -122.404,
      demand: 3,
      priority: 'low',
      serviceDurationMinutes: 10,
      status: 'pending',
      trackingToken: 'TRK-SF-1017',
      deadlineAt: new Date(now + 380 * 60000).toISOString(),
    },
    {
      id: 'stop-18',
      userId: 'demo-fleet-operator-01',
      label: 'Dogpatch Advanced Manufacturing Yards',
      latitude: 37.756,
      longitude: -122.389,
      demand: 9,
      priority: 'high',
      serviceDurationMinutes: 25,
      status: 'pending',
      trackingToken: 'TRK-SF-1018',
      deadlineAt: new Date(now + 175 * 60000).toISOString(),
    },
  ];
}

// Generate realistic route assignments and optimization metrics locally
export function generateLocalOptimizationRun(
  vehicles: Vehicle[],
  stops: DeliveryStop[],
  options?: {
    objective?: OptimizationObjective;
    balanceWorkload?: boolean;
    prioritizeUrgent?: boolean;
  }
): OptimizationRun {
  const runId = `run-local-${Date.now()}`;
  const userId = 'demo-fleet-operator-01';
  const objective = options?.objective || 'balance_time_distance';
  const balanceWorkload = options?.balanceWorkload !== false;
  const prioritizeUrgent = options?.prioritizeUrgent !== false;

  // Re-order and partition stops based on chosen objective
  let organizedStops = [...stops];
  if (prioritizeUrgent || objective === 'prioritize_urgent') {
    const priorityWeights: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
    organizedStops.sort((a, b) => (priorityWeights[b.priority] || 2) - (priorityWeights[a.priority] || 2));
  } else if (objective === 'minimize_distance') {
    organizedStops.sort((a, b) => {
      const distA = Math.hypot(a.latitude - DEFAULT_DEPOT.latitude, a.longitude - DEFAULT_DEPOT.longitude);
      const distB = Math.hypot(b.latitude - DEFAULT_DEPOT.latitude, b.longitude - DEFAULT_DEPOT.longitude);
      return distA - distB;
    });
  }

  const assignments: VehicleRouteAssignment[] = vehicles.map((v, vIdx) => {
    // Distribute stops evenly across active fleet
    const assignedStops = organizedStops.filter((_, idx) => idx % vehicles.length === vIdx);

    const routeGeometry = [
      { latitude: DEFAULT_DEPOT.latitude, longitude: DEFAULT_DEPOT.longitude, isDepot: true },
      ...assignedStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude, stopId: s.id })),
      { latitude: DEFAULT_DEPOT.latitude, longitude: DEFAULT_DEPOT.longitude, isDepot: true },
    ];

    const distMult = objective === 'minimize_distance' ? 0.85 : 1.0;
    const stopsWithTimeline: RouteStopAssignment[] = assignedStops.map((s, seq) => ({
      id: `rsa-${v.id}-${s.id}`,
      assignmentId: `assign-${v.id}`,
      deliveryStopId: s.id,
      deliveryStop: s,
      sequenceNumber: seq + 1,
      estimatedArrivalAt: new Date(Date.now() + (seq + 1) * 20 * 60000).toISOString(),
      estimatedDepartureAt: new Date(Date.now() + ((seq + 1) * 20 + s.serviceDurationMinutes) * 60000).toISOString(),
      distanceFromPreviousKm: Number(((1.6 + Math.random() * 1.8) * distMult).toFixed(1)),
      travelMinutesFromPrevious: Number(((7 + Math.random() * 10) * distMult).toFixed(1)),
      riskLevel: s.priority === 'urgent' && !prioritizeUrgent ? 'medium' : 'low',
    }));

    const totalDist = Number(
      stopsWithTimeline.reduce((acc, curr) => acc + curr.distanceFromPreviousKm, 3.2).toFixed(1)
    );
    const totalDuration = Math.round(
      stopsWithTimeline.reduce(
        (acc, curr) => acc + curr.travelMinutesFromPrevious + curr.deliveryStop.serviceDurationMinutes,
        14
      )
    );
    const totalDelivered = stopsWithTimeline.reduce((acc, curr) => acc + curr.deliveryStop.demand, 0);

    return {
      id: `assign-${v.id}`,
      runId,
      userId,
      vehicleId: v.id,
      vehicleName: v.name,
      vehicleType: v.vehicleType,
      stopsCount: stopsWithTimeline.length,
      totalDistanceKm: totalDist,
      estimatedDurationMinutes: totalDuration,
      totalDemandDelivered: totalDelivered,
      utilizationPercent: Math.min(100, Math.round((totalDelivered / (v.capacity || 40)) * 100)),
      routeGeometry,
      stops: stopsWithTimeline,
      status: 'active',
    };
  });

  const totalDistAll = assignments.reduce((a, b) => a + b.totalDistanceKm, 0);
  const totalDurAll = assignments.reduce((a, b) => a + b.estimatedDurationMinutes, 0);
  const totalCo2 = Number((totalDistAll * 0.16).toFixed(1));

  const baselineMetrics: PlanMetrics = {
    totalDistanceKm: Number((totalDistAll * 1.28).toFixed(1)),
    totalDurationMinutes: Math.round(totalDurAll * 1.32),
    averageUtilizationPercent: 74,
    activeVehiclesCount: vehicles.length,
    assignedStopsCount: stops.length,
    unassignedStopsCount: 0,
    atRiskDeliveriesCount: objective === 'prioritize_urgent' ? 0 : 3,
    estimatedFuelLiters: Number(((totalDistAll * 1.28) * 0.12).toFixed(1)),
    estimatedCo2Kg: Number((totalCo2 * 1.28).toFixed(1)),
    estimatedCostUsd: Number(((totalDistAll * 1.28) * 1.35).toFixed(2)),
  };

  const optimizedMetrics: PlanMetrics = {
    totalDistanceKm: Number(totalDistAll.toFixed(1)),
    totalDurationMinutes: Math.round(totalDurAll),
    averageUtilizationPercent: balanceWorkload ? 89 : 82,
    activeVehiclesCount: vehicles.length,
    assignedStopsCount: stops.length,
    unassignedStopsCount: 0,
    atRiskDeliveriesCount: 0,
    estimatedFuelLiters: Number((totalDistAll * 0.09).toFixed(1)),
    estimatedCo2Kg: totalCo2,
    estimatedCostUsd: Number((totalDistAll * 1.05).toFixed(2)),
  };

  return {
    id: runId,
    userId,
    objective,
    calculationMode: 'simulated',
    inputSnapshot: {
      depot: DEFAULT_DEPOT,
      vehicleCount: vehicles.length,
      deliveryCount: stops.length,
      balanceWorkload,
      prioritizeUrgent,
    },
    baselineMetrics,
    optimizedMetrics,
    assignments,
    unassignedStops: [],
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
}

// Client-side Local Data Store Service
export const localDataService = {
  seed: () => {
    const vehicles = createDefaultVehicles();
    const stops = createDefaultStops();
    const run = generateLocalOptimizationRun(vehicles, stops);

    localStorage.setItem('routerescue_custom_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('routerescue_custom_stops', JSON.stringify(stops));
    localStorage.setItem('routerescue_latest_run', JSON.stringify(run));

    return { vehicles, stops, initialRun: run };
  },

  getVehicles: (): Vehicle[] => {
    try {
      const stored = localStorage.getItem('routerescue_custom_vehicles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    const fresh = createDefaultVehicles();
    localStorage.setItem('routerescue_custom_vehicles', JSON.stringify(fresh));
    return fresh;
  },

  getStops: (): DeliveryStop[] => {
    try {
      const stored = localStorage.getItem('routerescue_custom_stops');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    const fresh = createDefaultStops();
    localStorage.setItem('routerescue_custom_stops', JSON.stringify(fresh));
    return fresh;
  },

  getLatestRun: (): OptimizationRun => {
    try {
      const stored = localStorage.getItem('routerescue_latest_run');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    const vehicles = localDataService.getVehicles();
    const stops = localDataService.getStops();
    const run = generateLocalOptimizationRun(vehicles, stops);
    localStorage.setItem('routerescue_latest_run', JSON.stringify(run));
    return run;
  },

  runOptimization: (options?: {
    objective?: OptimizationObjective;
    balanceWorkload?: boolean;
    prioritizeUrgent?: boolean;
    vehicleIds?: string[];
    stopIds?: string[];
  }): OptimizationRun => {
    let vehicles = localDataService.getVehicles();
    let stops = localDataService.getStops();

    if (options?.vehicleIds && options.vehicleIds.length > 0) {
      vehicles = vehicles.filter((v) => options.vehicleIds!.includes(v.id));
    }
    if (options?.stopIds && options.stopIds.length > 0) {
      stops = stops.filter((s) => options.stopIds!.includes(s.id));
    }

    const run = generateLocalOptimizationRun(vehicles, stops, {
      objective: options?.objective || 'balance_time_distance',
      balanceWorkload: options?.balanceWorkload !== false,
      prioritizeUrgent: options?.prioritizeUrgent !== false,
    });

    localStorage.setItem('routerescue_latest_run', JSON.stringify(run));
    return run;
  },

  simulateDisruption: (
    baselineRun: OptimizationRun,
    scenarioType: 'traffic' | 'road_closure' | 'vehicle_breakdown' | 'urgent_delivery',
    name: string,
    configuration: any
  ): { scenario: DisruptionScenario; changedAssignments: VehicleRouteAssignment[] } => {
    const clonedRun: OptimizationRun = JSON.parse(JSON.stringify(baselineRun));

    if (scenarioType === 'traffic') {
      const mult = configuration.congestionMultiplier || 2.2;
      clonedRun.assignments = clonedRun.assignments.map((a) => ({
        ...a,
        totalDistanceKm: Number((a.totalDistanceKm * 1.15).toFixed(1)),
        estimatedDurationMinutes: Math.round(a.estimatedDurationMinutes * mult),
      }));
    } else if (scenarioType === 'vehicle_breakdown') {
      const breakdownId = configuration.breakdownVehicleId || clonedRun.assignments[0]?.vehicleId;
      const brokenAssignment = clonedRun.assignments.find((a) => a.vehicleId === breakdownId);
      const remainingAssignments = clonedRun.assignments.filter((a) => a.vehicleId !== breakdownId);

      if (brokenAssignment && remainingAssignments.length > 0) {
        brokenAssignment.stops.forEach((s, idx) => {
          const targetVan = remainingAssignments[idx % remainingAssignments.length];
          targetVan.stops.push(s);
          targetVan.stopsCount = targetVan.stops.length;
          targetVan.totalDemandDelivered += s.deliveryStop.demand;
          targetVan.totalDistanceKm = Number((targetVan.totalDistanceKm + 3.2).toFixed(1));
          targetVan.estimatedDurationMinutes += 25;
          targetVan.routeGeometry.push({
            latitude: s.deliveryStop.latitude,
            longitude: s.deliveryStop.longitude,
          });
        });
        clonedRun.assignments = remainingAssignments;
      }
    } else if (scenarioType === 'urgent_delivery') {
      const urgentStop: DeliveryStop = configuration.urgentStop || {
        id: `stop-urgent-${Date.now()}`,
        label: 'Emergency St. Jude Medical Supply Dispatch',
        latitude: 37.785,
        longitude: -122.42,
        demand: 3,
        priority: 'urgent',
        serviceDurationMinutes: 12,
        status: 'pending',
      };
      if (clonedRun.assignments.length > 0) {
        const primaryVan = clonedRun.assignments[0];
        primaryVan.stops.unshift({
          id: `urgent-${Date.now()}`,
          assignmentId: primaryVan.id,
          deliveryStopId: urgentStop.id,
          deliveryStop: urgentStop,
          sequenceNumber: 1,
          estimatedArrivalAt: new Date(Date.now() + 12 * 60000).toISOString(),
          estimatedDepartureAt: new Date(Date.now() + 20 * 60000).toISOString(),
          distanceFromPreviousKm: 1.4,
          travelMinutesFromPrevious: 8,
          riskLevel: 'high',
          riskReason: 'Urgent emergency priority route insertion',
        });
        primaryVan.stopsCount++;
        primaryVan.totalDemandDelivered += urgentStop.demand;
        primaryVan.routeGeometry.splice(1, 0, {
          latitude: urgentStop.latitude,
          longitude: urgentStop.longitude,
        });
      }
    }

    const baselineDist = baselineRun.assignments.reduce((a, b) => a + b.totalDistanceKm, 0);
    const clonedDist = clonedRun.assignments.reduce((a, b) => a + b.totalDistanceKm, 0);
    const baselineDur = baselineRun.assignments.reduce((a, b) => a + b.estimatedDurationMinutes, 0);
    const clonedDur = clonedRun.assignments.reduce((a, b) => a + b.estimatedDurationMinutes, 0);

    const scenario: DisruptionScenario = {
      id: `scen-${Date.now()}`,
      userId: 'demo-fleet-operator-01',
      name: name || `Simulated ${scenarioType}`,
      baselineRunId: baselineRun.id,
      scenarioType,
      configuration: {
        ...configuration,
        description: configuration?.description || `Simulated disruption event: ${scenarioType}`,
      },
      revisedRun: clonedRun,
      metricDeltas: {
        distanceDiffKm: Number(Math.max(0.1, clonedDist - baselineDist).toFixed(1)),
        durationDiffMinutes: Math.max(1, clonedDur - baselineDur),
        newlyAtRiskCount: scenarioType === 'traffic' ? 4 : 1,
        reassignedStopsCount: scenarioType === 'vehicle_breakdown' ? 3 : 1,
      },
      calculationMode: 'simulated',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('routerescue_active_scenario', JSON.stringify(scenario));
    localStorage.setItem('routerescue_latest_run', JSON.stringify(clonedRun));

    return { scenario, changedAssignments: clonedRun.assignments };
  },
};
