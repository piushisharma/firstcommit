import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getSavedRepos, saveRepo, deleteSavedRepo,
  getSavedIssues, saveIssue, deleteSavedIssue,
} from '../controllers/saved.js';

const router = Router();

router.use(requireAuth);

router.get('/repos', getSavedRepos);
router.post('/repos', validate(z.object({
  owner: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
  repo:  z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  summary_json: z.record(z.unknown()).optional(),
})), saveRepo);
router.delete('/repos/:owner/:repo', deleteSavedRepo);

router.get('/issues', getSavedIssues);
router.post('/issues', validate(z.object({
  owner:        z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
  repo:         z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  issue_number: z.number().int().positive(),
  title:        z.string().max(500),
  difficulty:   z.enum(['Easy', 'Medium', 'Hard']).optional(),
})), saveIssue);
router.delete('/issues/:id', deleteSavedIssue);

export default router;
