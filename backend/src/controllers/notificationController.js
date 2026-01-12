import Notification from '../models/Notification.js';

export const creerNotification = async (req, res) =>
{
    try
    {
        const { id_utilisateur, type, titre, message, lien, metadata } = req.body;

        if (!id_utilisateur || !type || !titre || !message)
        {
            return res.status(400).json({ success: false, message: 'Champs manquants' });
        }

        const notification = await Notification.create({
            id_utilisateur,
            type,
            titre,
            message,
            lien,
            metadata
        });

        res.status(201).json({
            success: true,
            message: 'Notification créée',
            data: notification
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const getMesNotifications = async (req, res) =>
{
    try
    {
        const { limit = 20, lu } = req.query;
        const id_utilisateur = req.user.id_utilisateur;

        const filter = { id_utilisateur };

        if (lu !== undefined)
        {
            filter.lu = lu === 'true';
        }

        const notifications = await Notification
            .find(filter)
            .sort({ date_creation: -1 })
            .limit(parseInt(limit));

        const count_non_lues = await Notification.countDocuments({
            id_utilisateur,
            lu: false
        });

        res.json({
            success: true,
            count: notifications.length,
            count_non_lues,
            data: notifications
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const marquerLue = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const id_utilisateur = req.user.id_utilisateur;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, id_utilisateur },
            { lu: true },
            { new: true }
        );

        if (!notification)
        {
            return res.status(404).json({ success: false, message: 'Notification non trouvée' });
        }

        res.json({
            success: true,
            message: 'Notification marquée lue',
            data: notification
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const toutMarquerLu = async (req, res) =>
{
    try
    {
        const id_utilisateur = req.user.id_utilisateur;

        const result = await Notification.updateMany(
            { id_utilisateur, lu: false },
            { lu: true }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} notifications marquées lues`
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const supprimerNotification = async (req, res) =>
{
    try
    {
        const { id } = req.params;
        const id_utilisateur = req.user.id_utilisateur;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            id_utilisateur
        });

        if (!notification)
        {
            return res.status(404).json({ success: false, message: 'Notification non trouvée' });
        }

        res.json({
            success: true,
            message: 'Notification supprimée'
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const supprimerLues = async (req, res) =>
{
    try
    {
        const id_utilisateur = req.user.id_utilisateur;

        const result = await Notification.deleteMany({
            id_utilisateur,
            lu: true
        });

        res.json({
            success: true,
            message: `${result.deletedCount} notifications supprimées`
        });

    } catch (error)
    {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Fonction utilitaire pour créer notification automatique
export const notifierUtilisateur = async (id_utilisateur, type, titre, message, metadata = {}) =>
{
    try
    {
        await Notification.create({
            id_utilisateur,
            type,
            titre,
            message,
            metadata
        });
    } catch (error)
    {
        console.error('Erreur création notification:', error);
    }
};