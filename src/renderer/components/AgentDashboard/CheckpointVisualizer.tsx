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
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        <p>No checkpoints yet</p>
      </div>
    );
  }

  const sortedCheckpoints = [...checkpoints].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">📍 Checkpoints</h3>
      <div className="space-y-2">
        {sortedCheckpoints.map((checkpoint, index) => (
          <div
            key={checkpoint.id}
            className="p-3 bg-white border border-gray-200 rounded flex items-start justify-between hover:shadow-md transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <p className="font-medium text-gray-900">Step {checkpoint.stepIndex + 1}</p>
                {index === 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">Latest</span>}
              </div>
              <p className="text-sm text-gray-600 mt-1">{checkpoint.step.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(checkpoint.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => onRestoreCheckpoint?.(checkpoint.id)}
              className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded text-sm transition"
            >
              🔄 Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};