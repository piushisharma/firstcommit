// Main entry point for Express service
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

import { createApp } from './src/app.js';

const app = createApp();
const PORT = process.env.PORT || 3001;

// Only listen if not imported as a serverless handler
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.info(`[server] FirstCommit API listening on http://localhost:${PORT}`);
  });
}

export default app;

