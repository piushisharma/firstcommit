import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  createRoadmap,
  getRoadmap,
  updateStep,
} from '../controllers/roadmaps.js';

const router = Router();

router.use(requireAuth);

// POST /roadmaps
router.post(
  '/',
  validate(z.object({
    owner:        z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:         z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
    issue_number: z.number().int().positive().optional(),
    title:        z.string().max(200),
  })),
  createRoadmap
);

// GET /roadmaps/:id
router.get('/:id', validate(z.object({ id: z.string().uuid() }), 'params'), getRoadmap);

// PATCH /roadmaps/:id/steps/:stepId
router.patch(
  '/:id/steps/:stepId',
  validate(z.object({
    id:     z.string().uuid(),
    stepId: z.string().uuid(),
  }), 'params'),
  validate(z.object({ done: z.boolean() })),
  updateStep
);

export default router;
