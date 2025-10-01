import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment
} from '../modules/tasks/comment.controller';

const router = Router();

// All comment routes require authentication
router.use(authenticate);

// GET /api/tasks/comments/task/:taskId - Get all comments for a task
router.get('/task/:taskId', getCommentsByTask);

// POST /api/tasks/comments/task/:taskId - Create a new comment for a task
router.post('/task/:taskId', createComment);

// PUT /api/tasks/comments/:id - Update a comment
router.put('/:id', updateComment);

// DELETE /api/tasks/comments/:id - Delete a comment
router.delete('/:id', deleteComment);

export default router;
