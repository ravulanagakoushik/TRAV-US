import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js';
import { fleetRepository } from '../repositories/fleetRepository.js';
import { VehicleCreateSchema, VehicleUpdateSchema } from '../schemas/index.js';

export const vehiclesRouter = Router();

vehiclesRouter.use(authenticateToken);

// GET /api/vehicles
vehiclesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const vehicles = await fleetRepository.getVehicles(req.userId!);
  res.json({ success: true, count: vehicles.length, vehicles });
});

// POST /api/vehicles
vehiclesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const data = VehicleCreateSchema.parse(req.body);
  const created = await fleetRepository.createVehicle(req.userId!, data);
  res.status(201).json({ success: true, vehicle: created });
});

// GET /api/vehicles/:id
vehiclesRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const vehicle = await fleetRepository.getVehicleById(req.userId!, req.params.id);
  if (!vehicle) {
    res.status(404).json({ error: 'Not Found', message: 'Vehicle not found' });
    return;
  }
  res.json({ success: true, vehicle });
});

// PATCH /api/vehicles/:id
vehiclesRouter.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const data = VehicleUpdateSchema.parse(req.body);
  const updated = await fleetRepository.updateVehicle(req.userId!, req.params.id, data);
  if (!updated) {
    res.status(404).json({ error: 'Not Found', message: 'Vehicle not found' });
    return;
  }
  res.json({ success: true, vehicle: updated });
});

// DELETE /api/vehicles/:id
vehiclesRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await fleetRepository.deleteVehicle(req.userId!, req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not Found', message: 'Vehicle not found' });
    return;
  }
  res.json({ success: true, message: 'Vehicle deleted successfully' });
});
