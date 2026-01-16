import express from 'express';
const router = express.Router();

import { getStatsAdmin, getStatsEtudiant, getStatsEnseignant, getStudentDashboard, getTeacherDashboard } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.get('/admin', authenticate, authorize(['admin']), getStatsAdmin);
router.get('/etudiant', authenticate, getStatsEtudiant);
router.get('/enseignant', authenticate, getStatsEnseignant);

/**
 * GET /api/dashboard/student/:id
 * Dashboard étudiant avec toutes les stats
 */
router.get('/student/:id', authenticate, authorize(['student', 'admin']), getStudentDashboard);

/**
 * GET /api/dashboard/teacher/:id
 * Dashboard enseignant avec toutes les stats
 */
router.get('/teacher/:id', authenticate, authorize(['teacher', 'admin']), getTeacherDashboard);

export default router;