import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import attachmentRoutes from './routes/attachment.routes';
import timeEntryRoutes from './routes/timeEntry.routes';
import taskDependencyRoutes from './routes/taskDependency.routes';
import notificationRoutes from './routes/notification.routes';
import reportingRoutes from './routes/reporting.routes';
import './models/index';
import { seedAdmin } from './seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/task-dependencies', taskDependencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportingRoutes);

// Database connection and server start
sequelize.sync({ force: false }).then(async () => {
  console.log('Database connected successfully');

  // Seed admin user
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Unable to connect to the database:', error);
});
