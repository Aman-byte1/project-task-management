import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Project } from './Project';
import { User, UserRole } from '../auth/User';
import { Notification } from '../auth/Notification';
import { notifyProjectAssigned } from '../auth/notification.controller';
import { Task } from '../tasks/Task';
import { validateBody, validateQuery, validateParams } from '../../validation/middleware';
import { CreateProjectSchema, UpdateProjectSchema, ProjectQuerySchema, ProjectParamsSchema } from './project.schema';

export const getAllProjects = async (req: AuthRequest, res: Response) => {
  try {
    let projects;

    if (req.user?.role === UserRole.ADMIN) {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: Task, as: 'tasks' }
        ]
      });
    } else {
      // Employees can create and see their own projects too
      projects = await Project.findAll({
        where: { ownerId: req.user!.id },
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: Task, as: 'tasks' }
        ]
      });
    }

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      message: 'Failed to fetch projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Task, as: 'tasks', include: [
          { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] }
        ]}
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createProject = [
  validateBody(CreateProjectSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, status, teamMembers } = req.body;

    // Allow all authenticated users to create projects
    const project = await Project.create({
      name,
      description,
      status: status || 'active',
      ownerId: req.user!.id
    });

    const projectWithOwner = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    // Send notifications to team members (excluding the creator)
    if (teamMembers && Array.isArray(teamMembers)) {
      console.log(`Creating project assignment notifications for ${teamMembers.length} team members`);
      for (const userId of teamMembers) {
        if (userId !== req.user!.id) {
          console.log(`Creating project assignment notification for user ${userId}, project ${project.id}`);
          await notifyProjectAssigned(project.id, userId);
          console.log(`Project assignment notification created for user ${userId}`);
        }
      }
    }

      res.status(201).json(projectWithOwner);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  }
];

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user?.role !== UserRole.ADMIN && project.ownerId !== req.user?.id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const { name, description, status } = req.body;
    await project.update({ name, description, status });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (req.user?.role !== UserRole.ADMIN && project.ownerId !== req.user?.id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
