import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

export interface AppConfig {
  nodeEnv: string;
  port: number;
  frontendOrigin: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  geminiApiKey?: string;
  geminiModel: string;
  routingBaseUrl?: string;
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || undefined,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || undefined,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  geminiApiKey: process.env.GEMINI_API_KEY || undefined,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  routingBaseUrl: process.env.ROUTING_BASE_URL || undefined,
};
