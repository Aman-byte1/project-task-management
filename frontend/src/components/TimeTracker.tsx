import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { TimeEntry } from '../types';

interface TimeTrackerProps {
  taskId: number;
  currentUserId: number;
  currentUserRole: string;
  onStart?: (taskId: number, description?: string) => Promise<void>;
  onStop?: (timeEntryId: number) => Promise<void>;
  onUpdate?: (timeEntryId: number, description: string) => Promise<void>;
  onDelete?: (timeEntryId: number) => Promise<void>;
  timeEntries?: TimeEntry[];
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  taskId,
  currentUserId,
  currentUserRole,
  onStart,
  onStop,
  onUpdate,
  onDelete,
  timeEntries = []
}) => {
  const { isDark } = useTheme();
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for running time entry on component mount
  useEffect(() => {
    const runningEntry = timeEntries.find(entry => entry.isRunning);
    if (runningEntry) {
      setIsRunning(true);
      setCurrentEntry(runningEntry);
      setDescription(runningEntry.description || '');

      // Start the timer
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(runningEntry.startTime).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeEntries]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/time-entries/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          taskId,
          description: description.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start time entry');
      }

      const newEntry = await response.json();
      setIsRunning(true);
      setCurrentEntry(newEntry);

      // Start the timer
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(newEntry.startTime).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      // Store interval ID for cleanup
      (window as any).timeTrackerInterval = interval;

    } catch (error) {
      console.error('Error starting time entry:', error);
      alert(`Failed to start time tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentEntry) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/time-entries/${currentEntry.id}/stop`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop time entry');
      }

      const updatedEntry = await response.json();
      setIsRunning(false);
      setCurrentEntry(null);
      setElapsedTime(0);
      setDescription('');

      // Clear the timer interval
      if ((window as any).timeTrackerInterval) {
        clearInterval((window as any).timeTrackerInterval);
        delete (window as any).timeTrackerInterval;
      }

      // Refresh the page to update time entries
      window.location.reload();

    } catch (error) {
      console.error('Error stopping time entry:', error);
      alert(`Failed to stop time tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!currentEntry || !description.trim()) {
      alert('Please enter a description first');
      return;
    }

    try {
      console.log('Updating time entry:', currentEntry.id, 'with description:', description.trim());

      const response = await fetch(`http://localhost:5000/api/time-entries/${currentEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          description: description.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update response error:', errorData);
        throw new Error(errorData.error || 'Failed to update time entry');
      }

      const updatedEntry = await response.json();
      console.log('Update successful:', updatedEntry);
      setCurrentEntry(updatedEntry);

      alert('Description updated successfully!');

    } catch (error) {
      console.error('Error updating time entry:', error);
      alert(`Failed to update time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (timeEntryId: number) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/time-entries/${timeEntryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete time entry');
      }

      // Refresh the page to update time entries
      window.location.reload();

    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert(`Failed to delete time entry: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const canManageTimeEntry = (entry: TimeEntry) => {
    return entry.userId === currentUserId || currentUserRole === 'admin';
  };

  return (
    <div className={`mt-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <h3 className="text-lg font-semibold mb-4">Time Tracking</h3>

      {/* Current Timer */}
      <div className="mb-6">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium">Current Session</h4>
              {isRunning && (
                <div className="text-2xl font-mono font-bold text-blue-500">
                  {formatTime(elapsedTime)}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {isLoading ? 'Starting...' : '▶ Start'}
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  disabled={isLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {isLoading ? 'Stopping...' : '⏸ Stop'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you working on?"
                  className={`flex-1 px-3 py-2 border rounded ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                {isRunning && (
                  <button
                    onClick={handleUpdateDescription}
                    className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
                  >
                    Update
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries History */}
      <div>
        <h4 className="font-medium mb-3">Time Entries</h4>
        {timeEntries.length > 0 ? (
          <div className="space-y-3">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${entry.isRunning ? 'text-green-500' : ''}`}>
                        {entry.isRunning ? '🟢 Running' : '⚪ Completed'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.startTime).toLocaleString()}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm mt-1">{entry.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">
                        Duration: {formatDuration(entry.duration)}
                      </span>
                      {entry.endTime && (
                        <span className="text-sm text-gray-500">
                          Ended: {new Date(entry.endTime).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManageTimeEntry(entry) && !entry.isRunning && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No time entries yet</p>
            <p className="text-xs mt-1">Start tracking time to see your entries here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeTracker;
