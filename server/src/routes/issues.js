import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { aiRateLimit } from '../middleware/rateLimit.js';
import { searchIssues, analyzeIssue } from '../controllers/issues.js';

const router = Router();

// GET /issues
router.get(
  '/',
  validate(z.object({
    language:   z.string().max(50).optional(),
    label:      z.string().max(100).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
    sort:       z.enum(['created', 'updated', 'comments']).optional(),
    page:       z.coerce.number().int().min(1).max(50).optional(),
  }), 'query'),
  searchIssues
);

// POST /issues/analyze
router.post(
  '/analyze',
  aiRateLimit,
  validate(z.object({
    owner:  z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:   z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
    number: z.number().int().positive(),
  })),
  analyzeIssue
);

export default router;
