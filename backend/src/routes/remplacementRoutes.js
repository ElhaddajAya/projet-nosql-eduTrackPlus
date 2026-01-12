import express from 'express';
const router = express.Router();

import { demanderRemplacement, getEnseignantsDisponibles, accepterRemplacement, getRemplacementsEnAttente } from '../controllers/remplacementController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.post('/demander', authenticate, authorize(['admin', 'teacher']), demanderRemplacement);
router.get('/enseignants-disponibles/:seance_id', authenticate, authorize(['admin']), getEnseignantsDisponibles);
router.post('/:id/accepter', authenticate, authorize(['admin']), accepterRemplacement);
router.get('/en-attente', authenticate, authorize(['admin']), getRemplacementsEnAttente);

export default router;