import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config/env.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Request payload failed data validation rules',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Syntax / JSON Parsing Errors
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Malformed JSON payload in request body',
    });
    return;
  }

  // Default Centralized Error Handling
  console.error('[ServerError]', err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'production' ? 'An unexpected server error occurred.' : err.message,
    ...(config.nodeEnv !== 'production' && { stack: err.stack }),
  });
}
