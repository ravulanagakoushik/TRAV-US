import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { fleetRepository } from '../repositories/fleetRepository.js';
import { DeliveryStopCreateSchema, DeliveryStopUpdateSchema } from '../schemas/index.js';

export const stopsRouter = Router();

stopsRouter.use(authenticateToken);

// GET /api/stops
stopsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const stops = await fleetRepository.getStops(req.userId!);
  res.json({ success: true, count: stops.length, stops });
});

// POST /api/stops
stopsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const data = DeliveryStopCreateSchema.parse(req.body);
  const created = await fleetRepository.createStop(req.userId!, {
    label: data.label,
    latitude: data.latitude,
    longitude: data.longitude,
    demand: data.demand,
    priority: data.priority,
    earliestServiceAt: data.earliestServiceAt || undefined,
    deadlineAt: data.deadlineAt || undefined,
    serviceDurationMinutes: data.serviceDurationMinutes,
    status: data.status,
  });
  res.status(201).json({ success: true, stop: created });
});

// GET /api/stops/:id
stopsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const stop = await fleetRepository.getStopById(req.userId!, req.params.id);
  if (!stop) {
    res.status(404).json({ error: 'Not Found', message: 'Delivery stop not found' });
    return;
  }
  res.json({ success: true, stop });
});

// PATCH /api/stops/:id
stopsRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const data = DeliveryStopUpdateSchema.parse(req.body);
  const updated = await fleetRepository.updateStop(req.userId!, req.params.id, data as any);
  if (!updated) {
    res.status(404).json({ error: 'Not Found', message: 'Delivery stop not found' });
    return;
  }
  res.json({ success: true, stop: updated });
});

// DELETE /api/stops/:id
stopsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await fleetRepository.deleteStop(req.userId!, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found', message: 'Delivery stop not found' });
    return;
  }
  res.json({ success: true, message: 'Delivery stop deleted successfully' });
});
