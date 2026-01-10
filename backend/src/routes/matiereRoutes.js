// Import d'Express Router
import express from 'express';
const router = express.Router();

// Import des controllers de matière
import
{
    getAllMatieres,
    getMatiereById,
    createMatiere,
    updateMatiere,
    deleteMatiere
} from '../controllers/matiereController.js';

// Import des middlewares d'authentification
import { authenticate, authorize } from '../middleware/auth.js';

/**
 * Route pour récupérer toutes les matières
 * GET /api/matieres
 * Accessible par : admin, teacher, student (tout le monde authentifié)
 */
router.get('/', authenticate, getAllMatieres);

/**
 * Route pour récupérer une matière par son ID
 * GET /api/matieres/:id
 * Accessible par : admin, teacher, student (tout le monde authentifié)
 */
router.get('/:id', authenticate, getMatiereById);

/**
 * Route pour créer une nouvelle matière
 * POST /api/matieres
 * Accessible par : admin seulement
 */
router.post('/', authenticate, authorize(['admin']), createMatiere);

/**
 * Route pour modifier une matière
 * PUT /api/matieres/:id
 * Accessible par : admin seulement
 */
router.put('/:id', authenticate, authorize(['admin']), updateMatiere);

/**
 * Route pour supprimer une matière
 * DELETE /api/matieres/:id
 * Accessible par : admin seulement
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteMatiere);

// On export le router
export default router;