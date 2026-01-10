// Import de la connexion MySQL
import { query } from '../config/mysql.js';

/**
 * Récupérer tous les enseignants
 * GET /api/enseignants
 */
export const getAllEnseignants = async (req, res) =>
{
    try
    {
        // On récupère tous les enseignants avec leurs infos utilisateur
        const enseignants = await query(
            `SELECT 
        e.id_enseignant,
        e.id_utilisateur,
        e.matricule_prof,
        e.specialite,
        e.type_contrat,
        e.date_embauche,
        e.telephone,
        e.id_departement,
        u.prenom,
        u.nom,
        u.email,
        d.nom_departement
      FROM Enseignant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Departement d ON e.id_departement = d.id_departement
      ORDER BY u.nom, u.prenom`
        );

        // On retourne la liste des enseignants
        res.status(200).json({
            success: true,
            count: enseignants.length,
            data: enseignants
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération des enseignants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des enseignants.'
        });
    }
};

/**
 * Récupérer un enseignant par son ID
 * GET /api/enseignants/:id
 */
export const getEnseignantById = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // On récupère l'enseignant avec ses informations
        const enseignants = await query(
            `SELECT 
        e.id_enseignant,
        e.id_utilisateur,
        e.matricule_prof,
        e.specialite,
        e.type_contrat,
        e.date_embauche,
        e.telephone,
        e.id_departement,
        u.prenom,
        u.nom,
        u.email,
        d.nom_departement
      FROM Enseignant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Departement d ON e.id_departement = d.id_departement
      WHERE e.id_enseignant = ?`,
            [id]
        );

        // Si l'enseignant n'existe pas
        if (enseignants.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé.'
            });
        }

        // On retourne l'enseignant
        res.status(200).json({
            success: true,
            data: enseignants[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération de l\'enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de l\'enseignant.'
        });
    }
};

/**
 * Créer un nouvel enseignant
 * POST /api/enseignants
 */
export const createEnseignant = async (req, res) =>
{
    try
    {
        const {
            id_utilisateur,
            matricule_prof,
            specialite,
            type_contrat,
            date_embauche,
            telephone,
            id_departement
        } = req.body;

        // Validation: vérifier que tous les champs obligatoires sont présents
        if (!id_utilisateur || !matricule_prof || !date_embauche)
        {
            return res.status(400).json({
                success: false,
                message: 'Les champs id_utilisateur, matricule_prof et date_embauche sont obligatoires.'
            });
        }

        // Vérifier que l'utilisateur existe et a le rôle 'teacher'
        const user = await query(
            'SELECT id_utilisateur, role FROM Utilisateur WHERE id_utilisateur = ?',
            [id_utilisateur]
        );

        if (user.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé.'
            });
        }

        if (user[0].role !== 'teacher')
        {
            return res.status(400).json({
                success: false,
                message: 'L\'utilisateur doit avoir le rôle "teacher".'
            });
        }

        // Vérifier que l'utilisateur n'est pas déjà enseignant
        const existingEnseignant = await query(
            'SELECT id_enseignant FROM Enseignant WHERE id_utilisateur = ?',
            [id_utilisateur]
        );

        if (existingEnseignant.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Cet utilisateur est déjà enregistré comme enseignant.'
            });
        }

        // Vérifier que le matricule est unique
        const existingMatricule = await query(
            'SELECT id_enseignant FROM Enseignant WHERE matricule_prof = ?',
            [matricule_prof]
        );

        if (existingMatricule.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Ce matricule est déjà utilisé.'
            });
        }

        // Si un département est spécifié, vérifier qu'il existe
        if (id_departement)
        {
            const departement = await query(
                'SELECT id_departement FROM Departement WHERE id_departement = ?',
                [id_departement]
            );

            if (departement.length === 0)
            {
                return res.status(404).json({
                    success: false,
                    message: 'Département non trouvé.'
                });
            }
        }

        // Créer le nouvel enseignant
        const result = await query(
            `INSERT INTO Enseignant (
        id_utilisateur, 
        matricule_prof, 
        specialite, 
        type_contrat, 
        date_embauche, 
        telephone,
        id_departement
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id_utilisateur,
                matricule_prof,
                specialite || null,
                type_contrat || 'titulaire',
                date_embauche,
                telephone || null,
                id_departement || null
            ]
        );

        // Récupérer l'enseignant créé
        const newEnseignant = await query(
            `SELECT 
        e.id_enseignant,
        e.id_utilisateur,
        e.matricule_prof,
        e.specialite,
        e.type_contrat,
        e.date_embauche,
        e.telephone,
        e.id_departement,
        u.prenom,
        u.nom,
        u.email,
        d.nom_departement
      FROM Enseignant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Departement d ON e.id_departement = d.id_departement
      WHERE e.id_enseignant = ?`,
            [result.insertId]
        );

        // On retourne l'enseignant créé
        res.status(201).json({
            success: true,
            message: 'Enseignant créé avec succès.',
            data: newEnseignant[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la création de l\'enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de l\'enseignant.'
        });
    }
};

/**
 * Modifier un enseignant existant
 * PUT /api/enseignants/:id
 */
export const updateEnseignant = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const {
            matricule_prof,
            specialite,
            type_contrat,
            date_embauche,
            telephone,
            id_departement
        } = req.body;

        // Vérifier que l'enseignant existe
        const existingEnseignant = await query(
            'SELECT id_enseignant FROM Enseignant WHERE id_enseignant = ?',
            [id]
        );

        if (existingEnseignant.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé.'
            });
        }

        // Si on modifie le département, vérifier qu'il existe
        if (id_departement)
        {
            const departement = await query(
                'SELECT id_departement FROM Departement WHERE id_departement = ?',
                [id_departement]
            );

            if (departement.length === 0)
            {
                return res.status(404).json({
                    success: false,
                    message: 'Département non trouvé.'
                });
            }
        }

        // Construire la requête de mise à jour dynamiquement
        const updates = [];
        const values = [];

        if (matricule_prof)
        {
            updates.push('matricule_prof = ?');
            values.push(matricule_prof);
        }
        if (specialite !== undefined)
        {
            updates.push('specialite = ?');
            values.push(specialite || null);
        }
        if (type_contrat)
        {
            updates.push('type_contrat = ?');
            values.push(type_contrat);
        }
        if (date_embauche)
        {
            updates.push('date_embauche = ?');
            values.push(date_embauche);
        }
        if (telephone !== undefined)
        {
            updates.push('telephone = ?');
            values.push(telephone || null);
        }
        if (id_departement !== undefined)
        {
            updates.push('id_departement = ?');
            values.push(id_departement || null);
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
            `UPDATE Enseignant SET ${updates.join(', ')} WHERE id_enseignant = ?`,
            values
        );

        // Récupérer l'enseignant mis à jour
        const updatedEnseignant = await query(
            `SELECT 
        e.id_enseignant,
        e.id_utilisateur,
        e.matricule_prof,
        e.specialite,
        e.type_contrat,
        e.date_embauche,
        e.telephone,
        e.id_departement,
        u.prenom,
        u.nom,
        u.email,
        d.nom_departement
      FROM Enseignant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Departement d ON e.id_departement = d.id_departement
      WHERE e.id_enseignant = ?`,
            [id]
        );

        // On retourne l'enseignant mis à jour
        res.status(200).json({
            success: true,
            message: 'Enseignant mis à jour avec succès.',
            data: updatedEnseignant[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la mise à jour de l\'enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour de l\'enseignant.'
        });
    }
};

/**
 * Supprimer un enseignant
 * DELETE /api/enseignants/:id
 */
export const deleteEnseignant = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // Vérifier que l'enseignant existe
        const existingEnseignant = await query(
            'SELECT id_enseignant FROM Enseignant WHERE id_enseignant = ?',
            [id]
        );

        if (existingEnseignant.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé.'
            });
        }

        // Vérifier si l'enseignant a des cours
        const cours = await query(
            'SELECT COUNT(*) as count FROM Cours WHERE id_enseignant_titulaire = ?',
            [id]
        );

        if (cours[0].count > 0)
        {
            return res.status(409).json({
                success: false,
                message: `Impossible de supprimer cet enseignant car il est titulaire de ${cours[0].count} cours.`
            });
        }

        // Supprimer l'enseignant
        await query('DELETE FROM Enseignant WHERE id_enseignant = ?', [id]);

        // On retourne un message de succès
        res.status(200).json({
            success: true,
            message: 'Enseignant supprimé avec succès.'
        });

    } catch (error)
    {
        console.error('Erreur lors de la suppression de l\'enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de l\'enseignant.'
        });
    }
};