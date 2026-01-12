import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// ===================================
// CONFIGURATION NEO4J
// ===================================

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

// Créer le driver Neo4j
const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
    }
);

// ===================================
// FONCTION DE TEST DE CONNEXION
// ===================================

export const testNeo4jConnection = async () =>
{
    const session = driver.session();
    try
    {
        const result = await session.run('RETURN 1 AS num');
        console.log('✅ Neo4j connecté avec succès !');
        return true;
    } catch (error)
    {
        console.error('❌ Erreur de connexion Neo4j:', error.message);
        return false;
    } finally
    {
        await session.close();
    }
};

// ===================================
// FONCTION POUR CRÉER UNE SESSION
// ===================================

export const session = () =>
{
    return driver.session();
};

// ===================================
// FONCTION POUR EXÉCUTER DES REQUÊTES
// ===================================

export const runQuery = async (cypher, params = {}) =>
{
    const session = driver.session();
    try
    {
        const result = await session.run(cypher, params);
        return result.records.map(record => record.toObject());
    } catch (error)
    {
        console.error('Erreur requête Neo4j:', error.message);
        throw error;
    } finally
    {
        await session.close();
    }
};

// ===================================
// FERMETURE PROPRE
// ===================================

process.on('SIGINT', async () =>
{
    await driver.close();
    console.log('Neo4j driver fermé (app terminée)');
    process.exit(0);
});

// Export du driver par défaut
export default driver;