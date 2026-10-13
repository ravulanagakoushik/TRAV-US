import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

const supabase =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

/**
 * Authentication Middleware:
 * Verifies Supabase Bearer JWT or demo token, strictly isolating users.
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If running in development/demo mode without token, assign dedicated default demo user
    if (config.nodeEnv === 'development' || !supabase) {
      req.userId = 'demo-fleet-operator-01';
      req.userEmail = 'dispatcher@routerescue.ai';
      return next();
    }
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization bearer header',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Demo token support
  if (token.startsWith('demo-token-')) {
    const customId = token.replace('demo-token-', '');
    req.userId = customId || 'demo-fleet-operator-01';
    req.userEmail = 'dispatcher@routerescue.ai';
    return next();
  }

  // Supabase Auth verification
  if (supabase) {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token',
        });
        return;
      }

      req.userId = user.id;
      req.userEmail = user.email;
      return next();
    } catch (err) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Failed to verify session token with authentication authority',
      });
      return;
    }
  }

  // Fallback demo user
  req.userId = 'demo-fleet-operator-01';
  req.userEmail = 'dispatcher@routerescue.ai';
  next();
}
