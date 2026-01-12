// Import des connexions
import { query } from '../config/mysql.js';
import { session } from '../config/neo4j.js';

/**
 * Planifier une nouvelle séance
 * POST /api/emploi-temps/seances
 */
export const planifierSeance = async (req, res) =>
{
    try
    {
        const {
            id_cours,
            date_seance,
            heure_debut,
            heure_fin,
            id_salle,
            id_creneau, // Ex: "LUN_08_10"
        } = req.body;

        // Validation
        if (!id_cours || !date_seance || !heure_debut || !heure_fin || !id_salle || !id_creneau)
        {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires.',
            });
        }

        // Vérifier que le cours existe et récupérer l'enseignant titulaire
        const cours = await query(
            'SELECT id_enseignant_titulaire FROM Cours WHERE id_cours = ?',
            [id_cours]
        );

        if (cours.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé.',
            });
        }

        const id_enseignant_titulaire = cours[0].id_enseignant_titulaire;

        // Vérifier conflit dans Neo4j (même salle, même créneau, même date)
        const neo4jSession = session();
        const conflitResult = await neo4jSession.run(
            `MATCH (s:Salle {id: $id_salle})<-[:IN_ROOM]-(seance:Seance)-[:SCHEDULED_AT]->(c:Creneau {id: $id_creneau})
       WHERE seance.date = $date
       RETURN seance`,
            { id_salle, id_creneau, date: date_seance }
        );

        if (conflitResult.records.length > 0)
        {
            await neo4jSession.close();
            return res.status(409).json({
                success: false,
                message: 'Conflit : Cette salle est déjà occupée à ce créneau.',
            });
        }

        // Créer la séance dans MySQL
        const result = await query(
            `INSERT INTO Seance (id_cours, date_seance, heure_debut, heure_fin, id_salle, statut, code_couleur, id_enseignant_effectif)
       VALUES (?, ?, ?, ?, ?, 'prevue', 'blanc', ?)`,
            [id_cours, date_seance, heure_debut, heure_fin, id_salle, id_enseignant_titulaire]
        );

        const id_seance = result.insertId;

        // Créer le nœud Seance dans Neo4j et le lier
        await neo4jSession.run(
            `MATCH (s:Salle {id: $id_salle}), (c:Creneau {id: $id_creneau})
       CREATE (seance:Seance {
         id_seance: $id_seance,
         id_cours: $id_cours,
         date: $date,
         statut: 'prevue'
       })
       CREATE (seance)-[:IN_ROOM]->(s)
       CREATE (seance)-[:SCHEDULED_AT]->(c)
       RETURN seance`,
            { id_seance, id_cours, date: date_seance, id_salle, id_creneau }
        );

        await neo4jSession.close();

        // Récupérer la séance créée
        const seance = await query(
            `SELECT s.*, c.nom_classe, m.nom_matiere
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE s.id_seance = ?`,
            [id_seance]
        );

        res.status(201).json({
            success: true,
            message: 'Séance planifiée avec succès.',
            data: seance[0],
        });
    } catch (error)
    {
        console.error('Erreur planification séance:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Mettre à jour le statut d'une séance (avec code couleur automatique)
 * PUT /api/emploi-temps/seances/:id/statut
 */
export const updateStatutSeance = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { statut, id_enseignant_remplacant, date_report } = req.body;

        const statusValides = ['prevue', 'remplacee', 'reportee', 'annulee', 'rattrapage'];
        if (!statusValides.includes(statut))
        {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide.',
            });
        }

        // Déterminer le code couleur selon le statut
        let code_couleur;
        let id_enseignant_effectif = null;

        switch (statut)
        {
            case 'prevue':
                code_couleur = 'blanc';
                // Récupérer l'enseignant titulaire
                const cours = await query(
                    `SELECT co.id_enseignant_titulaire 
           FROM Seance s 
           JOIN Cours co ON s.id_cours = co.id_cours 
           WHERE s.id_seance = ?`,
                    [id]
                );
                id_enseignant_effectif = cours[0]?.id_enseignant_titulaire;
                break;
            case 'remplacee':
                code_couleur = 'bleu';
                id_enseignant_effectif = id_enseignant_remplacant;
                if (!id_enseignant_remplacant)
                {
                    return res.status(400).json({
                        success: false,
                        message: 'id_enseignant_remplacant requis pour statut "remplacee".',
                    });
                }
                break;
            case 'reportee':
                code_couleur = 'vert';
                break;
            case 'annulee':
                code_couleur = 'rouge';
                break;
            case 'rattrapage':
                code_couleur = 'violet';
                break;
        }

        // Mettre à jour MySQL
        const updates = ['statut = ?', 'code_couleur = ?'];
        const values = [statut, code_couleur];

        if (id_enseignant_effectif)
        {
            updates.push('id_enseignant_effectif = ?');
            values.push(id_enseignant_effectif);
        }

        if (date_report)
        {
            updates.push('date_report = ?');
            values.push(date_report);
        }

        values.push(id);

        await query(
            `UPDATE Seance SET ${updates.join(', ')} WHERE id_seance = ?`,
            values
        );

        // Mettre à jour Neo4j
        const neo4jSession = session();
        await neo4jSession.run(
            `MATCH (seance:Seance {id_seance: $id_seance})
       SET seance.statut = $statut
       RETURN seance`,
            { id_seance: parseInt(id), statut }
        );
        await neo4jSession.close();

        // Récupérer la séance mise à jour
        const seance = await query(
            `SELECT s.*, c.nom_classe, m.nom_matiere
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE s.id_seance = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Statut mis à jour.',
            data: seance[0],
        });
    } catch (error)
    {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Récupérer l'emploi du temps d'une classe
 * GET /api/emploi-temps/classe/:id
 */
export const getEmploiTempsClasse = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const seances = await query(
            `SELECT 
        s.id_seance,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.id_salle,
        s.statut,
        s.code_couleur,
        c.nom_classe,
        m.nom_matiere,
        u.prenom as prof_prenom,
        u.nom as prof_nom
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       LEFT JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
       LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE c.id_classe = ?
       ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: seances.length,
            data: seances,
        });
    } catch (error)
    {
        console.error('Erreur EDT classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Récupérer l'emploi du temps d'un enseignant
 * GET /api/emploi-temps/enseignant/:id
 */
export const getEmploiTempsEnseignant = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const seances = await query(
            `SELECT 
        s.id_seance,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.id_salle,
        s.statut,
        s.code_couleur,
        c.nom_classe,
        m.nom_matiere
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE s.id_enseignant_effectif = ?
       ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: seances.length,
            data: seances,
        });
    } catch (error)
    {
        console.error('Erreur EDT enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Récupérer l'occupation d'une salle
 * GET /api/emploi-temps/salle/:id
 */
export const getOccupationSalle = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const seances = await query(
            `SELECT 
        s.id_seance,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.statut,
        s.code_couleur,
        c.nom_classe,
        m.nom_matiere,
        u.prenom as prof_prenom,
        u.nom as prof_nom
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       LEFT JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
       LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE s.id_salle = ?
       ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        res.status(200).json({
            success: true,
            salle: id,
            count: seances.length,
            data: seances,
        });
    } catch (error)
    {
        console.error('Erreur occupation salle:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Trouver les salles disponibles pour un créneau donné
 * GET /api/emploi-temps/salles-disponibles
 */
export const getSallesDisponibles = async (req, res) =>
{
    try
    {
        const { id_creneau, date } = req.query;

        if (!id_creneau || !date)
        {
            return res.status(400).json({
                success: false,
                message: 'id_creneau et date requis.',
            });
        }

        // Requête Neo4j pour trouver les salles disponibles
        const neo4jSession = session();
        const result = await neo4jSession.run(
            `MATCH (s:Salle)-[:DISPONIBLE_A]->(c:Creneau {id: $id_creneau})
       WHERE NOT EXISTS {
         MATCH (s)<-[:IN_ROOM]-(seance:Seance)-[:SCHEDULED_AT]->(c)
         WHERE seance.date = $date
       }
       RETURN s.id as id_salle, s.nom, s.type, s.capacite, s.equipements`,
            { id_creneau, date }
        );

        const salles = result.records.map((record) => ({
            id_salle: record.get('id_salle'),
            nom: record.get('nom'),
            type: record.get('type'),
            capacite: record.get('capacite').toNumber(),
            equipements: record.get('equipements'),
        }));

        await neo4jSession.close();

        res.status(200).json({
            success: true,
            count: salles.length,
            data: salles,
        });
    } catch (error)
    {
        console.error('Erreur salles disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};