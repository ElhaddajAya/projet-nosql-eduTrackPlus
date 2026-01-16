import { query } from '../config/mysql.js';
import { getSession } from '../config/neo4j.js';
import Notification from '../models/Notification.js';


/**
 * 1️⃣ Déclarer une absence (création d'une demande)
 * ✨ NOUVEAU : Marque TOUTES les séances du jour comme "annulées"
 * ✨ NOUVEAU : Envoie notification à l'admin
 */
export const demanderRemplacement = async (req, res) =>
{
    try
    {
        const { date_absence, raison } = req.body;
        const id_utilisateur = req.user?.id_utilisateur;

        if (!date_absence || !raison)
        {
            return res.status(400).json({
                success: false,
                message: 'Date et raison obligatoires'
            });
        }

        // 1. Récupérer id_enseignant
        const enseignantRows = await query(
            'SELECT id_enseignant FROM Enseignant WHERE id_utilisateur = ?',
            [id_utilisateur]
        );

        if (enseignantRows.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Profil enseignant non trouvé'
            });
        }

        const id_enseignant_absent = enseignantRows[0].id_enseignant;

        // 2. Trouver TOUTES les séances de ce prof ce jour-là
        const seances = await query(
            `SELECT s.id_seance, s.id_cours, c.nom_classe, m.nom_matiere, s.heure_debut, s.heure_fin
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE s.id_enseignant_effectif = ?
       AND DATE(s.date_seance) = ?
       AND s.statut = 'prevue'`,
            [id_enseignant_absent, date_absence]
        );

        if (seances.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Aucune séance trouvée pour cette date'
            });
        }

        // 3. ⭐ Marquer toutes les séances comme "annulées"
        for (const seance of seances)
        {
            await query(
                `UPDATE Seance 
         SET statut = 'annulee', code_couleur = 'rouge' 
         WHERE id_seance = ?`,
                [seance.id_seance]
            );

            // Créer demande de remplacement pour chaque séance
            await query(
                `INSERT INTO Remplacement
         (id_seance, id_enseignant_absent, date_absence, raison, statut, demande_par)
         VALUES (?, ?, ?, ?, 'demande', ?)`,
                [seance.id_seance, id_enseignant_absent, date_absence, raison, id_utilisateur]
            );
        }

        // 4. ⭐ Récupérer nom du prof
        const profRows = await query(
            `SELECT CONCAT(u.prenom, ' ', u.nom) AS nom 
       FROM Enseignant e
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE e.id_enseignant = ?`,
            [id_enseignant_absent]
        );

        const nomProf = profRows[0]?.nom || 'Un enseignant';

        // 5. ⭐ Notifier TOUS les admins
        const admins = await query(
            `SELECT u.id_utilisateur 
       FROM Utilisateur u 
       WHERE u.role = 'admin'`
        );

        const seancesList = seances.map(s =>
            `${s.heure_debut.slice(0, 5)} - ${s.nom_matiere} (${s.nom_classe})`
        ).join(', ');

        for (const admin of admins)
        {
            await Notification.create({
                id_utilisateur: admin.id_utilisateur,
                type: 'absence',
                titre: `Absence enseignant - ${date_absence}`,
                message: `${nomProf} a déclaré une absence pour le ${date_absence}. ${seances.length} séance(s) concernée(s) : ${seancesList}. Motif : ${raison}`,
                lien: `/admin/remplacements`,
                metadata: {
                    id_enseignant_absent,
                    date_absence,
                    nb_seances: seances.length,
                    seances: seances.map(s => s.id_seance)
                }
            });
        }

        // 6. Notifier le prof de confirmation
        await Notification.create({
            id_utilisateur: id_utilisateur,
            type: 'absence',
            titre: 'Absence enregistrée',
            message: `Votre absence du ${date_absence} a été enregistrée. ${seances.length} séance(s) marquée(s) comme annulée(s). L'administration va chercher des remplaçants.`,
            metadata: {
                date_absence,
                nb_seances: seances.length
            }
        });

        res.status(201).json({
            success: true,
            message: `Absence déclarée. ${seances.length} séance(s) annulée(s).`,
            data: {
                nb_seances: seances.length,
                seances: seances.map(s => ({
                    id_seance: s.id_seance,
                    matiere: s.nom_matiere,
                    classe: s.nom_classe,
                    horaire: `${s.heure_debut} - ${s.heure_fin}`
                }))
            }
        });

    } catch (error)
    {
        console.error('❌ Erreur demanderRemplacement:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * 2️⃣ Calcul des enseignants disponibles (Neo4j = intelligence)
 * ✨ AMÉLIORÉ : Cherche profs même matière + créneaux libres
 */
export const getEnseignantsDisponibles = async (req, res) =>
{
    try
    {
        const { seance_id } = req.params;

        // 1. Récupérer infos de la séance
        const seanceRows = await query(
            `SELECT s.date_seance, s.heure_debut, s.heure_fin, 
              co.id_matiere, m.nom_matiere
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE s.id_seance = ?`,
            [seance_id]
        );

        if (seanceRows.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Séance non trouvée'
            });
        }

        const { date_seance, heure_debut, heure_fin, id_matiere, nom_matiere } = seanceRows[0];
        const dateStr = date_seance.toISOString().split('T')[0];

        // 2. Trouver tous les enseignants de cette matière
        const enseignantsMatiere = await query(
            `SELECT DISTINCT e.id_enseignant, 
              CONCAT(u.prenom, ' ', u.nom) AS nom,
              e.type_contrat, e.specialite
       FROM Enseignant e
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       JOIN Cours c ON e.id_enseignant = c.id_enseignant_titulaire
       WHERE c.id_matiere = ?`,
            [id_matiere]
        );

        // 3. Vérifier qui est LIBRE à ce créneau
        const disponibles = [];

        for (const ens of enseignantsMatiere)
        {
            const conflits = await query(
                `SELECT COUNT(*) as count
         FROM Seance s
         WHERE s.id_enseignant_effectif = ?
         AND DATE(s.date_seance) = ?
         AND s.statut NOT IN ('annulee', 'reportee')
         AND (
           (s.heure_debut < ? AND s.heure_fin > ?) OR
           (s.heure_debut < ? AND s.heure_fin > ?) OR
           (s.heure_debut >= ? AND s.heure_fin <= ?)
         )`,
                [ens.id_enseignant, dateStr, heure_fin, heure_debut, heure_fin, heure_debut, heure_debut, heure_fin]
            );

            if (conflits[0].count === 0)
            {
                disponibles.push({
                    id_enseignant: ens.id_enseignant,
                    nom: ens.nom,
                    type_contrat: ens.type_contrat,
                    specialite: ens.specialite,
                    matiere_enseignee: nom_matiere
                });
            }
        }

        res.json({
            success: true,
            count: disponibles.length,
            data: disponibles,
            seance_info: {
                date: dateStr,
                horaire: `${heure_debut.slice(0, 5)} - ${heure_fin.slice(0, 5)}`,
                matiere: nom_matiere
            }
        });

    } catch (error)
    {
        console.error('❌ Erreur getEnseignantsDisponibles:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * 3️⃣ Acceptation du remplacement (IDENTIQUE - déjà bon)
 */
export const accepterRemplacement = async (req, res) =>
{
    const { id } = req.params;
    const { id_enseignant_remplacant } = req.body;

    try
    {
        // 1. Vérifier la demande
        const demande = await query(
            `SELECT * FROM remplacement 
       WHERE id_remplacement = ? AND statut = 'demande'`,
            [id]
        );

        if (demande.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée ou déjà traitée'
            });
        }

        const demandeData = demande[0];

        // 2. Vérifier le remplaçant
        const remplacant = await query(
            `SELECT id_enseignant FROM Enseignant WHERE id_enseignant = ?`,
            [id_enseignant_remplacant]
        );

        if (remplacant.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Enseignant remplaçant non trouvé'
            });
        }

        const absentId = parseInt(demandeData.id_enseignant_absent);
        const remplacantId = parseInt(id_enseignant_remplacant);
        const seanceId = parseInt(demandeData.id_seance);
        const date = demandeData.date_absence.toISOString().split('T')[0];

        // 3. Mise à jour MySQL de la séance
        await query(
            `UPDATE seance 
       SET statut = 'remplacee', 
           code_couleur = 'bleu', 
           id_enseignant_effectif = ?
       WHERE id_seance = ?`,
            [id_enseignant_remplacant, demandeData.id_seance]
        );

        // 4. Mise à jour MySQL du remplacement
        await query(
            `UPDATE remplacement 
       SET id_enseignant_remplacant = ?, 
           statut = 'accepte', 
           date_reponse = NOW()
       WHERE id_remplacement = ?`,
            [id_enseignant_remplacant, id]
        );

        // 5. Synchronisation Neo4j
        const neoSession = getSession();

        try
        {
            const tx = neoSession.beginTransaction();

            try
            {
                await tx.run(
                    `MATCH (remplacant:Enseignant {id_enseignant: $remplacantId})
           MATCH (absent:Enseignant {id_enseignant: $absentId})
           MATCH (seance:Seance {id_seance: $seanceId})
           MERGE (remplacant)-[r1:REPLACES {date: $date}]->(absent)
           MERGE (remplacant)-[r2:TEACHES_TEMP]->(seance)
           RETURN remplacant, absent, seance`,
                    { remplacantId, absentId, seanceId, date }
                );

                await tx.commit();
                console.log('✅ Neo4j synchronisé');
            } catch (txError)
            {
                await tx.rollback();
                console.error('❌ Erreur transaction Neo4j:', txError.message);
            }
        } finally
        {
            await neoSession.close();
        }

        // 6. Récupérer infos pour notifications
        const remplacantInfo = await query(
            `SELECT u.id_utilisateur, CONCAT(u.prenom, ' ', u.nom) AS nom
       FROM Enseignant e
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE e.id_enseignant = ?`,
            [id_enseignant_remplacant]
        );

        const absentInfo = await query(
            `SELECT u.id_utilisateur
       FROM Enseignant e
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE e.id_enseignant = ?`,
            [demandeData.id_enseignant_absent]
        );

        const seanceInfo = await query(
            `SELECT m.nom_matiere, c.nom_classe, s.heure_debut, s.heure_fin
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       JOIN Classe c ON co.id_classe = c.id_classe
       WHERE s.id_seance = ?`,
            [seanceId]
        );

        const { nom_matiere, nom_classe, heure_debut, heure_fin } = seanceInfo[0] || {};

        // 7. Notifications
        await Notification.create({
            id_utilisateur: remplacantInfo[0].id_utilisateur,
            type: 'remplacement',
            titre: 'Nouveau remplacement assigné',
            message: `Vous avez été assigné pour remplacer le ${date} : ${nom_matiere} - ${nom_classe} (${heure_debut.slice(0, 5)}-${heure_fin.slice(0, 5)})`,
            lien: '/teacher/schedule',
            metadata: { id_seance: seanceId, date, matiere: nom_matiere }
        });

        await Notification.create({
            id_utilisateur: absentInfo[0].id_utilisateur,
            type: 'remplacement',
            titre: 'Remplaçant trouvé',
            message: `${remplacantInfo[0].nom} va assurer votre cours du ${date} : ${nom_matiere} - ${nom_classe}`,
            metadata: { id_seance: seanceId }
        });

        res.json({
            success: true,
            message: 'Remplacement accepté et séance mise à jour.'
        });

    } catch (error)
    {
        console.error('❌ Erreur accepterRemplacement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
};

/**
 * 4️⃣ Liste des demandes en attente (IDENTIQUE - déjà bon)
 */
export const getRemplacementsEnAttente = async (req, res) =>
{
    try
    {
        const demandes = await query(
            `SELECT r.*, 
              s.date_seance, s.heure_debut, s.heure_fin, s.id_salle,
              m.nom_matiere, c.nom_classe,
              u.prenom AS absent_prenom, u.nom AS absent_nom
       FROM Remplacement r
       JOIN Seance s ON r.id_seance = s.id_seance
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Enseignant e ON r.id_enseignant_absent = e.id_enseignant
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE r.statut = 'demande'
       ORDER BY r.date_demande DESC`
        );

        res.json({ success: true, count: demandes.length, data: demandes });

    } catch (error)
    {
        console.error('❌ Erreur getRemplacementsEnAttente:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

/**
 * 5️⃣ ⭐ NOUVEAU : Historique des absences d'un enseignant
 * GET /api/remplacements/historique/:id_enseignant
 */
export const getHistoriqueAbsences = async (req, res) =>
{
    try
    {
        const { id_enseignant } = req.params;

        // Compter les séances par demande
        const historique = await query(
            `SELECT 
        r.id_remplacement,
        r.date_absence,
        r.raison,
        r.statut,
        r.date_demande,
        COUNT(DISTINCT r2.id_seance) as nb_seances
       FROM Remplacement r
       LEFT JOIN Remplacement r2 ON r.id_enseignant_absent = r2.id_enseignant_absent 
                                 AND DATE(r.date_absence) = DATE(r2.date_absence)
       WHERE r.id_enseignant_absent = ?
       GROUP BY r.id_remplacement
       ORDER BY r.date_demande DESC
       LIMIT 10`,
            [id_enseignant]
        );

        res.json({ success: true, data: historique });

    } catch (error)
    {
        console.error('❌ Erreur getHistoriqueAbsences:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};