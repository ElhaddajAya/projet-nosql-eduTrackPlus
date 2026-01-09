// Import de bcrypt pour hasher les mots de passe
const bcrypt = require('bcryptjs');

// Import de la connexion MySQL
const { query } = require('../config/mysql');

// Import des fonctions JWT
const { generateToken } = require('../utils/jwt');

/**
 * Inscription d'un nouvel utilisateur
 * POST /api/auth/register
 */
const register = async (req, res) =>
{
    try
    {
        // On récupère les données envoyées par le client
        const { firstName, lastName, email, password, role } = req.body;

        // Validation: on vérifie que tous les champs obligatoires sont présents
        if (!firstName || !lastName || !email || !password || !role)
        {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs obligatoires doivent être remplis.'
            });
        }

        // Validation: on vérifie que le rôle est valide
        const validRoles = ['admin', 'teacher', 'student'];
        if (!validRoles.includes(role))
        {
            return res.status(400).json({
                success: false,
                message: 'Rôle invalide. Les rôles valides sont: admin, teacher, student.'
            });
        }

        // On vérifie si l'email existe déjà dans la base de données
        const existingUser = await query(
            'SELECT id_utilisateur FROM Utilisateur WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0)
        {
            return res.status(409).json({
                success: false,
                message: 'Cet email est déjà utilisé.'
            });
        }

        // On hash le mot de passe (10 rounds de salage)
        const hashedPassword = await bcrypt.hash(password, 10);

        // On insère le nouvel utilisateur dans la base de données
        const result = await query(
            `INSERT INTO Utilisateur (prenom, nom, email, mot_de_passe, role)
       VALUES (?, ?, ?, ?, ?)`,
            [firstName, lastName, email, hashedPassword, role]
        );

        // On récupère l'ID du nouvel utilisateur
        const userId = result.insertId;

        // On génère un token JWT pour l'utilisateur
        const token = generateToken({
            id: userId,
            email: email,
            role: role
        });

        // On retourne une réponse de succès avec le token
        res.status(201).json({
            success: true,
            message: 'Inscription réussie.',
            data: {
                user: {
                    id: userId,
                    firstName,
                    lastName,
                    email,
                    role
                },
                token
            }
        });

    } catch (error)
    {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de l\'inscription.'
        });
    }
};

/**
 * Connexion d'un utilisateur existant
 * POST /api/auth/login
 */
const login = async (req, res) =>
{
    try
    {
        // On récupère les données envoyées par le client
        const { email, password } = req.body;

        // Validation: on vérifie que email et password sont présents
        if (!email || !password)
        {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis.'
            });
        }

        // On cherche l'utilisateur dans la base de données
        const users = await query(
            'SELECT id_utilisateur, prenom, nom, email, mot_de_passe, role FROM Utilisateur WHERE email = ?',
            [email]
        );

        // Si l'utilisateur n'existe pas
        if (users.length === 0)
        {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        const user = users[0];

        // On compare le mot de passe entré avec le hash stocké
        const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);

        // Si le mot de passe est incorrect
        if (!isPasswordValid)
        {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect.'
            });
        }

        // On génère un token JWT pour l'utilisateur
        const token = generateToken({
            id: user.id_utilisateur,
            email: user.email,
            role: user.role
        });

        // On retourne une réponse de succès avec le token
        res.status(200).json({
            success: true,
            message: 'Connexion réussie.',
            data: {
                user: {
                    id: user.id_utilisateur,
                    firstName: user.prenom,
                    lastName: user.nom,
                    email: user.email,
                    role: user.role
                },
                token
            }
        });

    } catch (error)
    {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion.'
        });
    }
};

/**
 * Récupère le profil de l'utilisateur connecté
 * GET /api/auth/profile
 */
const getProfile = async (req, res) =>
{
    try
    {
        // req.user est rempli par le middleware authenticate
        const userId = req.user.id;

        // On récupère les infos de l'utilisateur depuis la base de données
        const users = await query(
            `SELECT id_utilisateur, prenom, nom, email, role
       FROM Utilisateur WHERE id_utilisateur = ?`,
            [userId]
        );

        if (users.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé.'
            });
        }

        const user = users[0];

        // On retourne les infos de l'utilisateur
        res.status(200).json({
            success: true,
            data: {
                id: user.id_utilisateur,
                firstName: user.prenom,
                lastName: user.nom,
                email: user.email,
                role: user.role
            }
        });

    } catch (error)
    {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du profil.'
        });
    }
};

// On export les fonctions du controller
module.exports = {
    register,
    login,
    getProfile
};