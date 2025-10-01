import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import {
  getAttachmentsByTask,
  getAttachmentsByProject,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment
} from '../modules/tasks/attachment.controller';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and text files are allowed.'));
    }
  }
});

const router = Router();

// All attachment routes require authentication
router.use(authenticate);

// GET /api/attachments/task/:taskId - Get all attachments for a task
router.get('/task/:taskId', getAttachmentsByTask);

// GET /api/attachments/project/:projectId - Get all attachments for a project
router.get('/project/:projectId', getAttachmentsByProject);

// POST /api/attachments/upload - Upload a new attachment
router.post('/upload', upload.single('file'), uploadAttachment);

// GET /api/attachments/:id/download - Download an attachment
router.get('/:id/download', downloadAttachment);

// DELETE /api/attachments/:id - Delete an attachment
router.delete('/:id', deleteAttachment);

export default router;
