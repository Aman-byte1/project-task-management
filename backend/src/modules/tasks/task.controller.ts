import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Task } from './Task';
import { Project } from '../projects/Project';
import { User, UserRole } from '../auth/User';
import { Comment } from './Comment';
import { Attachment } from './Attachment';
import { TaskDependency } from './TaskDependency';
import { TimeEntry } from './TimeEntry';
import { notifyTaskAssigned } from '../auth/notification.controller';
import { validateBody, validateQuery, validateParams } from '../../validation/middleware';
import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema, TaskParamsSchema, CreateTimeEntrySchema } from './task.schema';

export const getAllTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, assigneeId, projectId } = req.query;
    let whereClause: any = {};

    // Add filtering conditions
    if (status) {
      whereClause.status = status;
    }
    if (assigneeId) {
      whereClause.assigneeId = assigneeId;
    }
    if (projectId) {
      whereClause.projectId = projectId;
    }

    let tasks;

    if (req.user?.role === UserRole.ADMIN) {
      tasks = await Task.findAll({
        where: whereClause,
        include: [
          { model: Project, as: 'project' },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }] },
          { model: Attachment, as: 'attachments', include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'email'] }] }
        ]
      });
    } else {
      // Both project managers and employees see tasks from their projects
      const projects = await Project.findAll({
        where: { ownerId: req.user!.id },
        attributes: ['id']
      });
      const projectIds = projects.map(p => p.id);

      // Also include tasks assigned to them
      const baseWhereClause = {
        [require('sequelize').Op.or]: [
          { projectId: projectIds },
          { assigneeId: req.user!.id }
        ]
      };

      // Combine base where clause with filter conditions
      if (Object.keys(whereClause).length > 0) {
        baseWhereClause[require('sequelize').Op.and] = whereClause;
      }

      tasks = await Task.findAll({
        where: baseWhereClause,
        include: [
          { model: Project, as: 'project' },
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
          { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }] },
          { model: Attachment, as: 'attachments', include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'email'] }] }
        ]
      });
    }

    // Add dependencies and time entries to each task
    const tasksWithDependencies = await Promise.all(
      tasks.map(async (task) => {
        const taskData = task.toJSON();

        // Add dependencies using direct query
        const dependencies = await TaskDependency.findAll({
          where: { taskId: task.id },
          include: [
            {
              model: Task,
              as: 'dependsOnTask',
              attributes: ['id', 'title', 'status', 'priority']
            }
          ]
        });

        // Add time entries using direct query
        const timeEntries = await TimeEntry.findAll({
          where: { taskId: task.id },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        });

        return {
          ...taskData,
          dependencies: dependencies || [],
          timeEntries: timeEntries || []
        };
      })
    );

    res.json(tasksWithDependencies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Comment, as: 'comments', include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }] },
        { model: Attachment, as: 'attachments', include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'email'] }] }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createTask = [
  validateBody(CreateTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, projectId, assigneeId, status, priority, dueDate, labels, estimatedHours } = req.body;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Allow task creation if user owns the project or is admin
    if (req.user?.role !== UserRole.ADMIN && project.ownerId !== req.user?.id) {
      return res.status(403).json({ message: 'You can only create tasks for your own projects' });
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assigneeId,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      labels,
      estimatedHours
    });

    const taskWithDetails = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

    // Send notification to the assigned user (if not assigning to self)
    if (assigneeId && assigneeId !== req.user?.id) {
      console.log(`Creating task assignment notification for user ${assigneeId}, task ${task.id}`);
      await notifyTaskAssigned(task.id, assigneeId);
      console.log('Task assignment notification created successfully');
    }

      res.status(201).json(taskWithDetails);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
];

export const updateTask = [
  validateParams(TaskParamsSchema),
  validateBody(UpdateTaskSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const task = await Task.findByPk(req.params.id, {
        include: [{ model: Project, as: 'project' }]
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Allow update if user is admin, owns the project, or is assigned to the task
      const projectOwnerId = (task as any).project?.ownerId;
      const canUpdate = req.user?.role === UserRole.ADMIN ||
                       (projectOwnerId === req.user?.id) ||
                       task.assigneeId === req.user?.id;

      if (!canUpdate) {
        return res.status(403).json({ message: 'Insufficient permissions to update this task' });
      }

      const { title, description, status, priority, dueDate, assigneeId, labels, estimatedHours, actualHours } = req.body;
    await task.update({ title, description, status, priority, dueDate, assigneeId, labels, estimatedHours, actualHours });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
      ]
    });

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
];

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admin or project owner can delete tasks
    const projectOwnerId = (task as any).project?.ownerId;
    if (req.user?.role !== UserRole.ADMIN && projectOwnerId !== req.user?.id) {
      return res.status(403).json({ message: 'Insufficient permissions to delete this task' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
