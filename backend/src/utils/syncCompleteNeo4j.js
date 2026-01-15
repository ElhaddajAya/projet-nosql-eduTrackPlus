import { query } from '../config/mysql.js';
import { getSession } from '../config/neo4j.js';

/**
 * ⭐ SYNCHRONISATION COMPLÈTE MYSQL → NEO4J
 * À exécuter au démarrage ou via endpoint /api/admin/sync-neo4j
 */
export const syncCompleteNeo4j = async () =>
{
  console.log('🔷 === SYNCHRONISATION COMPLÈTE NEO4J ===');
  const session = getSession();

  try
  {
    // ========================================
    // 1. NETTOYAGE COMPLET
    // ========================================
    console.log('🧹 Nettoyage de la base Neo4j...');
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('✅ Base nettoyée');

    // ========================================
    // 2. CONTRAINTES
    // ========================================
    console.log('🔒 Création des contraintes...');

    const constraints = [
      'CREATE CONSTRAINT enseignant_id IF NOT EXISTS FOR (e:Enseignant) REQUIRE e.id_enseignant IS UNIQUE',
      'CREATE CONSTRAINT seance_id IF NOT EXISTS FOR (s:Seance) REQUIRE s.id_seance IS UNIQUE',
      'CREATE CONSTRAINT salle_id IF NOT EXISTS FOR (s:Salle) REQUIRE s.id_salle IS UNIQUE',
      'CREATE CONSTRAINT creneau_id IF NOT EXISTS FOR (c:Creneau) REQUIRE c.id_creneau IS UNIQUE',
      'CREATE CONSTRAINT classe_id IF NOT EXISTS FOR (c:Classe) REQUIRE c.id_classe IS UNIQUE',
      'CREATE CONSTRAINT cours_id IF NOT EXISTS FOR (c:Cours) REQUIRE c.id_cours IS UNIQUE',
    ];

    for (const constraint of constraints)
    {
      try
      {
        await session.run(constraint);
      } catch (e)
      {
        // Ignore si contrainte existe déjà
      }
    }
    console.log('✅ Contraintes créées');

    // ========================================
    // 3. ENSEIGNANTS
    // ========================================
    console.log('👨‍🏫 Synchronisation des enseignants...');
    const enseignants = await query(`
      SELECT e.id_enseignant, CONCAT(u.prenom, ' ', u.nom) AS nom, e.specialite, e.type_contrat
      FROM Enseignant e
      JOIN Utilisateur u ON e.id_utilisateur = u.id_utilisateur
    `);

    for (const e of enseignants)
    {
      await session.run(`
        MERGE (ens:Enseignant {id_enseignant: $id})
        SET ens.nom = $nom, ens.specialite = $specialite, ens.type_contrat = $type
      `, {
        id: Number(e.id_enseignant),
        nom: e.nom || 'Inconnu',
        specialite: e.specialite || 'Non spécifiée',
        type: e.type_contrat || 'titulaire'
      });
    }
    console.log(`✅ ${enseignants.length} enseignants synchronisés`);

    // ========================================
    // 4. CLASSES
    // ========================================
    console.log('🎓 Synchronisation des classes...');
    const classes = await query(`
      SELECT id_classe, nom_classe, niveau
      FROM Classe
    `);

    for (const c of classes)
    {
      await session.run(`
        MERGE (cl:Classe {id_classe: $id})
        SET cl.nom_classe = $nom, cl.niveau = $niveau
      `, {
        id: Number(c.id_classe),
        nom: c.nom_classe,
        niveau: c.niveau
      });
    }
    console.log(`✅ ${classes.length} classes synchronisées`);

    // ========================================
    // 5. COURS
    // ========================================
    console.log('📚 Synchronisation des cours...');
    const cours = await query(`
      SELECT c.id_cours, c.id_classe, c.id_matiere, c.id_enseignant_titulaire, m.nom_matiere
      FROM Cours c
      JOIN Matiere m ON c.id_matiere = m.id_matiere
    `);

    for (const c of cours)
    {
      await session.run(`
        MERGE (co:Cours {id_cours: $id})
        SET co.nom_matiere = $matiere
      `, {
        id: Number(c.id_cours),
        matiere: c.nom_matiere
      });
    }
    console.log(`✅ ${cours.length} cours synchronisés`);

    // ========================================
    // 6. RELATIONS COURS
    // ========================================
    console.log('🔗 Création relations cours...');
    for (const c of cours)
    {
      // ENSEIGNE (Enseignant -> Cours)
      await session.run(`
        MATCH (e:Enseignant {id_enseignant: $ens_id})
        MATCH (co:Cours {id_cours: $cours_id})
        MERGE (e)-[:ENSEIGNE]->(co)
      `, {
        ens_id: Number(c.id_enseignant_titulaire),
        cours_id: Number(c.id_cours)
      });

      // ASSIGNED_TO (Cours -> Classe)
      await session.run(`
        MATCH (co:Cours {id_cours: $cours_id})
        MATCH (cl:Classe {id_classe: $classe_id})
        MERGE (co)-[:ASSIGNED_TO]->(cl)
      `, {
        cours_id: Number(c.id_cours),
        classe_id: Number(c.id_classe)
      });
    }
    console.log('✅ Relations cours créées');

    // ========================================
    // 7. SALLES
    // ========================================
    console.log('🏢 Synchronisation des salles...');
    const salles = await query(`
      SELECT DISTINCT id_salle FROM Seance
    `);

    for (const s of salles)
    {
      await session.run(`
        MERGE (sa:Salle {id_salle: $id})
        SET sa.nom = $id
      `, {
        id: String(s.id_salle)
      });
    }
    console.log(`✅ ${salles.length} salles synchronisées`);

    // ========================================
    // 8. CRÉNEAUX
    // ========================================
    console.log('⏰ Synchronisation des créneaux...');
    const seances = await query(`
      SELECT DISTINCT heure_debut, heure_fin FROM Seance
    `);

    const creneaux = new Set();
    for (const s of seances)
    {
      const debut = s.heure_debut.slice(0, 5).replace(':', 'h');
      const fin = s.heure_fin.slice(0, 5).replace(':', 'h');
      const id = `${debut}_${fin}`;
      creneaux.add(JSON.stringify({ id, debut: s.heure_debut, fin: s.heure_fin }));
    }

    for (const c of creneaux)
    {
      const { id, debut, fin } = JSON.parse(c);
      await session.run(`
        MERGE (cr:Creneau {id_creneau: $id})
        SET cr.heure_debut = $debut, cr.heure_fin = $fin
      `, { id, debut, fin });
    }
    console.log(`✅ ${creneaux.size} créneaux synchronisés`);

    // ========================================
    // 9. SÉANCES
    // ========================================
    console.log('📅 Synchronisation des séances...');
    const allSeances = await query(`
      SELECT s.id_seance, s.id_cours, s.date_seance, s.heure_debut, s.heure_fin, 
             s.id_salle, s.statut, s.id_enseignant_effectif
      FROM Seance s
    `);

    for (const s of allSeances)
    {
      const dateStr = s.date_seance.toISOString().split('T')[0];
      const debut = s.heure_debut.slice(0, 5).replace(':', 'h');
      const fin = s.heure_fin.slice(0, 5).replace(':', 'h');
      const creneauId = `${debut}_${fin}`;

      // Créer séance
      await session.run(`
        MERGE (se:Seance {id_seance: $id})
        SET se.date = $date, se.heure_debut = $debut, se.heure_fin = $fin, se.statut = $statut
      `, {
        id: Number(s.id_seance),
        date: dateStr,
        debut: s.heure_debut,
        fin: s.heure_fin,
        statut: s.statut || 'prevue'
      });

      // Relations
      await session.run(`
        MATCH (se:Seance {id_seance: $seance_id})
        MATCH (sa:Salle {id_salle: $salle_id})
        MATCH (cr:Creneau {id_creneau: $creneau_id})
        MATCH (co:Cours {id_cours: $cours_id})
        MATCH (e:Enseignant {id_enseignant: $ens_id})
        MERGE (se)-[:IN_ROOM]->(sa)
        MERGE (se)-[:SCHEDULED_AT]->(cr)
        MERGE (se)-[:FOR_COURSE]->(co)
        MERGE (e)-[:TEACHES]->(se)
      `, {
        seance_id: Number(s.id_seance),
        salle_id: String(s.id_salle),
        creneau_id: creneauId,
        cours_id: Number(s.id_cours),
        ens_id: Number(s.id_enseignant_effectif)
      });
    }
    console.log(`✅ ${allSeances.length} séances synchronisées`);

    // ========================================
    // ⭐ 10. RELATIONS DE REMPLACEMENT
    // ========================================
    console.log('🔄 Synchronisation des remplacements...');
    const remplacements = await query(`
      SELECT 
        r.id_remplacement,
        r.id_seance,
        r.id_enseignant_absent,
        r.id_enseignant_remplacant,
        r.date_absence,
        r.statut
      FROM Remplacement r
      WHERE r.statut = 'accepte' AND r.id_enseignant_remplacant IS NOT NULL
    `);

    for (const r of remplacements)
    {
      try
      {
        const dateStr = r.date_absence.toISOString().split('T')[0];

        await session.run(`
          MATCH (remplacant:Enseignant {id_enseignant: $remplacant_id})
          MATCH (absent:Enseignant {id_enseignant: $absent_id})
          MATCH (seance:Seance {id_seance: $seance_id})
          MERGE (remplacant)-[:REPLACES {date: $date, id_remplacement: $remp_id}]->(absent)
          MERGE (remplacant)-[:TEACHES_TEMP]->(seance)
        `, {
          remplacant_id: Number(r.id_enseignant_remplacant),
          absent_id: Number(r.id_enseignant_absent),
          seance_id: Number(r.id_seance),
          date: dateStr,
          remp_id: Number(r.id_remplacement)
        });

        console.log(`  ✅ Remplacement ${r.id_remplacement} : Prof ${r.id_enseignant_remplacant} → Prof ${r.id_enseignant_absent}`);
      } catch (err)
      {
        console.error(`  ❌ Erreur remplacement ${r.id_remplacement}:`, err.message);
      }
    }
    console.log(`✅ ${remplacements.length} remplacements synchronisés`);

    // ========================================
    // 11. VÉRIFICATION
    // ========================================
    console.log('🔍 Vérification finale...');
    const stats = await session.run(`
      MATCH (e:Enseignant) WITH count(e) as enseignants
      MATCH (s:Seance) WITH enseignants, count(s) as seances
      MATCH (sa:Salle) WITH enseignants, seances, count(sa) as salles
      MATCH (c:Creneau) WITH enseignants, seances, salles, count(c) as creneaux
      MATCH (cl:Classe) WITH enseignants, seances, salles, creneaux, count(cl) as classes
      MATCH (co:Cours) WITH enseignants, seances, salles, creneaux, classes, count(co) as cours
      OPTIONAL MATCH ()-[r:REPLACES]->() WITH enseignants, seances, salles, creneaux, classes, cours, count(r) as remplacements
      RETURN enseignants, seances, salles, creneaux, classes, cours, remplacements
    `);

    const record = stats.records[0];
    console.log('📊 Statistiques Neo4j :');
    console.log(`  - Enseignants: ${record.get('enseignants')}`);
    console.log(`  - Séances: ${record.get('seances')}`);
    console.log(`  - Salles: ${record.get('salles')}`);
    console.log(`  - Créneaux: ${record.get('creneaux')}`);
    console.log(`  - Classes: ${record.get('classes')}`);
    console.log(`  - Cours: ${record.get('cours')}`);
    console.log(`  - Remplacements: ${record.get('remplacements')}`);

    console.log('✅ Synchronisation complète terminée !');
    return true;

  } catch (error)
  {
    console.error('❌ Erreur synchronisation Neo4j:', error);
    throw error;
  } finally
  {
    await session.close();
  }
};
