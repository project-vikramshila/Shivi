import React, { useState, useEffect } from 'react';
import type { AgentWorkflow, AgentTaskStep } from '@/agent/core/types';

interface AgentDashboardProps {
  workflow: AgentWorkflow | null;
  onPause?: (workflowId: string) => void;
  onCancel?: (workflowId: string) => void;
  onResume?: (workflowId: string) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  workflow,
  onPause,
  onCancel,
  onResume,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  if (!workflow) {
    return (
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <p className="text-gray-400">No active workflow</p>
      </div>
    );
  }

  const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
  const failedSteps = workflow.steps.filter(s => s.status === 'failed').length;
  const totalSteps = workflow.steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  const toggleStepDetails = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepStatusColor = (status: AgentTaskStep['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStepStatusIcon = (status: AgentTaskStep['status']): string => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'running':
        return '⟳';
      case 'failed':
        return '✕';
      case 'pending':
        return '○';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">🤖 Autonomous Agent</h2>
        <p className="text-sm opacity-90 mb-3">{workflow.title}</p>

        {/* Status */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">
            Status: <span className="font-semibold">{workflow.status.toUpperCase()}</span>
          </span>
          <span className="text-sm">
            {completedSteps}/{totalSteps}
            {failedSteps > 0 && <span className="ml-2 text-red-300">({failedSteps} failed)</span>}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {workflow.status === 'running' && (
          <>
            <button
              onClick={() => onPause?.(workflow.id)}
              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition"
            >
              ⏸ Pause
            </button>
            <button
              onClick={() => onCancel?.(workflow.id)}
              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
            >
              ✕ Cancel
            </button>
          </>
        )}
        {workflow.status === 'paused' && (
          <button
            onClick={() => onResume?.(workflow.id)}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition"
          >
            ▶ Resume
          </button>
        )}
      </div>

      {/* Execution Timeline */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-700">Execution Timeline</h3>
        </div>
        <div className="divide-y">
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="p-3 hover:bg-gray-50 transition cursor-pointer">
              {/* Step Header */}
              <button
                onClick={() => toggleStepDetails(step.id)}
                className="w-full flex items-start justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${getStepStatusColor(step.status)}`}>
                    {getStepStatusIcon(step.status)}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{index + 1}. {step.name}</p>
                    {step.description && (
                      <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-gray-400">
                  {expandedSteps.has(step.id) ? '▼' : '▶'}
                </span>
              </button>

              {/* Step Details */}
              {expandedSteps.has(step.id) && (
                <div className="mt-3 pl-9 border-l-2 border-gray-200 pt-3 space-y-2 text-sm">
                  <div>
                    <label className="text-gray-600">App:</label>
                    <span className="ml-2 font-mono text-gray-900">{step.app}</span>
                  </div>
                  <div>
                    <label className="text-gray-600">Action:</label>
                    <span className="ml-2 font-mono text-gray-900">{step.action}</span>
                  </div>
                  {step.status === 'running' && step.startedAt && (
                    <div>
                      <label className="text-gray-600">Running for:</label>
                      <span className="ml-2 text-blue-600">{Math.round((Date.now() - step.startedAt) / 1000)}s</span>
                    </div>
                  )}\n                  {step.finishedAt && step.startedAt && (\n                    <div>\n                      <label className=\"text-gray-600\">Duration:</label>\n                      <span className=\"ml-2 text-gray-900\">{Math.round((step.finishedAt - step.startedAt) / 1000)}s</span>\n                    </div>\n                  )}\n                  {step.error && (\n                    <div>\n                      <label className=\"text-red-600\">Error:</label>\n                      <p className=\"ml-2 text-red-600 font-mono text-xs mt-1 bg-red-50 p-2 rounded\">{step.error}</p>\n                    </div>\n                  )}\n                </div>\n              )}\n            </div>\n          ))}\n        </div>\n      </div>\n\n      {/* Stats Footer */}\n      <div className=\"grid grid-cols-4 gap-3 text-center\">\n        <div className=\"bg-green-50 p-3 rounded\">\n          <p className=\"text-2xl font-bold text-green-600\">{completedSteps}</p>\n          <p className=\"text-xs text-green-700\">Completed</p>\n        </div>\n        <div className=\"bg-blue-50 p-3 rounded\">\n          <p className=\"text-2xl font-bold text-blue-600\">{workflow.steps.filter(s => s.status === 'running').length}</p>\n          <p className=\"text-xs text-blue-700\">Running</p>\n        </div>\n        <div className=\"bg-yellow-50 p-3 rounded\">\n          <p className=\"text-2xl font-bold text-yellow-600\">{workflow.steps.filter(s => s.status === 'pending').length}</p>\n          <p className=\"text-xs text-yellow-700\">Pending</p>\n        </div>\n        <div className=\"bg-red-50 p-3 rounded\">\n          <p className=\"text-2xl font-bold text-red-600\">{failedSteps}</p>\n          <p className=\"text-xs text-red-700\">Failed</p>\n        </div>\n      </div>\n    </div>\n  );\n};