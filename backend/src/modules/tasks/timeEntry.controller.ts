import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { TimeEntry } from './TimeEntry';
import { Task } from './Task';
import { User } from '../auth/User';

export const getTimeEntriesByTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user has permission to view time entries for this task
    const task = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'assignee' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Allow access if user is admin, owns the project, or is assigned to the task
    const projectOwnerId = (task as any).project?.ownerId;
    const canAccess = userRole === 'admin' ||
                     projectOwnerId === userId ||
                     task.assigneeId === userId;

    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to view time entries for this task' });
    }

    const timeEntries = await TimeEntry.findAll({
      where: { taskId: parseInt(taskId) },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['startTime', 'DESC']]
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

export const getTimeEntriesByUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;

    // Users can only view their own time entries unless they're admin
    if (parseInt(userId) !== currentUserId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view other users\' time entries' });
    }

    const timeEntries = await TimeEntry.findAll({
      where: { userId: parseInt(userId) },
      include: [
        {
          model: Task,
          as: 'task',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
          ]
        }
      ],
      order: [['startTime', 'DESC']]
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Error fetching user time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
};

export const startTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has permission to track time on this task
    const projectOwnerId = (task as any).project?.ownerId;
    const userRole = req.user?.role;
    const canTrack = userRole === 'admin' ||
                    projectOwnerId === userId ||
                    task.assigneeId === userId;

    if (!canTrack) {
      return res.status(403).json({ error: 'Not authorized to track time on this task' });
    }

    // Check if user already has a running time entry
    const existingRunningEntry = await TimeEntry.findOne({
      where: { userId, isRunning: true }
    });

    if (existingRunningEntry) {
      return res.status(400).json({
        error: 'You already have a running time entry. Please stop it before starting a new one.'
      });
    }

    const timeEntry = await TimeEntry.create({
      taskId: parseInt(taskId),
      userId,
      startTime: new Date(),
      description,
      isRunning: true
    });

    const timeEntryWithDetails = await TimeEntry.findByPk(timeEntry.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(timeEntryWithDetails);
  } catch (error) {
    console.error('Error starting time entry:', error);
    res.status(500).json({ error: 'Failed to start time entry' });
  }
};

export const stopTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const timeEntry = await TimeEntry.findByPk(id);
    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Check permissions - user can stop their own entries or admin can stop any
    if (timeEntry.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to stop this time entry' });
    }

    if (!timeEntry.isRunning) {
      return res.status(400).json({ error: 'Time entry is not running' });
    }

    const endTime = new Date();
    const startTime = new Date(timeEntry.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // in minutes

    await timeEntry.update({
      endTime,
      duration,
      isRunning: false
    });

    const updatedTimeEntry = await TimeEntry.findByPk(timeEntry.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(updatedTimeEntry);
  } catch (error) {
    console.error('Error stopping time entry:', error);
    res.status(500).json({ error: 'Failed to stop time entry' });
  }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { description, startTime, endTime } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    console.log('Update request:', { id, description, startTime, endTime, userId, userRole });

    const timeEntry = await TimeEntry.findByPk(id);
    if (!timeEntry) {
      console.log('Time entry not found:', id);
      return res.status(404).json({ error: 'Time entry not found' });
    }

    console.log('Found time entry:', timeEntry.id, 'User:', timeEntry.userId);

    // Check permissions - user can update their own entries or admin can update any
    if (timeEntry.userId !== userId && userRole !== 'admin') {
      console.log('Permission denied:', { entryUser: timeEntry.userId, requestUser: userId, role: userRole });
      return res.status(403).json({ error: 'Not authorized to update this time entry' });
    }

    // Calculate duration if both start and end times are provided
    let duration = timeEntry.duration;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    console.log('Updating with:', { description, startTime, endTime, duration });

    await timeEntry.update({
      description: description || timeEntry.description,
      startTime: startTime ? new Date(startTime) : timeEntry.startTime,
      endTime: endTime ? new Date(endTime) : timeEntry.endTime,
      duration
    });

    const updatedTimeEntry = await TimeEntry.findByPk(timeEntry.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    console.log('Update successful:', updatedTimeEntry);
    res.json(updatedTimeEntry);
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const timeEntry = await TimeEntry.findByPk(id);
    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Check permissions - user can delete their own entries or admin can delete any
    if (timeEntry.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this time entry' });
    }

    await timeEntry.destroy();
    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
};

export const getRunningTimeEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const runningEntry = await TimeEntry.findOne({
      where: { userId, isRunning: true },
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    if (!runningEntry) {
      return res.status(404).json({ error: 'No running time entry found' });
    }

    res.json(runningEntry);
  } catch (error) {
    console.error('Error fetching running time entry:', error);
    res.status(500).json({ error: 'Failed to fetch running time entry' });
  }
};
