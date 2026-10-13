import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { computeRateLimiter } from '../middleware/rateLimiter.js';
import { fleetRepository, DEFAULT_DEPOT } from '../repositories/fleetRepository.js';
import { DisruptionScenarioSchema } from '../schemas/index.js';
import { executeScenarioSimulation } from '../optimization/simulatorEngine.js';
import { DisruptionScenario } from '../types/index.js';

export const simulatorRouter = Router();

simulatorRouter.use(authenticateToken);

// POST /api/scenarios (Create and optionally run scenario)
simulatorRouter.post('/', computeRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const data = DisruptionScenarioSchema.parse(req.body);

  const baselineRun = await fleetRepository.getOptimizationRunById(req.userId!, data.baselineRunId);
  if (!baselineRun) {
    res.status(404).json({ error: 'Not Found', message: 'Baseline optimization run not found' });
    return;
  }

  const vehicles = await fleetRepository.getVehicles(req.userId!);
  const stops = await fleetRepository.getStops(req.userId!);
  const depot = baselineRun.inputSnapshot.depot || DEFAULT_DEPOT;

  const scenarioId = `scen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const initialScenario: DisruptionScenario = {
    id: scenarioId,
    userId: req.userId!,
    baselineRunId: data.baselineRunId,
    name: data.name,
    scenarioType: data.scenarioType,
    configuration: data.configuration,
    calculationMode: 'simulated',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Run simulation
  const simulation = executeScenarioSimulation({
    scenario: initialScenario,
    baselineRun,
    vehicles,
    stops,
    depot,
  });

  initialScenario.revisedRun = simulation.revisedRun;
  initialScenario.metricDeltas = simulation.metricDeltas;
  initialScenario.status = 'completed';

  const saved = await fleetRepository.saveScenario(req.userId!, initialScenario);

  res.status(201).json({
    success: true,
    scenario: saved,
    changedAssignments: simulation.changedAssignments,
  });
});

// GET /api/scenarios
simulatorRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const scenarios = await fleetRepository.getScenarios(req.userId!);
  res.json({
    success: true,
    count: scenarios.length,
    scenarios,
  });
});

// GET /api/scenarios/:id
simulatorRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const scenario = await fleetRepository.getScenarioById(req.userId!, req.params.id);
  if (!scenario) {
    res.status(404).json({ error: 'Not Found', message: 'Scenario not found' });
    return;
  }
  res.json({ success: true, scenario });
});

// POST /api/scenarios/:id/run (Re-run scenario)
simulatorRouter.post('/:id/run', computeRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const scenario = await fleetRepository.getScenarioById(req.userId!, req.params.id);
  if (!scenario) {
    res.status(404).json({ error: 'Not Found', message: 'Scenario not found' });
    return;
  }

  const baselineRun = await fleetRepository.getOptimizationRunById(req.userId!, scenario.baselineRunId);
  if (!baselineRun) {
    res.status(404).json({ error: 'Not Found', message: 'Baseline run associated with scenario not found' });
    return;
  }

  const vehicles = await fleetRepository.getVehicles(req.userId!);
  const stops = await fleetRepository.getStops(req.userId!);
  const depot = baselineRun.inputSnapshot.depot || DEFAULT_DEPOT;

  const simulation = executeScenarioSimulation({
    scenario,
    baselineRun,
    vehicles,
    stops,
    depot,
  });

  scenario.revisedRun = simulation.revisedRun;
  scenario.metricDeltas = simulation.metricDeltas;
  scenario.status = 'completed';

  await fleetRepository.saveScenario(req.userId!, scenario);

  res.json({
    success: true,
    scenario,
    changedAssignments: simulation.changedAssignments,
  });
});
