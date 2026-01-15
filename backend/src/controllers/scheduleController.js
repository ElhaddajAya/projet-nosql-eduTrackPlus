// Import des connexions
import { runQuery, getNeo4jSession } from '../config/neo4j.js';
import { query } from '../config/mysql.js';

/**
 * Planifier une nouvelle séance
 * POST /api/emploi-temps/seances
 */
export const planifierSeance = async (req, res) =>
{
    try
    {
        console.log('🚀 DÉBUT planifierSeance');
        console.log('📥 Body reçu:', req.body);

        const {
            id_cours,
            date_seance,
            heure_debut,
            heure_fin,
            id_salle,
            id_creneau,
            id_enseignant_effectif // Optionnel
        } = req.body;

        // ========================================
        // 1. VALIDATION
        // ========================================
        if (!id_cours || !date_seance || !heure_debut || !heure_fin || !id_salle || !id_creneau)
        {
            console.log('❌ Champs manquants');
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont obligatoires (id_cours, date_seance, heure_debut, heure_fin, id_salle, id_creneau).',
            });
        }

        // ========================================
        // 2. VÉRIFIER LE COURS ET RÉCUPÉRER L'ENSEIGNANT TITULAIRE
        // ========================================
        console.log('🔍 Vérification du cours:', id_cours);

        const coursData = await query(
            `SELECT 
        co.id_enseignant_titulaire,
        co.id_classe,
        c.nom_classe,
        m.nom_matiere
       FROM Cours co
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE co.id_cours = ?`,
            [id_cours]
        );

        if (coursData.length === 0)
        {
            console.log('❌ Cours introuvable');
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé.',
            });
        }

        const cours = coursData[0];
        const id_enseignant_titulaire = cours.id_enseignant_titulaire;
        const id_classe = cours.id_classe;

        console.log('✅ Cours trouvé:', {
            id_classe,
            nom_classe: cours.nom_classe,
            nom_matiere: cours.nom_matiere,
            enseignant_titulaire: id_enseignant_titulaire
        });

        // ========================================
        // 3. VÉRIFIER CONFLITS NEO4J (Salle occupée)
        // ========================================
        console.log('🔍 Vérification des conflits Neo4j...');

        try
        {
            const conflitResult = await runQuery(
                `
        MATCH (seance:Seance)-[:IN_ROOM]->(s:Salle {id_salle: $id_salle})
        WHERE seance.date = $date
          AND seance.heure_debut = $heure_debut
        RETURN seance
        `,
                {
                    id_salle: parseInt(id_salle),
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

        // ========================================
        // 4. INSERTION MYSQL
        // ========================================
        console.log('💾 Insertion dans MySQL...');

        // Déterminer l'enseignant effectif
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
            [id_cours, date_seance, heure_debut, heure_fin, id_salle, enseignant_effectif]
        );

        const id_seance = result.insertId;
        console.log('✅ Séance insérée dans MySQL, ID:', id_seance);

        // ========================================
        // 5. CRÉATION NEO4J (Séance + Salle si nécessaire)
        // ========================================
        console.log('🔷 Synchronisation Neo4j...');

        try
        {
            const neo4jSession = getNeo4jSession('WRITE');

            // Créer le nœud Salle si n'existe pas
            await neo4jSession.run(
                `MERGE (s:Salle {id_salle: $id_salle})
         ON CREATE SET s.nom = $nom_salle
         RETURN s`,
                {
                    id_salle: parseInt(id_salle),
                    nom_salle: `Salle ${id_salle}`
                }
            );

            console.log('✅ Nœud Salle créé/trouvé');

            // Créer le nœud Créneau si n'existe pas
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

            // Créer le nœud Séance et les relations
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
                    id_salle: parseInt(id_salle),
                    id_creneau
                }
            );

            await neo4jSession.close();
            console.log('✅ Nœud Séance créé avec relations');

        } catch (neoError)
        {
            console.error('⚠️ Erreur Neo4j (non bloquante):', neoError.message);
        }

        // ========================================
        // 6. RÉCUPÉRER LA SÉANCE CRÉÉE
        // ========================================
        const seanceComplete = await query(
            `SELECT 
        s.*,
        c.nom_classe,
        m.nom_matiere,
        u.prenom as prof_prenom,
        u.nom as prof_nom
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       LEFT JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
       LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE s.id_seance = ?`,
            [id_seance]
        );

        console.log('✅ Séance récupérée:', seanceComplete[0]);
        console.log('✅ FIN planifierSeance - SUCCESS');

        res.status(201).json({
            success: true,
            message: 'Séance planifiée avec succès.',
            data: seanceComplete[0],
        });

    } catch (error)
    {
        console.error('❌ ERREUR planifierSeance:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la planification.',
            error: error.message
        });
    }
};

/**
 * Mettre à jour le statut d'une séance (avec code couleur automatique)
 * PUT /api/emploi-temps/seances/:id/statut
 */
export const updateStatutSeance = async (req, res) =>
{
    try
    {
        console.log('🔄 UPDATE statut séance:', req.params.id);

        const { id } = req.params;
        const { statut, id_enseignant_remplacant, date_report } = req.body;

        const statusValides = ['prevue', 'remplacee', 'reportee', 'annulee', 'rattrapage'];
        if (!statusValides.includes(statut))
        {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide.',
            });
        }

        // Déterminer le code couleur selon le statut
        let code_couleur;
        let id_enseignant_effectif = null;

        switch (statut)
        {
            case 'prevue':
                code_couleur = 'blanc';
                const cours = await query(
                    `SELECT co.id_enseignant_titulaire 
           FROM Seance s 
           JOIN Cours co ON s.id_cours = co.id_cours 
           WHERE s.id_seance = ?`,
                    [id]
                );
                id_enseignant_effectif = cours[0]?.id_enseignant_titulaire;
                break;
            case 'remplacee':
                code_couleur = 'bleu';
                id_enseignant_effectif = id_enseignant_remplacant;
                if (!id_enseignant_remplacant)
                {
                    return res.status(400).json({
                        success: false,
                        message: 'id_enseignant_remplacant requis pour statut "remplacee".',
                    });
                }
                break;
            case 'reportee':
                code_couleur = 'vert';
                break;
            case 'annulee':
                code_couleur = 'rouge';
                break;
            case 'rattrapage':
                code_couleur = 'violet';
                break;
        }

        // Mettre à jour MySQL
        const updates = ['statut = ?', 'code_couleur = ?'];
        const values = [statut, code_couleur];

        if (id_enseignant_effectif)
        {
            updates.push('id_enseignant_effectif = ?');
            values.push(id_enseignant_effectif);
        }

        if (date_report)
        {
            updates.push('date_report = ?');
            values.push(date_report);
        }

        values.push(id);

        await query(
            `UPDATE Seance SET ${updates.join(', ')} WHERE id_seance = ?`,
            values
        );

        // Mettre à jour Neo4j
        try
        {
            const neo4jSession = getNeo4jSession('WRITE');
            await neo4jSession.run(
                `MATCH (seance:Seance {id_seance: $id_seance})
         SET seance.statut = $statut
         RETURN seance`,
                { id_seance: parseInt(id), statut }
            );
            await neo4jSession.close();
        } catch (neoError)
        {
            console.warn('⚠️ Neo4j update failed (non-blocking)');
        }

        // Récupérer la séance mise à jour
        const seance = await query(
            `SELECT s.*, c.nom_classe, m.nom_matiere
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       WHERE s.id_seance = ?`,
            [id]
        );

        console.log('✅ Statut mis à jour');

        res.status(200).json({
            success: true,
            message: 'Statut mis à jour.',
            data: seance[0],
        });
    } catch (error)
    {
        console.error('❌ Erreur mise à jour statut:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Récupérer l'emploi du temps d'une classe
 * GET /api/emploi-temps/classe/:id
 */
export const getEmploiTempsClasse = async (req, res) =>
{
    try
    {
        const { id } = req.params;

        console.log('📅 GET emploi du temps classe:', id);

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
        m.nom_matiere,
        u.prenom as prof_prenom,
        u.nom as prof_nom
       FROM Seance s
       JOIN Cours co ON s.id_cours = co.id_cours
       JOIN Classe c ON co.id_classe = c.id_classe
       JOIN Matiere m ON co.id_matiere = m.id_matiere
       LEFT JOIN Enseignant e ON s.id_enseignant_effectif = e.id_enseignant
       LEFT JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
       WHERE c.id_classe = ?
       ORDER BY s.date_seance, s.heure_debut`,
            [id]
        );

        console.log(`✅ ${seances.length} séances trouvées pour classe ${id}`);

        res.status(200).json({
            success: true,
            count: seances.length,
            data: seances,
        });
    } catch (error)
    {
        console.error('❌ Erreur EDT classe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Récupérer l'emploi du temps d'un enseignant
 * GET /api/emploi-temps/enseignant/:id
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
            data: seances,
        });
    } catch (error)
    {
        console.error('❌ Erreur EDT enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Récupérer l'occupation d'une salle
 * GET /api/emploi-temps/salle/:id
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
        s.code_couleur,
        c.nom_classe,
        m.nom_matiere,
        u.prenom as prof_prenom,
        u.nom as prof_nom
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
            salle: id,
            count: seances.length,
            data: seances,
        });
    } catch (error)
    {
        console.error('❌ Erreur occupation salle:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};

/**
 * Trouver les salles disponibles pour un créneau donné
 * GET /api/emploi-temps/salles-disponibles
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
                message: 'id_creneau et date requis.',
            });
        }

        // Requête Neo4j pour trouver les salles disponibles
        try
        {
            const result = await runQuery(
                `MATCH (s:Salle)
         WHERE NOT EXISTS {
           MATCH (s)<-[:IN_ROOM]-(seance:Seance)
           WHERE seance.date = $date
             AND seance.heure_debut = $heure_debut
         }
         RETURN s.id_salle as id_salle, 
                s.nom as nom, 
                s.type as type, 
                s.capacite as capacite`,
                { date, heure_debut: id_creneau.split('_')[1] + ':00' },
                'READ'
            );

            const salles = result.records.map((record) => ({
                id_salle: record.get('id_salle'),
                nom: record.get('nom'),
                type: record.get('type') || 'Standard',
                capacite: record.get('capacite') ? record.get('capacite').toNumber() : 30,
            }));

            res.status(200).json({
                success: true,
                count: salles.length,
                data: salles,
            });
        } catch (neoError)
        {
            // Fallback MySQL si Neo4j indisponible
            console.warn('⚠️ Neo4j indisponible, fallback MySQL');

            const sallesOccupees = await query(
                `SELECT DISTINCT id_salle 
         FROM Seance 
         WHERE date_seance = ? 
           AND heure_debut = ?`,
                [date, id_creneau.split('_')[1] + ':00']
            );

            const idsOccupes = sallesOccupees.map(s => s.id_salle);

            // Retourner les salles de 1 à 20 sauf occupées
            const sallesDisponibles = [];
            for (let i = 1; i <= 20; i++)
            {
                if (!idsOccupes.includes(i))
                {
                    sallesDisponibles.push({
                        id_salle: i,
                        nom: `Salle ${i}`,
                        type: 'Standard',
                        capacite: 30
                    });
                }
            }

            res.status(200).json({
                success: true,
                count: sallesDisponibles.length,
                data: sallesDisponibles,
            });
        }
    } catch (error)
    {
        console.error('❌ Erreur salles disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur.',
        });
    }
};