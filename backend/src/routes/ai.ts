import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { computeRateLimiter } from '../middleware/rateLimiter.js';
import { fleetRepository } from '../repositories/fleetRepository.js';
import { AIAdviceRequestSchema } from '../schemas/index.js';
import { geminiService } from '../ai/geminiService.js';
import { AIAdvisory } from '../types/index.js';

export const aiRouter = Router();

aiRouter.use(authenticateToken);

// POST /api/ai/advice
aiRouter.post('/advice', computeRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const data = AIAdviceRequestSchema.parse(req.body);

  let run = null;
  if (data.runId) {
    run = await fleetRepository.getOptimizationRunById(req.userId!, data.runId);
  } else {
    // If no runId provided, fetch most recent run
    const runs = await fleetRepository.getOptimizationRuns(req.userId!);
    if (runs.length > 0) {
      run = runs[0];
    }
  }

  let scenario = null;
  if (data.scenarioId) {
    scenario = await fleetRepository.getScenarioById(req.userId!, data.scenarioId);
  }

  const adviceResult = await geminiService.generateAdvice({
    question: data.question,
    taskType: data.taskType,
    run,
    scenario,
  });

  const advisory: AIAdvisory = {
    id: `adv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: req.userId!,
    runId: data.runId,
    scenarioId: data.scenarioId,
    question: data.question,
    response: adviceResult.response,
    provider: adviceResult.provider,
    createdAt: new Date().toISOString(),
  };

  await fleetRepository.saveAdvisory(req.userId!, advisory);

  res.json({
    success: true,
    advisory,
  });
});

// GET /api/ai/advice/history
aiRouter.get('/advice/history', async (req: AuthenticatedRequest, res: Response) => {
  const history = await fleetRepository.getAdvisories(req.userId!);
  res.json({
    success: true,
    count: history.length,
    history,
  });
});
