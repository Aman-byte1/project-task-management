import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Notification, NotificationType } from './Notification';
import { User } from './User';
import { Task } from '../tasks/Task';
import { Project } from '../projects/Project';

export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { isRead, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const whereClause: any = { userId };

    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    const unreadCount = await Notification.count({
      where: { userId, isRead: false }
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    await notification.update({ isRead: true });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const notification = await Notification.findByPk(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await notification.destroy();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Helper function to create notifications
export const createNotification = async (
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: number,
  relatedType?: 'task' | 'project' | 'comment'
) => {
  try {
    console.log(`Creating notification: ${type} for user ${userId} with message: ${message}`);

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      isRead: false
    });

    console.log(`Notification created successfully: ${type} for user ${userId}, notification ID: ${notification.id}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    console.error('Notification data:', { userId, type, title, message, relatedId, relatedType });
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

// Helper function to notify user about task assignment
export const notifyTaskAssigned = async (taskId: number, assigneeId: number) => {
  try {
    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) return null;

    const title = 'New Task Assigned';
    const projectName = (task as any).project?.name || 'Unknown Project';
    const message = `You have been assigned to the task: "${task.title}" in project "${projectName}"`;

    return await createNotification(
      assigneeId,
      'task_assigned',
      title,
      message,
      taskId,
      'task'
    );
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
    return null;
  }
};

// Helper function to notify user about project assignment
export const notifyProjectAssigned = async (projectId: number, userId: number) => {
  try {
    const project = await Project.findByPk(projectId);

    if (!project) return null;

    const title = 'Added to Project';
    const message = `You have been added to the project: "${project.name}"`;

    return await createNotification(
      userId,
      'project_assigned',
      title,
      message,
      projectId,
      'project'
    );
  } catch (error) {
    console.error('Error creating project assignment notification:', error);
    return null;
  }
};

// Helper function to notify about task completion
export const notifyTaskCompleted = async (taskId: number) => {
  try {
    const task = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee' }
      ]
    });

    if (!task || !task.assigneeId) return null;

    const title = 'Task Completed';
    const message = `The task "${task.title}" has been completed`;

    return await createNotification(
      task.assigneeId,
      'task_completed',
      title,
      message,
      taskId,
      'task'
    );
  } catch (error) {
    console.error('Error creating task completion notification:', error);
    return null;
  }
};

// Helper function to notify about new comments
export const notifyNewComment = async (taskId: number, commentId: number, mentionedUserIds: number[] = []) => {
  try {
    const task = await Task.findByPk(taskId, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee' }
      ]
    });

    if (!task) return null;

    const notifications = [];

    // Notify task assignee about new comment
    if (task.assigneeId) {
      const title = 'New Comment on Your Task';
      const message = `A new comment has been added to your task: "${task.title}"`;

      const notification = await createNotification(
        task.assigneeId,
        'comment_added',
        title,
        message,
        taskId,
        'task'
      );
      notifications.push(notification);
    }

    // Notify mentioned users
    for (const userId of mentionedUserIds) {
      const title = 'You were mentioned in a comment';
      const message = `You were mentioned in a comment on task: "${task.title}"`;

      const notification = await createNotification(
        userId,
        'comment_added',
        title,
        message,
        taskId,
        'task'
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    return null;
  }
};
