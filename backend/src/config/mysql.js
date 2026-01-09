import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ===================================
// CONFIGURATION MYSQL
// ===================================

const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'edutrackplus',
    waitForConnections: true,
    connectionLimit: 10, // Nombre maximum de connexions simultanées
    queueLimit: 0
};

// Créer le pool de connexions
const pool = mysql.createPool(mysqlConfig);

// ===================================
// FONCTION DE TEST DE CONNEXION
// ===================================

export const testMySQLConnection = async () =>
{
    try
    {
        const connection = await pool.getConnection();
        console.log('✅ MySQL connecté avec succès !');
        connection.release();
        return true;
    } catch (error)
    {
        console.error('❌ Erreur de connexion MySQL:', error.message);
        return false;
    }
};

// ===================================
// FONCTION POUR EXÉCUTER DES REQUÊTES
// ===================================

export const query = async (sql, params) =>
{
    try
    {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error)
    {
        console.error('Erreur requête MySQL:', error.message);
        throw error;
    }
};

// Export du pool pour usage avancé
export default pool;