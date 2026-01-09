// Import de jsonwebtoken pour créer et vérifier les tokens
const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} payload - Les données à encoder dans le token (id, email, role)
 * @returns {string} - Le token JWT signé
 */
const generateToken = (payload) =>
{
    // On récupère le secret depuis les variables d'environnement
    const secret = process.env.JWT_SECRET;

    // On récupère la durée d'expiration (par défaut 7 jours)
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // On crée et retourne le token avec les données + expiration
    return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Vérifie si un token JWT est valide
 * @param {string} token - Le token à vérifier
 * @returns {Object} - Les données décodées du token
 * @throws {Error} - Si le token est invalide ou expiré
 */
const verifyToken = (token) =>
{
    try
    {
        // On récupère le secret depuis les variables d'environnement
        const secret = process.env.JWT_SECRET;

        // On vérifie et décode le token
        const decoded = jwt.verify(token, secret);

        return decoded;
    } catch (error)
    {
        // Si le token est expiré ou invalide, on lance une erreur
        throw new Error('Token invalide ou expiré');
    }
};

// On export les fonctions pour les utiliser ailleurs
module.exports = {
    generateToken,
    verifyToken
};