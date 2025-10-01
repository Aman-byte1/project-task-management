import { User } from '../modules/auth/User';
import { Project } from '../modules/projects/Project';
import { Task } from '../modules/tasks/Task';
import { Comment } from '../modules/tasks/Comment';
import { Attachment } from '../modules/tasks/Attachment';
import { TimeEntry } from '../modules/tasks/TimeEntry';
import { TaskDependency } from '../modules/tasks/TaskDependency';
import { Notification } from '../modules/auth/Notification';

// Define associations
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Task.hasMany(Attachment, { foreignKey: 'taskId', as: 'attachments', onDelete: 'CASCADE' });
Attachment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

Project.hasMany(Attachment, { foreignKey: 'projectId', as: 'attachments', onDelete: 'CASCADE' });
Attachment.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Attachment, { foreignKey: 'uploadedBy', as: 'uploadedAttachments' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

Task.hasMany(TimeEntry, { foreignKey: 'taskId', as: 'timeEntries', onDelete: 'CASCADE' });
TimeEntry.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(TimeEntry, { foreignKey: 'userId', as: 'timeEntries' });
TimeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Task Dependencies
Task.hasMany(TaskDependency, { foreignKey: 'taskId', as: 'dependencies', onDelete: 'CASCADE' });
TaskDependency.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

Task.hasMany(TaskDependency, { foreignKey: 'dependsOnTaskId', as: 'dependents', onDelete: 'CASCADE' });
TaskDependency.belongsTo(Task, { foreignKey: 'dependsOnTaskId', as: 'dependsOnTask' });

// Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { User, Project, Task, Comment, Attachment, TimeEntry, TaskDependency, Notification };
