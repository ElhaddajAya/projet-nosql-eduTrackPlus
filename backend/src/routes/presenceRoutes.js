import express from 'express';
const router = express.Router();

import
{
    marquerPresence,
    marquerPresencesMasse,
    verifierPresencesSeance,
    getPresencesSeance,
    getPresencesEtudiant,
    getLeaderboard,
    getStreak
} from '../controllers/presenceController.js';

import { authenticate, authorize } from '../middleware/auth.js';

// ========================================
// ROUTES PRINCIPALES
// ========================================

// ✅ NOUVELLE : Vérifier si déjà marqué AVANT d'afficher
router.get('/verifier/:id_seance', authenticate, verifierPresencesSeance);

// ✅ NOUVELLE : Marquer en masse (tous les étudiants d'un coup)
router.post('/masse', authenticate, authorize(['admin', 'teacher']), marquerPresencesMasse);

// Marquer présence individuelle
router.post('/', authenticate, authorize(['admin', 'teacher']), marquerPresence);

// Récupérer présences d'une séance
router.get('/seance/:id_seance', authenticate, getPresencesSeance);

// Récupérer présences d'un étudiant
router.get('/etudiant/:id', authenticate, getPresencesEtudiant);

// Leaderboard
router.get('/leaderboard', authenticate, getLeaderboard);

// Streak d'un étudiant
router.get('/streak/:id', authenticate, getStreak);

export default router;