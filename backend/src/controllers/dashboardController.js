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

/**
 * ⭐ DASHBOARD ÉTUDIANT
 * GET /api/dashboard/student/:id
 */
export const getStudentDashboard = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // 1. Infos étudiant + classe
        const etudiantData = await query(`
      SELECT 
        e.id_etudiant,
        e.streak_count,
        e.last_present_date,
        e.bonus_gagnes,
        u.prenom,
        u.nom,
        c.nom_classe
      FROM Etudiant e
      JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Classe c ON e.id_classe = c.id_classe
      WHERE e.id_etudiant = ?
    `, [id]);

        if (etudiantData.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
        }

        const etudiant = etudiantData[0];

        // 2. Stats présences
        const presenceStats = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents,
        SUM(CASE WHEN statut = 'absent' THEN 1 ELSE 0 END) as absents,
        SUM(CASE WHEN statut = 'retard' THEN 1 ELSE 0 END) as retards
      FROM Presence
      WHERE id_etudiant = ?
    `, [id]);

        const stats = presenceStats[0];
        const tauxPresence = stats.total > 0
            ? ((stats.presents / stats.total) * 100).toFixed(1)
            : 0;

        // 3. Présences par semaine (4 dernières semaines)
        const presencesParSemaine = await query(`
      SELECT 
        WEEK(s.date_seance) as semaine,
        YEAR(s.date_seance) as annee,
        COUNT(*) as total,
        SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) as presents
      FROM Presence p
      JOIN Seance s ON p.id_seance = s.id_seance
      WHERE p.id_etudiant = ?
        AND s.date_seance >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
      GROUP BY semaine, annee
      ORDER BY annee, semaine
    `, [id]);

        // 4. Cours les plus suivis
        const coursLesPlusSuivis = await query(`
      SELECT 
        m.nom_matiere,
        COUNT(*) as total_presences,
        SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) as presents
      FROM Presence p
      JOIN Seance s ON p.id_seance = s.id_seance
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      WHERE p.id_etudiant = ?
      GROUP BY m.id_matiere, m.nom_matiere
      ORDER BY presents DESC
      LIMIT 5
    `, [id]);

        // 5. Prochains cours (cette semaine)
        const prochainesCours = await query(`
      SELECT 
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.id_salle,
        m.nom_matiere,
        CONCAT(u.prenom, ' ', u.nom) as prof_nom
      FROM Seance s
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
      JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      WHERE co.id_classe = (SELECT id_classe FROM Etudiant WHERE id_etudiant = ?)
        AND s.date_seance >= CURDATE()
        AND s.date_seance <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND s.statut NOT IN ('annulee')
      ORDER BY s.date_seance, s.heure_debut
      LIMIT 5
    `, [id]);

        res.status(200).json({
            success: true,
            data: {
                etudiant: {
                    nom: `${etudiant.prenom} ${etudiant.nom}`,
                    classe: etudiant.nom_classe,
                    streak: etudiant.streak_count,
                    bonus: parseFloat(etudiant.bonus_gagnes)
                },
                presences: {
                    total: stats.total,
                    presents: stats.presents,
                    absents: stats.absents,
                    retards: stats.retards,
                    tauxPresence: parseFloat(tauxPresence)
                },
                presencesParSemaine,
                coursLesPlusSuivis,
                prochainesCours
            }
        });

    } catch (error)
    {
        console.error('Erreur getStudentDashboard:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * ⭐ DASHBOARD ENSEIGNANT
 * GET /api/dashboard/teacher/:id
 */
export const getTeacherDashboard = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        // 1. Infos enseignant
        const enseignantData = await query(`
      SELECT 
        e.id_enseignant,
        u.prenom,
        u.nom,
        e.specialite,
        d.nom_departement
      FROM Enseignant e
      JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Departement d ON e.id_departement = d.id_departement
      WHERE e.id_enseignant = ?
    `, [id]);

        if (enseignantData.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Enseignant non trouvé' });
        }

        const enseignant = enseignantData[0];

        // 2. Nombre de cours enseignés
        const coursEnseignes = await query(`
      SELECT COUNT(DISTINCT id_cours) as total
      FROM Cours
      WHERE id_enseignant_titulaire = ?
    `, [id]);

        // 3. Séances cette semaine
        const seancesCetteSemaine = await query(`
      SELECT COUNT(*) as total
      FROM Seance s
      WHERE s.id_enseignant_effectif = ?
        AND WEEK(s.date_seance) = WEEK(CURDATE())
        AND YEAR(s.date_seance) = YEAR(CURDATE())
    `, [id]);

        // 4. Classes enseignées (distinctes)
        const classesEnseignees = await query(`
      SELECT DISTINCT c.nom_classe, c.niveau
      FROM Cours co
      JOIN Classe c ON co.id_classe = c.id_classe
      WHERE co.id_enseignant_titulaire = ?
      ORDER BY c.niveau, c.nom_classe
    `, [id]);

        // 5. Remplacements effectués
        const remplacements = await query(`
      SELECT COUNT(*) as total
      FROM Remplacement
      WHERE id_enseignant_remplacant = ?
        AND statut = 'accepte'
    `, [id]);

        // 6. Séances par statut
        const seancesParStatut = await query(`
      SELECT 
        statut,
        COUNT(*) as total
      FROM Seance
      WHERE id_enseignant_effectif = ?
      GROUP BY statut
    `, [id]);

        // 7. Taux présence moyen des étudiants dans ses cours
        const tauxPresenceMoyen = await query(`
      SELECT 
        COUNT(*) as total_presences,
        SUM(CASE WHEN p.statut = 'present' THEN 1 ELSE 0 END) as presents
      FROM Presence p
      JOIN Seance s ON p.id_seance = s.id_seance
      JOIN Cours co ON s.id_cours = co.id_cours
      WHERE co.id_enseignant_titulaire = ?
    `, [id]);

        const presenceData = tauxPresenceMoyen[0];
        const tauxPresence = presenceData.total_presences > 0
            ? ((presenceData.presents / presenceData.total_presences) * 100).toFixed(1)
            : 0;

        // 8. Prochaines séances
        const prochainesSeances = await query(`
      SELECT 
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.id_salle,
        s.statut,
        m.nom_matiere,
        c.nom_classe
      FROM Seance s
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      JOIN Classe c ON co.id_classe = c.id_classe
      WHERE s.id_enseignant_effectif = ?
        AND s.date_seance >= CURDATE()
        AND s.date_seance <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY s.date_seance, s.heure_debut
      LIMIT 5
    `, [id]);

        res.status(200).json({
            success: true,
            data: {
                enseignant: {
                    nom: `${enseignant.prenom} ${enseignant.nom}`,
                    specialite: enseignant.specialite,
                    departement: enseignant.nom_departement
                },
                stats: {
                    coursEnseignes: coursEnseignes[0].total,
                    seancesCetteSemaine: seancesCetteSemaine[0].total,
                    classesEnseignees: classesEnseignees.length,
                    remplacements: remplacements[0].total,
                    tauxPresenceMoyen: parseFloat(tauxPresence)
                },
                seancesParStatut,
                classesEnseignees,
                prochainesSeances
            }
        });

    } catch (error)
    {
        console.error('Erreur getTeacherDashboard:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};