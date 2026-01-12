import express from 'express';
const router = express.Router();

import { getStatsAdmin, getStatsEtudiant, getStatsEnseignant } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.get('/admin', authenticate, authorize(['admin']), getStatsAdmin);
router.get('/etudiant', authenticate, getStatsEtudiant);
router.get('/enseignant', authenticate, getStatsEnseignant);

export default router;