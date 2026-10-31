import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load root .env first, then local server .env, then fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
  const hasGithub = !!process.env.GITHUB_TOKEN;
  const hasGroq = !!process.env.GROQ_API_KEY;
  console.info(`[server] FirstCommit API listening on http://localhost:${PORT}`);
  console.info(`[server] Config: GitHub token: ${hasGithub ? 'present (5000 req/hr)' : 'MISSING (60 req/hr IP limit)'} | AI provider: ${hasGroq ? 'Groq' : 'Anthropic'}`);
});
