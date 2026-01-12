import express from 'express';
const router = express.Router();

import { saisirNote, getNotesEtudiant, getBulletin, supprimerNote } from '../controllers/noteController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.post('/', authenticate, authorize(['admin', 'teacher']), saisirNote);
router.get('/etudiant/:id', authenticate, getNotesEtudiant);
router.get('/bulletin/:id_etudiant/:semestre', authenticate, getBulletin);
router.delete('/:id', authenticate, authorize(['admin', 'teacher']), supprimerNote);

export default router;