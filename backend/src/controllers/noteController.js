import { query } from '../config/mysql.js';

export const saisirNote = async (req, res) =>
{
    try
    {
        const { id_etudiant, id_matiere, note, semestre } = req.body;

        if (!id_etudiant || !id_matiere || note === undefined || !semestre)
        {
            return res.status(400).json({ success: false, message: 'Champs manquants' });
        }

        if (note < 0 || note > 20)
        {
            return res.status(400).json({ success: false, message: 'La note doit être entre 0 et 20' });
        }

        // Vérifier si note existe déjà
        const existante = await query(
            'SELECT * FROM Note WHERE id_etudiant = ? AND id_matiere = ? AND semestre = ?',
            [id_etudiant, id_matiere, semestre]
        );

        if (existante.length > 0)
        {
            await query(
                'UPDATE Note SET note = ? WHERE id_note = ?',
                [note, existante[0].id_note]
            );

            return res.json({
                success: true,
                message: 'Note mise à jour',
                data: { id_note: existante[0].id_note, note }
            });
        }

        const result = await query(
            'INSERT INTO Note (id_etudiant, id_matiere, note, semestre) VALUES (?, ?, ?, ?)',
            [id_etudiant, id_matiere, note, semestre]
        );

        res.status(201).json({
            success: true,
            message: 'Note saisie avec succès',
            data: { id_note: result.insertId, note }
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getNotesEtudiant = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { semestre } = req.query;

        let sql = `
      SELECT n.*, m.nom_matiere, m.coefficient
      FROM Note n
      JOIN Matiere m ON n.id_matiere = m.id_matiere
      WHERE n.id_etudiant = ?
    `;

        const params = [id];

        if (semestre)
        {
            sql += ' AND n.semestre = ?';
            params.push(semestre);
        }

        sql += ' ORDER BY n.semestre, m.nom_matiere';

        const notes = await query(sql, params);

        res.json({ success: true, count: notes.length, data: notes });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getBulletin = async (req, res) =>
{
    try
    {
        const { id_etudiant, semestre } = req.params;

        // Récupérer l'étudiant
        const etudiant = await query(
            `SELECT e.*, u.prenom, u.nom FROM Etudiant e 
       JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur 
       WHERE e.id_etudiant = ?`,
            [id_etudiant]
        );

        if (etudiant.length === 0)
        {
            return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
        }

        // Récupérer les statistiques de présence
        const presences = await query(
            `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'present' THEN 1 ELSE 0 END) as presents
       FROM Presence WHERE id_etudiant = ?`,
            [id_etudiant]
        );

        const taux_presence = presences[0].total > 0
            ? ((presences[0].presents / presences[0].total) * 100).toFixed(2)
            : 0;

        const bonus_gagnes = etudiant[0].bonus_gagnes || 0;
        const streak = etudiant[0].streak_count || 0;

        // Récupérer toutes les notes du semestre
        const notes = await query(
            `SELECT n.note, m.nom_matiere, m.coefficient
       FROM Note n
       JOIN Matiere m ON n.id_matiere = m.id_matiere
       WHERE n.id_etudiant = ? AND n.semestre = ?`,
            [id_etudiant, semestre]
        );

        if (notes.length === 0)
        {
            return res.json({
                success: true,
                message: 'Aucune note pour ce semestre',
                data: {
                    etudiant: {
                        id_etudiant: etudiant[0].id_etudiant,
                        prenom: etudiant[0].prenom,
                        nom: etudiant[0].nom,
                        numero_etudiant: etudiant[0].numero_etudiant
                    },
                    semestre: parseInt(semestre),
                    notes: [],
                    moyenne_generale: 0,
                    assiduite: {
                        taux_presence: parseFloat(taux_presence),
                        streak_actuel: streak,
                        bonus_gagnes: bonus_gagnes
                    },
                    statut: 'Aucune note'
                }
            });
        }

        // Calculer moyenne générale pondérée (SANS le bonus)
        let somme_ponderee = 0;
        let somme_coefficients = 0;

        const notesAvecMatieres = notes.map(n =>
        {
            const noteValue = parseFloat(n.note);
            const coeff = parseFloat(n.coefficient);
            somme_ponderee += noteValue * coeff;
            somme_coefficients += coeff;
            return {
                matiere: n.nom_matiere,
                note: noteValue,
                coefficient: coeff
            };
        });

        // Moyenne générale (calcul des notes uniquement)
        const moyenne_generale = (somme_ponderee / somme_coefficients).toFixed(2);

        // Déterminer statut (basé sur la moyenne des notes)
        let statut;
        const moy = parseFloat(moyenne_generale);
        if (moy >= 10)
        {
            statut = 'Validé';
        } else if (moy >= 8)
        {
            statut = 'Rattrapage';
        } else
        {
            statut = 'Ajournement';
        }

        res.json({
            success: true,
            data: {
                etudiant: {
                    id_etudiant: etudiant[0].id_etudiant,
                    prenom: etudiant[0].prenom,
                    nom: etudiant[0].nom,
                    numero_etudiant: etudiant[0].numero_etudiant
                },
                semestre: parseInt(semestre),
                notes: notesAvecMatieres,
                moyenne_generale: parseFloat(moyenne_generale),
                assiduite: {
                    taux_presence: parseFloat(taux_presence),
                    streak_actuel: streak,
                    bonus_gagnes: bonus_gagnes
                },
                statut
            }
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const supprimerNote = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        await query('DELETE FROM Note WHERE id_note = ?', [id]);

        res.json({ success: true, message: 'Note supprimée' });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};