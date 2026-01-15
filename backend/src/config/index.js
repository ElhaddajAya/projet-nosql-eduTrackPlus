import { testMySQLConnection } from './mysql.js';
import { connectMongoDB } from './mongodb.js';
import { testNeo4jConnection } from './neo4j.js';
import { connectRedis } from './redis.js';
import { query } from './mysql.js';
import { getSession } from './neo4j.js';
import { syncCompleteNeo4j } from '../utils/syncCompleteNeo4j.js';

// ===================================
// SYNCHRONISATION ENSEIGNANTS → NEO4J
// ===================================
const syncEnseignantsToNeo4j = async () =>
{
    console.log('🔄 Synchronisation enseignants MySQL → Neo4j...');
    const session = getSession();
    try
    {
        const enseignants = await query(
            `SELECT 
         e.id_enseignant,
         CONCAT(u.prenom, ' ', u.nom) AS nom,
         e.specialite,
         e.type_contrat
       FROM Enseignant e
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur`
        );

        for (const e of enseignants)
        {
            await session.run(
                `
        MERGE (t:Enseignant {id_enseignant: $id})
        SET t.nom = $nom,
            t.specialite = $specialite,
            t.type_contrat = $type
        `,
                {
                    id: Number(e.id_enseignant),
                    nom: e.nom || 'Inconnu',
                    specialite: e.specialite || 'Non spécifiée',
                    type: e.type_contrat || 'titulaire'
                }
            );
        }

        console.log(`✅ ${enseignants.length} enseignants synchronisés dans Neo4j`);
    } catch (err)
    {
        console.error('Erreur sync enseignants Neo4j:', err.message);
    } finally
    {
        await session.close();
    }
};

// ===================================
// SYNCHRONISATION SÉANCES → NEO4J
// ===================================
const syncSeancesToNeo4j = async () =>
{
    console.log('🔄 Synchronisation séances MySQL → Neo4j...');
    const session = getSession();
    try
    {
        const seances = await query(
            `SELECT 
         id_seance,
         date_seance AS date,
         heure_debut,
         heure_fin,
         statut,
         code_couleur
       FROM Seance`
        );

        for (const s of seances)
        {
            await session.run(
                `
        MERGE (s:Seance {id_seance: $id})
        SET s.date = $date,
            s.heure_debut = $heure_debut,
            s.heure_fin = $heure_fin,
            s.statut = $statut,
            s.code_couleur = $code_couleur
        `,
                {
                    id: Number(s.id_seance),
                    date: s.date.toISOString().split('T')[0],
                    heure_debut: s.heure_debut,
                    heure_fin: s.heure_fin,
                    statut: s.statut || 'prevue',
                    code_couleur: s.code_couleur || 'blanc'
                }
            );
        }

        console.log(`✅ ${seances.length} séances synchronisées dans Neo4j`);
    } catch (err)
    {
        console.error('Erreur sync séances Neo4j:', err.message);
    } finally
    {
        await session.close();
    }
};

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

    const allConnected = Object.values(results).every(status => status === true);

    if (allConnected)
    {
        console.log('🎉  Toutes les bases de données sont connectées !');
        console.log('');

        // SYNCHRONISATION DES ENSEIGNANTS ET SÉANCES VERS NEO4J
        await syncEnseignantsToNeo4j();
        await syncSeancesToNeo4j();

        // ⭐ SYNCHRONISATION COMPLÈTE NEO4J
        try
        {
            await syncCompleteNeo4j();
        } catch (error)
        {
            console.error('❌ Erreur sync Neo4j (non bloquante):', error.message);
        }

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