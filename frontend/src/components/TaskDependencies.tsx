import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TaskDependency, DependencyType, Task } from '../types';

interface TaskDependenciesProps {
  taskId: number;
  currentUserId: number;
  currentUserRole: string;
  dependencies?: TaskDependency[];
  allTasks?: Task[];
  onCreate?: (taskId: number, dependsOnTaskId: number, dependencyType: DependencyType, lagTime?: number) => Promise<void>;
  onUpdate?: (dependencyId: number, dependencyType: DependencyType, lagTime?: number) => Promise<void>;
  onDelete?: (dependencyId: number) => Promise<void>;
}

const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  taskId,
  currentUserId,
  currentUserRole,
  dependencies = [],
  allTasks = [],
  onCreate,
  onUpdate,
  onDelete
}) => {
  const { isDark } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [selectedDependencyType, setSelectedDependencyType] = useState<DependencyType>('finish_to_start');
  const [lagTime, setLagTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get available tasks that can be dependencies (exclude current task and already dependent tasks)
  const availableTasks = allTasks.filter(task =>
    task.id !== taskId &&
    !dependencies.some(dep => dep.dependsOnTaskId === task.id)
  );

  const handleCreate = async () => {
    if (!selectedTaskId || selectedTaskId === taskId) {
      alert('Please select a valid task to depend on');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/task-dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          dependsOnTaskId: selectedTaskId,
          dependencyType: selectedDependencyType,
          lagTime: lagTime || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dependency');
      }

      const newDependency = await response.json();
      console.log('Dependency created successfully:', newDependency);

      // Reset form
      setSelectedTaskId(0);
      setSelectedDependencyType('finish_to_start');
      setLagTime(0);
      setIsCreating(false);

      // Refresh the page to update dependencies
      window.location.reload();

    } catch (error) {
      console.error('Error creating dependency:', error);
      alert(`Failed to create dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (dependencyId: number) => {
    if (!window.confirm('Are you sure you want to delete this dependency?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/task-dependencies/${dependencyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete dependency');
      }

      // Refresh the page to update dependencies
      window.location.reload();

    } catch (error) {
      console.error('Error deleting dependency:', error);
      alert(`Failed to delete dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getDependencyTypeLabel = (type: DependencyType) => {
    switch (type) {
      case 'finish_to_start':
        return 'Finish to Start';
      case 'start_to_start':
        return 'Start to Start';
      case 'finish_to_finish':
        return 'Finish to Finish';
      case 'start_to_finish':
        return 'Start to Finish';
      default:
        return type;
    }
  };

  const getDependencyTypeDescription = (type: DependencyType) => {
    switch (type) {
      case 'finish_to_start':
        return 'Task can start when dependency task is finished';
      case 'start_to_start':
        return 'Task can start when dependency task starts';
      case 'finish_to_finish':
        return 'Task can finish when dependency task finishes';
      case 'start_to_finish':
        return 'Task can finish when dependency task starts';
      default:
        return '';
    }
  };

  const getDependencyIcon = (type: DependencyType) => {
    switch (type) {
      case 'finish_to_start':
        return '🔗';
      case 'start_to_start':
        return '🚀';
      case 'finish_to_finish':
        return '🏁';
      case 'start_to_finish':
        return '⏰';
      default:
        return '🔗';
    }
  };

  const formatLagTime = (days: number) => {
    if (days === 0) return 'No delay';
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} after`;
    return `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} before`;
  };

  const canManageDependencies = () => {
    return currentUserRole === 'admin';
  };

  return (
    <div className={`mt-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Task Dependencies</h3>

      {/* Create New Dependency */}
      {canManageDependencies() && (
        <div className="mb-6">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ➕ Add Dependency
            </button>
          ) : (
            <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h4 className="font-medium mb-3">Create New Dependency</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Depends On Task</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                    className={`w-full px-3 py-2 border rounded ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value={0}>Select a task...</option>
                    {availableTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dependency Type</label>
                  <select
                    value={selectedDependencyType}
                    onChange={(e) => setSelectedDependencyType(e.target.value as DependencyType)}
                    className={`w-full px-3 py-2 border rounded ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="finish_to_start">Finish to Start</option>
                    <option value="start_to_start">Start to Start</option>
                    <option value="finish_to_finish">Finish to Finish</option>
                    <option value="start_to_finish">Start to Finish</option>
                  </select>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getDependencyTypeDescription(selectedDependencyType)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Lag Time (days)</label>
                  <input
                    type="number"
                    value={lagTime}
                    onChange={(e) => setLagTime(Number(e.target.value))}
                    placeholder="0"
                    className={`w-full px-3 py-2 border rounded ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatLagTime(lagTime)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleCreate}
                    disabled={isLoading || !selectedTaskId}
                    className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedTaskId(0);
                      setSelectedDependencyType('finish_to_start');
                      setLagTime(0);
                    }}
                    className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dependencies List */}
      {dependencies.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium">Current Dependencies</h4>
          {dependencies.map((dependency) => (
            <div
              key={dependency.id}
              className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getDependencyIcon(dependency.dependencyType)}</span>
                    <span className="font-medium">
                      Depends on: {dependency.dependsOnTask?.title || 'Unknown Task'}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {getDependencyTypeLabel(dependency.dependencyType)}
                    </div>
                    <div>
                      <span className="font-medium">Lag Time:</span> {formatLagTime(dependency.lagTime || 0)}
                    </div>
                    {dependency.dependsOnTask && (
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                          dependency.dependsOnTask.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                          dependency.dependsOnTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {dependency.dependsOnTask.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {canManageDependencies() && (
                  <button
                    onClick={() => handleDelete(dependency.id)}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-lg">No dependencies</p>
          <p className="text-sm mt-2">
            {canManageDependencies()
              ? 'Add dependencies to define task relationships'
              : 'Dependencies will be shown here when created'
            }
          </p>
        </div>
      )}

      {/* Dependency Types Legend */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">Dependency Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <span>🔗</span>
            <span>Finish to Start: Task starts when dependency finishes</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🚀</span>
            <span>Start to Start: Task starts when dependency starts</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>🏁</span>
            <span>Finish to Finish: Task finishes when dependency finishes</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>⏰</span>
            <span>Start to Finish: Task finishes when dependency starts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDependencies;
