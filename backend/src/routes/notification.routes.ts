import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../modules/auth/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user's notifications
router.get('/', getUserNotifications);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', markNotificationAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsAsRead);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

export default router;
