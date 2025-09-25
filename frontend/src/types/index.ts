export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  status: 'active' | 'completed' | 'cancelled';
  owner?: User;
  tasks?: Task[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: number;
  content: string;
  taskId: number;
  userId: number;
  author?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  taskId?: number;
  projectId?: number;
  uploadedBy: number;
  uploader?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeEntry {
  id: number;
  taskId: number;
  userId: number;
  startTime: string;
  endTime?: string;
  duration?: number;
  description?: string;
  isRunning: boolean;
  task?: Task;
  user?: User;
  createdAt?: string;
  updatedAt?: string;
}

export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

export interface TaskDependency {
  id: number;
  taskId: number;
  dependsOnTaskId: number;
  dependencyType: DependencyType;
  lagTime?: number;
  task?: Task;
  dependsOnTask?: Task;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number;
  assigneeId: number;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  labels?: string;
  estimatedHours?: number;
  actualHours?: number;
  project?: Project;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
  timeEntries?: TimeEntry[];
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  createdAt?: string;
  updatedAt?: string;
}
