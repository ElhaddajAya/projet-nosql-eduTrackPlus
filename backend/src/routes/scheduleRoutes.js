// Import d'Express Router
import express from 'express';
const router = express.Router();

// Import des controllers
import
{
    planifierSeance,
    updateStatutSeance,
    getEmploiTempsClasse,
    getEmploiTempsEnseignant,
    getOccupationSalle,
    getSallesDisponibles,
} from '../controllers/scheduleController.js';

// Import middlewares
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * POST /api/emploi-temps/seances
 * Planifier une nouvelle séance
 * Accessible par : admin seulement
 */
router.post('/seances', authenticate, authorize(['admin']), planifierSeance);

/**
 * PUT /api/emploi-temps/seances/:id/statut
 * Mettre à jour le statut d'une séance (+ code couleur automatique)
 * Accessible par : admin, teacher (pour déclarer absence)
 */
router.put('/seances/:id/statut', authenticate, authorize(['admin', 'teacher']), updateStatutSeance);

/**
 * GET /api/emploi-temps/classe/:id
 * Récupérer l'emploi du temps d'une classe
 * Accessible par : admin, teacher, student
 */
router.get('/classe/:id', authenticate, getEmploiTempsClasse);

/**
 * GET /api/emploi-temps/enseignant/:id
 * Récupérer l'emploi du temps d'un enseignant
 * Accessible par : admin, teacher
 */
router.get('/enseignant/:id', authenticate, authorize(['admin', 'teacher']), getEmploiTempsEnseignant);

/**
 * GET /api/emploi-temps/salle/:id
 * Récupérer l'occupation d'une salle
 * Accessible par : admin
 */
router.get('/salle/:id', authenticate, authorize(['admin']), getOccupationSalle);

/**
 * GET /api/emploi-temps/salles-disponibles
 * Trouver les salles disponibles pour un créneau donné
 * Query params: id_creneau, date
 * Accessible par : admin
 */
router.get('/salles-disponibles', authenticate, authorize(['admin']), getSallesDisponibles);

export default router;