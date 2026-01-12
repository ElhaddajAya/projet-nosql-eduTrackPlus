import express from 'express';
const router = express.Router();

import { marquerPresence, getPresencesEtudiant, getLeaderboard, getStreak } from '../controllers/presenceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.post('/', authenticate, authorize(['admin', 'teacher']), marquerPresence);
router.get('/etudiant/:id', authenticate, getPresencesEtudiant);
router.get('/leaderboard', authenticate, getLeaderboard);
router.get('/streak/:id', authenticate, getStreak);

export default router;