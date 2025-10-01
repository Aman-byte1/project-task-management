import { z } from 'zod';

// PDF format options
export const PDFFormatSchema = z.enum(['A4', 'A3', 'Letter']);

// PDF options schema
export const PDFOptionsSchema = z.object({
  format: PDFFormatSchema.optional().default('A4'),
  landscape: z.boolean().optional().default(false),
  margin: z.object({
    top: z.string().optional(),
    right: z.string().optional(),
    bottom: z.string().optional(),
    left: z.string().optional()
  }).optional(),
  scale: z.number().min(0.1).max(2).optional().default(1)
});

// Schema for project report PDF request
export const ProjectReportPDFSchema = z.object({
  projectId: z
    .string()
    .regex(/^\d+$/, 'Project ID must be a number')
    .transform(Number),
  options: PDFOptionsSchema.optional().default({})
});

// Schema for task report PDF request
export const TaskReportPDFSchema = z.object({
  taskId: z
    .string()
    .regex(/^\d+$/, 'Task ID must be a number')
    .transform(Number),
  options: PDFOptionsSchema.optional().default({})
});

// Schema for time tracking report PDF request
export const TimeTrackingReportPDFSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, 'User ID must be a number')
    .transform(Number),
  startDate: z
    .string()
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Start date must be a valid date'),
  endDate: z
    .string()
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'End date must be a valid date'),
  options: PDFOptionsSchema.optional().default({})
});

// Type inference for TypeScript
export type ProjectReportPDFInput = z.infer<typeof ProjectReportPDFSchema>;
export type TaskReportPDFInput = z.infer<typeof TaskReportPDFSchema>;
export type TimeTrackingReportPDFInput = z.infer<typeof TimeTrackingReportPDFSchema>;
export type PDFOptionsInput = z.infer<typeof PDFOptionsSchema>;
