import { Router } from 'express';
import { ReportingController } from '../controllers/reporting.controller';
// import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Temporarily disable authentication for testing
// router.use(authenticate);

// Project statistics
router.get('/projects/stats', ReportingController.getProjectStats);

// Task statistics
router.get('/tasks/stats', ReportingController.getTaskStats);

// User performance statistics
router.get('/users/performance', ReportingController.getUserPerformance);

// Project progress data
router.get('/projects/progress', ReportingController.getProjectProgress);

// Task priority distribution
router.get('/tasks/priority-distribution', ReportingController.getTaskPriorityDistribution);

// Time tracking statistics
router.get('/time-tracking/stats', ReportingController.getTimeTrackingStats);

// Monthly trends
router.get('/trends/monthly', ReportingController.getMonthlyTrends);

// Productivity metrics
router.get('/productivity/metrics', ReportingController.getProductivityMetrics);

// Workload distribution
router.get('/workload/distribution', ReportingController.getWorkloadDistribution);

// Project timeline
router.get('/projects/timeline', ReportingController.getProjectTimeline);

// Task velocity
router.get('/tasks/velocity', ReportingController.getTaskVelocity);

// Resource utilization
router.get('/resources/utilization', ReportingController.getResourceUtilization);

// Custom reports
router.get('/custom', ReportingController.getCustomReport);

export default router;
