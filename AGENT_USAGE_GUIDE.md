/**
 * INTEGRATION GUIDE: Using the Autonomous Agent System
 */

# 🚀 How to Use the Autonomous Agent System

## Quick Start

### 1. Execute a Goal Autonomously

```typescript
import { agentPlanner, enhancedExecutionEngine, AutonomyManager } from '@shivi/agent';

// Create agent planner and manager
const planner = new AgentPlanner();
const autonomy = new AutonomyManager();

// Define a goal
const goal: AgentGoal = {
  id: 'goal-1',
  title: 'kal ki meeting prepare karo',
  description: 'Prepare for tomorrow\'s meeting by gathering context',
  createdAt: Date.now(),
  targetApps: ['calendar', 'browser', 'email'],
  priority: 1,
  status: 'pending'
};

// Execute with default autonomy (assist mode)
const result = await enhancedExecutionEngine.executeGoal(
  goal,
  planner,
  autonomy.getDefaultSettings()
);

if (result.success) {
  console.log('✅ Goal completed!');
} else {
  console.log('❌ Goal failed:', result.error);
}
```

### 2. Monitor Execution in Real-Time

```typescript
import { agentEventBus } from '@shivi/agent';

// Listen to workflow events
agentEventBus.subscribe('workflow_completed', (event) => {
  console.log('🎉 Workflow completed:', event.payload);
});

agentEventBus.subscribe('workflow_step_completed', (event) => {
  console.log('✅ Step done:', event.payload.stepId);
});

agentEventBus.subscribe('ai_decision_made', (event) => {
  console.log('🧠 AI Decision:', event.payload.decision);
  console.log('💬 Message:', event.payload.narrative);
});
```

### 3. Use the Task Queue for Long-Running Tasks

```typescript
import { taskQueue } from '@shivi/agent';

const task: AgentTask = {
  id: 'task-1',
  goal: myGoal,
  priority: 'high',
  status: 'queued',
  createdAt: Date.now()
};

// Enqueue task
taskQueue.enqueueTask(task);

// Dequeue when ready to execute
const nextTask = taskQueue.dequeueTask();
if (nextTask) {
  await enhancedExecutionEngine.executeGoal(nextTask.goal, planner);
  taskQueue.updateTaskStatus(nextTask.id, 'completed');
}
```

### 4. Create Checkpoints for Safe Execution

```typescript
import { checkpointManager } from '@shivi/agent';

// Before critical action
const checkpoint = checkpointManager.createCheckpoint(
  workflow,
  currentStepIndex,
  {
    userEmail: 'user@example.com',
    messageContent: 'Important message',
    requiresConfirmation: true
  }
);

// On failure, restore from checkpoint
const restored = checkpointManager.restoreFromCheckpoint(
  checkpoint,
  workflow
);

await enhancedExecutionEngine.resumeFromCheckpoint(
  restored.id,
  autonomySettings
);
```

### 5. Handle Retry Logic

```typescript
import { agentRetryManager } from '@shivi/agent';

const retryResult = await agentRetryManager.retryStep(
  step,
  async () => {
    // Your async operation
    return await connector.execute(step.action, step.params);
  },
  autonomySettings
);

console.log(`Attempted ${retryResult.attempts} times`);
console.log(`Success: ${retryResult.success}`);
console.log(`Total delay: ${retryResult.totalDelay}ms`);
```

### 6. Use AI Decision Engine

```typescript
import { aiDecisionEngine } from '@shivi/agent';

const decision = await aiDecisionEngine.makeDecision({
  currentStep: step,
  workflow: workflow,
  error: 'Network timeout',
  previousAttempts: 2,
  autonomy: autonomySettings,
  recentHistory: previousSteps
});

console.log('Recommendation:', decision.recommendation);
console.log('Action:', decision.action);
console.log('Hindi message:', decision.narrativeHindi);
console.log('Confidence:', decision.confidence);
```

---

## Advanced Usage

### Custom Autonomy Levels

```typescript
import { AutonomyManager } from '@shivi/agent';

const autonomy = new AutonomyManager();

// Full autonomous mode
const autonomousSettings = {
  mode: 'autonomous' as const,
  requireConfirmationFor: ['purchase'],  // Only ask for purchases
  proactiveEnabled: true,
  privacyLevel: 'relaxed'
};

// Strict mode
const strictSettings = {
  mode: 'suggest' as const,
  requireConfirmationFor: [
    'sendMessage',
    'deleteData',
    'purchase',
    'modifySettings'
  ],
  proactiveEnabled: false,
  privacyLevel: 'strict'
};
```

### Custom Retry Strategies

```typescript
agentRetryManager.addStrategy('aggressive-network', {
  name: 'aggressive-network',
  maxRetries: 5,
  backoffMs: 500,
  backoffMultiplier: 1.2,
  maxBackoffMs: 10000
});
```

### Multi-Step Workflow Control

```typescript
const workflow = planner.planGoal(goal);
const execution = enhancedExecutionEngine.executeWorkflow(
  workflow,
  autonomySettings
);

// Can pause and resume
enhancedExecutionEngine.pauseWorkflow(workflow.id);
// ... do something else ...
enhancedExecutionEngine.resumeFromCheckpoint(workflow.id, autonomySettings);

// Or cancel
enhancedExecutionEngine.cancelWorkflow(workflow.id);
```

---

## React Component Usage

### AgentDashboard

```tsx
import { AgentDashboard } from '@components/AgentDashboard';
import { enhancedExecutionEngine } from '@shivi/agent';

export function WorkflowMonitor() {
  const [workflow, setWorkflow] = useState<AgentWorkflow | null>(null);

  const activeWorkflows = enhancedExecutionEngine.getActiveWorkflows();

  return (
    <AgentDashboard
      workflow={activeWorkflows[0]}
      onPause={(wfId) => enhancedExecutionEngine.pauseWorkflow(wfId)}
      onCancel={(wfId) => enhancedExecutionEngine.cancelWorkflow(wfId)}
      onResume={(wfId) => enhancedExecutionEngine.resumeFromCheckpoint(wfId, settings)}
    />
  );
}
```

### TaskManagementUI

```tsx
import { TaskManagementUI } from '@components/AgentDashboard';
import { taskQueue } from '@shivi/agent';

export function TaskManager() {
  const allTasks = taskQueue.getTasks();

  return (
    <TaskManagementUI
      tasks={allTasks}
      onPauseTask={(taskId) => taskQueue.pauseTask(taskId)}
      onResumeTask={(taskId) => taskQueue.resumeTask(taskId)}
      onCancelTask={(taskId) => taskQueue.cancelTask(taskId)}
      onRetryTask={(taskId) => taskQueue.retryTask(taskId)}
    />
  );
}
```

### CheckpointVisualizer

```tsx
import { CheckpointVisualizer } from '@components/AgentDashboard';
import { checkpointManager } from '@shivi/agent';

export function Recovery() {
  const checkpoints = checkpointManager.getAllCheckpoints(workflowId);

  return (
    <CheckpointVisualizer
      checkpoints={checkpoints}
      onRestoreCheckpoint={(cpId) => {
        const cp = checkpointManager.getCheckpointAt(
          workflowId,
          // ... restore logic
        );
      }}
    />
  );
}
```

---

## Error Handling Best Practices

```typescript
try {
  const result = await enhancedExecutionEngine.executeGoal(
    goal,
    planner,
    autonomySettings
  );

  if (!result.success) {
    // Handle graceful failure
    console.log('Goal failed, reason:', result.error);
    
    // Option 1: Retry from checkpoint
    if (result.workflow.checkpoints && Object.keys(result.workflow.checkpoints).length > 0) {
      await enhancedExecutionEngine.resumeFromCheckpoint(
        result.workflow.id,
        autonomySettings
      );
    }
    
    // Option 2: Try alternative approach
    const altGoal = { ...goal, description: 'Alternative approach...' };
    await enhancedExecutionEngine.executeGoal(altGoal, planner, autonomySettings);
  }
} catch (error) {
  // Handle critical error
  console.error('Critical error:', error);
  // Report to error tracking
}
```

---

## Monitoring & Metrics

```typescript
// Get task queue statistics
const stats = taskQueue.getStats();
console.log('Total tasks:', stats.total);
console.log('Running:', stats.running);
console.log('By priority:', stats.byPriority);

// Get checkpoint statistics
const cpStats = checkpointManager.getCheckpointStats(workflowId);
console.log('Total checkpoints:', cpStats.totalCheckpoints);
console.log('Average context size:', cpStats.averageContextSize, 'bytes');

// Rate-limit monitoring
const activeTasks = taskQueue.getTasks({ status: 'running' });
if (activeTasks.length > MAX_CONCURRENT) {
  // Pause new tasks
}
```

---

## Common Patterns

### Pattern 1: Goal with Confirmation

```typescript
// User asks for action
const goal = parseUserCommand("Sabko meeting ka notification bhej");

// Plan workflow
const workflow = planner.planGoal(goal);

// Run in 'suggest' mode
const result = await enhancedExecutionEngine.executeGoal(
  goal,
  planner,
  { mode: 'suggest', requireConfirmationFor: ['sendMessage'], ... }
);

// If paused waiting for confirmation
if (result.workflow.status === 'paused') {
  // Show user what the agent will do
  // Get confirmation
  // Resume
  await enhancedExecutionEngine.resumeFromCheckpoint(result.workflow.id, settings);
}
```

### Pattern 2: Long-Running Task with Monitoring

```typescript
const longRunningGoal = {
  title: 'Download and organize all photos',
  priority: 'high',
  status: 'pending'
};

const task: AgentTask = {
  id: uuid(),
  goal: longRunningGoal,
  priority: 'high',
  status: 'queued',
  createdAt: Date.now()
};

taskQueue.enqueueTask(task);

// Execute with periodic status checks
const interval = setInterval(() => {
  const task = taskQueue.getTask(task.id);
  if (task?.status === 'completed' || task?.status === 'failed') {
    clearInterval(interval);
    notifyUser(`Task ${task.status}`);
  }
}, 5000);
```

---

## Troubleshooting

### Issue: Workflow stuck in 'running' state

```typescript
// Force pause
enhancedExecutionEngine.pauseWorkflow(workflowId);

// Check checkpoints
const checkpoints = checkpointManager.getAllCheckpoints(workflowId);
console.log('Available checkpoints:', checkpoints.length);

// Resume from latest
if (checkpoints.length > 0) {
  await enhancedExecutionEngine.resumeFromCheckpoint(workflowId, settings);
}
```

### Issue: High failure rate

```typescript
// Analyze which steps fail most
const workflow = enhancedExecutionEngine.getWorkflow(workflowId);
const failures = workflow.steps.filter(s => s.status === 'failed');

// Increase retry limits
agentRetryManager.addStrategy('relaxed', {
  maxRetries: 5,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 60000
});

// Retry with more conservative approach
```

---

## Testing

```typescript
// Mock agent for testing
const mockPlanner = {
  planGoal: (goal) => ({
    id: 'test-workflow',
    goalId: goal.id,
    title: goal.title,
    steps: [
      // ... mock steps
    ],
    // ...
  })
};

// Test execution
await enhancedExecutionEngine.executeGoal(goal, mockPlanner, settings);
```

---

**Version**: 1.0
**Phase**: PROMPT #10 ✅
**Status**: Production Ready 🚀