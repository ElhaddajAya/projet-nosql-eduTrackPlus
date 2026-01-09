import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// ===================================
// CONFIGURATION REDIS
// ===================================

const redisConfig = {
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
};

// Créer le client Redis
const redisClient = createClient(redisConfig);

// ===================================
// GESTION DES ÉVÉNEMENTS
// ===================================

redisClient.on('connect', () =>
{
    console.log('📡 Redis en cours de connexion...');
});

redisClient.on('ready', () =>
{
    console.log('✅ Redis connecté avec succès !');
});

redisClient.on('error', (err) =>
{
    console.error('❌ Erreur Redis:', err.message);
});

redisClient.on('end', () =>
{
    console.log('⚠️  Redis déconnecté');
});

// ===================================
// CONNEXION REDIS
// ===================================

export const connectRedis = async () =>
{
    try
    {
        await redisClient.connect();
        return true;
    } catch (error)
    {
        console.error('❌ Erreur de connexion Redis:', error.message);
        return false;
    }
};

// ===================================
// FONCTIONS UTILITAIRES
// ===================================

// Récupérer une valeur du cache
export const getCache = async (key) =>
{
    try
    {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error)
    {
        console.error('Erreur getCache:', error.message);
        return null;
    }
};

// Mettre une valeur en cache
export const setCache = async (key, value, ttl = 3600) =>
{
    try
    {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
    } catch (error)
    {
        console.error('Erreur setCache:', error.message);
        return false;
    }
};

// Supprimer une clé du cache
export const deleteCache = async (key) =>
{
    try
    {
        await redisClient.del(key);
        return true;
    } catch (error)
    {
        console.error('Erreur deleteCache:', error.message);
        return false;
    }
};

// Vérifier si une clé existe
export const existsCache = async (key) =>
{
    try
    {
        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (error)
    {
        console.error('Erreur existsCache:', error.message);
        return false;
    }
};

// ===================================
// FERMETURE PROPRE
// ===================================

process.on('SIGINT', async () =>
{
    await redisClient.quit();
    console.log('Redis client fermé (app terminée)');
    process.exit(0);
});

// Export du client
export default redisClient;