import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// ===================================
// CONFIGURATION MONGODB
// ===================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutrackplus';

// Options de connexion
const mongoOptions = {
    // Pas besoin de useNewUrlParser et useUnifiedTopology dans Mongoose 6+
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// ===================================
// CONNEXION MONGODB
// ===================================

export const connectMongoDB = async () =>
{
    try
    {
        await mongoose.connect(MONGODB_URI, mongoOptions);
        console.log('✅ MongoDB connecté avec succès !');
        return true;
    } catch (error)
    {
        console.error('❌ Erreur de connexion MongoDB:', error.message);
        return false;
    }
};

// ===================================
// GESTION DES ÉVÉNEMENTS
// ===================================

mongoose.connection.on('connected', () =>
{
    console.log('📡 Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) =>
{
    console.error('❌ Erreur Mongoose:', err.message);
});

mongoose.connection.on('disconnected', () =>
{
    console.log('⚠️  Mongoose déconnecté de MongoDB');
});

// Fermeture propre lors de l'arrêt de l'application
process.on('SIGINT', async () =>
{
    await mongoose.connection.close();
    console.log('MongoDB connexion fermée (app terminée)');
    process.exit(0);
});

// Export de la connexion
export default mongoose;