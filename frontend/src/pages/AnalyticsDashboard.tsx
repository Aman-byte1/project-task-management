import React, { useState, useEffect } from 'react';
import {
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
} from '../store/api/reportingApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';

const AnalyticsDashboard: React.FC = () => {
  // State for filters and real-time updates
  const [dateRange, setDateRange] = useState('30');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['all']);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // API hooks with real-time updates
  const { data: projectStats, isLoading: projectStatsLoading, refetch: refetchProjectStats } = useGetProjectStatsQuery();
  const { data: taskStats, isLoading: taskStatsLoading, refetch: refetchTaskStats } = useGetTaskStatsQuery();
  const { data: userPerformance, isLoading: userPerformanceLoading, refetch: refetchUserPerformance } = useGetUserPerformanceQuery();
  const { data: projectProgress, isLoading: projectProgressLoading, refetch: refetchProjectProgress } = useGetProjectProgressQuery();
  const { data: priorityDistribution, isLoading: priorityLoading, refetch: refetchPriorityDistribution } = useGetTaskPriorityDistributionQuery();
  const { data: timeTrackingStats, isLoading: timeTrackingLoading, refetch: refetchTimeTrackingStats } = useGetTimeTrackingStatsQuery();
  const { data: monthlyTrends, isLoading: trendsLoading, refetch: refetchMonthlyTrends } = useGetMonthlyTrendsQuery();
  const { data: productivityMetrics, isLoading: productivityLoading, refetch: refetchProductivityMetrics } = useGetProductivityMetricsQuery();
  const { data: workloadDistribution, isLoading: workloadLoading, refetch: refetchWorkloadDistribution } = useGetWorkloadDistributionQuery();
  const { data: projectTimeline, isLoading: timelineLoading, refetch: refetchProjectTimeline } = useGetProjectTimelineQuery();
  const { data: taskVelocity, isLoading: velocityLoading, refetch: refetchTaskVelocity } = useGetTaskVelocityQuery({ days: parseInt(dateRange) });
  const { data: resourceUtilization, isLoading: utilizationLoading, refetch: refetchResourceUtilization } = useGetResourceUtilizationQuery();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  // Auto-refresh functionality
  useEffect(() => {
    const interval = setInterval(() => {
      refetchProjectStats();
      refetchTaskStats();
      refetchUserPerformance();
      refetchProjectProgress();
      refetchPriorityDistribution();
      refetchTimeTrackingStats();
      refetchMonthlyTrends();
      refetchProductivityMetrics();
      refetchWorkloadDistribution();
      refetchProjectTimeline();
      refetchTaskVelocity();
      refetchResourceUtilization();
      setLastRefresh(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, dateRange]);

  const handleExport = (format: string) => {
    // Export functionality would be implemented here
    console.log(`Exporting data in ${format} format`);
  };

  const handleCustomReport = () => {
    // Custom report builder would be implemented here
    console.log('Opening custom report builder');
  };

  const isLoading = projectStatsLoading || taskStatsLoading || userPerformanceLoading ||
    projectProgressLoading || priorityLoading || timeTrackingLoading || trendsLoading ||
    productivityLoading || workloadLoading || timelineLoading || velocityLoading || utilizationLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-lg">Loading advanced analytics...</div>
      </div>
    );
  }

  // Prepare data for charts
  const priorityData = priorityDistribution ? [
    { name: 'Low', value: priorityDistribution.low, color: '#00C49F' },
    { name: 'Medium', value: priorityDistribution.medium, color: '#FFBB28' },
    { name: 'High', value: priorityDistribution.high, color: '#FF8042' },
  ] : [];

  const userPerformanceData = userPerformance?.map(user => ({
    name: user.name,
    completionRate: user.completionRate,
    totalTasks: user.totalTasks,
  })) || [];

  const projectProgressData = projectProgress?.map(project => ({
    name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
    progress: project.progress,
    totalTasks: project.totalTasks,
    completedTasks: project.completedTasks,
  })) || [];

  const monthlyTrendsData = monthlyTrends?.map(trend => ({
    month: trend.month,
    completed: trend.completedProjects,
  })) || [];

  const productivityData = productivityMetrics?.map(metric => ({
    name: metric.name,
    efficiency: metric.efficiency,
    onTimeCompletionRate: metric.onTimeCompletionRate,
    averageTaskCompletionTime: metric.averageTaskCompletionTime,
  })) || [];

  const workloadData = workloadDistribution?.map(workload => ({
    name: workload.name,
    workloadScore: workload.workloadScore,
    highPriority: workload.highPriority,
    mediumPriority: workload.mediumPriority,
    lowPriority: workload.lowPriority,
  })) || [];

  const velocityData = taskVelocity?.map(velocity => ({
    date: velocity.date,
    completedTasks: velocity.completedTasks,
  })) || [];

  const utilizationData = resourceUtilization?.map(util => ({
    name: util.name,
    utilizationRate: util.utilizationRate,
    allocatedHours: util.allocatedHours,
    capacity: util.capacity,
    isOverallocated: util.isOverallocated,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10000">10 seconds</option>
            <option value="30000">30 seconds</option>
            <option value="60000">1 minute</option>
            <option value="300000">5 minutes</option>
          </select>
          <button
            onClick={handleCustomReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Custom Report
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
            >
              PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Last refresh indicator */}
      <div className="text-sm text-gray-500 mb-4">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {projectStats && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-700">Projects</h3>
            <div className="text-3xl font-bold text-blue-600">{projectStats.total}</div>
            <div className="text-sm text-gray-500">
              {projectStats.active} active, {projectStats.completed} completed
            </div>
            <div className="text-sm text-green-600">
              {projectStats.completionRate.toFixed(1)}% completion rate
            </div>
          </div>
        )}

        {taskStats && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-700">Tasks</h3>
            <div className="text-3xl font-bold text-green-600">{taskStats.total}</div>
            <div className="text-sm text-gray-500">
              {taskStats.completed} completed, {taskStats.inProgress} in progress
            </div>
            <div className="text-sm text-green-600">
              {taskStats.completionRate.toFixed(1)}% completion rate
            </div>
          </div>
        )}

        {timeTrackingStats && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-700">Time Tracking</h3>
            <div className="text-3xl font-bold text-purple-600">{timeTrackingStats.totalEstimatedHours}h</div>
            <div className="text-sm text-gray-500">
              {timeTrackingStats.totalActualHours}h actual
            </div>
            <div className="text-sm text-purple-600">
              {timeTrackingStats.timeAccuracy.toFixed(1)}% accuracy
            </div>
          </div>
        )}

        {priorityDistribution && (
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-gray-700">Priority Distribution</h3>
            <div className="text-3xl font-bold text-red-600">{priorityDistribution.high}</div>
            <div className="text-sm text-gray-500">High priority tasks</div>
            <div className="text-sm text-gray-500">
              {priorityDistribution.total} total tasks
            </div>
          </div>
        )}
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Priority Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Task Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Completion Velocity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Task Completion Velocity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="completedTasks" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Completed Tasks" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productivity and Workload Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Productivity Metrics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Team Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="efficiency" fill="#8884d8" name="Efficiency %" />
              <Line yAxisId="right" type="monotone" dataKey="onTimeCompletionRate" stroke="#82ca9d" strokeWidth={2} name="On-time Rate %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Workload Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={workloadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="highPriority" stackId="a" fill="#FF8042" name="High Priority" />
              <Bar dataKey="mediumPriority" stackId="a" fill="#FFBB28" name="Medium Priority" />
              <Bar dataKey="lowPriority" stackId="a" fill="#00C49F" name="Low Priority" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Utilization and Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Resource Utilization */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Resource Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={utilizationData}>
              <RadialBar
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                dataKey="utilizationRate"
                fill="#8884d8"
              />
              <Legend />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Progress */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" fill="#82ca9d" name="Progress %" />
              <Bar dataKey="completedTasks" fill="#8884d8" name="Completed Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Monthly Project Completion Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrendsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke="#8884d8" strokeWidth={3} name="Completed Projects" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Performance Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">User Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Tasks</th>
                  <th className="px-4 py-2 text-left">Completed</th>
                  <th className="px-4 py-2 text-left">Rate</th>
                </tr>
              </thead>
              <tbody>
                {userPerformance?.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.totalTasks}</td>
                    <td className="px-4 py-2">{user.completedTasks}</td>
                    <td className="px-4 py-2">{user.completionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Progress Table */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Project Progress Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Project</th>
                  <th className="px-4 py-2 text-left">Tasks</th>
                  <th className="px-4 py-2 text-left">Completed</th>
                  <th className="px-4 py-2 text-left">Progress</th>
                </tr>
              </thead>
              <tbody>
                {projectProgress?.map((project) => (
                  <tr key={project.id} className="border-t">
                    <td className="px-4 py-2">{project.name}</td>
                    <td className="px-4 py-2">{project.totalTasks}</td>
                    <td className="px-4 py-2">{project.completedTasks}</td>
                    <td className="px-4 py-2">{project.progress.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
