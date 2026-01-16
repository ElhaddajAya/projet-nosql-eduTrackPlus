import express from 'express';
const router = express.Router();

import
{
    demanderRemplacement,
    getEnseignantsDisponibles,
    accepterRemplacement,
    getRemplacementsEnAttente,
    getHistoriqueAbsences
} from '../controllers/remplacementController.js';

import { authenticate, authorize } from '../middleware/auth.js';

/**
 * 1️⃣ Déclaration d'absence (enseignant ou admin)
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

/**
 * 5️⃣ ⭐ NOUVEAU : Historique des absences d'un enseignant
 * GET /api/remplacements/historique/:id_enseignant
 */
router.get(
    '/historique/:id_enseignant',
    authenticate,
    authorize(['teacher', 'admin']),
    getHistoriqueAbsences
);

export default router;