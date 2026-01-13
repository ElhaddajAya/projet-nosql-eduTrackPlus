import { query } from '../config/mysql.js';
import { getSession } from '../config/neo4j.js';
import neo4j from 'neo4j-driver';
import Notification from '../models/Notification.js';

/**
 * 1️⃣ Déclarer une absence (création d’une demande)
 * ➜ NE MODIFIE PAS la séance
 */
export const demanderRemplacement = async (req, res) =>
{
    try
    {
        const { id_seance, id_enseignant_absent, raison } = req.body;

        if (!id_seance || !id_enseignant_absent)
        {
            return res.status(400).json({ success: false, message: 'Champs manquants' });
        }

        const seance = await query(
            'SELECT date_seance FROM Seance WHERE id_seance = ?',
            [id_seance]
        );

        if (seance.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Séance non trouvée' });
        }

        const demande_par = req.user?.id_utilisateur || 1;

        await query(
            `INSERT INTO Remplacement
       (id_seance, id_enseignant_absent, date_absence, raison, statut, demande_par)
       VALUES (?, ?, ?, ?, 'demande', ?)`,
            [id_seance, id_enseignant_absent, seance[0].date_seance, raison || null, demande_par]
        );

        res.status(201).json({
            success: true,
            message: 'Demande de remplacement enregistrée'
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * 2️⃣ Calcul des enseignants disponibles (Neo4j = intelligence)
 */
export const getEnseignantsDisponibles = async (req, res) =>
{
    try
    {
        const { seance_id } = req.params;

        // TODO: À implémenter avec Neo4j une fois le problème résolu
        // Pour l'instant, retourner les enseignants vacataires
        const vacataires = await query(
            `SELECT e.id_enseignant, u.prenom, u.nom, e.type_contrat, e.specialite
             FROM Enseignant e
             JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
             WHERE e.type_contrat = 'vacataire'
             LIMIT 3`
        );

        res.json({ success: true, count: vacataires.length, data: vacataires });

    } catch (error)
    {
        console.error('❌ Erreur getEnseignantsDisponibles:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * 3️⃣ Acceptation du remplacement
 */
export const accepterRemplacement = async (req, res) =>
{
    const { id } = req.params;
    const { id_enseignant_remplacant } = req.body;

    try
    {
        // 1. Vérifier la demande
        const demande = await query(
            `SELECT * FROM remplacement 
             WHERE id_remplacement = ? AND statut = 'demande'`,
            [id]
        );

        if (demande.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée ou déjà traitée'
            });
        }

        const demandeData = demande[0];

        // 2. Vérifier le remplaçant
        const remplacant = await query(
            `SELECT id_enseignant FROM Enseignant WHERE id_enseignant = ?`,
            [id_enseignant_remplacant]
        );

        if (remplacant.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Enseignant remplaçant non trouvé'
            });
        }

        // ⚡ IMPORTANT : Déclarer les variables ICI pour qu'elles soient accessibles partout
        const absentId = parseInt(demandeData.id_enseignant_absent);
        const remplacantId = parseInt(id_enseignant_remplacant);
        const seanceId = parseInt(demandeData.id_seance);
        const date = demandeData.date_absence.toISOString().split('T')[0];

        // 3. Mise à jour MySQL de la séance
        await query(
            `UPDATE seance 
             SET statut = 'remplacee', 
                 code_couleur = 'bleu', 
                 id_enseignant_effectif = ?
             WHERE id_seance = ?`,
            [id_enseignant_remplacant, demandeData.id_seance]
        );

        // 4. Mise à jour MySQL du remplacement
        await query(
            `UPDATE remplacement 
             SET id_enseignant_remplacant = ?, 
                 statut = 'accepte', 
                 date_reponse = NOW()
             WHERE id_remplacement = ?`,
            [id_enseignant_remplacant, id]
        );

        // 5. Synchronisation Neo4j avec transaction explicite
        const neoSession = getSession();

        try
        {
            console.log(`🔵 Tentative Neo4j pour remplacement ${id}:`);
            console.log(`  - Absent: ${absentId}, Remplaçant: ${remplacantId}, Séance: ${seanceId}`);
            console.log(`  - Date: ${date}`);

            // ⚡ UTILISER UNE TRANSACTION EXPLICITE
            const tx = neoSession.beginTransaction();

            try
            {
                // 1. Vérification des nœuds
                const checkResult = await tx.run(
                    `
            OPTIONAL MATCH (remplacant:Enseignant {id_enseignant: $remplacantId})
            OPTIONAL MATCH (absent:Enseignant {id_enseignant: $absentId})
            OPTIONAL MATCH (seance:Seance {id_seance: $seanceId})
            RETURN remplacant, absent, seance
            `,
                    { remplacantId, absentId, seanceId }
                );

                const record = checkResult.records[0];
                console.log('🔍 Vérification des nœuds :');
                console.log('  - Remplaçant:', record.get('remplacant') ? '✅ Existe' : '❌ N\'existe pas');
                console.log('  - Absent:', record.get('absent') ? '✅ Existe' : '❌ N\'existe pas');
                console.log('  - Séance:', record.get('seance') ? '✅ Existe' : '❌ N\'existe pas');

                // 2. Création des relations
                console.log('📝 Création des relations...');
                const result = await tx.run(
                    `
            MATCH (remplacant:Enseignant {id_enseignant: $remplacantId})
            MATCH (absent:Enseignant {id_enseignant: $absentId})
            MATCH (seance:Seance {id_seance: $seanceId})
            
            MERGE (remplacant)-[r1:REPLACES {date: $date}]->(absent)
            MERGE (remplacant)-[r2:TEACHES_TEMP]->(seance)
            
            RETURN remplacant.id_enseignant as remplacant_id, 
                   absent.id_enseignant as absent_id, 
                   seance.id_seance as seance_id,
                   r1, r2
            `,
                    { remplacantId, absentId, seanceId, date }
                );

                // 3. COMMIT de la transaction (CRUCIAL !)
                await tx.commit();
                console.log('✅ Transaction Neo4j commitée avec succès !');

                if (result.records.length > 0)
                {
                    const rel = result.records[0];
                    console.log('📊 Relations créées :');
                    console.log('  - REPLACES:', rel.get('r1') ? '✅' : '❌');
                    console.log('  - TEACHES_TEMP:', rel.get('r2') ? '✅' : '❌');
                }

            } catch (txError)
            {
                // Rollback en cas d'erreur
                await tx.rollback();
                console.error('❌ Erreur dans la transaction Neo4j, rollback effectué:', txError.message);
                throw txError;
            }

        } catch (neoError)
        {
            console.error('❌ Erreur Neo4j globale:', neoError.message);
        } finally
        {
            await neoSession.close();
        }

        // 6. Notifications (utilise maintenant 'date' qui est définie plus haut)
        await Notification.create({
            id_utilisateur: id_enseignant_remplacant,
            type: 'remplacement',
            titre: 'Remplacement accepté',
            message: `Vous avez été assigné comme remplaçant pour la séance ${demandeData.id_seance}`,
            metadata: { id_seance: demandeData.id_seance }
        });

        await Notification.create({
            id_utilisateur: demandeData.id_enseignant_absent,
            type: 'remplacement',
            titre: 'Remplaçant trouvé',
            message: `Un remplaçant a été trouvé pour votre absence du ${date}`,
            metadata: { id_seance: demandeData.id_seance }
        });

        // 7. Réponse finale
        res.json({
            success: true,
            message: 'Remplacement accepté. Séance mise à jour en bleu (remplacée).'
        });

    } catch (error)
    {
        console.error('❌ Erreur dans accepterRemplacement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'acceptation du remplacement.'
        });
    }
};

/**
 * 4️⃣ Liste des demandes en attente
 */
export const getRemplacementsEnAttente = async (req, res) =>
{
    try
    {
        const demandes = await query(
            `
      SELECT r.*, s.date_seance, m.nom_matiere, c.nom_classe,
             u.prenom AS absent_prenom, u.nom AS absent_nom
      FROM Remplacement r
      JOIN Seance s ON r.id_seance = s.id_seance
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      JOIN Classe c ON co.id_classe = c.id_classe
      JOIN Enseignant e ON r.id_enseignant_absent = e.id_enseignant
      JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      WHERE r.statut = 'demande'
      ORDER BY r.date_demande DESC
      `
        );

        res.json({ success: true, count: demandes.length, data: demandes });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};