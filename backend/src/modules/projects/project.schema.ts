import { z } from 'zod';

// Project status enum
export const ProjectStatusSchema = z.enum(['active', 'completed', 'cancelled']);

// Base project schema for creation
export const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .min(3, 'Project name must be at least 3 characters long')
    .max(100, 'Project name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores'),
  description: z
    .string()
    .min(1, 'Project description is required')
    .min(10, 'Project description must be at least 10 characters long')
    .max(1000, 'Project description cannot exceed 1000 characters'),
  status: ProjectStatusSchema.default('active'),
  teamMembers: z
    .array(z.number().int().positive('Team member ID must be a positive integer'))
    .optional()
    .default([])
});

// Schema for updating project
export const UpdateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters long')
    .max(100, 'Project name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Project name can only contain letters, numbers, spaces, hyphens, and underscores')
    .optional(),
  description: z
    .string()
    .min(10, 'Project description must be at least 10 characters long')
    .max(1000, 'Project description cannot exceed 1000 characters')
    .optional(),
  status: ProjectStatusSchema.optional(),
  teamMembers: z
    .array(z.number().int().positive('Team member ID must be a positive integer'))
    .optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Schema for project query parameters
export const ProjectQuerySchema = z.object({
  status: ProjectStatusSchema.optional(),
  ownerId: z
    .string()
    .regex(/^\d+$/, 'Owner ID must be a number')
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

// Schema for project parameters (URL params)
export const ProjectParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Project ID must be a number')
    .transform(Number)
});

// Type inference for TypeScript
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ProjectQueryInput = z.infer<typeof ProjectQuerySchema>;
export type ProjectParamsInput = z.infer<typeof ProjectParamsSchema>;
