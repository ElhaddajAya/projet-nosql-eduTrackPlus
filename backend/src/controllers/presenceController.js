import { query } from '../config/mysql.js';
import { redisClient } from '../config/redis.js';

export const marquerPresence = async (req, res) =>
{
    try
    {
        const { id_etudiant, id_seance, statut } = req.body;

        if (!id_etudiant || !id_seance || !statut)
        {
            return res.status(400).json({ success: false, message: 'Champs manquants' });
        }

        const streakKey = `streak:${id_etudiant}`;
        const lastPresentKey = `last_present:${id_etudiant}`;

        let currentStreak = parseInt(await redisClient.get(streakKey)) || 0;
        const lastPresent = await redisClient.get(lastPresentKey);

        const seance = await query('SELECT date_seance FROM Seance WHERE id_seance = ?', [id_seance]);
        const dateSeance = seance[0].date_seance;

        let message = '';
        let nouveauBonus = 0;

        if (statut === 'present')
        {
            if (lastPresent)
            {
                const lastDate = new Date(lastPresent);
                const currentDate = new Date(dateSeance);
                const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

                if (diffDays === 1)
                {
                    currentStreak++;
                    if (currentStreak % 5 === 0)
                    {
                        nouveauBonus = 1;
                        message = `🎉 ${currentStreak} jours ! +${nouveauBonus}% bonus !`;
                    } else
                    {
                        message = `✅ Streak: ${currentStreak} jours`;
                    }
                } else if (diffDays > 1)
                {
                    currentStreak = 1;
                    message = `✅ Nouveau streak: 1 jour`;
                }
            } else
            {
                currentStreak = 1;
                message = `✅ Streak commencé: 1 jour`;
            }

            await redisClient.set(streakKey, currentStreak.toString());
            await redisClient.set(lastPresentKey, dateSeance.toISOString().split('T')[0]);
            await redisClient.zAdd('leaderboard:streaks', { score: currentStreak, value: id_etudiant.toString() });

        } else if (statut === 'absent')
        {
            currentStreak = 0;
            await redisClient.set(streakKey, '0');
            message = `⚠️ Absence. Streak réinitialisé.`;
        } else
        {
            message = `⏰ Retard enregistré`;
        }

        if (nouveauBonus > 0)
        {
            await query(
                'UPDATE Etudiant SET streak_count = ?, bonus_gagnes = bonus_gagnes + ? WHERE id_etudiant = ?',
                [currentStreak, nouveauBonus, id_etudiant]
            );
        } else
        {
            await query(
                'UPDATE Etudiant SET streak_count = ? WHERE id_etudiant = ?',
                [currentStreak, id_etudiant]
            );
        }

        const existante = await query(
            'SELECT * FROM Presence WHERE id_etudiant = ? AND id_seance = ?',
            [id_etudiant, id_seance]
        );

        if (existante.length > 0)
        {
            await query('UPDATE Presence SET statut = ? WHERE id_presence = ?', [statut, existante[0].id_presence]);
        } else
        {
            await query('INSERT INTO Presence (id_etudiant, id_seance, statut) VALUES (?, ?, ?)', [id_etudiant, id_seance, statut]);
        }

        res.json({ success: true, message, data: { streak: currentStreak, bonus: nouveauBonus } });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getPresencesEtudiant = async (req, res) =>
{
    try
    {
        const presences = await query(
            `SELECT p.*, s.date_seance, m.nom_matiere
       FROM Presence p
       JOIN Seance s ON p.id_seance = s.id_seance
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE p.id_etudiant = ?
       ORDER BY s.date_seance DESC`,
            [req.params.id]
        );

        const total = presences.length;
        const presents = presences.filter(p => p.statut === 'present').length;

        res.json({
            success: true,
            count: total,
            statistiques: {
                total,
                presents,
                taux: total > 0 ? ((presents / total) * 100).toFixed(2) + '%' : '0%'
            },
            data: presences
        });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getLeaderboard = async (req, res) =>
{
    try
    {
        const topStreaks = await redisClient.zRangeWithScores('leaderboard:streaks', 0, 9, { REV: true });
        const leaderboard = [];

        for (const item of topStreaks)
        {
            const id_etudiant = item.value;
            const streak = item.score;

            if (streak > 0)
            {
                const etudiant = await query(
                    `SELECT e.id_etudiant, u.prenom, u.nom, e.streak_count, e.bonus_gagnes
           FROM Etudiant e
           JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
           WHERE e.id_etudiant = ?`,
                    [id_etudiant]
                );
                if (etudiant.length > 0) leaderboard.push(etudiant[0]);
            }
        }

        res.json({ success: true, data: leaderboard });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getStreak = async (req, res) =>
{
    try
    {
        const streak = parseInt(await redisClient.get(`streak:${req.params.id}`)) || 0;
        const etudiant = await query('SELECT bonus_gagnes FROM Etudiant WHERE id_etudiant = ?', [req.params.id]);

        res.json({
            success: true,
            data: {
                streak_actuel: streak,
                bonus_gagnes: etudiant[0]?.bonus_gagnes || 0,
                jours_avant_bonus: streak > 0 ? 5 - (streak % 5) : 5
            }
        });
    } catch (error)
    {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};