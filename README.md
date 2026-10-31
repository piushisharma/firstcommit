# FirstCommit ✦
> **"Breaking the barriers to open source by turning first-time developers into confident contributors, one commit at a time."**

FirstCommit is a retro-OS styled, AI-powered onboarding assistant designed to help college students, beginner programmers, and first-time contributors navigate open-source GitHub repositories without feeling overwhelmed.

---

## ✦ Architecture Overview

FirstCommit is structured as a full-stack monorepo:

```
firstcommit/
├── client/                 # React 18 + Vite SPA (Retro-OS custom design)
│   ├── src/
│   │   ├── components/     # Window, MenuBar, Button, Folder, Toast, Skeleton, DifficultyBadge
│   │   ├── pages/          # Home, Explain, Explorer, Issues, Setup, Roadmap, Dashboard, NotFound
│   │   ├── hooks/          # useAuth, useLocalStorage
│   │   ├── lib/            # api.js, supabase.js
│   │   └── styles/         # tokens.css, global.css
│   └── index.html
├── server/                 # Express backend (ES Modules)
│   ├── api/index.js        # Serverless entry for Vercel
│   └── src/
│       ├── app.js          # App factory with Helmet, CORS, Rate Limiters
│       ├── controllers/    # repos, issues, roadmaps, saved
│       ├── middleware/     # auth, errorHandler, rateLimit, validate
│       ├── prompts/        # repoAnalysis, fileExplanation, setupGuide, issueAnalysis, chat
│       ├── routes/         # repos, issues, roadmaps, saved
│       ├── services/       # ai.js (Claude abstraction), github.js (Octokit), cache.js (L1 mem + L2 Supabase)
│       └── tests/          # urlParser.test.js, validate.test.js
├── supabase/
│   └── migrations/         # 001_initial_schema.sql (RLS-enabled schema)
├── vercel.json             # Monorepo deployment with API serverless rewrites
└── README.md
```

### System Architecture Flow
```
User Browser (React 18 + Retro OS)
       │
       ▼
   Vercel Edge / API Gateway
       │
       ├─► /api/* ──► Express API Server
       │                  │
       │                  ├──► Cache (L1 Memory + L2 Supabase Table)
       │                  ├──► GitHub REST API (Octokit + Octokit Search)
       │                  └──► Anthropic Claude API (services/ai.js prompt-injection safe)
       │
       └─► Supabase Auth (GitHub OAuth) + Postgres (RLS enabled)
```

---

## ✦ Key Features

1. **Repo Explainer (`/explain/:owner/:repo`)**: Paste any GitHub URL to receive an interactive plain-English summary: what it does, complete tech stack with beginner tips, annotated folder map, key files breakdown, and how the pieces connect.
2. **Codebase Explorer (`/explore/:owner/:repo`)**: Interactive collapsible file tree. Click any file to view a beginner-friendly AI explanation and syntax-highlighted code preview.
3. **Good First Issue Finder (`/issues`)**: Filter GitHub issues by programming language and label (`good first issue`, `help wanted`, etc.). One-click AI breakdown explains the issue, likely files to edit, difficulty level, and recommended steps.
4. **Setup Guide (`/setup/:owner/:repo`)**: Step-by-step local development setup instructions derived from README, package managers, and configuration files, with copy buttons and common troubleshooting fixes.
5. **First Contribution Roadmap (`/roadmap/:id`)**: An interactive 10-step checklist (fork, clone, branch, develop, test, commit, push, PR, review) with persistent progress tracking, suggested PR titles, and commit messages.
6. **Chat Assistant**: "Ask about this repo" embedded mentor box grounded in the repository context with prompt injection defenses.
7. **User Dashboard (`/dashboard`)**: GitHub OAuth authentication via Supabase to save starred repos, bookmarked issues, and ongoing roadmaps. Works seamlessly for anonymous guests as well.

---

## ✦ Environment Variables

Copy `.env.example` to `.env` in both client and server or root:

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | Client | URL of the Express API (e.g. `http://localhost:3001` or empty in production) |
| `VITE_SUPABASE_URL` | Client | Supabase Project URL (`https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase Public / Anon API key |
| `GROQ_API_KEY` | Server | Groq API Key (`gsk_...`) for ultra-fast Llama 3 models |
| `ANTHROPIC_API_KEY` | Server | Optional: Anthropic Claude API Key (`sk-ant-...`) |
| `GITHUB_TOKEN` | Server | GitHub Personal Access Token (for higher Octokit rate limits) |
| `SUPABASE_URL` | Server | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase Service Role Key (bypasses RLS for server-side cache and admin) |
| `SUPABASE_JWT_SECRET` | Server | Secret for validating Supabase JWT bearer tokens |
| `CLIENT_ORIGIN` | Server | Frontend origin URL for CORS (`http://localhost:5173` or custom domain) |
| `PORT` | Server | Port for the Express server (default: `3001`) |

---

## ✦ Local Development Setup

### 1. Prerequisites
- Node.js 18+
- npm 9+
- Supabase account (free tier)
- Anthropic API key & GitHub Personal Access Token

### 2. Installation
```bash
git clone https://github.com/your-username/firstcommit.git
cd firstcommit
npm install
```

### 3. Configure Supabase
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Open `supabase/migrations/001_initial_schema.sql` and run it. This creates:
   - `profiles` table with automatic signup triggers
   - `saved_repos`, `saved_issues`, `roadmaps`, `roadmap_steps` with full Row-Level Security (RLS)
   - `cache` table for L2 LLM response caching
4. Under **Authentication → Providers**, enable **GitHub** and enter your GitHub OAuth app credentials.

### 4. Running Locally
Start both backend server and frontend client concurrently:
```bash
npm run dev
```

- Client will run on: `http://localhost:5173`
- Server will run on: `http://localhost:3001`

To run tests:
```bash
npm test
```

---

## ✦ Deployment to Vercel

1. Push your repository to GitHub.
2. In the Vercel Dashboard, import the `firstcommit` repository.
3. Configure the environment variables in Vercel project settings:
   - `ANTHROPIC_API_KEY`
   - `GITHUB_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `CLIENT_ORIGIN` (your Vercel production domain)
4. Deploy! Vercel will use `vercel.json` to:
   - Build `client` to static assets (`client/dist`)
   - Route `/api/*` to `server/api/index.js`
   - Route all other paths to `index.html` for client-side routing.

---

## ✦ Known Limitations
- Repositories without code files (pure markdown or empty repos) will show minimal AI context.
- GitHub unauthenticated rate limits apply if `GITHUB_TOKEN` is not supplied.
- Extremely large repositories (> 5,000 files) will have their file tree truncated at 500 items for responsive performance.

