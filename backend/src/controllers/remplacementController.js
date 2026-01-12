import { query } from '../config/mysql.js';
import { session } from '../config/neo4j.js';

export const demanderRemplacement = async (req, res) =>
{
    try
    {
        const { id_seance, id_enseignant_absent, raison } = req.body;

        if (!id_seance || !id_enseignant_absent)
        {
            return res.status(400).json({ success: false, message: 'Champs manquants' });
        }

        const seance = await query('SELECT date_seance FROM Seance WHERE id_seance = ?', [id_seance]);

        if (!seance || seance.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Séance non trouvée' });
        }

        const date_absence = seance[0].date_seance;

        // Utiliser id_utilisateur du token ou 1 par défaut (admin)
        const demande_par = req.user?.id_utilisateur || 1;

        await query(
            'INSERT INTO Remplacement (id_seance, id_enseignant_absent, date_absence, raison, statut, demande_par) VALUES (?, ?, ?, ?, ?, ?)',
            [id_seance, id_enseignant_absent, date_absence, raison || null, 'demande', demande_par]
        );

        await query(
            'UPDATE Seance SET statut = ?, code_couleur = ? WHERE id_seance = ?',
            ['annulee', 'rouge', id_seance]
        );

        res.status(201).json({ success: true, message: 'Demande créée. Séance annulée (rouge)' });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getEnseignantsDisponibles = async (req, res) =>
{
    try
    {
        const { seance_id } = req.params;

        const seance = await query(
            'SELECT date_seance, heure_debut FROM Seance WHERE id_seance = ?',
            [seance_id]
        );

        const date = seance[0].date_seance;
        const heure = seance[0].heure_debut.substring(0, 5);

        const jours = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
        const jour = jours[new Date(date).getDay()];

        const creneauMap = {
            '08:00': '08_10',
            '10:00': '10_12',
            '14:00': '14_16',
            '16:00': '16_18'
        };

        const id_creneau = `${jour}_${creneauMap[heure]}`;

        const neo4jSession = session();
        const result = await neo4jSession.run(
            `MATCH (creneau:Creneau {id: $id_creneau})
       OPTIONAL MATCH (seance_occupee:Seance {date: $date})-[:SCHEDULED_AT]->(creneau)
       RETURN collect(seance_occupee.id_cours) as cours_occupes`,
            { id_creneau, date: date.toISOString().split('T')[0] }
        );
        await neo4jSession.close();

        const cours_occupes = result.records[0].get('cours_occupes');

        let disponibles;
        if (cours_occupes.length > 0)
        {
            disponibles = await query(
                `SELECT e.id_enseignant, u.prenom, u.nom, e.type_contrat
         FROM Enseignant e
         JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
         WHERE e.id_enseignant NOT IN (
           SELECT DISTINCT id_enseignant_titulaire FROM Cours WHERE id_cours IN (?)
         )
         ORDER BY e.type_contrat DESC`,
                [cours_occupes]
            );
        } else
        {
            disponibles = await query(
                `SELECT e.id_enseignant, u.prenom, u.nom, e.type_contrat
         FROM Enseignant e
         JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
         ORDER BY e.type_contrat DESC`
            );
        }

        res.json({ success: true, count: disponibles.length, data: disponibles });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

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

        const remplacement = await query('SELECT * FROM Remplacement WHERE id_remplacement = ?', [id]);

        if (remplacement[0].statut !== 'demande')
        {
            return res.status(400).json({ success: false, message: 'Remplacement déjà traité' });
        }

        await query(
            'UPDATE Remplacement SET id_enseignant_remplacant = ?, statut = ?, date_reponse = NOW() WHERE id_remplacement = ?',
            [id_enseignant_remplacant, 'accepte', id]
        );

        await query(
            'UPDATE Seance SET statut = ?, code_couleur = ?, id_enseignant_effectif = ? WHERE id_seance = ?',
            ['remplacee', 'bleu', id_enseignant_remplacant, remplacement[0].id_seance]
        );

        res.json({ success: true, message: 'Remplacement accepté. Séance bleue.' });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getRemplacementsEnAttente = async (req, res) =>
{
    try
    {
        const demandes = await query(
            `SELECT r.*, s.date_seance, m.nom_matiere, c.nom_classe,
              u1.prenom as absent_prenom, u1.nom as absent_nom
       FROM Remplacement r
       JOIN Seance s ON r.id_seance = s.id_seance
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Enseignant e ON r.id_enseignant_absent = e.id_enseignant
       JOIN Utilisateur u1 ON e.id_utilisateur = u1.id_utilisateur
       WHERE r.statut = ?
       ORDER BY r.date_demande DESC`,
            ['demande']
        );

        res.json({ success: true, count: demandes.length, data: demandes });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};