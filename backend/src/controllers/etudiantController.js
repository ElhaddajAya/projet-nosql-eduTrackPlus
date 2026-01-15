// Import de la connexion MySQL
import { query } from '../config/mysql.js';

/**
 * Récupérer tous les étudiants
 * GET /api/etudiants
 */
export const getAllEtudiants = async (req, res) =>
{
    try
    {
        // On récupère tous les étudiants avec leurs infos
        const etudiants = await query(
            `SELECT 
        e.id_etudiant,
        e.id_utilisateur,
        e.id_classe,
        e.matricule,
        e.date_naissance,
        e.adresse,
        e.telephone_etudiant,
        e.telephone_parent,
        e.date_inscription,
        e.streak_count,
        e.last_present_date,
        e.bonus_gagnes,
        u.prenom,
        u.nom,
        u.email,
        c.nom_classe,
        c.niveau
      FROM Etudiant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Classe c ON e.id_classe = c.id_classe
      ORDER BY u.nom, u.prenom`
        );

        res.status(200).json({
            success: true,
            count: etudiants.length,
            data: etudiants
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération des étudiants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des étudiants.'
        });
    }
};

/**
 * Récupérer un étudiant par son ID
 * GET /api/etudiants/:id
 */
export const getEtudiantById = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const etudiants = await query(
            `SELECT 
        e.id_etudiant,
        e.id_utilisateur,
        e.id_classe,
        e.matricule,
        e.date_naissance,
        e.adresse,
        e.telephone_etudiant,
        e.telephone_parent,
        e.date_inscription,
        e.streak_count,
        e.last_present_date,
        e.bonus_gagnes,
        u.prenom,
        u.nom,
        u.email,
        c.nom_classe,
        c.niveau,
        c.annee_scolaire
      FROM Etudiant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Classe c ON e.id_classe = c.id_classe
      WHERE e.id_etudiant = ?`,
            [id]
        );

        if (etudiants.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé.'
            });
        }

        res.status(200).json({
            success: true,
            data: etudiants[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération de l\'étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération de l\'étudiant.'
        });
    }
};

/**
 * Créer un nouvel étudiant
 * POST /api/etudiants
 */
export const createEtudiant = async (req, res) =>
{
    try
    {
        const {
            id_utilisateur,
            id_classe,
            matricule,
            date_naissance,
            adresse,
            telephone_etudiant,
            telephone_parent,
            date_inscription
        } = req.body;

        // Validation
        if (!id_utilisateur || !id_classe)
        {
            return res.status(400).json({
                success: false,
                message: "Les champs id_utilisateur et id_classe sont obligatoires."
            });
        }

        // Vérifier que l'utilisateur existe et a le rôle 'student'
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

        if (user[0].role !== 'student')
        {
            return res.status(400).json({
                success: false,
                message: 'L\'utilisateur doit avoir le rôle "student".'
            });
        }

        // Vérifier que l'utilisateur n'est pas déjà étudiant
        const existingEtudiant = await query(
            'SELECT id_etudiant FROM Etudiant WHERE id_utilisateur = ?',
            [id_utilisateur]
        );

        if (existingEtudiant.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Cet utilisateur est déjà enregistré comme étudiant.'
            });
        }

        // Vérifier que le matricule est unique
        const existingMatricule = await query(
            'SELECT id_etudiant FROM Etudiant WHERE matricule = ?',
            [matricule]
        );

        if (existingMatricule.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Ce matricule est déjà utilisé.'
            });
        }

        // Vérifier que la classe existe
        const classe = await query(
            'SELECT id_classe FROM Classe WHERE id_classe = ?',
            [id_classe]
        );

        if (classe.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Classe non trouvée.'
            });
        }

        // Créer le nouvel étudiant
        const result = await query(
            `INSERT INTO Etudiant (
        id_utilisateur,
        id_classe,
        matricule,
        date_naissance,
        adresse,
        telephone_etudiant,
        telephone_parent,
        date_inscription
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_utilisateur,
                id_classe,
                matricule,
                date_naissance || null,
                adresse || null,
                telephone_etudiant || null,
                telephone_parent || null,
                date_inscription
            ]
        );

        // Récupérer l'étudiant créé
        const newEtudiant = await query(
            `SELECT 
        e.id_etudiant,
        e.id_utilisateur,
        e.id_classe,
        e.matricule,
        e.date_naissance,
        e.adresse,
        e.telephone_etudiant,
        e.telephone_parent,
        e.date_inscription,
        u.prenom,
        u.nom,
        u.email,
        c.nom_classe
      FROM Etudiant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Classe c ON e.id_classe = c.id_classe
      WHERE e.id_etudiant = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Étudiant créé avec succès.',
            data: newEtudiant[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la création de l\'étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de l\'étudiant.'
        });
    }
};

/**
 * Modifier un étudiant existant
 * PUT /api/etudiants/:id
 */
export const updateEtudiant = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const {
            id_classe,
            matricule,
            date_naissance,
            adresse,
            telephone_etudiant,
            telephone_parent
        } = req.body;

        // Vérifier que l'étudiant existe
        const existingEtudiant = await query(
            'SELECT id_etudiant FROM Etudiant WHERE id_etudiant = ?',
            [id]
        );

        if (existingEtudiant.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé.'
            });
        }

        // Si on modifie la classe, vérifier qu'elle existe
        if (id_classe)
        {
            const classe = await query(
                'SELECT id_classe FROM Classe WHERE id_classe = ?',
                [id_classe]
            );

            if (classe.length === 0)
            {
                return res.status(404).json({
                    success: false,
                    message: 'Classe non trouvée.'
                });
            }
        }

        // Construire la requête de mise à jour dynamiquement
        const updates = [];
        const values = [];

        if (id_classe)
        {
            updates.push('id_classe = ?');
            values.push(id_classe);
        }
        if (matricule)
        {
            updates.push('matricule = ?');
            values.push(matricule);
        }
        if (date_naissance !== undefined)
        {
            updates.push('date_naissance = ?');
            values.push(date_naissance || null);
        }
        if (adresse !== undefined)
        {
            updates.push('adresse = ?');
            values.push(adresse || null);
        }
        if (telephone_etudiant !== undefined)
        {
            updates.push('telephone_etudiant = ?');
            values.push(telephone_etudiant || null);
        }
        if (telephone_parent !== undefined)
        {
            updates.push('telephone_parent = ?');
            values.push(telephone_parent || null);
        }

        if (updates.length === 0)
        {
            return res.status(400).json({
                success: false,
                message: 'Aucun champ à mettre à jour.'
            });
        }

        values.push(id);

        await query(
            `UPDATE Etudiant SET ${updates.join(', ')} WHERE id_etudiant = ?`,
            values
        );

        // Récupérer l'étudiant mis à jour
        const updatedEtudiant = await query(
            `SELECT 
        e.id_etudiant,
        e.id_utilisateur,
        e.id_classe,
        e.matricule,
        e.date_naissance,
        e.adresse,
        e.telephone_etudiant,
        e.telephone_parent,
        e.date_inscription,
        u.prenom,
        u.nom,
        u.email,
        c.nom_classe
      FROM Etudiant e
      INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Classe c ON e.id_classe = c.id_classe
      WHERE e.id_etudiant = ?`,
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Étudiant mis à jour avec succès.',
            data: updatedEtudiant[0]
        });

    } catch (error)
    {
        console.error('Erreur lors de la mise à jour de l\'étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour de l\'étudiant.'
        });
    }
};

/**
 * Supprimer un étudiant
 * DELETE /api/etudiants/:id
 */
export const deleteEtudiant = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // Vérifier que l'étudiant existe
        const existingEtudiant = await query(
            'SELECT id_etudiant FROM Etudiant WHERE id_etudiant = ?',
            [id]
        );

        if (existingEtudiant.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé.'
            });
        }

        // Supprimer l'étudiant
        await query('DELETE FROM Etudiant WHERE id_etudiant = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Étudiant supprimé avec succès.'
        });

    } catch (error)
    {
        console.error('Erreur lors de la suppression de l\'étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de l\'étudiant.'
        });
    }
};

/**
 * Récupérer les candidats étudiants (utilisateurs role='student' non encore ajoutés dans Etudiant)
 * GET /api/etudiants/candidats
 */
export const getCandidatsEtudiants = async (req, res) =>
{
    try
    {
        const rows = await query(
            `SELECT 
         u.id_utilisateur,
         u.prenom,
         u.nom,
         u.email
       FROM Utilisateur u
       LEFT JOIN Etudiant e ON e.id_utilisateur = u.id_utilisateur
       WHERE u.role = 'student' AND e.id_etudiant IS NULL
       ORDER BY u.nom ASC, u.prenom ASC`
        );

        return res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error)
    {
        console.error("Erreur candidats étudiants:", error);
        return res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

/**
 * Récupérer l'étudiant connecté (depuis le token JWT)
 * GET /api/etudiants/me
 */
export const getMyProfile = async (req, res) =>
{
    try
    {
        console.log('🔍 GET /me appelé');
        console.log('📋 req.user:', req.user);

        // ⭐ FIX : Le JWT peut contenir soit "id" soit "id_utilisateur"
        const id_utilisateur = req.user?.id_utilisateur || req.user?.id;

        if (!id_utilisateur)
        {
            console.error('❌ Pas de id_utilisateur ou id dans req.user');
            return res.status(401).json({
                success: false,
                message: 'Non authentifié'
            });
        }

        console.log(`🔎 Recherche étudiant pour utilisateur ${id_utilisateur}...`);

        // Récupérer l'étudiant correspondant
        const etudiants = await query(
            `SELECT 
                e.id_etudiant,
                e.id_utilisateur,
                e.id_classe,
                e.matricule,
                e.date_naissance,
                e.adresse,
                e.telephone_etudiant,
                e.telephone_parent,
                e.date_inscription,
                e.streak_count,
                e.last_present_date,
                e.bonus_gagnes,
                u.prenom,
                u.nom,
                u.email,
                c.nom_classe,
                c.niveau,
                c.annee_scolaire
            FROM Etudiant e
            INNER JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
            LEFT JOIN Classe c ON e.id_classe = c.id_classe
            WHERE e.id_utilisateur = ?`,
            [id_utilisateur]
        );

        if (etudiants.length === 0)
        {
            console.error(`❌ Aucun étudiant trouvé pour utilisateur ${id_utilisateur}`);
            return res.status(404).json({
                success: false,
                message: 'Profil étudiant non trouvé. Es-tu bien enregistré comme étudiant ?'
            });
        }

        console.log('✅ Étudiant trouvé:', etudiants[0]);

        res.status(200).json({
            success: true,
            data: etudiants[0]
        });

    } catch (error)
    {
        console.error('❌ Erreur getMyProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du profil.'
        });
    }
};