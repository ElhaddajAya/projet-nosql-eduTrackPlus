// Import d'Express Router pour créer les routes
import express from 'express';
const router = express.Router();

// Import des controllers d'authentification
import { register, login, getProfile } from '../controllers/authController.js';

// Import du middleware d'authentification
import { authenticate } from '../middleware/auth.js';

/**
 * Route pour l'inscription d'un nouvel utilisateur
 * POST /api/auth/register
 * Body: { firstName, lastName, email, password, role }
 */
router.post('/register', register);

/**
 * Route pour la connexion d'un utilisateur
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * Route pour récupérer le profil de l'utilisateur connecté
 * GET /api/auth/profile
 * Headers: { Authorization: "Bearer token" }
 * Cette route est protégée par le middleware authenticate
 */
router.get('/profile', authenticate, getProfile);

// On export le router pour l'utiliser dans server.js
export default router;