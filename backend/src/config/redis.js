import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

export const redisClient = redis.createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
    }
});

redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

export const testRedisConnection = async () =>
{
    try
    {
        await redisClient.connect();
        console.log('✅ Redis connecté avec succès !');
        return true;
    } catch (error)
    {
        console.error('❌ Erreur Redis:', error.message);
        return false;
    }
};

// Alias pour l'import dans index.js
export const connectRedis = testRedisConnection;

export default redisClient;