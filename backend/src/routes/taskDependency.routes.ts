import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTaskDependencies,
  getTaskDependents,
  createTaskDependency,
  updateTaskDependency,
  deleteTaskDependency,
  getAllDependenciesForProject
} from '../modules/tasks/taskDependency.controller';

const router = Router();

// All task dependency routes require authentication
router.use(authenticate);

// GET /api/task-dependencies/task/:taskId - Get all dependencies for a task
router.get('/task/:taskId', getTaskDependencies);

// GET /api/task-dependencies/task/:taskId/dependents - Get all tasks that depend on this task
router.get('/task/:taskId/dependents', getTaskDependents);

// GET /api/task-dependencies/project/:projectId - Get all dependencies for a project
router.get('/project/:projectId', getAllDependenciesForProject);

// POST /api/task-dependencies - Create a new task dependency
router.post('/', createTaskDependency);

// PUT /api/task-dependencies/:id - Update a task dependency
router.put('/:id', updateTaskDependency);

// DELETE /api/task-dependencies/:id - Delete a task dependency
router.delete('/:id', deleteTaskDependency);

export default router;
