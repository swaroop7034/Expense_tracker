import 'dotenv/config'; // Ensures env vars are loaded early
import 'dotenv/config';
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
  console.log(`📚 Swagger documentation available at http://localhost:${env.PORT}/api-docs`);
});
