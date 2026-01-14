import { query } from "../config/mysql.js";

export const getAllFilieres = async (req, res) =>
{
    try
    {
        const filieres = await query(
            `SELECT id_filiere, nom_filiere, code_filiere
       FROM Filiere
       ORDER BY nom_filiere ASC`
        );

        return res.status(200).json({
            success: true,
            count: filieres.length,
            data: filieres,
        });
    } catch (error)
    {
        console.error("Erreur récupération filières:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur.",
        });
    }
};
