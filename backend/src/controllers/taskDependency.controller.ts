import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TaskDependency, DependencyType } from '../models/TaskDependency';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { User } from '../models/User';

export const getTaskDependencies = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user has permission to view dependencies for this task
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
      return res.status(403).json({ error: 'Not authorized to view dependencies for this task' });
    }

    const dependencies = await TaskDependency.findAll({
      where: { taskId: parseInt(taskId) },
      include: [
        {
          model: Task,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status', 'priority']
        }
      ]
    });

    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching task dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch task dependencies' });
  }
};

export const getTaskDependents = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user has permission to view dependents for this task
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
      return res.status(403).json({ error: 'Not authorized to view dependents for this task' });
    }

    const dependents = await TaskDependency.findAll({
      where: { dependsOnTaskId: parseInt(taskId) },
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'status', 'priority']
        }
      ]
    });

    res.json(dependents);
  } catch (error) {
    console.error('Error fetching task dependents:', error);
    res.status(500).json({ error: 'Failed to fetch task dependents' });
  }
};

export const createTaskDependency = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, dependsOnTaskId, dependencyType, lagTime } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate that both tasks exist
    const [task, dependsOnTask] = await Promise.all([
      Task.findByPk(taskId),
      Task.findByPk(dependsOnTaskId)
    ]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!dependsOnTask) {
      return res.status(404).json({ error: 'Dependency task not found' });
    }

    // Check if user has permission to create dependencies
    const projectOwnerId = (task as any).project?.ownerId;
    const canCreate = userRole === 'admin' || projectOwnerId === userId;

    if (!canCreate) {
      return res.status(403).json({ error: 'Not authorized to create task dependencies' });
    }

    // Prevent self-dependency
    if (taskId === dependsOnTaskId) {
      return res.status(400).json({ error: 'A task cannot depend on itself' });
    }

    // Check if dependency already exists
    const existingDependency = await TaskDependency.findOne({
      where: { taskId, dependsOnTaskId }
    });

    if (existingDependency) {
      return res.status(400).json({ error: 'Dependency already exists' });
    }

    // Check for circular dependencies
    const hasCircularDependency = await checkCircularDependency(taskId, dependsOnTaskId);
    if (hasCircularDependency) {
      return res.status(400).json({ error: 'Creating this dependency would create a circular reference' });
    }

    const dependency = await TaskDependency.create({
      taskId: parseInt(taskId),
      dependsOnTaskId: parseInt(dependsOnTaskId),
      dependencyType: dependencyType || 'finish_to_start',
      lagTime: lagTime || 0
    });

    const dependencyWithTasks = await TaskDependency.findByPk(dependency.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'status', 'priority']
        },
        {
          model: Task,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status', 'priority']
        }
      ]
    });

    res.status(201).json(dependencyWithTasks);
  } catch (error) {
    console.error('Error creating task dependency:', error);
    res.status(500).json({ error: 'Failed to create task dependency' });
  }
};

export const updateTaskDependency = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { dependencyType, lagTime } = req.body;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const dependency = await TaskDependency.findByPk(id);
    if (!dependency) {
      return res.status(404).json({ error: 'Task dependency not found' });
    }

    // Check permissions
    const task = await Task.findByPk(dependency.taskId);
    const projectOwnerId = (task as any)?.project?.ownerId;
    const canUpdate = userRole === 'admin' || projectOwnerId === userId;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update task dependencies' });
    }

    await dependency.update({
      dependencyType: dependencyType || dependency.dependencyType,
      lagTime: lagTime !== undefined ? lagTime : dependency.lagTime
    });

    const updatedDependency = await TaskDependency.findByPk(dependency.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'status', 'priority']
        },
        {
          model: Task,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status', 'priority']
        }
      ]
    });

    res.json(updatedDependency);
  } catch (error) {
    console.error('Error updating task dependency:', error);
    res.status(500).json({ error: 'Failed to update task dependency' });
  }
};

export const deleteTaskDependency = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const dependency = await TaskDependency.findByPk(id);
    if (!dependency) {
      return res.status(404).json({ error: 'Task dependency not found' });
    }

    // Check permissions
    const task = await Task.findByPk(dependency.taskId);
    const projectOwnerId = (task as any)?.project?.ownerId;
    const canDelete = userRole === 'admin' || projectOwnerId === userId;

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete task dependencies' });
    }

    await dependency.destroy();
    res.json({ message: 'Task dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting task dependency:', error);
    res.status(500).json({ error: 'Failed to delete task dependency' });
  }
};

export const getAllDependenciesForProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if user has permission to view project dependencies
    const project = await Project.findByPk(projectId, {
      include: [{ model: User, as: 'owner' }]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const canAccess = userRole === 'admin' || project.ownerId === userId;
    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to view project dependencies' });
    }

    const dependencies = await TaskDependency.findAll({
      include: [
        {
          model: Task,
          as: 'task',
          where: { projectId: parseInt(projectId) },
          attributes: ['id', 'title', 'status', 'priority']
        },
        {
          model: Task,
          as: 'dependsOnTask',
          attributes: ['id', 'title', 'status', 'priority']
        }
      ]
    });

    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching project dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch project dependencies' });
  }
};

// Helper function to check for circular dependencies
const checkCircularDependency = async (taskId: number, dependsOnTaskId: number): Promise<boolean> => {
  const visited = new Set<number>();
  const stack = [dependsOnTaskId];

  while (stack.length > 0) {
    const currentTaskId = stack.pop()!;

    if (visited.has(currentTaskId)) {
      continue;
    }

    if (currentTaskId === taskId) {
      return true; // Circular dependency found
    }

    visited.add(currentTaskId);

    // Find all tasks that this task depends on
    const dependencies = await TaskDependency.findAll({
      where: { taskId: currentTaskId },
      attributes: ['dependsOnTaskId']
    });

    for (const dep of dependencies) {
      stack.push(dep.dependsOnTaskId);
    }
  }

  return false;
};
