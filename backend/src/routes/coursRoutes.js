// Import d'Express Router
import express from 'express';
const router = express.Router();

// Import des controllers
import
{
    getAllCours,
    getCoursById,
    createCours,
    updateCours,
    deleteCours
} from '../controllers/coursController.js';

// Import middlewares
import { authenticate, authorize } from '../middleware/auth.js';

// GET tous les cours (admin + teacher)
router.get('/', authenticate, authorize(['admin', 'teacher']), getAllCours);

// GET un cours par ID (admin + teacher)
router.get('/:id', authenticate, authorize(['admin', 'teacher']), getCoursById);

// POST créer un cours (admin only)
router.post('/', authenticate, authorize(['admin']), createCours);

// PUT modifier un cours (admin only)
router.put('/:id', authenticate, authorize(['admin']), updateCours);

// DELETE supprimer un cours (admin only)
router.delete('/:id', authenticate, authorize(['admin']), deleteCours);

export default router;