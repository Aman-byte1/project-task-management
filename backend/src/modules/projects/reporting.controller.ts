import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Task } from '../tasks/Task';
import { Project } from './Project';
import { User } from '../auth/User';
import { pdfService } from './pdf.service';
import { validateBody } from '../../validation/middleware';
import {
  ProjectReportPDFSchema,
  TaskReportPDFSchema,
  TimeTrackingReportPDFSchema
} from './pdf.schema';

export class ReportingController {
  // Get overall project statistics
  static async getProjectStats(req: Request, res: Response) {
    try {
      const totalProjects = await Project.count();
      const activeProjects = await Project.count({ where: { status: 'active' } });
      const completedProjects = await Project.count({ where: { status: 'completed' } });
      const cancelledProjects = await Project.count({ where: { status: 'cancelled' } });

      const stats = {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        cancelled: cancelledProjects,
        completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project statistics' });
    }
  }

  // Get task statistics
  static async getTaskStats(req: Request, res: Response) {
    try {
      const totalTasks = await Task.count();
      const todoTasks = await Task.count({ where: { status: 'todo' } });
      const inProgressTasks = await Task.count({ where: { status: 'in_progress' } });
      const completedTasks = await Task.count({ where: { status: 'done' } });

      const stats = {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task statistics' });
    }
  }

  // Get user performance statistics
  static async getUserPerformance(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            required: false
          }
        ]
      });

      const userStats = users.map(user => {
        const tasks = (user as any).assignedTasks || [];
        const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
        const totalTasks = tasks.length;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalTasks,
          completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        };
      });

      res.json(userStats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user performance statistics' });
    }
  }

  // Get project progress over time
  static async getProjectProgress(req: Request, res: Response) {
    try {
      const projects = await Project.findAll({
        include: [
          {
            model: Task,
            required: false
          }
        ]
      });

      const projectProgress = projects.map(project => {
        const tasks = (project as any).Tasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task: any) => task.status === 'done').length;

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          totalTasks,
          completedTasks,
          progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          createdAt: project.createdAt
        };
      });

      res.json(projectProgress);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project progress data' });
    }
  }

  // Get task priority distribution
  static async getTaskPriorityDistribution(req: Request, res: Response) {
    try {
      const lowPriority = await Task.count({ where: { priority: 'low' } });
      const mediumPriority = await Task.count({ where: { priority: 'medium' } });
      const highPriority = await Task.count({ where: { priority: 'high' } });

      const distribution = {
        low: lowPriority,
        medium: mediumPriority,
        high: highPriority,
        total: lowPriority + mediumPriority + highPriority
      };

      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task priority distribution' });
    }
  }

  // Get time tracking statistics
  static async getTimeTrackingStats(req: Request, res: Response) {
    try {
      const allTasks = await Task.findAll();

      let totalEstimatedHours = 0;
      let totalActualHours = 0;
      let tasksWithEstimates = 0;
      let tasksWithActuals = 0;

      allTasks.forEach((task) => {
        if ((task as any).estimatedHours !== null && (task as any).estimatedHours !== undefined) {
          totalEstimatedHours += (task as any).estimatedHours;
          tasksWithEstimates++;
        }
        if ((task as any).actualHours !== null && (task as any).actualHours !== undefined) {
          totalActualHours += (task as any).actualHours;
          tasksWithActuals++;
        }
      });

      const stats = {
        totalEstimatedHours,
        totalActualHours,
        tasksWithEstimates,
        tasksWithActuals,
        averageEstimatedHours: tasksWithEstimates > 0 ? totalEstimatedHours / tasksWithEstimates : 0,
        averageActualHours: tasksWithActuals > 0 ? totalActualHours / tasksWithActuals : 0,
        timeAccuracy: totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch time tracking statistics' });
    }
  }

  // Get monthly project completion trends
  static async getMonthlyTrends(req: Request, res: Response) {
    try {
      const completedProjects = await Project.findAll({
        where: { status: 'completed' },
        attributes: [
          [Project.sequelize!.fn('DATE_TRUNC', 'month', Project.sequelize!.col('createdAt')), 'month'],
          [Project.sequelize!.fn('COUNT', Project.sequelize!.col('id')), 'count']
        ],
        group: [Project.sequelize!.fn('DATE_TRUNC', 'month', Project.sequelize!.col('createdAt'))],
        order: [Project.sequelize!.literal('month')]
      });

      const monthlyTrends = completedProjects.map(item => ({
        month: item.get('month'),
        completedProjects: parseInt(item.get('count') as string)
      }));

      res.json(monthlyTrends);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch monthly trends' });
    }
  }

  // Get productivity metrics
  static async getProductivityMetrics(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            required: false
          }
        ]
      });

      const productivityMetrics = users.map(user => {
        const tasks = (user as any).assignedTasks || [];
        const completedTasks = tasks.filter((task: any) => task.status === 'done');
        const overdueTasks = tasks.filter((task: any) =>
          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
        );

        const totalEstimatedHours = tasks.reduce((sum: number, task: any) =>
          sum + ((task as any).estimatedHours || 0), 0
        );
        const totalActualHours = completedTasks.reduce((sum: number, task: any) =>
          sum + ((task as any).actualHours || 0), 0
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          totalTasks: tasks.length,
          completedTasks: completedTasks.length,
          overdueTasks: overdueTasks.length,
          onTimeCompletionRate: tasks.length > 0 ?
            ((tasks.length - overdueTasks.length) / tasks.length) * 100 : 0,
          averageTaskCompletionTime: completedTasks.length > 0 ?
            (completedTasks.reduce((sum: number, task: any) => {
              const created = new Date(task.createdAt);
              const completed = new Date(task.updatedAt);
              return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }, 0) / completedTasks.length) : 0,
          totalEstimatedHours,
          totalActualHours,
          efficiency: totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0
        };
      });

      res.json(productivityMetrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch productivity metrics' });
    }
  }

  // Get workload distribution
  static async getWorkloadDistribution(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            required: false
          }
        ]
      });

      const workloadData = users.map(user => {
        const tasks = (user as any).assignedTasks || [];
        const highPriorityTasks = tasks.filter((task: any) => task.priority === 'high').length;
        const mediumPriorityTasks = tasks.filter((task: any) => task.priority === 'medium').length;
        const lowPriorityTasks = tasks.filter((task: any) => task.priority === 'low').length;

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          totalTasks: tasks.length,
          highPriority: highPriorityTasks,
          mediumPriority: mediumPriorityTasks,
          lowPriority: lowPriorityTasks,
          workloadScore: (highPriorityTasks * 3) + (mediumPriorityTasks * 2) + lowPriorityTasks
        };
      });

      res.json(workloadData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch workload distribution' });
    }
  }

  // Get project timeline and milestones
  static async getProjectTimeline(req: Request, res: Response) {
    try {
      const projects = await Project.findAll({
        include: [
          {
            model: Task,
            required: false
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      const timelineData = projects.map(project => {
        const tasks = (project as any).Tasks || [];
        const completedTasks = tasks.filter((task: any) => task.status === 'done').length;
        const totalTasks = tasks.length;

        const startDate = new Date(project.createdAt);
        const endDate = new Date(); // Projects don't have due dates in the model
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const elapsed = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          id: project.id,
          name: project.name,
          status: project.status,
          startDate: project.createdAt,
          endDate: null, // Projects don't have due dates
          duration,
          elapsed,
          progress,
          isOverdue: false, // Projects don't have due dates
          isOnTrack: elapsed > 0 && duration > 0 ? (progress >= (elapsed / duration) * 100) : true
        };
      });

      res.json(timelineData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch project timeline' });
    }
  }

  // Get task completion velocity
  static async getTaskVelocity(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(days as string));

      const completedTasks = await Task.findAll({
        where: {
          status: 'done',
          updatedAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: [
          [Task.sequelize!.fn('DATE_TRUNC', 'day', Task.sequelize!.col('updatedAt')), 'date'],
          [Task.sequelize!.fn('COUNT', Task.sequelize!.col('id')), 'count']
        ],
        group: [Task.sequelize!.fn('DATE_TRUNC', 'day', Task.sequelize!.col('updatedAt'))],
        order: [Task.sequelize!.literal('date')]
      });

      const velocityData = completedTasks.map(item => ({
        date: item.get('date'),
        completedTasks: parseInt(item.get('count') as string)
      }));

      res.json(velocityData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task velocity' });
    }
  }

  // Get resource utilization
  static async getResourceUtilization(req: Request, res: Response) {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            required: false
          }
        ]
      });

      const utilizationData = users.map(user => {
        const tasks = (user as any).assignedTasks || [];
        const activeTasks = tasks.filter((task: any) =>
          task.status === 'in_progress' || task.status === 'todo'
        );

        const totalCapacity = 40; // Assuming 40 hours per week capacity
        const allocatedHours = activeTasks.reduce((sum: number, task: any) =>
          sum + ((task as any).estimatedHours || 0), 0
        );

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          activeTasks: activeTasks.length,
          allocatedHours,
          capacity: totalCapacity,
          utilizationRate: totalCapacity > 0 ? (allocatedHours / totalCapacity) * 100 : 0,
          isOverallocated: allocatedHours > totalCapacity
        };
      });

      res.json(utilizationData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch resource utilization' });
    }
  }

  // Generate project report PDF
  static async generateProjectReportPDF(req: Request, res: Response) {
    try {
      const { projectId } = req.params;

      const pdfBuffer = await pdfService.generateProjectReport(parseInt(projectId), req.body || {});

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="project-report-${projectId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating project report PDF:', error);
      if (error.message === 'Project not found') {
        res.status(404).json({ error: 'Project not found' });
      } else {
        res.status(500).json({ error: 'Failed to generate project report PDF' });
      }
    }
  }

  // Generate task report PDF
  static async generateTaskReportPDF(req: Request, res: Response) {
    try {
      const { taskId } = req.params;

      const pdfBuffer = await pdfService.generateTaskReport(parseInt(taskId), req.body || {});

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="task-report-${taskId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating task report PDF:', error);
      if (error.message === 'Task not found') {
        res.status(404).json({ error: 'Task not found' });
      } else {
        res.status(500).json({ error: 'Failed to generate task report PDF' });
      }
    }
  }

  // Generate time tracking report PDF
  static async generateTimeTrackingReportPDF(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const pdfBuffer = await pdfService.generateTimeTrackingReport(
        parseInt(userId),
        new Date(startDate as string),
        new Date(endDate as string),
        req.body || {}
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="time-tracking-report-${userId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating time tracking report PDF:', error);
      if (error.message === 'User not found' || error.message.includes('TimeEntry')) {
        res.status(404).json({ error: 'User or time entries not found' });
      } else {
        res.status(500).json({ error: 'Failed to generate time tracking report PDF' });
      }
    }
  }

  // Get custom report data
  static async getCustomReport(req: Request, res: Response) {
    try {
      const {
        startDate,
        endDate,
        projectIds,
        userIds,
        taskStatuses,
        priorities,
        reportType = 'summary'
      } = req.query;

      let whereConditions: any = {};

      if (startDate && endDate) {
        whereConditions.createdAt = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        };
      }

      if (projectIds) {
        whereConditions.projectId = { [Op.in]: (projectIds as string).split(',') };
      }

      if (userIds) {
        whereConditions.assigneeId = { [Op.in]: (userIds as string).split(',') };
      }

      if (taskStatuses) {
        whereConditions.status = { [Op.in]: (taskStatuses as string).split(',') };
      }

      if (priorities) {
        whereConditions.priority = { [Op.in]: (priorities as string).split(',') };
      }

      const tasks = await Task.findAll({
        where: whereConditions,
        include: [
          { model: Project, required: true },
          { model: User, as: 'assignee', required: false }
        ]
      });

      const projects = await Project.findAll({
        where: whereConditions,
        include: [
          { model: Task, required: false }
        ]
      });

      let reportData: any = {};

      switch (reportType) {
        case 'summary':
          reportData = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
            inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
            totalProjects: projects.length,
            completedProjects: projects.filter(p => p.status === 'completed').length,
            totalEstimatedHours: tasks.reduce((sum, t) => sum + ((t as any).estimatedHours || 0), 0),
            totalActualHours: tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + ((t as any).actualHours || 0), 0)
          };
          break;

        case 'detailed':
          reportData = {
            tasks: tasks.map(task => ({
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
              estimatedHours: (task as any).estimatedHours,
              actualHours: (task as any).actualHours,
              projectName: (task as any).Project?.name,
              assignedUser: (task as any).assignee?.name,
              createdAt: task.createdAt,
              dueDate: task.dueDate,
              completedAt: task.updatedAt
            })),
            projects: projects.map(project => ({
              id: project.id,
              name: project.name,
              status: project.status,
              taskCount: (project as any).Tasks?.length || 0,
              completedTasks: (project as any).Tasks?.filter((t: any) => t.status === 'done').length || 0,
              createdAt: project.createdAt,
              dueDate: null // Projects don't have due dates
            }))
          };
          break;

        default:
          reportData = { error: 'Invalid report type' };
      }

      res.json(reportData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate custom report' });
    }
  }
}
