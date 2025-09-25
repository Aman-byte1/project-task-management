import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface UserPerformance {
  id: number;
  name: string;
  email: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface ProjectProgress {
  id: number;
  name: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  createdAt: string;
}

export interface TaskPriorityDistribution {
  low: number;
  medium: number;
  high: number;
  total: number;
}

export interface TimeTrackingStats {
  totalEstimatedHours: number;
  totalActualHours: number;
  tasksWithEstimates: number;
  tasksWithActuals: number;
  averageEstimatedHours: number;
  averageActualHours: number;
  timeAccuracy: number;
}

export interface MonthlyTrend {
  month: string;
  completedProjects: number;
}

export interface ProductivityMetric {
  id: number;
  name: string;
  email: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  onTimeCompletionRate: number;
  averageTaskCompletionTime: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  efficiency: number;
}

export interface WorkloadDistribution {
  id: number;
  name: string;
  role: string;
  totalTasks: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  workloadScore: number;
}

export interface ProjectTimeline {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  duration: number;
  elapsed: number;
  progress: number;
  isOverdue: boolean;
  isOnTrack: boolean;
}

export interface TaskVelocity {
  date: string;
  completedTasks: number;
}

export interface ResourceUtilization {
  id: number;
  name: string;
  role: string;
  activeTasks: number;
  allocatedHours: number;
  capacity: number;
  utilizationRate: number;
  isOverallocated: boolean;
}

export interface CustomReport {
  totalTasks?: number;
  completedTasks?: number;
  inProgressTasks?: number;
  totalProjects?: number;
  completedProjects?: number;
  totalEstimatedHours?: number;
  totalActualHours?: number;
  tasks?: any[];
  projects?: any[];
  error?: string;
}

export const reportingApi = createApi({
  reducerPath: 'reportingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api/reports',
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getProjectStats: builder.query<ProjectStats, void>({
      query: () => '/projects/stats',
    }),
    getTaskStats: builder.query<TaskStats, void>({
      query: () => '/tasks/stats',
    }),
    getUserPerformance: builder.query<UserPerformance[], void>({
      query: () => '/users/performance',
    }),
    getProjectProgress: builder.query<ProjectProgress[], void>({
      query: () => '/projects/progress',
    }),
    getTaskPriorityDistribution: builder.query<TaskPriorityDistribution, void>({
      query: () => '/tasks/priority-distribution',
    }),
    getTimeTrackingStats: builder.query<TimeTrackingStats, void>({
      query: () => '/time-tracking/stats',
    }),
    getMonthlyTrends: builder.query<MonthlyTrend[], void>({
      query: () => '/trends/monthly',
    }),
    getProductivityMetrics: builder.query<ProductivityMetric[], void>({
      query: () => '/productivity/metrics',
    }),
    getWorkloadDistribution: builder.query<WorkloadDistribution[], void>({
      query: () => '/workload/distribution',
    }),
    getProjectTimeline: builder.query<ProjectTimeline[], void>({
      query: () => '/projects/timeline',
    }),
    getTaskVelocity: builder.query<TaskVelocity[], { days?: number }>({
      query: (params) => `/tasks/velocity${params.days ? `?days=${params.days}` : ''}`,
    }),
    getResourceUtilization: builder.query<ResourceUtilization[], void>({
      query: () => '/resources/utilization',
    }),
    getCustomReport: builder.query<CustomReport, {
      startDate?: string;
      endDate?: string;
      projectIds?: string;
      userIds?: string;
      taskStatuses?: string;
      priorities?: string;
      reportType?: string;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value);
          }
        });
        return `/custom?${searchParams.toString()}`;
      },
    }),
  }),
});

export const {
  useGetProjectStatsQuery,
  useGetTaskStatsQuery,
  useGetUserPerformanceQuery,
  useGetProjectProgressQuery,
  useGetTaskPriorityDistributionQuery,
  useGetTimeTrackingStatsQuery,
  useGetMonthlyTrendsQuery,
  useGetProductivityMetricsQuery,
  useGetWorkloadDistributionQuery,
  useGetProjectTimelineQuery,
  useGetTaskVelocityQuery,
  useGetResourceUtilizationQuery,
  useGetCustomReportQuery,
} = reportingApi;
