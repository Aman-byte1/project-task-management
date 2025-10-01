import { z } from 'zod';

// Task status enum
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done']);

// Task priority enum
export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Base task schema for creation
export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(3, 'Task title must be at least 3 characters long')
    .max(200, 'Task title cannot exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Task title contains invalid characters'),
  description: z
    .string()
    .min(1, 'Task description is required')
    .min(10, 'Task description must be at least 10 characters long')
    .max(2000, 'Task description cannot exceed 2000 characters'),
  projectId: z
    .number()
    .int('Project ID must be an integer')
    .positive('Project ID must be a positive number'),
  assigneeId: z
    .number()
    .int('Assignee ID must be an integer')
    .positive('Assignee ID must be a positive number'),
  status: TaskStatusSchema.default('todo'),
  priority: TaskPrioritySchema.default('medium'),
  dueDate: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'Due date must be a valid future date'),
  labels: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(label => label.trim().length >= 2 && label.trim().length <= 50);
    }, 'Each label must be between 2 and 50 characters'),
  estimatedHours: z
    .number()
    .int('Estimated hours must be an integer')
    .min(1, 'Estimated hours must be at least 1')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
  dependencies: z
    .array(z.number().int().positive('Dependency task ID must be a positive integer'))
    .optional()
    .default([])
});

// Schema for updating task
export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Task title must be at least 3 characters long')
    .max(200, 'Task title cannot exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Task title contains invalid characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Task description must be at least 10 characters long')
    .max(2000, 'Task description cannot exceed 2000 characters')
    .optional(),
  assigneeId: z
    .number()
    .int('Assignee ID must be an integer')
    .positive('Assignee ID must be a positive number')
    .optional(),
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  dueDate: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date > new Date();
    }, 'Due date must be a valid future date'),
  labels: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true;
      return val.split(',').every(label => label.trim().length >= 2 && label.trim().length <= 50);
    }, 'Each label must be between 2 and 50 characters'),
  estimatedHours: z
    .number()
    .int('Estimated hours must be an integer')
    .min(1, 'Estimated hours must be at least 1')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
  actualHours: z
    .number()
    .int('Actual hours must be an integer')
    .min(0, 'Actual hours cannot be negative')
    .max(1000, 'Actual hours cannot exceed 1000')
    .optional(),
  dependencies: z
    .array(z.number().int().positive('Dependency task ID must be a positive integer'))
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Schema for task query parameters
export const TaskQuerySchema = z.object({
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  assigneeId: z
    .string()
    .regex(/^\d+$/, 'Assignee ID must be a number')
    .transform(Number)
    .optional(),
  projectId: z
    .string()
    .regex(/^\d+$/, 'Project ID must be a number')
    .transform(Number)
    .optional(),
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(val => {
      const num = Number(val);
      if (num < 1) throw new Error('Page must be at least 1');
      return num;
    })
    .optional()
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(val => {
      const num = Number(val);
      if (num < 1) throw new Error('Limit must be at least 1');
      if (num > 100) throw new Error('Limit cannot exceed 100');
      return num;
    })
    .optional()
    .default(10)
});

// Schema for task parameters (URL params)
export const TaskParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Task ID must be a number')
    .transform(Number)
});

// Schema for time entry creation
export const CreateTimeEntrySchema = z.object({
  taskId: z
    .number()
    .int('Task ID must be an integer')
    .positive('Task ID must be a positive number'),
  hours: z
    .number()
    .min(0.25, 'Hours must be at least 0.25')
    .max(24, 'Hours cannot exceed 24 per entry'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  date: z
    .string()
    .optional()
    .refine(val => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Date must be a valid date')
});

// Type inference for TypeScript
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type TaskQueryInput = z.infer<typeof TaskQuerySchema>;
export type TaskParamsInput = z.infer<typeof TaskParamsSchema>;
export type CreateTimeEntryInput = z.infer<typeof CreateTimeEntrySchema>;
