import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { fleetRepository } from '../repositories/fleetRepository.js';
import { ProfileUpdateSchema, PreferencesSchema } from '../schemas/index.js';

export const profileRouter = Router();

profileRouter.use(authenticateToken);

profileRouter.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  const profile = await fleetRepository.getProfile(req.userId!);
  res.json({ success: true, profile });
});

profileRouter.patch('/profile', async (req: AuthenticatedRequest, res: Response) => {
  const { displayName } = ProfileUpdateSchema.parse(req.body);
  const updated = await fleetRepository.updateProfile(req.userId!, displayName);
  res.json({ success: true, profile: updated });
});

profileRouter.get('/preferences', async (req: AuthenticatedRequest, res: Response) => {
  const preferences = await fleetRepository.getPreferences(req.userId!);
  res.json({ success: true, preferences });
});

profileRouter.patch('/preferences', async (req: AuthenticatedRequest, res: Response) => {
  const data = PreferencesSchema.parse(req.body);
  const updated = await fleetRepository.updatePreferences(req.userId!, data);
  res.json({ success: true, preferences: updated });
});
