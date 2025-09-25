import React, { useState } from 'react';
import { useGetUsersQuery, useDeleteUserMutation } from '../store/api/userApi';
import { useGetProjectsQuery, useCreateProjectMutation, useDeleteProjectMutation } from '../store/api/projectApi';
import { useGetTasksQuery, useCreateTaskMutation, useDeleteTaskMutation } from '../store/api/taskApi';
import { useTheme } from '../contexts/ThemeContext';
import TaskComments from '../components/TaskComments';
import FileAttachments from '../components/FileAttachments';
import TimeTracker from '../components/TimeTracker';
import TaskDependencies from '../components/TaskDependencies';
import TaskFilter from '../components/TaskFilter';

const AdminDashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'tasks'>('users');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [filters, setFilters] = useState<{
    status?: string;
    assigneeId?: number;
    projectId?: number;
  }>({});

  const { data: users, isLoading: usersLoading } = useGetUsersQuery();
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: tasks, isLoading: tasksLoading } = useGetTasksQuery(filters);

  const [deleteUser] = useDeleteUserMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [createProject] = useCreateProjectMutation();
  const [createTask] = useCreateTaskMutation();

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'completed' | 'cancelled',
    teamMembers: [] as number[]
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    projectId: 0,
    assigneeId: 0,
    status: 'todo' as 'todo' | 'in_progress' | 'done',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    labels: '',
    estimatedHours: 0,
    dueDate: '',
    actualHours: 0,
  });

  const handleCreateProject = async () => {
    if (newProject.name && newProject.description) {
      try {
        await createProject(newProject).unwrap();
        setNewProject({ name: '', description: '', status: 'active', teamMembers: [] });
        // The project list will automatically refresh due to RTK Query cache invalidation
        alert('Project created successfully!');
      } catch (error) {
        console.error('Failed to create project:', error);
        alert('Failed to create project. Please try again.');
      }
    } else {
      alert('Please fill in both project name and description.');
    }
  };

  const handleCreateTask = async () => {
    if (newTask.title && newTask.description && newTask.projectId && newTask.assigneeId) {
      try {
        await createTask(newTask).unwrap();
        setNewTask({
          title: '',
          description: '',
          projectId: 0,
          assigneeId: 0,
          status: 'todo',
          priority: 'medium',
          labels: '',
          estimatedHours: 0,
          dueDate: '',
          actualHours: 0,
        });
        alert('Task created successfully!');
      } catch (error) {
        console.error('Failed to create task:', error);
        alert('Failed to create task. Please try again.');
      }
    } else {
      alert('Please fill in all required fields (title, description, project, and assignee).');
    }
  };

  return (
    <div className={`p-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(['users', 'projects', 'tasks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6`}>
          <h2 className="text-xl font-semibold mb-4">Users Management</h2>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users?.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6`}>
          <h2 className="text-xl font-semibold mb-4">Projects Management</h2>

          <div className="mb-6 p-4 border rounded">
            <h3 className="font-semibold mb-4">Create New Project</h3>

            {/* Project Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name *</label>
                <input
                  type="text"
                  placeholder="Enter project name"
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project Status</label>
                <select
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newProject.status}
                  onChange={(e) => setNewProject({ ...newProject, status: e.target.value as 'active' | 'completed' | 'cancelled' })}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                placeholder="Enter project description"
                rows={3}
                className={`w-full px-3 py-2 border rounded ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            {/* Team Members */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Team Members</label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {users?.map((user) => (
                  <label key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                    <input
                      type="checkbox"
                      checked={newProject.teamMembers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProject({
                            ...newProject,
                            teamMembers: [...newProject.teamMembers, user.id]
                          });
                        } else {
                          setNewProject({
                            ...newProject,
                            teamMembers: newProject.teamMembers.filter(id => id !== user.id)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user.name} ({user.email}) - {user.role}
                    </span>
                  </label>
                ))}
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Selected: {newProject.teamMembers.length} member(s)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setNewProject({ name: '', description: '', status: 'active', teamMembers: [] })}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name || !newProject.description}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            </div>

            {/* Form Validation Messages */}
            {!newProject.name && (
              <p className="text-red-500 text-sm mt-2">Project name is required</p>
            )}
            {!newProject.description && (
              <p className="text-red-500 text-sm mt-2">Description is required</p>
            )}
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading projects...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects?.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-gray-600">{project.description}</p>
                      <p className="text-sm text-gray-500">
                        Status: {project.status} | Owner: {project.owner?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6`}>
          <h2 className="text-xl font-semibold mb-4">Tasks Management</h2>

          <div className="mb-6 p-4 border rounded">
            <h3 className="font-semibold mb-4">Create New Task</h3>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="Enter task title"
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Project *</label>
                <select
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({ ...newTask, projectId: Number(e.target.value) })}
                >
                  <option value={0}>Select Project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assignee *</label>
                <select
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.assigneeId}
                  onChange={(e) => setNewTask({ ...newTask, assigneeId: Number(e.target.value) })}
                >
                  <option value={0}>Select Assignee</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as 'todo' | 'in_progress' | 'done' })}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estimated Hours</label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.estimatedHours || ''}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Labels/Tags</label>
                <input
                  type="text"
                  placeholder="bug, feature, urgent"
                  className={`w-full px-3 py-2 border rounded ${
                    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  value={newTask.labels}
                  onChange={(e) => setNewTask({ ...newTask, labels: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Description *</label>
              <textarea
                placeholder="Enter task description"
                rows={4}
                className={`w-full px-3 py-2 border rounded ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setNewTask({
                  title: '',
                  description: '',
                  projectId: 0,
                  assigneeId: 0,
                  status: 'todo',
                  priority: 'medium',
                  labels: '',
                  estimatedHours: 0,
                  dueDate: '',
                  actualHours: 0,
                })}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTask.title || !newTask.description || !newTask.projectId || !newTask.assigneeId}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Task
              </button>
            </div>

            {/* Form Validation Messages */}
            {!newTask.title && (
              <p className="text-red-500 text-sm mt-2">Title is required</p>
            )}
            {!newTask.description && (
              <p className="text-red-500 text-sm mt-2">Description is required</p>
            )}
            {!newTask.projectId && (
              <p className="text-red-500 text-sm mt-2">Project selection is required</p>
            )}
            {!newTask.assigneeId && (
              <p className="text-red-500 text-sm mt-2">Assignee selection is required</p>
            )}
          </div>

          <TaskFilter
            filters={filters}
            onFiltersChange={setFilters}
            showProjectFilter={true}
            showAssigneeFilter={true}
            showStatusFilter={true}
          />

          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-gray-600">Loading tasks...</span>
            </div>
          ) : (
            <div className="grid gap-4">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{task.title}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                        {task.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        Status: {task.status} | Priority: {task.priority} | Assignee: {task.assignee?.name}
                      </p>
                      {task.comments && task.comments.length > 0 && (
                        <p className="text-sm text-blue-500 mt-1">
                          {task.comments.length} comment(s)
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedTask.status === 'todo' ? 'bg-gray-100 text-gray-800' :
                        selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedTask.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>
                      <span className={`ml-2 font-medium ${
                        selectedTask.priority === 'low' ? 'text-green-600' :
                        selectedTask.priority === 'medium' ? 'text-yellow-600' :
                        selectedTask.priority === 'high' ? 'text-red-600' :
                        'text-purple-600'
                      }`}>
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
                currentUserRole="admin" // Admin can manage all comments
              />

              {/* Time Tracking Section */}
              <TimeTracker
                taskId={selectedTask.id}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="admin" // Admin can manage all time entries
                timeEntries={selectedTask.timeEntries || []}
              />

              {/* Dependencies Section */}
              <TaskDependencies
                taskId={selectedTask.id}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="admin" // Admin can manage all dependencies
                dependencies={selectedTask.dependencies || []}
                allTasks={tasks || []}
              />

              {/* Attachments Section */}
              <FileAttachments
                taskId={selectedTask.id}
                attachments={selectedTask.attachments || []}
                currentUserId={1} // TODO: Get from auth context
                currentUserRole="admin" // Admin can manage all attachments
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
