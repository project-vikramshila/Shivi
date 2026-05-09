import React from 'react';
import type { Checkpoint } from '@/agent/checkpoints';

interface CheckpointVisualizerProps {
  checkpoints: Checkpoint[];
  onRestoreCheckpoint?: (checkpointId: string) => void;
}

export const CheckpointVisualizer: React.FC<CheckpointVisualizerProps> = ({
  checkpoints,
  onRestoreCheckpoint,
}) => {
  if (checkpoints.length === 0) {
    return (\n      <div className=\"p-4 bg-gray-50 rounded-lg text-center text-gray-500\">\n        <p>No checkpoints yet</p>\n      </div>\n    );\n  }\n\n  const sortedCheckpoints = [...checkpoints].sort((a, b) => b.timestamp - a.timestamp);\n\n  return (\n    <div className=\"space-y-3\">\n      <h3 className=\"font-semibold text-gray-700\">📍 Checkpoints</h3>\n      <div className=\"space-y-2\">\n        {sortedCheckpoints.map((checkpoint, index) => (\n          <div\n            key={checkpoint.id}\n            className=\"p-3 bg-white border border-gray-200 rounded flex items-start justify-between hover:shadow-md transition\"\n          >\n            <div className=\"flex-1\">\n              <div className=\"flex items-center gap-2\">\n                <span className=\"text-xl\">📍</span>\n                <p className=\"font-medium text-gray-900\">Step {checkpoint.stepIndex + 1}</p>\n                {index === 0 && <span className=\"px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium\">Latest</span>}\n              </div>\n              <p className=\"text-sm text-gray-600 mt-1\">{checkpoint.step.name}</p>\n              <p className=\"text-xs text-gray-500 mt-1\">\n                {new Date(checkpoint.timestamp).toLocaleTimeString()}\n              </p>\n            </div>\n            <button\n              onClick={() => onRestoreCheckpoint?.(checkpoint.id)}\n              className=\"px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded text-sm transition\"\n            >\n              🔄 Restore\n            </button>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n};