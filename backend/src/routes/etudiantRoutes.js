// Import d'Express Router
import express from 'express';
const router = express.Router();

// Import des controllers d'étudiant
import
{
    getAllEtudiants,
    getEtudiantById,
    createEtudiant,
    updateEtudiant,
    deleteEtudiant,
    getCandidatsEtudiants
} from '../controllers/etudiantController.js';

// Import des middlewares d'authentification
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Route pour récupérer tous les candidats étudiants
 * GET /api/etudiants/candidats
 * Accessible par : admin seulement
 */
router.get('/candidats', authenticate, authorize(['admin']), getCandidatsEtudiants);

/**
 * Route pour récupérer tous les étudiants
 * GET /api/etudiants
 * Accessible par : admin, teacher
 */
router.get('/', authenticate, authorize(['admin', 'teacher']), getAllEtudiants);

/**
 * Route pour récupérer un étudiant par son ID
 * GET /api/etudiants/:id
 * Accessible par : admin, teacher
 */
router.get('/:id', authenticate, authorize(['admin', 'teacher']), getEtudiantById);

/**
 * Route pour créer un nouvel étudiant
 * POST /api/etudiants
 * Accessible par : admin seulement
 */
router.post('/', authenticate, authorize(['admin']), createEtudiant);

/**
 * Route pour modifier un étudiant
 * PUT /api/etudiants/:id
 * Accessible par : admin seulement
 */
router.put('/:id', authenticate, authorize(['admin']), updateEtudiant);

/**
 * Route pour supprimer un étudiant
 * DELETE /api/etudiants/:id
 * Accessible par : admin seulement
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteEtudiant);

// On export le router
export default router;