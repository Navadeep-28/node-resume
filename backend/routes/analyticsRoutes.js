// backend/routes/analyticsRoutes.js
import express from 'express';
import { getDashboardStats, getSkillsAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/dashboard', getDashboardStats);
router.get('/skills', getSkillsAnalytics);

export default router;