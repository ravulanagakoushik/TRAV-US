import { createApp } from './app.js';
import { config } from './config/env.js';

const app = createApp();

const port = config.port;

app.listen(port, () => {
  console.log(`====================================================`);
  console.log(`🚀 RouteRescue AI Optimization Server Running`);
  console.log(`📡 Port: ${port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🤖 Gemini Model: ${config.geminiModel}`);
  console.log(`💾 Supabase: ${config.supabaseUrl ? 'Connected' : 'Standalone / In-Memory Demo Mode'}`);
  console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
  console.log(`====================================================`);
});
