import React, { useState } from 'react';
import { useGetTasksQuery, useUpdateTaskMutation } from '../store/api/taskApi';
import { useTheme } from '../contexts/ThemeContext';
import TaskComments from '../components/TaskComments';
import FileAttachments from '../components/FileAttachments';
import TimeTracker from '../components/TimeTracker';
import TaskDependencies from '../components/TaskDependencies';
import TaskFilter from '../components/TaskFilter';

const EmployeeDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [filters, setFilters] = useState<{
    status?: string;
    assigneeId?: number;
    projectId?: number;
  }>({});
  const { data: tasks, isLoading } = useGetTasksQuery(filters);
  const [updateTask] = useUpdateTaskMutation();
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const handleStatusUpdate = async (taskId: number, status: 'todo' | 'in_progress' | 'done') => {
    await updateTask({ id: taskId, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

      <TaskFilter
        filters={filters}
        onFiltersChange={setFilters}
        showProjectFilter={false}
        showAssigneeFilter={false}
        showStatusFilter={true}
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks?.map((task: any) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{task.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-3 line-clamp-2`}>
                  {task.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                    Priority: {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="text-sm text-gray-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Project: {task.project?.name}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
                <select
                  className="text-sm px-2 py-1 border rounded"
                  value={task.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate(task.id, e.target.value as any);
                  }}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">{selectedTask.title}</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Task Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {selectedTask.description}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <span className={`ml-2 font-medium ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    {selectedTask.dueDate && (
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <span className="ml-2 text-gray-500">
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Project:</span>
                      <span className="ml-2 text-gray-500">
                        {selectedTask.project?.name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Assignee:</span>
                      <span className="ml-2 text-gray-500">
                        {selectedTask.assignee?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Time Tracking</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">Estimated Hours:</span>
                      <span className="ml-2 text-gray-500">
                        {selectedTask.estimatedHours || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Actual Hours:</span>
                      <span className="ml-2 text-gray-500">
                        {selectedTask.actualHours || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <TaskComments
                taskId={selectedTask.id}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="employee" // TODO: Get from auth context
              />

              {/* Time Tracking Section */}
              <TimeTracker
                taskId={selectedTask.id}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="employee" // TODO: Get from auth context
                timeEntries={selectedTask.timeEntries || []}
              />

              {/* Dependencies Section */}
              <TaskDependencies
                taskId={selectedTask.id}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="employee" // TODO: Get from auth context
                dependencies={selectedTask.dependencies || []}
                allTasks={tasks || []}
              />

              {/* Attachments Section */}
              <FileAttachments
                taskId={selectedTask.id}
                attachments={selectedTask.attachments || []}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="employee" // TODO: Get from auth context
              />
            </div>
          </div>
        </div>
      )}

      {tasks?.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-2">Tasks assigned to you will appear here</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
