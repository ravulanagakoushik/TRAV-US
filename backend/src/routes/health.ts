import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'RouteRescue AI Optimization Engine',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});
