// Import d'Express Router pour créer les routes
const express = require('express');
const router = express.Router();

// Import des controllers d'authentification
const { register, login, getProfile } = require('../controllers/authController');

// Import du middleware d'authentification
const { authenticate } = require('../middlewares/auth');

/**
 * Route pour l'inscription d'un nouvel utilisateur
 * POST /api/auth/register
 * Body: { firstName, lastName, email, password, role, phoneNumber?, address? }
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
module.exports = router;