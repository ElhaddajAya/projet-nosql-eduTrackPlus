import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

/**
 * Driver Neo4j (singleton)
 */
const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

/**
 * Test de connexion (pour initializeDatabase)
 */
export const testNeo4jConnection = async () =>
{
    const session = driver.session({
        database: NEO4J_DATABASE,
        defaultAccessMode: neo4j.session.READ
    });
    try
    {
        await session.run('RETURN 1');
        console.log(`✅ Connecté à la base Neo4j: ${NEO4J_DATABASE}`);
        return true;
    } finally
    {
        await session.close();
    }
};

/**
 * Fonction utilitaire pour exécuter une requête Cypher
 */
export const runQuery = async (cypher, params = {}, mode = 'READ') =>
{
    const session = driver.session({
        database: NEO4J_DATABASE,
        defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ
    });

    try
    {
        const result = await session.run(cypher, params);
        return result;
    } finally
    {
        await session.close();
    }
};

/**
 * Fonction pour créer une nouvelle session avec la bonne base de données
 */
export const getSession = () => driver.session({
    database: NEO4J_DATABASE
});

/**
 * Fonction helper pour créer une session avec mode explicite
 */
export const getNeo4jSession = (mode = 'READ') =>
{
    return driver.session({
        database: NEO4J_DATABASE,
        defaultAccessMode: mode === 'WRITE' ? neo4j.session.WRITE : neo4j.session.READ
    });
};

/**
 * Fermeture propre du driver
 */
const closeNeo4j = async () =>
{
    try
    {
        await driver.close();
        console.log('🟣 Neo4j driver fermé proprement');
    } catch (error)
    {
        console.error('Erreur fermeture Neo4j:', error.message);
    }
};

process.on('SIGINT', async () =>
{
    await closeNeo4j();
    process.exit(0);
});

process.on('SIGTERM', async () =>
{
    await closeNeo4j();
    process.exit(0);
});

export default driver;