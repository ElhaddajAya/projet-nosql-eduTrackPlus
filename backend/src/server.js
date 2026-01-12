// Import d'Express et des modules nécessaires
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import de la fonction d'initialisation des BDD
import { initializeDatabase } from './config/index.js';

// Import des routes d'authentification
import authRoutes from './routes/authRoutes.js';

// Import des routes de gestion
import classRoutes from './routes/classRoutes.js';
import matiereRoutes from './routes/matiereRoutes.js';
import enseignantRoutes from './routes/enseignantRoutes.js';
import etudiantRoutes from './routes/etudiantRoutes.js';
import coursRoutes from './routes/coursRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import presenceRoutes from './routes/presenceRoutes.js';
import remplacementRoutes from './routes/remplacementRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();

// ===================================
// MIDDLEWARES GLOBAUX
// ===================================

// CORS - Autoriser les requêtes depuis le frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Parser JSON
app.use(express.json());

// Parser URL-encoded
app.use(express.urlencoded({ extended: true }));

// ===================================
// ROUTES
// ===================================

// Route de santé (health check)
app.get('/health', (req, res) =>
{
    res.status(200).json({
        success: true,
        message: 'Le serveur fonctionne correctement !',
        timestamp: new Date().toISOString()
    });
});

// Routes d'authentification
// Toutes les routes commencent par /api/auth
app.use('/api/auth', authRoutes);

// Routes de gestion des classes
// Toutes les routes commencent par /api/classes
app.use('/api/classes', classRoutes);

// Routes de gestion des matières
// Toutes les routes commencent par /api/matieres
app.use('/api/matieres', matiereRoutes);

// Routes de gestion des enseignants
// Toutes les routes commencent par /api/enseignants
app.use('/api/enseignants', enseignantRoutes);

// Routes de gestion des étudiants
// Toutes les routes commencent par /api/etudiants
app.use('/api/etudiants', etudiantRoutes);

// Routes de gestion des cours
// Toutes les routes commencent par /api/cours
app.use('/api/cours', coursRoutes);

// Routes de gestion de l'emploi du temps
// Toutes les routes commencent par /api/emploi-temps
app.use('/api/emploi-temps', scheduleRoutes);

// Routes de gestion des présences
// Toutes les routes commencent par /api/presences
app.use('/api/presences', presenceRoutes);

// Routes de gestion des remplacements
// Toutes les routes commencent par /api/remplacements
app.use('/api/remplacements', remplacementRoutes);

// Routes de gestion des notes
// Toutes les routes commencent par /api/notes
app.use('/api/notes', noteRoutes);

// Routes de gestion des notifications
// Toutes les routes commencent par /api/notifications
app.use('/api/notifications', notificationRoutes);

// Routes du tableau de bord
// Toutes les routes commencent par /api/dashboard
app.use('/api/dashboard', dashboardRoutes);

// ===================================
// GESTION DES ERREURS 404
// ===================================

app.use((req, res) =>
{
    res.status(404).json({
        success: false,
        message: 'Route non trouvée.'
    });
});

// ===================================
// GESTION DES ERREURS GLOBALES
// ===================================

app.use((err, req, res, next) =>
{
    console.error('Erreur globale:', err);
    res.status(500).json({
        success: false,
        message: 'Une erreur est survenue sur le serveur.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===================================
// DÉMARRAGE DU SERVEUR
// ===================================

const PORT = process.env.PORT || 5000;

// Initialiser les connexions aux bases de données puis démarrer le serveur
initializeDatabase()
    .then(() =>
    {
        app.listen(PORT, () =>
        {
            console.log(`🚀 Serveur démarré sur le port ${PORT}`);
            console.log(`📡 URL: http://localhost:${PORT}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
        });
    })
    .catch((error) =>
    {
        console.error('❌ Erreur lors de l\'initialisation des bases de données:', error);
        process.exit(1);
    });

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () =>
{
    console.log('SIGTERM reçu, fermeture du serveur...');
    process.exit(0);
});

process.on('SIGINT', () =>
{
    console.log('SIGINT reçu, fermeture du serveur...');
    process.exit(0);
});

export default app;