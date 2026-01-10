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

// Route de bienvenue
app.get('/', (req, res) =>
{
    res.json({
        message: '🎓 Bienvenue sur l\'API EduTrackPlus !',
        version: '1.0.0',
        status: 'En ligne ✅',
        authors: ['Aya EL HADDAJ', 'Malak BAKHOUTI'],
        project: '4IIR14 EMSI'
    });
});

// Route de santé (health check)
app.get('/health', (req, res) =>
{
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Routes d'authentification
// Toutes les routes commencent par /api/auth
app.use('/api/auth', authRoutes);

// Routes de gestion des classes
// Toutes les routes commencent par /api/classes
app.use('/api/classes', classRoutes);

// ===================================
// GESTION DES ERREURS 404
// ===================================

app.use((req, res) =>
{
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.path
    });
});

// ===================================
// DÉMARRAGE DU SERVEUR
// ===================================

const PORT = process.env.PORT || 5000;

// Fonction pour démarrer le serveur
const startServer = async () =>
{
    try
    {
        // Initialiser toutes les connexions aux bases de données
        const dbConnected = await initializeDatabase();

        // Démarrer le serveur Express
        app.listen(PORT, () =>
        {
            console.log('═══════════════════════════════════════════════════════');
            console.log('🎓  EDUTRACKPLUS BACKEND - DÉMARRÉ AVEC SUCCÈS !');
            console.log('═══════════════════════════════════════════════════════');
            console.log(`🚀  Serveur en écoute sur le port ${PORT}`);
            console.log(`🌐  URL: http://localhost:${PORT}`);
            console.log(`📅  Date: ${new Date().toLocaleString('fr-FR')}`);
            console.log(`🔧  Environnement: ${process.env.NODE_ENV || 'development'}`);
            console.log('═══════════════════════════════════════════════════════');
            console.log('');

            if (!dbConnected)
            {
                console.warn('⚠️   ATTENTION : Le serveur tourne mais certaines BDD ne sont pas connectées !');
                console.log('');
            }
        });

    } catch (error)
    {
        console.error('❌ Erreur lors du démarrage du serveur:', error.message);
        process.exit(1);
    }
};

// Lancer le serveur
startServer();

// Export pour les tests
export default app;