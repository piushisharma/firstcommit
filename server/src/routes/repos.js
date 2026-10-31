import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import {
  analyzeRepo,
  getRepoTree,
  getFileExplanation,
  getSetupGuide,
  chatWithRepo,
} from '../controllers/repos.js';

const router = Router();

// POST /repos/analyze
router.post(
  '/analyze',
  aiRateLimit,
  validate(z.object({
    url: z.string().url().includes('github.com'),
  })),
  analyzeRepo
);

// GET /repos/:owner/:repo/tree
router.get(
  '/:owner/:repo/tree',
  validate(z.object({
    owner: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:  z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  }), 'params'),
  getRepoTree
);

// GET /repos/:owner/:repo/file?path=
router.get(
  '/:owner/:repo/file',
  aiRateLimit,
  validate(z.object({
    owner: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:  z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  }), 'params'),
  validate(z.object({
    path: z.string().min(1).max(500).refine(p => !p.includes('..') && !p.startsWith('/'), {
      message: 'Invalid file path',
    }),
  }), 'query'),
  getFileExplanation
);

// POST /repos/:owner/:repo/setup-guide
router.post(
  '/:owner/:repo/setup-guide',
  aiRateLimit,
  validate(z.object({
    owner: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:  z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  }), 'params'),
  getSetupGuide
);

// POST /repos/:owner/:repo/chat
router.post(
  '/:owner/:repo/chat',
  aiRateLimit,
  validate(z.object({
    owner: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:  z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  }), 'params'),
  validate(z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(4000),
    })).min(1).max(20),
  })),
  chatWithRepo
);

export default router;
