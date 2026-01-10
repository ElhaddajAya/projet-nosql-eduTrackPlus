// Import de la connexion MySQL
import { query } from '../config/mysql.js';

/**
 * Récupérer tous les cours
 * GET /api/cours
 */
export const getAllCours = async (req, res) =>
{
    try
    {
        const cours = await query(
            `SELECT 
        co.id_cours,
        co.id_classe,
        co.id_matiere,
        co.id_enseignant_titulaire,
        co.total_seances_prevues,
        co.total_seances_passees,
        co.date_debut,
        co.date_fin,
        co.statut,
        c.nom_classe,
        c.niveau,
        m.nom_matiere,
        m.coefficient,
        u.prenom as prof_prenom,
        u.nom as prof_nom
      FROM Cours co
      LEFT JOIN Classe c ON co.id_classe = c.id_classe
      LEFT JOIN Matiere m ON co.id_matiere = m.id_matiere
      LEFT JOIN Enseignant e ON co.id_enseignant_titulaire = e.id_enseignant
      LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      ORDER BY co.date_debut DESC`
        );

        res.status(200).json({
            success: true,
            count: cours.length,
            data: cours
        });

    } catch (error)
    {
        console.error('Erreur récupération cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.'
        });
    }
};

/**
 * Récupérer un cours par son ID
 */
export const getCoursById = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const cours = await query(
            `SELECT co.*, c.nom_classe, m.nom_matiere, u.prenom, u.nom
       FROM Cours co
       LEFT JOIN Classe c ON co.id_classe = c.id_classe
       LEFT JOIN Matiere m ON co.id_matiere = m.id_matiere
       LEFT JOIN Enseignant e ON co.id_enseignant_titulaire = e.id_enseignant
       LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE co.id_cours = ?`,
            [id]
        );

        if (cours.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Cours non trouvé.' });
        }

        res.status(200).json({ success: true, data: cours[0] });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

/**
 * Créer un nouveau cours
 */
export const createCours = async (req, res) =>
{
    try
    {
        const { id_classe, id_matiere, id_enseignant_titulaire, total_seances_prevues, date_debut, date_fin, statut } = req.body;

        if (!id_classe || !id_matiere || !id_enseignant_titulaire)
        {
            return res.status(400).json({ success: false, message: 'Champs obligatoires manquants.' });
        }

        // Vérifier doublons
        const existing = await query(
            'SELECT id_cours FROM Cours WHERE id_classe = ? AND id_matiere = ?',
            [id_classe, id_matiere]
        );

        if (existing.length > 0)
        {
            return res.status(409).json({ success: false, message: 'Ce cours existe déjà pour cette classe.' });
        }

        const result = await query(
            `INSERT INTO Cours (id_classe, id_matiere, id_enseignant_titulaire, total_seances_prevues, date_debut, date_fin, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id_classe, id_matiere, id_enseignant_titulaire, total_seances_prevues || 0, date_debut || null, date_fin || null, statut || 'prevu']
        );

        const newCours = await query(
            `SELECT co.*, c.nom_classe, m.nom_matiere FROM Cours co
       LEFT JOIN Classe c ON co.id_classe = c.id_classe
       LEFT JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE co.id_cours = ?`,
            [result.insertId]
        );

        res.status(201).json({ success: true, message: 'Cours créé.', data: newCours[0] });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

/**
 * Modifier un cours
 */
export const updateCours = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { id_enseignant_titulaire, total_seances_prevues, total_seances_passees, date_debut, date_fin, statut } = req.body;

        const updates = [];
        const values = [];

        if (id_enseignant_titulaire) { updates.push('id_enseignant_titulaire = ?'); values.push(id_enseignant_titulaire); }
        if (total_seances_prevues !== undefined) { updates.push('total_seances_prevues = ?'); values.push(total_seances_prevues); }
        if (total_seances_passees !== undefined) { updates.push('total_seances_passees = ?'); values.push(total_seances_passees); }
        if (date_debut !== undefined) { updates.push('date_debut = ?'); values.push(date_debut); }
        if (date_fin !== undefined) { updates.push('date_fin = ?'); values.push(date_fin); }
        if (statut) { updates.push('statut = ?'); values.push(statut); }

        if (updates.length === 0)
        {
            return res.status(400).json({ success: false, message: 'Aucun champ à modifier.' });
        }

        values.push(id);
        await query(`UPDATE Cours SET ${updates.join(', ')} WHERE id_cours = ?`, values);

        const updated = await query('SELECT * FROM Cours WHERE id_cours = ?', [id]);
        res.status(200).json({ success: true, message: 'Cours modifié.', data: updated[0] });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};

/**
 * Supprimer un cours
 */
export const deleteCours = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const existing = await query('SELECT id_cours FROM Cours WHERE id_cours = ?', [id]);
        if (existing.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Cours non trouvé.' });
        }

        await query('DELETE FROM Cours WHERE id_cours = ?', [id]);
        res.status(200).json({ success: true, message: 'Cours supprimé.' });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur.' });
    }
};