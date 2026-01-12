import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    id_utilisateur: {
        type: Number,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['absence', 'note_saisie', 'streak_bonus', 'remplacement', 'seance_modifiee', 'info'],
        required: true
    },
    titre: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    lien: {
        type: String,
        default: null
    },
    lu: {
        type: Boolean,
        default: false,
        index: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    date_creation: {
        type: Date,
        default: Date.now,
        index: true
    }
});

notificationSchema.index({ id_utilisateur: 1, lu: 1, date_creation: -1 });

export default mongoose.model('Notification', notificationSchema);