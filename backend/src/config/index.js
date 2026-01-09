import { testMySQLConnection } from './mysql.js';
import { connectMongoDB } from './mongodb.js';
import { testNeo4jConnection } from './neo4j.js';
import { connectRedis } from './redis.js';

// ===================================
// INITIALISER TOUTES LES CONNEXIONS
// ===================================

export const initializeDatabase = async () =>
{
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔌  INITIALISATION DES CONNEXIONS AUX BASES DE DONNÉES');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    const results = {
        mysql: false,
        mongodb: false,
        neo4j: false,
        redis: false,
    };

    // Test MySQL
    console.log('🔵 [1/4] Test connexion MySQL...');
    results.mysql = await testMySQLConnection();
    console.log('');

    // Connexion MongoDB
    console.log('🟢 [2/4] Connexion MongoDB...');
    results.mongodb = await connectMongoDB();
    console.log('');

    // Test Neo4j
    console.log('🟣 [3/4] Test connexion Neo4j...');
    results.neo4j = await testNeo4jConnection();
    console.log('');

    // Connexion Redis
    console.log('🔴 [4/4] Connexion Redis...');
    results.redis = await connectRedis();
    console.log('');

    // Résumé
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊  RÉSUMÉ DES CONNEXIONS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`MySQL:    ${results.mysql ? '✅ Connecté' : '❌ Échec'}`);
    console.log(`MongoDB:  ${results.mongodb ? '✅ Connecté' : '❌ Échec'}`);
    console.log(`Neo4j:    ${results.neo4j ? '✅ Connecté' : '❌ Échec'}`);
    console.log(`Redis:    ${results.redis ? '✅ Connecté' : '❌ Échec'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Vérifier si toutes les connexions sont OK
    const allConnected = Object.values(results).every(status => status === true);

    if (allConnected)
    {
        console.log('🎉  Toutes les bases de données sont connectées !');
        console.log('');
        return true;
    } else
    {
        console.warn('⚠️   Certaines bases de données ne sont pas connectées.');
        console.warn('⚠️   Vérifie ta configuration dans le fichier .env');
        console.log('');
        return false;
    }
};

// Export des connexions individuelles
export { default as mysqlPool } from './mysql.js';
export { default as mongoose } from './mongodb.js';
export { default as neo4jDriver } from './neo4j.js';
export { default as redisClient } from './redis.js';