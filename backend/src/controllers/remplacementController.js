import { query } from '../config/mysql.js';
import { runQuery } from '../config/neo4j.js';
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
    try
    {
        const { id } = req.params;
        const { id_enseignant_remplacant } = req.body;

        if (!id_enseignant_remplacant)
        {
            return res.status(400).json({ success: false, message: 'id_enseignant_remplacant requis' });
        }

        const remplacement = await query(
            'SELECT * FROM Remplacement WHERE id_remplacement = ?',
            [id]
        );

        if (remplacement.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Demande non trouvée' });
        }

        if (remplacement[0].statut !== 'demande')
        {
            return res.status(400).json({ success: false, message: 'Remplacement déjà traité' });
        }

        await query(
            `
      UPDATE Remplacement
      SET id_enseignant_remplacant = ?, statut = 'accepte', date_reponse = NOW()
      WHERE id_remplacement = ?
      `,
            [id_enseignant_remplacant, id]
        );

        await query(
            `
      UPDATE Seance
      SET statut = 'remplacee',
          code_couleur = 'bleu',
          id_enseignant_effectif = ?
      WHERE id_seance = ?
      `,
            [id_enseignant_remplacant, remplacement[0].id_seance]
        );

        // 🔄 Synchronisation Neo4j - Créer la relation d'assignation
        try
        {
            console.log('🔍 Avant Neo4j - id_enseignant:', id_enseignant_remplacant, 'id_seance:', remplacement[0].id_seance);

            const neoResult = await runQuery(
                `MATCH (e:Enseignant)
                 MATCH (s:Seance)
                 WHERE e.id_enseignant = $id_enseignant AND s.id_seance = $id_seance
                 MERGE (e)-[r:ASSIGNED_TO {type: 'remplacement'}]->(s)
                 SET r.date_assignment = timestamp()
                 RETURN e, r, s`,
                {
                    id_enseignant: id_enseignant_remplacant,
                    id_seance: remplacement[0].id_seance
                },
                'WRITE'
            );
            console.log('✅ Neo4j synchronisé: Enseignant assigné à la séance', neoResult);
        } catch (neoError)
        {
            console.error('❌ Erreur Neo4j complète:', neoError);
            console.warn('⚠️ Erreur Neo4j (non-bloquante):', neoError.message);
            // L'erreur Neo4j ne bloque pas l'acceptation car les données MySQL sont déjà mises à jour
        }

        // 💾 Créer une notification MongoDB
        try
        {
            const notification = await Notification.create({
                id_utilisateur: id_enseignant_remplacant,
                type: 'remplacement',
                titre: 'Nouveau remplacement assigné',
                message: `Vous avez été désigné comme remplaçant pour la séance du ${remplacement[0].id_seance}.`,
                metadata: {
                    id_seance: remplacement[0].id_seance,
                    id_enseignant_absent: remplacement[0].id_enseignant_absent
                }
            });
            console.log('✅ MongoDB: Notification créée avec succès', notification._id);
        } catch (mongoError)
        {
            console.warn('⚠️ Erreur MongoDB (non-bloquante):', mongoError.message);
        }

        res.json({ success: true, message: 'Remplacement accepté. Séance mise à jour.' });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
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