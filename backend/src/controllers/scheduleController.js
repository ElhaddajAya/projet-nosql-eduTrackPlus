import { query } from '../config/mysql.js';
import { runQuery, getNeo4jSession } from '../config/neo4j.js';

/**
 * ⭐ PLANIFIER UNE SÉANCE
 */
export const planifierSeance = async (req, res) =>
{
    try
    {
        let {
            id_cours,
            date_seance,
            heure_debut,
            heure_fin,
            id_salle,
            id_creneau,
            id_enseignant_effectif
        } = req.body;

        // Validation
        if (!id_cours || !date_seance || !heure_debut || !heure_fin || !id_salle)
        {
            return res.status(400).json({
                success: false,
                message: 'Champs manquants'
            });
        }

        // Récupérer le cours
        const coursData = await query(
            'SELECT id_enseignant_titulaire, id_classe FROM Cours WHERE id_cours = ?',
            [id_cours]
        );

        if (coursData.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        const id_enseignant_titulaire = coursData[0].id_enseignant_titulaire;
        const id_classe = coursData[0].id_classe;

        // Vérifier conflit Neo4j
        console.log('🔍 Vérification des conflits Neo4j...');

        try
        {
            const id_salle_for_neo4j = String(id_salle);

            const conflitResult = await runQuery(
                `
        MATCH (seance:Seance)-[:IN_ROOM]->(s:Salle)
        WHERE s.id_salle = $id_salle OR s.nom = $id_salle
        AND seance.date = $date
        AND seance.heure_debut = $heure_debut
        RETURN seance
        `,
                {
                    id_salle: id_salle_for_neo4j,
                    date: date_seance,
                    heure_debut
                },
                "READ"
            );

            if (conflitResult.records.length > 0)
            {
                console.log('❌ Conflit détecté');
                return res.status(409).json({
                    success: false,
                    message: 'Conflit : Cette salle est déjà occupée à ce créneau.',
                });
            }

            console.log('✅ Pas de conflit');
        } catch (neoError)
        {
            console.warn('⚠️ Neo4j non disponible, skip vérification conflit');
        }

        // Insertion MySQL
        console.log('💾 Insertion dans MySQL...');

        const enseignant_effectif = id_enseignant_effectif || id_enseignant_titulaire;

        const result = await query(
            `INSERT INTO Seance (
        id_cours, 
        date_seance, 
        heure_debut, 
        heure_fin, 
        id_salle, 
        statut, 
        code_couleur, 
        id_enseignant_effectif
      ) VALUES (?, ?, ?, ?, ?, 'prevue', 'blanc', ?)`,
            [id_cours, date_seance, heure_debut, heure_fin, String(id_salle), enseignant_effectif]
        );

        const id_seance = result.insertId;
        console.log('✅ Séance insérée dans MySQL, ID:', id_seance);

        // Synchronisation Neo4j
        console.log('🔷 Synchronisation Neo4j...');

        try
        {
            const neo4jSession = getNeo4jSession('WRITE');

            const salle_identifier = String(id_salle);

            // Créer Salle
            await neo4jSession.run(
                `MERGE (s:Salle {id_salle: $id_salle})
         ON CREATE SET s.nom = $nom_salle
         RETURN s`,
                {
                    id_salle: salle_identifier,
                    nom_salle: salle_identifier
                }
            );

            console.log('✅ Nœud Salle créé/trouvé:', salle_identifier);

            // Créer Créneau
            await neo4jSession.run(
                `MERGE (c:Creneau {id_creneau: $id_creneau})
         ON CREATE SET c.heure_debut = $heure_debut,
                       c.heure_fin = $heure_fin
         RETURN c`,
                {
                    id_creneau,
                    heure_debut,
                    heure_fin
                }
            );

            console.log('✅ Nœud Créneau créé/trouvé');

            // Créer Séance + Relations
            await neo4jSession.run(
                `MATCH (s:Salle {id_salle: $id_salle})
         MATCH (c:Creneau {id_creneau: $id_creneau})
         CREATE (seance:Seance {
           id_seance: $id_seance,
           id_cours: $id_cours,
           date: $date,
           heure_debut: $heure_debut,
           heure_fin: $heure_fin,
           statut: 'prevue'
         })
         CREATE (seance)-[:IN_ROOM]->(s)
         CREATE (seance)-[:SCHEDULED_AT]->(c)
         RETURN seance`,
                {
                    id_seance: parseInt(id_seance),
                    id_cours: parseInt(id_cours),
                    date: date_seance,
                    heure_debut,
                    heure_fin,
                    id_salle: salle_identifier,
                    id_creneau
                }
            );

            await neo4jSession.close();
            console.log('✅ Nœud Séance créé avec relations');

        } catch (neoError)
        {
            console.error('⚠️ Erreur Neo4j (non bloquante):', neoError.message);
        }

        // Réponse
        res.status(201).json({
            success: true,
            message: 'Séance planifiée avec succès',
            data: {
                id_seance,
                id_cours,
                date_seance,
                heure_debut,
                heure_fin,
                id_salle,
                id_classe,
                id_enseignant_effectif: enseignant_effectif
            }
        });

    } catch (error)
    {
        console.error('❌ Erreur planifierSeance:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la planification de la séance.'
        });
    }
};

/**
 * ⭐ METTRE À JOUR LE STATUT D'UNE SÉANCE
 * - Reportée → Créer séance de rattrapage
 * - Remplacée → Affecter nouvel enseignant
 */
export const updateStatutSeance = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const { statut, id_enseignant_remplacant, date_report, creer_seance_rattrapage } = req.body;

        if (!statut)
        {
            return res.status(400).json({
                success: false,
                message: 'Le statut est obligatoire.'
            });
        }

        // Vérifier que la séance existe
        const seanceData = await query(
            'SELECT * FROM Seance WHERE id_seance = ?',
            [id]
        );

        if (seanceData.length === 0)
        {
            return res.status(404).json({
                success: false,
                message: 'Séance non trouvée.'
            });
        }

        const seance = seanceData[0];

        // Déterminer code couleur
        const codeCouleurMap = {
            'annulee': 'rouge',
            'reportee': 'vert',
            'rattrapage': 'violet',
            'remplacee': 'bleu',
            'prevue': 'blanc'
        };

        const code_couleur = codeCouleurMap[statut] || 'blanc';

        // ⭐ CAS 1 : REMPLACÉE
        if (statut === 'remplacee' && id_enseignant_remplacant)
        {
            await query(
                `UPDATE Seance 
         SET statut = ?, 
             code_couleur = ?, 
             id_enseignant_effectif = ?
         WHERE id_seance = ?`,
                [statut, code_couleur, id_enseignant_remplacant, id]
            );
        }
        // ⭐ CAS 2 : REPORTÉE → Créer séance de rattrapage
        else if (statut === 'reportee' && date_report && creer_seance_rattrapage)
        {
            // Mettre à jour séance originale
            await query(
                `UPDATE Seance 
         SET statut = ?, 
             code_couleur = ?, 
             date_report = ?
         WHERE id_seance = ?`,
                [statut, code_couleur, date_report, id]
            );

            // ⭐ CRÉER SÉANCE DE RATTRAPAGE
            const nouveauResultat = await query(
                `INSERT INTO Seance (
          id_cours, 
          date_seance, 
          heure_debut, 
          heure_fin, 
          id_salle, 
          statut, 
          code_couleur, 
          id_enseignant_effectif,
          id_seance_origine
        ) VALUES (?, ?, ?, ?, ?, 'rattrapage', 'violet', ?, ?)`,
                [
                    seance.id_cours,
                    date_report,
                    seance.heure_debut,
                    seance.heure_fin,
                    seance.id_salle,
                    seance.id_enseignant_effectif,
                    id // ID séance originale
                ]
            );

            console.log(`✅ Séance de rattrapage créée: ${nouveauResultat.insertId}`);
        }
        // ⭐ CAS 3 : AUTRES STATUTS
        else
        {
            await query(
                `UPDATE Seance 
         SET statut = ?, 
             code_couleur = ?
         WHERE id_seance = ?`,
                [statut, code_couleur, id]
            );
        }

        res.status(200).json({
            success: true,
            message: 'Statut de la séance mis à jour avec succès.'
        });

    } catch (error)
    {
        console.error('Erreur updateStatutSeance:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour du statut.'
        });
    }
};

/**
 * ⭐ RÉCUPÉRER EMPLOI DU TEMPS D'UNE CLASSE
 * - Inclure infos remplaçant
 * - Inclure date_report
 */
export const getEmploiTempsClasse = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const seances = await query(
            `SELECT 
        s.id_seance,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.id_salle,
        s.statut,
        s.code_couleur,
        s.date_report,
        s.id_seance_origine,
        c.nom_classe,
        m.nom_matiere,
        u.prenom AS prof_prenom,
        u.nom AS prof_nom,
        ur.prenom AS remplacant_prenom,
        ur.nom AS remplacant_nom
      FROM Seance s
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Classe c ON co.id_classe = c.id_classe
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      LEFT JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
      LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      LEFT JOIN Enseignant er ON s.id_enseignant_effectif = er.id_enseignant AND s.statut = 'remplacee'
      LEFT JOIN Utilisateur ur ON er.id_utilisateur = ur.id_utilisateur
      WHERE c.id_classe = ?
      ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: seances.length,
            data: seances
        });

    } catch (error)
    {
        console.error('Erreur getEmploiTempsClasse:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.'
        });
    }
};

/**
 * ⭐ RÉCUPÉRER EMPLOI DU TEMPS D'UN ENSEIGNANT
 */
export const getEmploiTempsEnseignant = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const seances = await query(
            `SELECT 
        s.id_seance,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.id_salle,
        s.statut,
        s.code_couleur,
        c.nom_classe,
        m.nom_matiere
      FROM Seance s
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Classe c ON co.id_classe = c.id_classe
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      WHERE s.id_enseignant_effectif = ?
      ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: seances.length,
            data: seances
        });

    } catch (error)
    {
        console.error('Erreur getEmploiTempsEnseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.'
        });
    }
};

/**
 * ⭐ RÉCUPÉRER OCCUPATION D'UNE SALLE
 */
export const getOccupationSalle = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        const seances = await query(
            `SELECT 
        s.id_seance,
        s.date_seance,
        s.heure_debut,
        s.heure_fin,
        s.statut,
        c.nom_classe,
        m.nom_matiere,
        u.prenom,
        u.nom
      FROM Seance s
      JOIN Cours co ON s.id_cours = co.id_cours
      JOIN Classe c ON co.id_classe = c.id_classe
      JOIN Matiere m ON co.id_matiere = m.id_matiere
      LEFT JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
      LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
      WHERE s.id_salle = ?
      ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        res.status(200).json({
            success: true,
            count: seances.length,
            data: seances
        });

    } catch (error)
    {
        console.error('Erreur getOccupationSalle:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.'
        });
    }
};

/**
 * ⭐ TROUVER SALLES DISPONIBLES
 */
export const getSallesDisponibles = async (req, res) =>
{
    try
    {
        const { id_creneau, date } = req.query;

        if (!id_creneau || !date)
        {
            return res.status(400).json({
                success: false,
                message: 'Paramètres manquants (id_creneau, date)'
            });
        }

        const sallesOccupees = await query(
            `SELECT DISTINCT s.id_salle
       FROM Seance s
       WHERE s.date_seance = ?`,
            [date]
        );

        const idsOccupes = sallesOccupees.map(s => s.id_salle);

        const salles = await query(
            'SELECT * FROM Salle'
        );

        const sallesDisponibles = salles.filter(
            s => !idsOccupes.includes(s.id_salle)
        );

        res.status(200).json({
            success: true,
            count: sallesDisponibles.length,
            data: sallesDisponibles
        });

    } catch (error)
    {
        console.error('Erreur getSallesDisponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.'
        });
    }
};