// Import des fonctions JWT qu'on a créées
import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware qui vérifie si l'utilisateur est authentifié
 * Ce middleware protège les routes qui nécessitent une connexion
 */
export const authenticate = async (req, res, next) =>
{
    try
    {
        // On récupère le token depuis le header Authorization
        // Format attendu: "Bearer token_ici"
        const authHeader = req.headers.authorization;

        // Si pas de header Authorization, on refuse l'accès
        if (!authHeader)
        {
            return res.status(401).json({
                success: false,
                message: 'Accès refusé. Token manquant.'
            });
        }

        // On extrait le token (on enlève "Bearer ")
        const token = authHeader.split(' ')[1];

        // Si le token est vide, on refuse l'accès
        if (!token)
        {
            return res.status(401).json({
                success: false,
                message: 'Accès refusé. Token invalide.'
            });
        }

        // On vérifie le token et on récupère les données de l'utilisateur
        const decoded = verifyToken(token);

        // On attache les données de l'utilisateur à la requête
        // Comme ça on peut les utiliser dans les controllers
        req.user = decoded;

        // On passe au middleware suivant (ou au controller)
        next();

    } catch (error)
    {
        // Si le token est invalide ou expiré, on refuse l'accès
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré. Veuillez vous reconnecter.'
        });
    }
};

/**
 * Middleware qui vérifie si l'utilisateur a un rôle spécifique
 * @param {Array} roles - Liste des rôles autorisés (ex: ['admin', 'teacher'])
 */
export const authorize = (roles = []) =>
{
    return (req, res, next) =>
    {
        // On vérifie si l'utilisateur est authentifié
        if (!req.user)
        {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise.'
            });
        }

        // On vérifie si le rôle de l'utilisateur est dans la liste autorisée
        if (!roles.includes(req.user.role))
        {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Permissions insuffisantes.'
            });
        }

        // Si tout est bon, on passe au middleware suivant
        next();
    };
};