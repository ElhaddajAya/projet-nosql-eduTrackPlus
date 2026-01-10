// Import de la connexion MySQL
import { query } from '../config/mysql.js';

/**
 * Récupérer toutes les classes
 * GET /api/classes
 */
export const getAllClasses = async (req, res) =>
{
    try
    {
        // On récupère toutes les classes avec leurs informations de filière
        const classes = await query(
            `SELECT 
        c.id_classe,
        c.nom_classe,
        c.niveau,
        c.annee_scolaire,
        c.capacite_max,
        c.id_filiere,
        f.nom_filiere,
        f.code_filiere,
        d.nom_departement
      FROM Classe c
      LEFT JOIN Filiere f ON c.id_filiere = f.id_filiere
      LEFT JOIN Departement d ON f.id_departement = d.id_departement
      ORDER BY c.annee_scolaire DESC, c.niveau, c.nom_classe`
        );

        // On retourne la liste des classes
        res.status(200).json({
            success: true,
            count: classes.length,
            data: classes
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération des classes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des classes.'
        });
    }
};

/**
 * Récupérer une classe par son ID
 * GET /api/classes/:id
 */
export const getClassById = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // On récupère la classe avec ses informations
        const classes = await query(
            `SELECT 
        c.id_classe,
        c.nom_classe,
        c.niveau,
        c.annee_scolaire,
        c.capacite_max,
        c.id_filiere,
        f.nom_filiere,
        f.code_filiere,
        d.id_departement,
        d.nom_departement
      FROM Classe c
      LEFT JOIN Filiere f ON c.id_filiere = f.id_filiere
      LEFT JOIN Departement d ON f.id_departement = d.id_departement
      WHERE c.id_classe = ?`,
            [id]
        );

        // Si la classe n'existe pas
        if (classes.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée.'
            });
        }

        // On retourne la classe
        res.status(200).json({
            success: true,
            data: classes[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération de la classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de la classe.'
        });
    }
};

/**
 * Créer une nouvelle classe
 * POST /api/classes
 */
export const createClass = async (req, res) =>
{
    try
    {
        const { nom_classe, niveau, annee_scolaire, capacite_max, id_filiere } = req.body;

        // Validation: vérifier que tous les champs obligatoires sont présents
        if (!nom_classe || !niveau || !annee_scolaire || !id_filiere)
        {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être remplis (nom_classe, niveau, annee_scolaire, id_filiere).'
            });
        }

        // Vérifier que la filière existe
        const filiere = await query(
            'SELECT id_filiere FROM Filiere WHERE id_filiere = ?',
            [id_filiere]
        );

        if (filiere.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée.'
            });
        }

        // Vérifier qu'une classe avec le même nom n'existe pas déjà pour cette année
        const existingClass = await query(
            'SELECT id_classe FROM Classe WHERE nom_classe = ? AND annee_scolaire = ?',
            [nom_classe, annee_scolaire]
        );

        if (existingClass.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Une classe avec ce nom existe déjà pour cette année scolaire.'
            });
        }

        // Créer la nouvelle classe
        const result = await query(
            `INSERT INTO Classe (nom_classe, niveau, annee_scolaire, capacite_max, id_filiere)
       VALUES (?, ?, ?, ?, ?)`,
            [nom_classe, niveau, annee_scolaire, capacite_max || 30, id_filiere]
        );

        // Récupérer la classe créée
        const newClass = await query(
            `SELECT 
        c.id_classe,
        c.nom_classe,
        c.niveau,
        c.annee_scolaire,
        c.capacite_max,
        c.id_filiere,
        f.nom_filiere,
        f.code_filiere
      FROM Classe c
      LEFT JOIN Filiere f ON c.id_filiere = f.id_filiere
      WHERE c.id_classe = ?`,
            [result.insertId]
        );

        // On retourne la classe créée
        res.status(201).json({
            success: true,
            message: 'Classe créée avec succès.',
            data: newClass[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la création de la classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de la classe.'
        });
    }
};

/**
 * Modifier une classe existante
 * PUT /api/classes/:id
 */
export const updateClass = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { nom_classe, niveau, annee_scolaire, capacite_max, id_filiere } = req.body;

        // Vérifier que la classe existe
        const existingClass = await query(
            'SELECT id_classe FROM Classe WHERE id_classe = ?',
            [id]
        );

        if (existingClass.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée.'
            });
        }

        // Si on modifie la filière, vérifier qu'elle existe
        if (id_filiere)
        {
            const filiere = await query(
                'SELECT id_filiere FROM Filiere WHERE id_filiere = ?',
                [id_filiere]
            );

            if (filiere.length === 0)
            {
                return res.status(404).json({
                    success: false,
                    message: 'Filière non trouvée.'
                });
            }
        }

        // Construire la requête de mise à jour dynamiquement
        const updates = [];
        const values = [];

        if (nom_classe)
        {
            updates.push('nom_classe = ?');
            values.push(nom_classe);
        }
        if (niveau)
        {
            updates.push('niveau = ?');
            values.push(niveau);
        }
        if (annee_scolaire)
        {
            updates.push('annee_scolaire = ?');
            values.push(annee_scolaire);
        }
        if (capacite_max !== undefined)
        {
            updates.push('capacite_max = ?');
            values.push(capacite_max);
        }
        if (id_filiere)
        {
            updates.push('id_filiere = ?');
            values.push(id_filiere);
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
            `UPDATE Classe SET ${updates.join(', ')} WHERE id_classe = ?`,
            values
        );

        // Récupérer la classe mise à jour
        const updatedClass = await query(
            `SELECT 
        c.id_classe,
        c.nom_classe,
        c.niveau,
        c.annee_scolaire,
        c.capacite_max,
        c.id_filiere,
        f.nom_filiere,
        f.code_filiere
      FROM Classe c
      LEFT JOIN Filiere f ON c.id_filiere = f.id_filiere
      WHERE c.id_classe = ?`,
            [id]
        );

        // On retourne la classe mise à jour
        res.status(200).json({
            success: true,
            message: 'Classe mise à jour avec succès.',
            data: updatedClass[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la mise à jour de la classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour de la classe.'
        });
    }
};

/**
 * Supprimer une classe
 * DELETE /api/classes/:id
 */
export const deleteClass = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // Vérifier que la classe existe
        const existingClass = await query(
            'SELECT id_classe FROM Classe WHERE id_classe = ?',
            [id]
        );

        if (existingClass.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée.'
            });
        }

        // Vérifier si la classe a des étudiants
        const students = await query(
            'SELECT COUNT(*) as count FROM Etudiant WHERE id_classe = ?',
            [id]
        );

        if (students[0].count > 0)
        {
            return res.status(409).json({
                success: false,
                message: `Impossible de supprimer cette classe car elle contient ${students[0].count} étudiant(s).`
            });
        }

        // Supprimer la classe
        await query('DELETE FROM Classe WHERE id_classe = ?', [id]);

        // On retourne un message de succès
        res.status(200).json({
            success: true,
            message: 'Classe supprimée avec succès.'
        });

    } catch (error)
    {
        console.error('Erreur lors de la suppression de la classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de la classe.'
        });
    }
};