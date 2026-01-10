// Import d'Express Router
import express from 'express';
const router = express.Router();

// Import des controllers de classe
import
{
    getAllClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} from '../controllers/classController.js';

// Import des middlewares d'authentification
import { authenticate, authorize } from '../middlewares/auth.js';

/**
 * Route pour récupérer toutes les classes
 * GET /api/classes
 * Accessible par : admin, teacher, student (tout le monde authentifié)
 */
router.get('/', authenticate, getAllClasses);

/**
 * Route pour récupérer une classe par son ID
 * GET /api/classes/:id
 * Accessible par : admin, teacher, student (tout le monde authentifié)
 */
router.get('/:id', authenticate, getClassById);

/**
 * Route pour créer une nouvelle classe
 * POST /api/classes
 * Accessible par : admin seulement
 */
router.post('/', authenticate, authorize(['admin']), createClass);

/**
 * Route pour modifier une classe
 * PUT /api/classes/:id
 * Accessible par : admin seulement
 */
router.put('/:id', authenticate, authorize(['admin']), updateClass);

/**
 * Route pour supprimer une classe
 * DELETE /api/classes/:id
 * Accessible par : admin seulement
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteClass);

// On export le router
export default router;