import bcrypt from "bcryptjs";
import { query } from "../config/mysql.js";

/**
 * Créer un utilisateur (admin only)
 * POST /api/utilisateurs
 * body: { firstName, lastName, email, password, role }
 */
export const createUtilisateur = async (req, res) =>
{
    try
    {
        const { firstName, lastName, email, password, role } = req.body;

        if (!firstName || !lastName || !email || !password || !role)
        {
            return res.status(400).json({
                success: false,
                message: "Tous les champs obligatoires doivent être remplis.",
            });
        }

        const validRoles = ["admin", "teacher", "student"];
        if (!validRoles.includes(role))
        {
            return res.status(400).json({
                success: false,
                message: "Rôle invalide. Rôles valides: admin, teacher, student.",
            });
        }

        // Vérifier email unique
        const existing = await query(
            "SELECT id_utilisateur FROM Utilisateur WHERE email = ?",
            [email]
        );

        if (existing.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: "Cet email est déjà utilisé.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await query(
            `INSERT INTO Utilisateur (email, mot_de_passe, role, prenom, nom)
       VALUES (?, ?, ?, ?, ?)`,
            [email, hashedPassword, role, firstName, lastName]
        );

        return res.status(201).json({
            success: true,
            message: "Utilisateur créé avec succès.",
            data: {
                id_utilisateur: result.insertId,
                user: {
                    id: result.insertId,
                    email,
                    role,
                    firstName,
                    lastName,
                },
            },
        });
    } catch (error)
    {
        console.error("❌ Erreur createUtilisateur:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la création de l'utilisateur.",
        });
    }
};

/**
 * (Optionnel pour après) Modifier un utilisateur (admin only)
 * PUT /api/utilisateurs/:id
 * body: { firstName?, lastName?, email?, role?, password? }
 */
export const updateUtilisateur = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { firstName, lastName, email, role, password } = req.body;

        const rows = await query(
            "SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ?",
            [id]
        );

        if (rows.length === 0)
        {
            return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
        }

        if (role)
        {
            const validRoles = ["admin", "teacher", "student"];
            if (!validRoles.includes(role))
            {
                return res.status(400).json({
                    success: false,
                    message: "Rôle invalide. Rôles valides: admin, teacher, student.",
                });
            }
        }

        // email unique si changement
        if (email)
        {
            const existing = await query(
                "SELECT id_utilisateur FROM Utilisateur WHERE email = ? AND id_utilisateur <> ?",
                [email, id]
            );
            if (existing.length > 0)
            {
                return res.status(409).json({
                    success: false,
                    message: "Cet email est déjà utilisé par un autre utilisateur.",
                });
            }
        }

        let hashedPassword = null;
        if (password) hashedPassword = await bcrypt.hash(password, 10);

        await query(
            `UPDATE Utilisateur
       SET prenom = COALESCE(?, prenom),
           nom = COALESCE(?, nom),
           email = COALESCE(?, email),
           role = COALESCE(?, role),
           mot_de_passe = COALESCE(?, mot_de_passe)
       WHERE id_utilisateur = ?`,
            [firstName ?? null, lastName ?? null, email ?? null, role ?? null, hashedPassword ?? null, id]
        );

        return res.json({
            success: true,
            message: "Utilisateur mis à jour.",
        });
    } catch (error)
    {
        console.error("❌ Erreur updateUtilisateur:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la mise à jour.",
        });
    }
};

/**
 * (Optionnel pour après) Supprimer un utilisateur (admin only)
 * DELETE /api/utilisateurs/:id
 */
export const deleteUtilisateur = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const rows = await query(
            "SELECT id_utilisateur FROM Utilisateur WHERE id_utilisateur = ?",
            [id]
        );

        if (rows.length === 0)
        {
            return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
        }

        await query("DELETE FROM Utilisateur WHERE id_utilisateur = ?", [id]);

        return res.json({
            success: true,
            message: "Utilisateur supprimé.",
        });
    } catch (error)
    {
        console.error("❌ Erreur deleteUtilisateur:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la suppression.",
        });
    }
};

/**
 * Récupérer tous les utilisateurs (admin only)
 * GET /api/utilisateurs
 */
export const getAllUtilisateurs = async (req, res) =>
{
    try
    {
        const rows = await query(
            `SELECT id_utilisateur, prenom, nom, email, role
       FROM Utilisateur
       ORDER BY id_utilisateur DESC`
        );

        return res.json({
            success: true,
            data: rows,
        });
    } catch (error)
    {
        console.error("❌ Erreur getAllUtilisateurs:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors du chargement des utilisateurs.",
        });
    }
};
