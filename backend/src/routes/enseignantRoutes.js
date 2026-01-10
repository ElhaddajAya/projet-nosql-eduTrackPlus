// Import d'Express Router
import express from 'express';
const router = express.Router();

// Import des controllers d'enseignant
import
{
    getAllEnseignants,
    getEnseignantById,
    createEnseignant,
    updateEnseignant,
    deleteEnseignant
} from '../controllers/enseignantController.js';

// Import des middlewares d'authentification
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Route pour récupérer tous les enseignants
 * GET /api/enseignants
 * Accessible par : admin, teacher (pas student)
 */
router.get('/', authenticate, authorize(['admin', 'teacher']), getAllEnseignants);

/**
 * Route pour récupérer un enseignant par son ID
 * GET /api/enseignants/:id
 * Accessible par : admin, teacher (pas student)
 */
router.get('/:id', authenticate, authorize(['admin', 'teacher']), getEnseignantById);

/**
 * Route pour créer un nouvel enseignant
 * POST /api/enseignants
 * Accessible par : admin seulement
 */
router.post('/', authenticate, authorize(['admin']), createEnseignant);

/**
 * Route pour modifier un enseignant
 * PUT /api/enseignants/:id
 * Accessible par : admin seulement
 */
router.put('/:id', authenticate, authorize(['admin']), updateEnseignant);

/**
 * Route pour supprimer un enseignant
 * DELETE /api/enseignants/:id
 * Accessible par : admin seulement
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteEnseignant);

// On export le router
export default router;