import { Router, Request, Response } from 'express';
import { fleetRepository } from '../repositories/fleetRepository.js';

export const trackingRouter = Router();

// GET /api/tracking/:token (Public scoped tracking endpoint)
trackingRouter.get('/:token', async (req: Request, res: Response) => {
  const token = req.params.token;

  if (!token || token.length < 5) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid tracking token format' });
    return;
  }

  const stop = await fleetRepository.getStopByTrackingToken(token);
  if (!stop) {
    res.status(404).json({
      error: 'Not Found',
      message: 'No delivery package found matching this tracking reference number',
    });
    return;
  }

  // Calculate ETA window based on scheduled window or service duration
  const now = new Date();
  const arrivalDate = stop.earliestServiceAt
    ? new Date(stop.earliestServiceAt)
    : new Date(now.getTime() + 45 * 60000);
  const deadlineDate = stop.deadlineAt ? new Date(stop.deadlineAt) : new Date(arrivalDate.getTime() + 60 * 60000);

  const isDelayed = now > deadlineDate;

  // Return strictly limited customer-facing information
  res.json({
    success: true,
    tracking: {
      trackingNumber: stop.trackingToken,
      destinationLabel: stop.label,
      status: stop.status,
      priority: stop.priority,
      estimatedArrivalWindow: {
        earliest: arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latest: deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: arrivalDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      },
      delayNotice: isDelayed
        ? 'Delivery is experiencing transit delay due to localized traffic adjustments.'
        : 'Transit is proceeding on schedule within expected delivery window.',
      operationalNote: 'Calculated using RouteRescue AI dynamic dispatch optimizer.',
    },
  });
});
