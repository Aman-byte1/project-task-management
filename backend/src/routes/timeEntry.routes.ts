import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getTimeEntriesByTask,
  getTimeEntriesByUser,
  startTimeEntry,
  stopTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getRunningTimeEntry
} from '../controllers/timeEntry.controller';

const router = Router();

// All time entry routes require authentication
router.use(authenticate);

// GET /api/time-entries/task/:taskId - Get all time entries for a task
router.get('/task/:taskId', getTimeEntriesByTask);

// GET /api/time-entries/user/:userId - Get all time entries for a user
router.get('/user/:userId', getTimeEntriesByUser);

// GET /api/time-entries/running - Get the currently running time entry for the authenticated user
router.get('/running', getRunningTimeEntry);

// POST /api/time-entries/start - Start a new time entry
router.post('/start', startTimeEntry);

// PUT /api/time-entries/:id/stop - Stop a running time entry
router.put('/:id/stop', stopTimeEntry);

// PUT /api/time-entries/:id - Update a time entry
router.put('/:id', updateTimeEntry);

// DELETE /api/time-entries/:id - Delete a time entry
router.delete('/:id', deleteTimeEntry);

export default router;
