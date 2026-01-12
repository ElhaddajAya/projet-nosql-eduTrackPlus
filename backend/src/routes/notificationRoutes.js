import express from 'express';
const router = express.Router();

import
{
    creerNotification,
    getMesNotifications,
    marquerLue,
    toutMarquerLu,
    supprimerNotification,
    supprimerLues
} from '../controllers/notificationController.js';
import { authenticate, authorize } from '../middleware/auth.js';

router.post('/', authenticate, authorize(['admin']), creerNotification);
router.get('/mes-notifications', authenticate, getMesNotifications);
router.put('/:id/lire', authenticate, marquerLue);
router.put('/tout-lire', authenticate, toutMarquerLu);
router.delete('/:id', authenticate, supprimerNotification);
router.delete('/supprimer-lues', authenticate, supprimerLues);

export default router;