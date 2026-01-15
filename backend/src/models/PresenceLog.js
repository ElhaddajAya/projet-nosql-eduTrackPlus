// Modèle MongoDB pour les logs de présences
import mongoose from 'mongoose';

const presenceLogSchema = new mongoose.Schema({
    // Référence à la séance
    seance_id: {
        type: Number,
        required: true,
        index: true
    },

    // Informations séance (embedded pour historique)
    seance_info: {
        date: String,
        heure_debut: String,
        heure_fin: String,
        classe: String,
        matiere: String,
        enseignant: String
    },

    // Présences détaillées (embedded)
    presences: [{
        etudiant_id: Number,
        etudiant: {
            nom: String,
            prenom: String,
            matricule: String
        },
        statut: {
            type: String,
            enum: ['present', 'absent', 'late']
        },
        heure_marquage: Date,
        remarque: String,
        // Gamification
        streak_count: Number,
        bonus_gagne: Number
    }],

    // Métadonnées
    marquee_par: {
        enseignant_id: Number,
        nom: String,
        prenom: String
    },
    date_marquage: {
        type: Date,
        default: Date.now
    },

    // Statistiques rapides
    stats: {
        total_etudiants: Number,
        presents: Number,
        absents: Number,
        retards: Number,
        taux_presence: Number
    },

    // Modification
    modifiee: {
        type: Boolean,
        default: false
    },
    date_modification: Date,
    modifiee_par: String

}, {
    timestamps: true  // createdAt, updatedAt automatiques
});

// Index pour recherche rapide
presenceLogSchema.index({ 'seance_id': 1, 'date_marquage': -1 });
presenceLogSchema.index({ 'seance_info.classe': 1, 'seance_info.date': -1 });

export default mongoose.model('PresenceLog', presenceLogSchema);