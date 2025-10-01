import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';
import { Task } from '../tasks/Task';
import { Project } from './Project';
import { User } from '../auth/User';
import { TimeEntry } from '../tasks/TimeEntry';
import { Comment } from '../tasks/Comment';
import { Attachment } from '../tasks/Attachment';

export interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  landscape?: boolean;
  scale?: number;
}

export interface ProjectReportData {
  project: any;
  tasks: any[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  teamMembers: any[];
  startDate: Date;
  endDate: Date;
}

export interface TaskReportData {
  task: any;
  project: any;
  assignee: any;
  comments: any[];
  attachments: any[];
  timeEntries: any[];
  dependencies: any[];
  totalTimeSpent: number;
  completionPercentage: number;
}

export class PDFService {
  private browser: Browser | null = null;

  // Initialize Puppeteer browser
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  // Generate project report PDF
  async generateProjectReport(projectId: number, options: PDFOptions = {}): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();

      // Fetch project data with related information
      const project = await Project.findByPk(projectId, {
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Task,
            as: 'tasks',
            include: [
              {
                model: User,
                as: 'assignee',
                attributes: ['id', 'name', 'email']
              }
            ]
          }
        ]
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate project statistics
      const tasks = (project as any).tasks || [];
      const reportData: ProjectReportData = {
        project: project.toJSON(),
        tasks: tasks.map((task: any) => task.toJSON()),
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task: any) => task.status === 'done').length,
        inProgressTasks: tasks.filter((task: any) => task.status === 'in_progress').length,
        todoTasks: tasks.filter((task: any) => task.status === 'todo').length,
        totalEstimatedHours: tasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 0), 0),
        totalActualHours: tasks.reduce((sum: number, task: any) => sum + (task.actualHours || 0), 0),
        teamMembers: this.extractTeamMembers(tasks),
        startDate: new Date(Math.min(...tasks.map((task: any) => new Date(task.createdAt).getTime()))),
        endDate: new Date(Math.max(...tasks.map((task: any) => new Date(task.createdAt).getTime())))
      };

      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Generate HTML content
      const htmlContent = this.generateProjectReportHTML(reportData);

      // Set HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        scale: options.scale || 1,
        printBackground: true,
        preferCSSPageSize: true
      }) as Buffer;

      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error('Error generating project report PDF:', error);
      throw new Error('Failed to generate project report PDF');
    }
  }

  // Generate task report PDF
  async generateTaskReport(taskId: number, options: PDFOptions = {}): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();

      // Fetch task data with all related information
      const task = await Task.findByPk(taskId, {
        include: [
          {
            model: Project,
            as: 'project'
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Fetch additional data
      const [comments, attachments, timeEntries] = await Promise.all([
        Comment.findAll({
          where: { taskId },
          include: [{ model: User, as: 'author', attributes: ['id', 'name', 'email'] }],
          order: [['createdAt', 'ASC']]
        }),
        Attachment.findAll({ where: { taskId} }),
        TimeEntry.findAll({ where: { taskId} })
      ]);

      // Calculate task statistics
      const totalTimeSpent = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const completionPercentage = this.calculateTaskCompletion(task.toJSON());

      const reportData: TaskReportData = {
        task: task.toJSON(),
        project: (task as any).project?.toJSON(),
        assignee: (task as any).assignee?.toJSON(),
        comments: comments.map(comment => comment.toJSON()),
        attachments: attachments.map(attachment => attachment.toJSON()),
        timeEntries: timeEntries.map(entry => entry.toJSON()),
        dependencies: [], // Would need to fetch dependencies
        totalTimeSpent,
        completionPercentage
      };

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });

      const htmlContent = this.generateTaskReportHTML(reportData);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: options.margin || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        scale: options.scale || 1,
        printBackground: true
      }) as Buffer;

      await page.close();
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating task report PDF:', error);
      throw new Error('Failed to generate task report PDF');
    }
  }

  // Generate time tracking report PDF
  async generateTimeTrackingReport(userId: number, startDate: Date, endDate: Date, options: PDFOptions = {}): Promise<Buffer> {
    try {
      const browser = await this.getBrowser();

      // Fetch time entries for the period
      const timeEntries = await TimeEntry.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Task,
            as: 'task',
            include: [{ model: Project, as: 'project' }]
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // Calculate summary statistics
      const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      const daysWorked = new Set(timeEntries.map(entry => entry.createdAt.toDateString())).size;
      const averageHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;

      const reportData = {
        userId,
        startDate,
        endDate,
        timeEntries: timeEntries.map(entry => entry.toJSON()),
        totalHours,
        daysWorked,
        averageHoursPerDay,
        entriesByDate: this.groupTimeEntriesByDate(timeEntries)
      };

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });

      const htmlContent = this.generateTimeTrackingReportHTML(reportData);
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.landscape || false,
        margin: options.margin || { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        scale: options.scale || 1,
        printBackground: true
      });

      await page.close();
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating time tracking report PDF:', error);
      throw new Error('Failed to generate time tracking report PDF');
    }
  }

  // Generate HTML for project report
  private generateProjectReportHTML(data: ProjectReportData): string {
    const completionRate = data.totalTasks > 0 ? (data.completedTasks / data.totalTasks) * 100 : 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Project Report - ${data.project.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 10px;
          }
          .header h2 {
            font-size: 22px;
            font-weight: 400;
            opacity: 0.9;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .project-info {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
          }
          .project-info h3 {
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 15px;
          }
          .project-info p {
            margin-bottom: 8px;
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          .stat-card {
            background: white;
            padding: 25px 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-top: 4px solid #667eea;
          }
          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .stat-label {
            color: #7f8c8d;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .progress-section {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }
          .progress-bar {
            background: #ecf0f1;
            border-radius: 20px;
            height: 8px;
            overflow: hidden;
            margin: 15px 0;
          }
          .progress-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            border-radius: 20px;
            transition: width 0.3s ease;
            width: ${completionRate}%;
          }
          .section {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }
          .section h3 {
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 20px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
          }
          .task-item {
            margin-bottom: 15px;
            padding: 15px;
            border: 1px solid #ecf0f1;
            border-radius: 8px;
            background: #fafbfc;
          }
          .task-title {
            font-weight: 600;
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .task-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            font-size: 13px;
            color: #7f8c8d;
          }
          .task-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-todo { background: #fff3cd; color: #856404; }
          .status-in_progress { background: #cce7ff; color: #0066cc; }
          .status-done { background: #d4edda; color: #155724; }
          .team-member {
            display: inline-block;
            margin: 5px 8px 5px 0;
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 25px;
            font-size: 13px;
            font-weight: 500;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            color: #7f8c8d;
            font-size: 12px;
          }
          @media print {
            .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
            .stat-card, .section, .project-info { box-shadow: none; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Project Report</h1>
          <h2>${data.project.name}</h2>
        </div>

        <div class="container">
          <div class="project-info">
            <h3>📋 Project Information</h3>
            <p><strong>Description:</strong> ${data.project.description || 'No description provided'}</p>
            <p><strong>Owner:</strong> ${data.project.owner?.name || 'Unknown'}</p>
            <p><strong>Status:</strong> ${data.project.status}</p>
            <p><strong>Period:</strong> ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${data.totalTasks}</div>
              <div class="stat-label">Total Tasks</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.completedTasks}</div>
              <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.totalEstimatedHours}h</div>
              <div class="stat-label">Estimated Hours</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.totalActualHours}h</div>
              <div class="stat-label">Actual Hours</div>
            </div>
          </div>

          <div class="progress-section">
            <h3>🎯 Project Progress</h3>
            <p><strong>Completion Rate:</strong> ${completionRate.toFixed(1)}%</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px;">
              <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">${data.todoTasks}</div>
                <div style="font-size: 12px; color: #7f8c8d;">To Do</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #f39c12;">${data.inProgressTasks}</div>
                <div style="font-size: 12px; color: #7f8c8d;">In Progress</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: bold; color: #27ae60;">${data.completedTasks}</div>
                <div style="font-size: 12px; color: #7f8c8d;">Done</div>
              </div>
            </div>
          </div>

          ${data.teamMembers.length > 0 ? `
            <div class="section">
              <h3>👥 Team Members</h3>
              ${data.teamMembers.map(member => `<span class="team-member">${member.name}</span>`).join('')}
            </div>
          ` : ''}

          <div class="section">
            <h3>📋 Tasks</h3>
            ${data.tasks.length > 0 ? data.tasks.map(task => `
              <div class="task-item">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                  <span><strong>👤 Assignee:</strong> ${task.assignee?.name || 'Unassigned'}</span>
                  <span><strong>🔥 Priority:</strong> ${task.priority}</span>
                  <span><strong>📊 Status:</strong>
                    <span class="task-status status-${task.status}">${task.status.replace('_', ' ')}</span>
                  </span>
                  ${task.estimatedHours ? `<span><strong>⏱️ Estimated:</strong> ${task.estimatedHours}h</span>` : ''}
                  ${task.actualHours ? `<span><strong>✅ Actual:</strong> ${task.actualHours}h</span>` : ''}
                </div>
              </div>
            `).join('') : '<p style="text-align: center; color: #7f8c8d; font-style: italic;">No tasks found for this project.</p>'}
          </div>

          <div class="footer">
            <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML for task report
  private generateTaskReportHTML(data: TaskReportData): string {
    const totalHours = Math.floor(data.totalTimeSpent / 60);
    const totalMinutes = data.totalTimeSpent % 60;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Task Report - ${data.task.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 10px;
          }
          .header h2 {
            font-size: 20px;
            font-weight: 400;
            opacity: 0.9;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .task-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
          }
          .info-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #667eea;
          }
          .info-card h4 {
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 15px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 8px;
          }
          .info-card p {
            margin-bottom: 8px;
            font-size: 14px;
          }
          .progress-container {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }
          .progress-bar {
            background: #ecf0f1;
            border-radius: 20px;
            height: 12px;
            overflow: hidden;
            margin: 15px 0;
          }
          .progress-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            border-radius: 20px;
            width: ${data.completionPercentage}%;
            transition: width 0.3s ease;
          }
          .section {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }
          .section h3 {
            color: #2c3e50;
            font-size: 18px;
            margin-bottom: 20px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
          }
          .time-entry {
            margin-bottom: 12px;
            padding: 12px 15px;
            background: linear-gradient(135deg, #e8f4fd, #f0f8ff);
            border-radius: 8px;
            border-left: 3px solid #667eea;
            font-size: 13px;
          }
          .time-entry strong {
            color: #2c3e50;
          }
          .comment-item {
            margin-bottom: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 3px solid #28a745;
          }
          .comment-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .comment-author {
            font-weight: 600;
            color: #2c3e50;
          }
          .comment-date {
            color: #7f8c8d;
          }
          .comment-content {
            color: #555;
            line-height: 1.5;
          }
          .attachment-item {
            margin-bottom: 10px;
            padding: 10px 12px;
            background: #fff3cd;
            border-radius: 5px;
            border-left: 3px solid #ffc107;
            font-size: 13px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-todo { background: #fff3cd; color: #856404; }
          .status-in_progress { background: #cce7ff; color: #0066cc; }
          .status-done { background: #d4edda; color: #155724; }
          .priority-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .priority-low { background: #d4edda; color: #155724; }
          .priority-medium { background: #fff3cd; color: #856404; }
          .priority-high { background: #f8d7da; color: #721c24; }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            color: #7f8c8d;
            font-size: 12px;
          }
          @media print {
            .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
            .info-card, .section, .progress-container { box-shadow: none; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Task Report</h1>
          <h2>${data.task.title}</h2>
        </div>

        <div class="container">
          <div class="task-info">
            <div class="info-card">
              <h4>📋 Task Details</h4>
              <p><strong>Description:</strong> ${data.task.description || 'No description provided'}</p>
              <p><strong>Status:</strong>
                <span class="status-badge status-${data.task.status}">${data.task.status.replace('_', ' ')}</span>
              </p>
              <p><strong>Priority:</strong>
                <span class="priority-badge priority-${data.task.priority}">${data.task.priority}</span>
              </p>
              <p><strong>Progress:</strong> ${data.completionPercentage}%</p>
            </div>
            <div class="info-card">
              <h4>👥 Assignment</h4>
              <p><strong>Project:</strong> ${data.project?.name || 'Unknown'}</p>
              <p><strong>Assignee:</strong> ${data.assignee?.name || 'Unassigned'}</p>
              <p><strong>Created:</strong> ${new Date(data.task.createdAt).toLocaleDateString()}</p>
              ${data.task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(data.task.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
          </div>

          <div class="progress-container">
            <h4>🎯 Completion Progress</h4>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p><strong>${data.completionPercentage}% Complete</strong></p>
          </div>

          <div class="section">
            <h3>⏱️ Time Tracking</h3>
            <p style="margin-bottom: 15px; font-size: 16px; color: #2c3e50;">
              <strong>Total Time Spent:</strong> ${totalHours}h ${totalMinutes}m
            </p>
            ${data.timeEntries.length > 0 ? data.timeEntries.map(entry => `
              <div class="time-entry">
                <strong>${entry.duration}min</strong> - ${entry.description || 'No description'}
                <br><span style="color: #7f8c8d;">${new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            `).join('') : '<p style="text-align: center; color: #7f8c8d; font-style: italic;">No time entries recorded.</p>'}
          </div>

          ${data.comments.length > 0 ? `
            <div class="section">
              <h3>💬 Comments</h3>
              ${data.comments.map(comment => `
                <div class="comment-item">
                  <div class="comment-header">
                    <span class="comment-author">${comment.author?.name || 'Unknown'}</span>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <div class="comment-content">${comment.content}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${data.attachments.length > 0 ? `
            <div class="section">
              <h3>📎 Attachments</h3>
              ${data.attachments.map(attachment => `
                <div class="attachment-item">
                  <strong>${attachment.originalName}</strong> (${(attachment.size / 1024).toFixed(2)} KB)
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML for time tracking report
  private generateTimeTrackingReportHTML(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Time Tracking Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 20px;
          }
          .summary {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 40px;
            border: 1px solid #dee2e6;
          }
          .summary h3 {
            color: #2c3e50;
            font-size: 20px;
            margin-bottom: 25px;
            text-align: center;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: white;
            padding: 25px 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-top: 4px solid #667eea;
            transition: transform 0.2s ease;
          }
          .stat-card:hover {
            transform: translateY(-2px);
          }
          .stat-value {
            font-size: 36px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
          }
          .stat-label {
            color: #7f8c8d;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }
          .section h3 {
            color: #2c3e50;
            font-size: 20px;
            margin-bottom: 25px;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 12px;
          }
          .daily-entry {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            background: #fafbfc;
            transition: background-color 0.2s ease;
          }
          .daily-entry:hover {
            background: #f8f9fa;
          }
          .entry-date {
            font-weight: 700;
            color: #2c3e50;
            font-size: 16px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #667eea;
            background: linear-gradient(90deg, #667eea20, transparent);
            padding-left: 10px;
          }
          .daily-total {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 14px;
            font-weight: 600;
          }
          .time-entry-item {
            margin-bottom: 12px;
            padding: 12px 15px;
            background: white;
            border-radius: 8px;
            border-left: 3px solid #28a745;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          }
          .time-entry-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
          }
          .time-entry-main {
            flex: 1;
            min-width: 200px;
          }
          .time-entry-duration {
            font-weight: 700;
            color: #2c3e50;
            font-size: 16px;
          }
          .time-entry-task {
            color: #667eea;
            font-weight: 600;
            margin-top: 4px;
          }
          .time-entry-description {
            color: #6c757d;
            font-size: 13px;
            margin-top: 4px;
          }
          .time-entry-meta {
            font-size: 12px;
            color: #adb5bd;
            white-space: nowrap;
          }
          .no-entries {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 25px;
            border-top: 1px solid #ecf0f1;
            color: #7f8c8d;
            font-size: 12px;
          }
          @media print {
            .header { background: #667eea !important; -webkit-print-color-adjust: exact; }
            .stat-card, .section, .summary { box-shadow: none; border: 1px solid #ddd; }
            .daily-entry { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏱️ Time Tracking Report</h1>
          <p><strong>Period:</strong> ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}</p>
        </div>

        <div class="container">
          <div class="summary">
            <h3>📊 Summary Statistics</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${data.totalHours.toFixed(2)}h</div>
                <div class="stat-label">Total Hours</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.daysWorked}</div>
                <div class="stat-label">Days Worked</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.averageHoursPerDay.toFixed(2)}h</div>
                <div class="stat-label">Avg per Day</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3>📅 Daily Breakdown</h3>
            ${Object.keys(data.entriesByDate).length > 0 ? Object.entries(data.entriesByDate).map(([date, entries]: [string, any]) => `
              <div class="daily-entry">
                <div class="entry-date">📆 ${new Date(date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
                <div class="daily-total">
                  ⏱️ Total: ${entries.totalHours.toFixed(2)} hours
                </div>
                ${entries.entries.map((entry: any) => `
                  <div class="time-entry-item">
                    <div class="time-entry-content">
                      <div class="time-entry-main">
                        <div class="time-entry-duration">${entry.duration} minutes</div>
                        <div class="time-entry-task">${entry.task?.title || 'Unknown Task'}</div>
                        ${entry.description ? `<div class="time-entry-description">${entry.description}</div>` : ''}
                      </div>
                      <div class="time-entry-meta">
                        ${new Date(entry.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `).join('') : '<div class="no-entries">No time entries found for the selected period.</div>'}
          </div>

          <div class="footer">
            <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Total Entries: ${data.timeEntries.length} | User ID: ${data.userId}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Helper methods
  private extractTeamMembers(tasks: any[]): any[] {
    const members = new Map();
    tasks.forEach(task => {
      if (task.assignee) {
        members.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(members.values());
  }

  private calculateTaskCompletion(task: any): number {
    // Simple completion calculation based on status
    switch (task.status) {
      case 'done': return 100;
      case 'in_progress': return 50;
      case 'todo': return 0;
      default: return 0;
    }
  }

  private groupTimeEntriesByDate(timeEntries: any[]): Record<string, any> {
    const grouped: Record<string, any> = {};

    timeEntries.forEach(entry => {
      const date = entry.createdAt.toDateString();
      if (!grouped[date]) {
        grouped[date] = {
          date,
          entries: [],
          totalHours: 0
        };
      }
      grouped[date].entries.push(entry);
      grouped[date].totalHours += (entry.duration || 0) / 60; // Convert minutes to hours
    });

    return grouped;
  }

  // Cleanup method
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
