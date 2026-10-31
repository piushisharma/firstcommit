import { Router } from 'express';
import repoRoutes from './repos.js';
import issueRoutes from './issues.js';
import roadmapRoutes from './roadmaps.js';
import savedRoutes from './saved.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ status: 'ok' }));
router.use('/repos', repoRoutes);
router.use('/issues', issueRoutes);
router.use('/roadmaps', roadmapRoutes);
router.use('/saved', savedRoutes);

export default router;
