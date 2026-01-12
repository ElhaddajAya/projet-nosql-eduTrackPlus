import { query } from '../config/mysql.js';
import { redisClient } from '../config/redis.js';
import Notification from '../models/Notification.js';

export const getStatsAdmin = async (req, res) =>
{
    try
    {
        // Statistiques générales
        const stats = {
            utilisateurs: await query('SELECT COUNT(*) as total FROM Utilisateur'),
            etudiants: await query('SELECT COUNT(*) as total FROM Etudiant'),
            enseignants: await query('SELECT COUNT(*) as total FROM Enseignant'),
            classes: await query('SELECT COUNT(*) as total FROM Classe'),
            matieres: await query('SELECT COUNT(*) as total FROM Matiere'),
            seances_aujourdhui: await query('SELECT COUNT(*) as total FROM Seance WHERE date_seance = CURDATE()'),
            absences_aujourdhui: await query('SELECT COUNT(*) as total FROM Presence WHERE statut = "absent" AND id_seance IN (SELECT id_seance FROM Seance WHERE date_seance = CURDATE())'),
            remplacements_attente: await query('SELECT COUNT(*) as total FROM Remplacement WHERE statut = "demande"')
        };

        // Top 5 étudiants avec le meilleur taux de présence
        const topPresence = await query(`
      SELECT e.id_etudiant, u.prenom, u.nom, e.streak_count, e.bonus_gagnes,
             COUNT(p.id_presence) as total_presences,
             SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) as presences,
             ROUND(SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) * 100.0 / COUNT(p.id_presence), 2) as taux
      FROM Etudiant e
      JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Presence p ON e.id_etudiant = p.id_etudiant
      GROUP BY e.id_etudiant
      ORDER BY taux DESC
      LIMIT 5
    `);

        // Classes avec le plus d'absences
        const classesAbsences = await query(`
      SELECT c.nom_classe, COUNT(*) as absences
      FROM Presence p
      JOIN Seance s ON p.id_seance = s.id_seance
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Classe c ON co.id_classe = c.id_classe
      WHERE p.statut = 'absent'
      GROUP BY c.id_classe
      ORDER BY absences DESC
      LIMIT 5
    `);

        res.json({
            success: true,
            data: {
                stats: {
                    total_utilisateurs: stats.utilisateurs[0].total,
                    total_etudiants: stats.etudiants[0].total,
                    total_enseignants: stats.enseignants[0].total,
                    total_classes: stats.classes[0].total,
                    total_matieres: stats.matieres[0].total,
                    seances_aujourdhui: stats.seances_aujourdhui[0].total,
                    absences_aujourdhui: stats.absences_aujourdhui[0].total,
                    remplacements_attente: stats.remplacements_attente[0].total
                },
                top_presence: topPresence,
                classes_absences: classesAbsences
            }
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getStatsEtudiant = async (req, res) =>
{
    try
    {
        const id_etudiant = req.user.role === 'student'
            ? (await query('SELECT id_etudiant FROM Etudiant WHERE id_utilisateur = ?', [req.user.id_utilisateur]))[0].id_etudiant
            : req.params.id;

        // Statistiques de présence
        const presences = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
        SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards
      FROM Presence WHERE id_etudiant = ?
    `, [id_etudiant]);

        const taux_presence = presences[0].total > 0
            ? ((presences[0].presents / presences[0].total) * 100).toFixed(2)
            : 0;

        // Streak
        const streak = parseInt(await redisClient.get(`streak:${id_etudiant}`)) || 0;

        // Bonus
        const etudiant = await query('SELECT bonus_gagnes FROM Etudiant WHERE id_etudiant = ?', [id_etudiant]);
        const bonus = etudiant[0]?.bonus_gagnes || 0;

        // Moyennes par semestre
        const moyennes = await query(`
      SELECT 
        n.semestre,
        SUM(n.note * m.coefficient) / SUM(m.coefficient) as moyenne
      FROM Note n
      JOIN Matiere m ON n.id_matiere = m.id_matiere
      WHERE n.id_etudiant = ?
      GROUP BY n.semestre
    `, [id_etudiant]);

        // Notifications non lues
        const notifs_non_lues = await Notification.countDocuments({
            id_utilisateur: req.user.id_utilisateur,
            lu: false
        });

        res.json({
            success: true,
            data: {
                presence: {
                    total: presences[0].total,
                    presents: presences[0].presents,
                    absents: presences[0].absents,
                    retards: presences[0].retards,
                    taux_presence: parseFloat(taux_presence)
                },
                streak: {
                    actuel: streak,
                    bonus_gagnes: bonus,
                    jours_avant_bonus: streak > 0 ? 5 - (streak % 5) : 5
                },
                moyennes: moyennes.map(m => ({
                    semestre: m.semestre,
                    moyenne: parseFloat(m.moyenne).toFixed(2)
                })),
                notifications_non_lues: notifs_non_lues
            }
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getStatsEnseignant = async (req, res) =>
{
    try
    {
        const id_enseignant = req.user.role === 'teacher'
            ? (await query('SELECT id_enseignant FROM Enseignant WHERE id_utilisateur = ?', [req.user.id_utilisateur]))[0].id_enseignant
            : req.params.id;

        // Nombre de cours
        const cours = await query('SELECT COUNT(*) as total FROM Cours WHERE id_enseignant_titulaire = ?', [id_enseignant]);

        // Séances à venir
        const seances_avenir = await query(`
      SELECT COUNT(*) as total FROM Seance 
      WHERE id_enseignant_effectif = ? AND date_seance >= CURDATE()
    `, [id_enseignant]);

        // Remplacements
        const remplacements = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'demande' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut = 'accepte' THEN 1 ELSE 0 END) as acceptes
      FROM Remplacement 
      WHERE id_enseignant_absent = ? OR id_enseignant_remplacant = ?
    `, [id_enseignant, id_enseignant]);

        // Taux de présence des étudiants dans ses cours
        const tauxPresence = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) as presents
      FROM Presence p
      JOIN Seance s ON p.id_seance = s.id_seance
      WHERE s.id_enseignant_effectif = ?
    `, [id_enseignant]);

        const taux = tauxPresence[0].total > 0
            ? ((tauxPresence[0].presents / tauxPresence[0].total) * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                cours_total: cours[0].total,
                seances_avenir: seances_avenir[0].total,
                remplacements: {
                    total: remplacements[0].total,
                    en_attente: remplacements[0].en_attente,
                    acceptes: remplacements[0].acceptes
                },
                taux_presence_etudiants: parseFloat(taux)
            }
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};