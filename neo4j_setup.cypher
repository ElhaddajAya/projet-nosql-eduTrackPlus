// ============================================
// NEO4J SETUP POUR EDUTRACK PLUS
// ============================================

// 1️⃣ CRÉER LES CRÉNÉAUX (pour tous les jours)
CREATE (c1:Creneau {id: "LUN_08_10", label: "Lundi 08h-10h"})
CREATE (c2:Creneau {id: "LUN_10_12", label: "Lundi 10h-12h"})
CREATE (c3:Creneau {id: "LUN_14_16", label: "Lundi 14h-16h"})
CREATE (c4:Creneau {id: "LUN_16_18", label: "Lundi 16h-18h"})

CREATE (c5:Creneau {id: "MAR_08_10", label: "Mardi 08h-10h"})
CREATE (c6:Creneau {id: "MAR_10_12", label: "Mardi 10h-12h"})
CREATE (c7:Creneau {id: "MAR_14_16", label: "Mardi 14h-16h"})
CREATE (c8:Creneau {id: "MAR_16_18", label: "Mardi 16h-18h"})

CREATE (c9:Creneau {id: "MER_08_10", label: "Mercredi 08h-10h"})
CREATE (c10:Creneau {id: "MER_10_12", label: "Mercredi 10h-12h"})
CREATE (c11:Creneau {id: "MER_14_16", label: "Mercredi 14h-16h"})
CREATE (c12:Creneau {id: "MER_16_18", label: "Mercredi 16h-18h"})

CREATE (c13:Creneau {id: "JEU_08_10", label: "Jeudi 08h-10h"})
CREATE (c14:Creneau {id: "JEU_10_12", label: "Jeudi 10h-12h"})
CREATE (c15:Creneau {id: "JEU_14_16", label: "Jeudi 14h-16h"})
CREATE (c16:Creneau {id: "JEU_16_18", label: "Jeudi 16h-18h"})

CREATE (c17:Creneau {id: "VEN_08_10", label: "Vendredi 08h-10h"})
CREATE (c18:Creneau {id: "VEN_10_12", label: "Vendredi 10h-12h"})
CREATE (c19:Creneau {id: "VEN_14_16", label: "Vendredi 14h-16h"})
CREATE (c20:Creneau {id: "VEN_16_18", label: "Vendredi 16h-18h"})

CREATE (c21:Creneau {id: "SAM_08_10", label: "Samedi 08h-10h"})
CREATE (c22:Creneau {id: "SAM_10_12", label: "Samedi 10h-12h"})
CREATE (c23:Creneau {id: "SAM_14_16", label: "Samedi 14h-16h"})
CREATE (c24:Creneau {id: "SAM_16_18", label: "Samedi 16h-18h"})

CREATE (c25:Creneau {id: "DIM_08_10", label: "Dimanche 08h-10h"})
CREATE (c26:Creneau {id: "DIM_10_12", label: "Dimanche 10h-12h"})
CREATE (c27:Creneau {id: "DIM_14_16", label: "Dimanche 14h-16h"})
CREATE (c28:Creneau {id: "DIM_16_18", label: "Dimanche 16h-18h"});

// 2️⃣ CRÉER LES NŒUDS ENSEIGNANTS
CREATE (e1:Enseignant {id_enseignant: 1, nom: "Teacher Test", specialite: "Développement Web Full Stack"})
CREATE (e2:Enseignant {id_enseignant: 2, nom: "Mohammed Alami", specialite: "Intelligence Artificielle"})
CREATE (e3:Enseignant {id_enseignant: 3, nom: "Fatima Bennani", specialite: "Bases de données"});

// 3️⃣ CRÉER LES NŒUDS SÉANCES
CREATE (s1:Seance {id_seance: 1, date: "2026-01-13", statut: "prevue"})
CREATE (s2:Seance {id_seance: 2, date: "2026-01-13", statut: "annulee"})
CREATE (s3:Seance {id_seance: 3, date: "2026-01-13", statut: "remplacee"})
CREATE (s4:Seance {id_seance: 4, date: "2026-01-13", statut: "prevue"})
CREATE (s5:Seance {id_seance: 5, date: "2026-01-14", statut: "prevue"})
CREATE (s6:Seance {id_seance: 6, date: "2026-01-14", statut: "annulee"})
CREATE (s7:Seance {id_seance: 7, date: "2026-01-14", statut: "prevue"})
CREATE (s8:Seance {id_seance: 8, date: "2026-01-14", statut: "prevue"})
CREATE (s9:Seance {id_seance: 9, date: "2026-01-15", statut: "prevue"})
CREATE (s10:Seance {id_seance: 10, date: "2026-01-15", statut: "remplacee"})
CREATE (s11:Seance {id_seance: 11, date: "2026-01-15", statut: "prevue"})
CREATE (s12:Seance {id_seance: 12, date: "2026-01-15", statut: "prevue"})
CREATE (s13:Seance {id_seance: 13, date: "2026-01-16", statut: "prevue"})
CREATE (s14:Seance {id_seance: 14, date: "2026-01-16", statut: "reportee"})
CREATE (s15:Seance {id_seance: 15, date: "2026-01-16", statut: "prevue"})
CREATE (s16:Seance {id_seance: 16, date: "2026-01-16", statut: "prevue"})
CREATE (s17:Seance {id_seance: 17, date: "2026-01-17", statut: "prevue"})
CREATE (s18:Seance {id_seance: 18, date: "2026-01-17", statut: "prevue"})
CREATE (s19:Seance {id_seance: 19, date: "2026-01-17", statut: "rattrapage"})
CREATE (s20:Seance {id_seance: 20, date: "2026-01-17", statut: "prevue"})
CREATE (s21:Seance {id_seance: 21, date: "2026-01-20", statut: "prevue"});

// 4️⃣ RELIER LES SÉANCES AUX CRÉNEAU
// Séance 12 : Mercredi 16h-18h
MATCH (s:Seance {id_seance: 12}), (c:Creneau {id: "MER_16_18"})
CREATE (s)-[:SCHEDULED_AT]->(c);

// 5️⃣ RELIER LES ENSEIGNANTS AUX SÉANCES (qui les enseignent)
// E1 enseigne les séances 1, 4, 5, 9, 11, 13, 17, 20, 21
MATCH (e:Enseignant {id_enseignant: 1}), (s:Seance) WHERE s.id_seance IN [1, 4, 5, 9, 11, 13, 17, 20, 21]
CREATE (e)-[:ENSEIGNE]->(s);

// E2 enseigne les séances 2, 6, 10, 14, 18 (et 12 qui est absent)
MATCH (e:Enseignant {id_enseignant: 2}), (s:Seance) WHERE s.id_seance IN [2, 6, 10, 14, 18, 12]
CREATE (e)-[:ENSEIGNE]->(s);

// E3 enseigne les séances 3, 7, 8, 12, 15, 16, 19
MATCH (e:Enseignant {id_enseignant: 3}), (s:Seance) WHERE s.id_seance IN [3, 7, 8, 15, 16, 19]
CREATE (e)-[:ENSEIGNE]->(s);

// 6️⃣ CRÉER LES RELATIONS DE DISPONIBILITÉ DES ENSEIGNANTS
// E1 (Teacher Test) - disponible le lundi et jeudi toute la journée
MATCH (e:Enseignant {id_enseignant: 1}), (c:Creneau) WHERE c.id CONTAINS "LUN" OR c.id CONTAINS "JEU"
CREATE (e)-[:DISPONIBLE_A]->(c);

// E2 (Mohammed Alami) - disponible le mardi et vendredi toute la journée
MATCH (e:Enseignant {id_enseignant: 2}), (c:Creneau) WHERE c.id CONTAINS "MAR" OR c.id CONTAINS "VEN"
CREATE (e)-[:DISPONIBLE_A]->(c);

// E3 (Fatima Bennani) - disponible le mercredi et samedi toute la journée
MATCH (e:Enseignant {id_enseignant: 3}), (c:Creneau) WHERE c.id CONTAINS "MER" OR c.id CONTAINS "SAM"
CREATE (e)-[:DISPONIBLE_A]->(c);

// ============================================
// RÉSUMÉ DE LA STRUCTURE
// ============================================
// Séance 12 : Mercredi 16h-18h → MER_16_18
// Enseignant absent : E2 (Mohammed Alami)
// Enseignants DISPONIBLES le mercredi 16h-18h : E3 (Fatima Bennani)
// 
// DONC : La requête retournera E3 comme remplaçant potentiel ✅
// ============================================
