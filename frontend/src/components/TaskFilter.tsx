import React from 'react';
import { useGetUsersQuery } from '../store/api/userApi';
import { useGetProjectsQuery } from '../store/api/projectApi';

interface TaskFilterProps {
  filters: {
    status?: string;
    assigneeId?: number;
    projectId?: number;
  };
  onFiltersChange: (filters: {
    status?: string;
    assigneeId?: number;
    projectId?: number;
  }) => void;
  showProjectFilter?: boolean;
  showAssigneeFilter?: boolean;
  showStatusFilter?: boolean;
}

const TaskFilter: React.FC<TaskFilterProps> = ({
  filters,
  onFiltersChange,
  showProjectFilter = true,
  showAssigneeFilter = true,
  showStatusFilter = true,
}) => {
  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : status,
    });
  };

  const handleAssigneeChange = (assigneeId: number) => {
    onFiltersChange({
      ...filters,
      assigneeId: assigneeId === 0 ? undefined : assigneeId,
    });
  };

  const handleProjectChange = (projectId: number) => {
    onFiltersChange({
      ...filters,
      projectId: projectId === 0 ? undefined : projectId,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.assigneeId) count++;
    if (filters.projectId) count++;
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filter Tasks
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
              ({getActiveFilterCount()} active)
            </span>
          )}
        </h3>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {showStatusFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        )}

        {showAssigneeFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignee
            </label>
            <select
              value={filters.assigneeId || 0}
              onChange={(e) => handleAssigneeChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={usersLoading}
            >
              <option value={0}>All Assignees</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {showProjectFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project
            </label>
            <select
              value={filters.projectId || 0}
              onChange={(e) => handleProjectChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={projectsLoading}
            >
              <option value={0}>All Projects</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFilter;
