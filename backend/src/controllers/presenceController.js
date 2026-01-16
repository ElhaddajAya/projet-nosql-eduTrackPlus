import { query } from "../config/mysql.js";
import { redisClient } from "../config/redis.js";

// ===============================
// HELPERS
// ===============================
const toMysqlStatut = (statut) => (statut === "late" ? "retard" : statut);
const toFrontStatut = (statut) => (statut === "retard" ? "late" : statut);

const formatDateOnly = (d) => new Date(d).toISOString().split("T")[0];

// ===============================
// ✅ Vérifier si la séance est déjà marquée
// GET /api/presences/verifier/:id_seance
// ===============================
export const verifierPresencesSeance = async (req, res) =>
{
    try
    {
        const { id_seance } = req.params;

        if (!id_seance)
        {
            return res.status(400).json({ success: false, message: "id_seance manquant" });
        }

        // Récupérer les présences de la séance (si existe)
        const rows = await query(
            `
      SELECT 
        p.id_presence,
        p.id_etudiant,
        p.id_seance,
        p.statut,
        p.created_at,
        e.matricule,
        u.prenom,
        u.nom,
        e.streak_count,
        e.bonus_gagnes
      FROM presence p
      JOIN etudiant e ON p.id_etudiant = e.id_etudiant
      JOIN utilisateur u ON e.id_utilisateur = u.id_utilisateur
      WHERE p.id_seance = ?
      ORDER BY p.created_at ASC
      `,
            [id_seance]
        );

        if (rows.length === 0)
        {
            return res.json({
                success: true,
                alreadyMarked: false,
                markedDate: null,
                data: [],
            });
        }

        const markedDate = rows[0].created_at;

        return res.json({
            success: true,
            alreadyMarked: true,
            markedDate,
            data: rows.map((r) => ({
                id_etudiant: r.id_etudiant,
                nom: r.nom,
                prenom: r.prenom,
                matricule: r.matricule,
                statut: toFrontStatut(r.statut),
                streak_count: r.streak_count,
                bonus_gagnes: r.bonus_gagnes,
            })),
        });
    } catch (error)
    {
        console.error("Erreur vérification:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la vérification",
            error: error.message,
        });
    }
};

// ===============================
// ✅ Marquer présence (1 étudiant)
// POST /api/presences
// body: { id_etudiant, id_seance, statut }
// ===============================
export const marquerPresence = async (req, res) =>
{
    try
    {
        const { id_etudiant, id_seance, statut } = req.body;

        if (!id_etudiant || !id_seance || !statut)
        {
            return res.status(400).json({ success: false, message: "Champs manquants" });
        }

        // Date séance
        const seanceRows = await query(
            "SELECT date_seance FROM seance WHERE id_seance = ?",
            [id_seance]
        );
        if (seanceRows.length === 0)
        {
            return res.status(404).json({ success: false, message: "Séance introuvable" });
        }

        const dateSeance = formatDateOnly(seanceRows[0].date_seance);
        const statutMySQL = toMysqlStatut(statut);

        // Upsert presence (par étudiant + séance)
        const existante = await query(
            "SELECT id_presence FROM presence WHERE id_etudiant = ? AND id_seance = ?",
            [id_etudiant, id_seance]
        );

        if (existante.length > 0)
        {
            await query(
                "UPDATE presence SET statut = ? WHERE id_presence = ?",
                [statutMySQL, existante[0].id_presence]
            );
        } else
        {
            await query(
                "INSERT INTO presence (id_etudiant, id_seance, statut) VALUES (?, ?, ?)",
                [id_etudiant, id_seance, statutMySQL]
            );
        }

        // =======================
        // Redis streak + bonus
        // =======================
        const streakKey = `streak:${id_etudiant}`;
        const lastPresentKey = `last_present:${id_etudiant}`;

        let currentStreak = parseInt((await redisClient.get(streakKey)) || "0", 10);
        const lastPresent = await redisClient.get(lastPresentKey);

        let message = "";
        let nouveauBonus = 0;

        if (statut === "present")
        {
            if (lastPresent)
            {
                const lastDate = new Date(lastPresent);
                const currentDate = new Date(dateSeance);
                const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 1)
                {
                    currentStreak++;
                } else if (diffDays > 1)
                {
                    currentStreak = 1;
                } // diffDays === 0 => même jour => on garde

            } else
            {
                currentStreak = 1;
            }

            if (currentStreak > 0 && currentStreak % 5 === 0)
            {
                nouveauBonus = 1;
                message = `🎉 ${currentStreak} jours ! +${nouveauBonus}% bonus !`;
            } else
            {
                message = `✅ Streak: ${currentStreak} jours`;
            }

            await redisClient.set(streakKey, currentStreak.toString());
            await redisClient.set(lastPresentKey, dateSeance);
            await redisClient.zAdd("leaderboard:streaks", {
                score: currentStreak,
                value: id_etudiant.toString(),
            });
        } else if (statut === "absent")
        {
            currentStreak = 0;
            await redisClient.set(streakKey, "0");
            message = "⚠️ Absence. Streak réinitialisé.";
        } else
        {
            message = "⏰ Retard enregistré";
        }

        // Sync MySQL etudiant
        if (nouveauBonus > 0)
        {
            await query(
                `
        UPDATE etudiant 
        SET streak_count = ?, 
            bonus_gagnes = bonus_gagnes + ?, 
            last_present_date = ?
        WHERE id_etudiant = ?
        `,
                [currentStreak, nouveauBonus, dateSeance, id_etudiant]
            );
        } else
        {
            await query(
                `
        UPDATE etudiant 
        SET streak_count = ?, 
            last_present_date = ?
        WHERE id_etudiant = ?
        `,
                [currentStreak, dateSeance, id_etudiant]
            );
        }

        return res.json({
            success: true,
            message,
            data: { streak: currentStreak, bonus: nouveauBonus },
        });
    } catch (error)
    {
        console.error("Erreur marquer présence:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message,
        });
    }
};

// ===============================
// ✅ Marquer présences en masse
// POST /api/presences/masse
// body: { id_seance, presences: [{id_etudiant, statut}] }
// ===============================
export const marquerPresencesMasse = async (req, res) =>
{
    try
    {
        const { id_seance, presences } = req.body;

        if (!id_seance || !presences || presences.length === 0)
        {
            return res.status(400).json({ success: false, message: "Données manquantes" });
        }

        // date séance
        const seanceRows = await query(
            "SELECT date_seance FROM seance WHERE id_seance = ?",
            [id_seance]
        );
        if (seanceRows.length === 0)
        {
            return res.status(404).json({ success: false, message: "Séance introuvable" });
        }
        const dateSeance = formatDateOnly(seanceRows[0].date_seance);

        const errors = [];
        const successes = [];

        for (const p of presences)
        {
            const { id_etudiant, statut } = p;
            if (!id_etudiant || !statut)
            {
                errors.push({ id_etudiant, error: "Champs manquants" });
                continue;
            }

            try
            {
                // ✅ réutilise la logique individuelle (upsert + streak)
                // (petit hack propre : on appelle la même fonction mais sans res/req express)
                // Ici, on duplique juste l'essentiel pour éviter complications Express.

                const statutMySQL = toMysqlStatut(statut);

                const existante = await query(
                    "SELECT id_presence FROM presence WHERE id_etudiant = ? AND id_seance = ?",
                    [id_etudiant, id_seance]
                );

                if (existante.length > 0)
                {
                    await query(
                        "UPDATE presence SET statut = ? WHERE id_presence = ?",
                        [statutMySQL, existante[0].id_presence]
                    );
                } else
                {
                    await query(
                        "INSERT INTO presence (id_etudiant, id_seance, statut) VALUES (?, ?, ?)",
                        [id_etudiant, id_seance, statutMySQL]
                    );
                }

                // streak (simple)
                const streakKey = `streak:${id_etudiant}`;
                const lastPresentKey = `last_present:${id_etudiant}`;

                let currentStreak = parseInt((await redisClient.get(streakKey)) || "0", 10);
                const lastPresent = await redisClient.get(lastPresentKey);
                let nouveauBonus = 0;

                if (statut === "present")
                {
                    if (lastPresent)
                    {
                        const lastDate = new Date(lastPresent);
                        const currentDate = new Date(dateSeance);
                        const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
                        if (diffDays === 1) currentStreak++;
                        else if (diffDays > 1) currentStreak = 1;
                    } else
                    {
                        currentStreak = 1;
                    }

                    if (currentStreak > 0 && currentStreak % 5 === 0)
                    {
                        nouveauBonus = 1;
                    }

                    await redisClient.set(streakKey, currentStreak.toString());
                    await redisClient.set(lastPresentKey, dateSeance);
                    await redisClient.zAdd("leaderboard:streaks", {
                        score: currentStreak,
                        value: id_etudiant.toString(),
                    });
                } else if (statut === "absent")
                {
                    currentStreak = 0;
                    await redisClient.set(streakKey, "0");
                }

                if (nouveauBonus > 0)
                {
                    await query(
                        `
            UPDATE etudiant 
            SET streak_count = ?, bonus_gagnes = bonus_gagnes + ?, last_present_date = ?
            WHERE id_etudiant = ?
            `,
                        [currentStreak, nouveauBonus, dateSeance, id_etudiant]
                    );
                } else
                {
                    await query(
                        `
            UPDATE etudiant 
            SET streak_count = ?, last_present_date = ?
            WHERE id_etudiant = ?
            `,
                        [currentStreak, dateSeance, id_etudiant]
                    );
                }

                successes.push({ id_etudiant });
            } catch (err)
            {
                errors.push({ id_etudiant, error: err.message });
            }
        }

        return res.json({
            success: true,
            message: "Présences traitées",
            data: { successes, errors },
        });
    } catch (error)
    {
        console.error("Erreur marquer présences masse:", error);
        return res.status(500).json({
            success: false,
            message: "Erreur serveur",
            error: error.message,
        });
    }
};

// ===============================
// GET /api/presences/seance/:id_seance
// ===============================
export const getPresencesSeance = async (req, res) =>
{
    try
    {
        const { id_seance } = req.params;
        const rows = await query(
            `
      SELECT 
        p.*,
        e.matricule,
        u.prenom,
        u.nom
      FROM presence p
      JOIN etudiant e ON p.id_etudiant = e.id_etudiant
      JOIN utilisateur u ON e.id_utilisateur = u.id_utilisateur
      WHERE p.id_seance = ?
      ORDER BY p.created_at ASC
      `,
            [id_seance]
        );

        return res.json({ success: true, data: rows });
    } catch (error)
    {
        return res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
};

// ===============================
// GET /api/presences/etudiant/:id
// ===============================
export const getPresencesEtudiant = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const rows = await query(
            `
      SELECT p.*, s.date_seance, s.heure_debut, s.heure_fin
      FROM presence p
      JOIN seance s ON p.id_seance = s.id_seance
      WHERE p.id_etudiant = ?
      ORDER BY s.date_seance DESC
      `,
            [id]
        );

        return res.json({ success: true, data: rows });
    } catch (error)
    {
        return res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
};

// ===============================
// GET /api/presences/leaderboard
// ===============================
export const getLeaderboard = async (req, res) =>
{
    try
    {
        // Récupérer les 10 meilleurs etudiants avec leur streak
        const top = await redisClient.zRangeWithScores("leaderboard:streaks", 0, 9, { REV: true });
        return res.json({ success: true, data: top });
    } catch (error)
    {
        return res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
};

// ===============================
// GET /api/presences/streak/:id
// ===============================
export const getStreak = async (req, res) =>
{
    try
    {
        // Récupérer le streak de l'etudiant avec id
        const { id } = req.params;
        const streak = await redisClient.get(`streak:${id}`);
        return res.json({ success: true, data: { id_etudiant: id, streak: parseInt(streak || "0", 10) } });
    } catch (error)
    {
        return res.status(500).json({ success: false, message: "Erreur serveur", error: error.message });
    }
};
