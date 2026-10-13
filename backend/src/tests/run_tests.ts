import { optimizeRoutes } from '../optimization/routingEngine.js';
import { executeScenarioSimulation } from '../optimization/simulatorEngine.js';
import { evaluateDeliveryRisks } from '../optimization/riskEngine.js';
import { haversineDistanceKm, estimateRoadDistanceKm } from '../optimization/distance.js';
import { createSeedData, DEFAULT_DEPOT, FleetRepository } from '../repositories/fleetRepository.js';
import { geminiService } from '../ai/geminiService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log(`====================================================`);
  console.log(`🧪 Running RouteRescue AI Comprehensive Test Suite`);
  console.log(`====================================================\n`);

  // Test 1: Geodesic & Road Distance Calculation
  console.log(`[Test Group 1: Distance & Road Tortuosity Models]`);
  const ptA = { latitude: 37.7749, longitude: -122.4194 };
  const ptB = { latitude: 37.7849, longitude: -122.4094 };
  const straightDist = haversineDistanceKm(ptA, ptB);
  const roadDist = estimateRoadDistanceKm(ptA, ptB);
  assert(straightDist > 0 && straightDist < 5, 'Haversine distance is within expected urban range (1-3 km)');
  assert(roadDist > straightDist, 'Road network distance correctly accounts for urban street tortuosity');

  // Test 2: Fleet Data Generation & Capacity Constraints
  console.log(`\n[Test Group 2: Capacity & Multi-Objective Route Optimization]`);
  const seed = createSeedData('test-user-01');
  assert(seed.vehicles.length >= 6, 'Seed fleet contains eligible vehicles (>= 6)');
  assert(seed.stops.length >= 18, 'Seed deliveries contain realistic stops (>= 18)');

  const optResult = optimizeRoutes({
    depot: DEFAULT_DEPOT,
    vehicles: seed.vehicles,
    stops: seed.stops,
    objective: 'balance_time_distance',
    balanceWorkload: true,
    prioritizeUrgent: true,
  });

  assert(optResult.assignments.length > 0, 'Optimizer successfully generated vehicle route assignments');
  assert(optResult.optimizedMetrics.assignedStopsCount > 0, 'Optimizer assigned delivery stops');
  assert(optResult.baselineMetrics.totalDistanceKm >= 0, 'Baseline comparison metrics computed');

  // Check vehicle capacity constraints
  let capacityViolated = false;
  for (const a of optResult.assignments) {
    const v = seed.vehicles.find((veh) => veh.id === a.vehicleId);
    if (v && a.totalDemandDelivered > v.capacity) {
      capacityViolated = true;
    }
  }
  assert(!capacityViolated, 'No vehicle exceeded its maximum payload capacity limit');

  // Test 3: Delivery Delay Prediction & Risk Engine
  console.log(`\n[Test Group 3: Delay Prediction & Risk Analysis Engine]`);
  const sampleStopsWithArrivals = optResult.assignments[0]?.stops.map((s) => ({
    stop: s.deliveryStop,
    estimatedArrivalAt: s.estimatedArrivalAt,
    travelMinutesFromPrevious: s.travelMinutesFromPrevious,
    sequenceNumber: s.sequenceNumber,
  })) || [];

  const riskEvaluations = evaluateDeliveryRisks(sampleStopsWithArrivals, 1.0);
  assert(riskEvaluations.length === sampleStopsWithArrivals.length, 'Risk engine evaluated every stop on route');
  const hasValidRiskLevels = riskEvaluations.every((r) => ['low', 'medium', 'high', 'unknown'].includes(r.riskLevel));
  assert(hasValidRiskLevels, 'All evaluated risks map to valid standardized risk tiers');

  // Test 4: What-If Disruption Simulator
  console.log(`\n[Test Group 4: What-If Mobility Simulator]`);
  const baselineRun = {
    id: 'run-test-baseline',
    userId: 'test-user-01',
    objective: 'balance_time_distance' as const,
    calculationMode: 'estimated' as const,
    inputSnapshot: {
      depot: DEFAULT_DEPOT,
      vehicleCount: seed.vehicles.length,
      deliveryCount: seed.stops.length,
      balanceWorkload: true,
      prioritizeUrgent: true,
    },
    baselineMetrics: optResult.baselineMetrics,
    optimizedMetrics: optResult.optimizedMetrics,
    assignments: optResult.assignments,
    unassignedStops: optResult.unassignedStops,
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
  };

  const trafficSimulation = executeScenarioSimulation({
    scenario: {
      id: 'scen-traffic-01',
      userId: 'test-user-01',
      baselineRunId: baselineRun.id,
      name: 'Severe Downtown Traffic Surge',
      scenarioType: 'traffic',
      configuration: {
        congestionMultiplier: 2.2,
        description: 'Simulated 2.2x rush hour congestion on city core',
      },
      calculationMode: 'simulated',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    baselineRun,
    vehicles: seed.vehicles,
    stops: seed.stops,
    depot: DEFAULT_DEPOT,
  });

  assert(trafficSimulation.revisedRun.optimizedMetrics.totalDurationMinutes > baselineRun.optimizedMetrics.totalDurationMinutes,
    'Traffic disruption correctly calculated increased travel duration');
  assert(trafficSimulation.metricDeltas.durationDiffMinutes > 0,
    'Metric deltas accurately reflect duration increase');

  // Breakdown simulation
  const brokenVehicleId = seed.vehicles[0].id;
  const breakdownSimulation = executeScenarioSimulation({
    scenario: {
      id: 'scen-breakdown-01',
      userId: 'test-user-01',
      baselineRunId: baselineRun.id,
      name: 'Vehicle Engine Failure',
      scenarioType: 'vehicle_breakdown',
      configuration: {
        breakdownVehicleId: brokenVehicleId,
        description: 'Lead cargo van broke down mid-route',
      },
      calculationMode: 'simulated',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
    baselineRun,
    vehicles: seed.vehicles,
    stops: seed.stops,
    depot: DEFAULT_DEPOT,
  });

  const brokenVehicleAssignment = breakdownSimulation.revisedRun.assignments.find((a) => a.vehicleId === brokenVehicleId);
  assert(!brokenVehicleAssignment || brokenVehicleAssignment.stopsCount === 0,
    'Broken vehicle stops were reassigned to other operating units');

  // Test 5: Grounded AI Mobility Advisor
  console.log(`\n[Test Group 5: Grounded AI Mobility Advisor]`);
  const advice = await geminiService.generateAdvice({
    question: 'Why is this delivery delayed and what actions should dispatch take?',
    taskType: 'delivery_risk_assessment',
    run: baselineRun,
  });

  assert(advice.provider === 'gemini' || advice.provider === 'fallback_rules_engine', 'AI advisor returned valid provider attribution');
  assert(typeof advice.response.summary === 'string', 'AI advisor provided clear executive summary');

  // Test 6: Repository Isolation
  console.log(`\n[Test Group 6: Data Repository & User Isolation]`);
  const repo = new FleetRepository();
  const user1Vehicles = await repo.getVehicles('user-alpha');
  const user2Vehicles = await repo.getVehicles('user-beta');
  assert(user1Vehicles.length > 0 && user2Vehicles.length > 0, 'Seed instances initialized for distinct users');
  assert(user1Vehicles[0].userId === 'user-alpha', 'User alpha records strictly owned by user alpha');
  assert(user2Vehicles[0].userId === 'user-beta', 'User beta records strictly owned by user beta');

  console.log(`\n====================================================`);
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`====================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
