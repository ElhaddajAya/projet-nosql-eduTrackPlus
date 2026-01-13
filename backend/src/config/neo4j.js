import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ================================
 * CONFIGURATION NEO4J
 * ================================
 */

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

/**
 * Driver Neo4j (singleton)
 */
const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 120000,
    }
);

/**
 * ================================
 * TEST DE CONNEXION
 * ================================
 */
export const testNeo4jConnection = async () =>
{
    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    try
    {
        await session.run('RETURN 1');
        console.log('✅ Neo4j connecté avec succès');
        return true;
    } catch (error)
    {
        console.error('❌ Erreur connexion Neo4j:', error.message);
        return false;
    } finally
    {
        await session.close();
    }
};

/**
 * ================================
 * CRÉER UNE SESSION (READ / WRITE)
 * ================================
 */
export const getNeo4jSession = (mode = 'READ') =>
{
    return driver.session({
        defaultAccessMode:
            mode === 'WRITE'
                ? neo4j.session.WRITE
                : neo4j.session.READ
    });
};

/**
 * ================================
 * EXÉCUTER UNE REQUÊTE SIMPLE
 * ================================
 */
/**
 * ================================
 * EXÉCUTER UNE REQUÊTE SIMPLE
 * ================================
 */
export const runQuery = async (cypher, params = {}, mode = 'READ') =>
{
    const session = getNeo4jSession(mode);
    try
    {
        let result;
        if (mode === 'WRITE')
        {
            result = await session.executeWrite(tx => tx.run(cypher, params));
        } else
        {
            result = await session.executeRead(tx => tx.run(cypher, params));
        }
        return result.records.map(record => record.toObject());
    } catch (error)
    {
        console.error('❌ Erreur requête Neo4j:', error.message);
        throw error;
    } finally
    {
        await session.close();
    }
};

/**
 * ================================
 * FERMETURE PROPRE DU DRIVER
 * ================================
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
