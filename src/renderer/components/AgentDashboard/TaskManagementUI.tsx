import React, { useState } from 'react';
import type { AgentTask, TaskPriority, TaskStatus } from '@/agent/tasks';
import type { AgentWorkflow } from '@/agent/core/types';

interface TaskManagementUIProps {
  tasks: AgentTask[];
  activeWorkflow?: AgentWorkflow | null;
  onPauseTask?: (taskId: string) => void;
  onResumeTask?: (taskId: string) => void;
  onCancelTask?: (taskId: string) => void;
  onRetryTask?: (taskId: string) => void;
}

export const TaskManagementUI: React.FC<TaskManagementUIProps> = ({
  tasks,
  activeWorkflow,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onRetryTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const toggleTaskDetails = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'queued':
        return 'text-purple-600 bg-purple-50';
      case 'scheduled':
        return 'text-indigo-600 bg-indigo-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'running':
        return '⟳';
      case 'paused':
        return '⏸';
      case 'failed':
        return '✕';
      case 'queued':
        return '⧖';
      case 'scheduled':
        return '⏰';
      case 'cancelled':
        return '✗';
    }
  };

  const getRuntime = (task: AgentTask): string => {
    if (!task.startedAt) return '-';
    const end = task.completedAt || Date.now();
    const seconds = Math.round((end - task.startedAt) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">📋 Task Management</h2>
        <p className="text-sm opacity-90">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          {tasks.length > filteredTasks.length && ` (${tasks.length} total)`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 bg-gray-50 p-3 rounded-lg">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 bg-white border border-gray-300 rounded text-sm"
        >
          <option value="all">All Status</option>
          <option value="queued">Queued</option>
          <option value="scheduled">Scheduled</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as any)}
          className="px-3 py-2 bg-white border border-gray-300 rounded text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTasks.map(task => (
              <div key={task.id} className="p-4 hover:bg-gray-50 transition">
                {/* Task Header */}
                <button
                  onClick={() => toggleTaskDetails(task.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Status Icon */}
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${getStatusColor(task.status)}`}>
                      {getStatusIcon(task.status)}
                    </span>

                    {/* Task Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{task.goal.title}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{task.goal.description}</p>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <span className="text-gray-400 ml-2">{expandedTasks.has(task.id) ? '▼' : '▶'}</span>
                </button>

                {/* Task Details */}
                {expandedTasks.has(task.id) && (
                  <div className="mt-4 pl-11 border-l-2 border-gray-200 pt-4 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-600">Status:</label>
                        <p className="font-mono text-gray-900">{task.status}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Runtime:</label>
                        <p className="font-mono text-gray-900">{getRuntime(task)}</p>
                      </div>
                      {task.scheduledFor && (
                        <div>
                          <label className="text-gray-600">Scheduled:</label>
                          <p className="font-mono text-gray-900">
                            {new Date(task.scheduledFor).toLocaleTimeString()}
                          </p>
                        </div>
                      )}
                      {task.retry && (
                        <div>
                          <label className="text-gray-600">Retries:</label>
                          <p className="font-mono text-gray-900">{task.retry.count}/{task.retry.maxRetries}</p>
                        </div>
                      )}
                    </div>

                    {/* Task Actions */}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                      {task.status === 'running' && (
                        <>
                          <button
                            onClick={() => onPauseTask?.(task.id)}
                            className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded text-xs transition"
                          >
                            ⏸ Pause
                          </button>
                          <button
                            onClick={() => onCancelTask?.(task.id)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs transition"
                          >
                            ✕ Cancel
                          </button>
                        </>
                      )}
                      {task.status === 'paused' && (
                        <button
                          onClick={() => onResumeTask?.(task.id)}
                          className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs transition"
                        >
                          ▶ Resume
                        </button>
                      )}
                      {task.status === 'failed' && (
                        <button
                          onClick={() => onRetryTask?.(task.id)}
                          className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs transition"
                        >
                          🔄 Retry
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};