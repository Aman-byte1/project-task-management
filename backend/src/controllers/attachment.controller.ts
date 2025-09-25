import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Attachment } from '../models/Attachment';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { User } from '../models/User';
import path from 'path';
import fs from 'fs';

export const getAttachmentsByTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const attachments = await Attachment.findAll({
      where: { taskId: parseInt(taskId) },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(attachments);
  } catch (error) {
    console.error('Error fetching task attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

export const getAttachmentsByProject = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const attachments = await Attachment.findAll({
      where: { projectId: parseInt(projectId) },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(attachments);
  } catch (error) {
    console.error('Error fetching project attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
};

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, projectId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate that either taskId or projectId is provided
    if (!taskId && !projectId) {
      return res.status(400).json({ error: 'Either taskId or projectId must be provided' });
    }

    // Validate that the task or project exists
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
    }

    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await Attachment.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      taskId: taskId ? parseInt(taskId) : undefined,
      projectId: projectId ? parseInt(projectId) : undefined,
      uploadedBy: userId
    });

    const attachmentWithUploader = await Attachment.findByPk(attachment.id, {
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(attachmentWithUploader);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
};

// Download attachment with proper headers to force download
export const downloadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log('Downloading attachment with ID:', id);

    const attachment = await Attachment.findByPk(id);

    if (!attachment) {
      console.log('Attachment not found in database');
      return res.status(404).json({ error: 'Attachment not found' });
    }

    console.log('Attachment found:', attachment.originalName);
    console.log('File path:', attachment.path);

    // Check if file exists
    if (!fs.existsSync(attachment.path)) {
      console.log('File does not exist on disk:', attachment.path);
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set headers to force download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Length', attachment.size.toString());
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    console.log('Starting file stream...');

    // Stream the file to the response
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);

    // Handle errors during streaming
    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });

    // Handle successful completion
    fileStream.on('end', () => {
      console.log('File stream completed successfully');
    });

  } catch (error) {
    console.error('Error downloading attachment:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download attachment' });
    }
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const attachment = await Attachment.findByPk(id);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check permissions - user can delete their own attachments or admin can delete any
    if (attachment.uploadedBy !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this attachment' });
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    await attachment.destroy();
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
};
