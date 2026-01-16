import express from 'express';
const router = express.Router();

import
{
    demanderRemplacement,
    getEnseignantsDisponibles,
    accepterRemplacement,
    getRemplacementsEnAttente
} from '../controllers/remplacementController.js';

import { authenticate, authorize } from '../middleware/auth.js';

/**
 * 1️⃣ Déclaration d’absence (enseignante ou admin)
 * POST /api/remplacements/demander
 */
router.post(
    '/demander',
    authenticate,
    authorize(['teacher', 'admin']),
    demanderRemplacement
);

/**
 * 2️⃣ Calcul des enseignants disponibles (admin uniquement)
 * GET /api/remplacements/enseignants-disponibles/:seance_id
 */
router.get(
    '/enseignants-disponibles/:seance_id',
    authenticate,
    authorize(['admin']),
    getEnseignantsDisponibles
);

/**
 * 3️⃣ Acceptation du remplacement (admin uniquement)
 * POST /api/remplacements/:id/accepter
 */
router.post(
    '/:id/accepter',
    authenticate,
    authorize(['admin']),
    accepterRemplacement
);

/**
 * 4️⃣ Liste des demandes en attente (admin)
 * GET /api/remplacements/en-attente
 */
router.get(
    '/en-attente',
    authenticate,
    authorize(['admin']),
    getRemplacementsEnAttente
);

export default router;