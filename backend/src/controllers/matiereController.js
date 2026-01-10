// Import de la connexion MySQL
import { query } from '../config/mysql.js';

/**
 * Récupérer toutes les matières
 * GET /api/matieres
 */
export const getAllMatieres = async (req, res) =>
{
    try
    {
        // On récupère toutes les matières
        const matieres = await query(
            `SELECT 
        id_matiere,
        nom_matiere,
        coefficient
      FROM Matiere
      ORDER BY nom_matiere ASC`
        );

        // On retourne la liste des matières
        res.status(200).json({
            success: true,
            count: matieres.length,
            data: matieres
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération des matières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des matières.'
        });
    }
};

/**
 * Récupérer une matière par son ID
 * GET /api/matieres/:id
 */
export const getMatiereById = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // On récupère la matière
        const matieres = await query(
            `SELECT 
        id_matiere,
        nom_matiere,
        coefficient
      FROM Matiere
      WHERE id_matiere = ?`,
            [id]
        );

        // Si la matière n'existe pas
        if (matieres.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Matière non trouvée.'
            });
        }

        // On retourne la matière
        res.status(200).json({
            success: true,
            data: matieres[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération de la matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de la matière.'
        });
    }
};

/**
 * Créer une nouvelle matière
 * POST /api/matieres
 */
export const createMatiere = async (req, res) =>
{
    try
    {
        const { nom_matiere, coefficient } = req.body;

        // Validation: vérifier que tous les champs obligatoires sont présents
        if (!nom_matiere)
        {
            return res.status(400).json({
                success: false,
                message: 'Le nom de la matière est obligatoire.'
            });
        }

        // Validation: vérifier que le coefficient est valide
        if (coefficient && (coefficient < 0 || coefficient > 10))
        {
            return res.status(400).json({
                success: false,
                message: 'Le coefficient doit être entre 0 et 10.'
            });
        }

        // Vérifier qu'une matière avec le même nom n'existe pas déjà
        const existingMatiere = await query(
            'SELECT id_matiere FROM Matiere WHERE nom_matiere = ?',
            [nom_matiere]
        );

        if (existingMatiere.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Une matière avec ce nom existe déjà.'
            });
        }

        // Créer la nouvelle matière
        const result = await query(
            `INSERT INTO Matiere (nom_matiere, coefficient)
       VALUES (?, ?)`,
            [nom_matiere, coefficient || 1.0]
        );

        // Récupérer la matière créée
        const newMatiere = await query(
            `SELECT id_matiere, nom_matiere, coefficient
       FROM Matiere
       WHERE id_matiere = ?`,
            [result.insertId]
        );

        // On retourne la matière créée
        res.status(201).json({
            success: true,
            message: 'Matière créée avec succès.',
            data: newMatiere[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la création de la matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la matière.'
        });
    }
};

/**
 * Modifier une matière existante
 * PUT /api/matieres/:id
 */
export const updateMatiere = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { nom_matiere, coefficient } = req.body;

        // Vérifier que la matière existe
        const existingMatiere = await query(
            'SELECT id_matiere FROM Matiere WHERE id_matiere = ?',
            [id]
        );

        if (existingMatiere.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Matière non trouvée.'
            });
        }

        // Validation: vérifier que le coefficient est valide
        if (coefficient !== undefined && (coefficient < 0 || coefficient > 10))
        {
            return res.status(400).json({
                success: false,
                message: 'Le coefficient doit être entre 0 et 10.'
            });
        }

        // Construire la requête de mise à jour dynamiquement
        const updates = [];
        const values = [];

        if (nom_matiere)
        {
            updates.push('nom_matiere = ?');
            values.push(nom_matiere);
        }
        if (coefficient !== undefined)
        {
            updates.push('coefficient = ?');
            values.push(coefficient);
        }

        // Si aucun champ à mettre à jour
        if (updates.length === 0)
        {
            return res.status(400).json({
                success: false,
                message: 'Aucun champ à mettre à jour.'
            });
        }

        // Ajouter l'ID à la fin des valeurs
        values.push(id);

        // Exécuter la mise à jour
        await query(
            `UPDATE Matiere SET ${updates.join(', ')} WHERE id_matiere = ?`,
            values
        );

        // Récupérer la matière mise à jour
        const updatedMatiere = await query(
            `SELECT id_matiere, nom_matiere, coefficient
       FROM Matiere
       WHERE id_matiere = ?`,
            [id]
        );

        // On retourne la matière mise à jour
        res.status(200).json({
            success: true,
            message: 'Matière mise à jour avec succès.',
            data: updatedMatiere[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la mise à jour de la matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour de la matière.'
        });
    }
};

/**
 * Supprimer une matière
 * DELETE /api/matieres/:id
 */
export const deleteMatiere = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // Vérifier que la matière existe
        const existingMatiere = await query(
            'SELECT id_matiere FROM Matiere WHERE id_matiere = ?',
            [id]
        );

        if (existingMatiere.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Matière non trouvée.'
            });
        }

        // Vérifier si la matière est utilisée dans des cours
        const cours = await query(
            'SELECT COUNT(*) as count FROM Cours WHERE id_matiere = ?',
            [id]
        );

        if (cours[0].count > 0)
        {
            return res.status(409).json({
                success: false,
                message: `Impossible de supprimer cette matière car elle est utilisée dans ${cours[0].count} cours.`
            });
        }

        // Supprimer la matière
        await query('DELETE FROM Matiere WHERE id_matiere = ?', [id]);

        // On retourne un message de succès
        res.status(200).json({
            success: true,
            message: 'Matière supprimée avec succès.'
        });

    } catch (error)
    {
        console.error('Erreur lors de la suppression de la matière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de la matière.'
        });
    }
};