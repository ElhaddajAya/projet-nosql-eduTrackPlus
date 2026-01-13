// config/neo4j.js
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

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
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try
    {
        await session.run('RETURN 1');
        return true;
    } finally
    {
        await session.close();
    }
};

/**
 * Fonction utilitaire pour exécuter une requête Cypher
 * (tu l'utilises déjà dans certains controllers)
 */
export const runQuery = async (cypher, params = {}, mode = 'READ') =>
{
    const session = driver.session({
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
 * Fonction pour créer une nouvelle session (utilisée dans accepterRemplacement)
 * C'EST ÇA QUI MANQUAIT !
 */
export const getSession = () => driver.session();

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