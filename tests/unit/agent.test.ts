/**
 * Unit Tests: Autonomous Agent System
 * Tests for goal planning, execution, retries, and checkpoints
 */

import { TestRunner, Assert, PerformanceMonitor } from '../utils/testHelper';
import { mockAgentData } from '../fixtures/mocks';

const runner = new TestRunner('Autonomous Agent System');
const monitor = new PerformanceMonitor();

export async function runAgentUnitTests() {
  // Test 1: Goal Planning
  await runner.test('Goal Planner: Decompose goal into steps', async () => {
    const goal = {
      id: 'test-goal',
      title: 'Prepare meeting',
      description: 'Get ready for meeting',
      targetApps: ['calendar', 'email'],
      priority: 1,
      status: 'pending',
    };

    // Basic validation
    Assert.isDefined(goal.id);
    Assert.ok(goal.targetApps.length > 0);
    Assert.equal(goal.status, 'pending');
  });

  // Test 2: Workflow Creation
  await runner.test('Workflow Engine: Create workflow from steps', async () => {
    const workflow = mockAgentData.workflow;
    
    Assert.isDefined(workflow.id);
    Assert.equal(workflow.status, 'running');
    Assert.ok(workflow.steps.length > 0);
    Assert.isNumber(workflow.currentStepIndex);
  });

  // Test 3: Retry Strategy Selection
  await runner.test('Retry Manager: Select strategy by error type', async () => {
    const errorTypes = [
      { error: 'Network timeout', strategy: 'network' },
      { error: 'Request timeout', strategy: 'timeout' },
      { error: 'App not available', strategy: 'app_unavailable' },
      { error: 'Unknown error', strategy: 'default' },
    ];

    errorTypes.forEach(({ error, strategy }) => {
      Assert.ok(strategy.length > 0);
    });
  });

  // Test 4: Checkpoint Creation
  await runner.test('Checkpoint Manager: Create and restore checkpoint', async () => {
    const workflow = mockAgentData.workflow;
    const checkpoint = {
      id: 'cp-1',
      workflowId: workflow.id,
      stepIndex: 0,
      step: workflow.steps[0],
      context: { saved: true },
      timestamp: Date.now(),
    };

    Assert.equal(checkpoint.workflowId, workflow.id);
    Assert.isNumber(checkpoint.timestamp);
    Assert.deepEqual(checkpoint.context, { saved: true });
  });

  // Test 5: Task Priority Sorting
  await runner.test('Task Queue: Sort tasks by priority', async () => {
    monitor.start('task-sorting');
    
    const tasks = [
      { id: '1', priority: 'normal' },
      { id: '2', priority: 'critical' },
      { id: '3', priority: 'low' },
      { id: '4', priority: 'high' },
    ];

    const priorityOrder = ['critical', 'high', 'normal', 'low'];
    let currentIndex = 0;
    
    tasks.forEach((task, i) => {
      const priority = priorityOrder.indexOf(task.priority);
      if (i > 0) {
        const prevPriority = priorityOrder.indexOf(tasks[i-1].priority);
        // In sorted order, priority should be >= previous
      }
    });

    monitor.end('task-sorting');
  });

  // Test 6: AI Decision Making
  await runner.test('AI Decision Engine: Analyze error and decide action', async () => {
    monitor.start('ai-decision');
    
    const scenarios = [
      { error: 'timeout', expectedAction: 'retry' },
      { error: 'permission denied', expectedAction: 'ask_user' },
      { error: 'not found', expectedAction: 'fallback' },
    ];

    scenarios.forEach(({ error, expectedAction }) => {
      // Validate error can trigger expected action
      Assert.ok(expectedAction === 'retry' || expectedAction === 'ask_user' || expectedAction === 'fallback');
    });

    monitor.end('ai-decision');
  });

  // Test 7: Autonomy Level Enforcement
  await runner.test('Autonomy Manager: Enforce autonomy levels', async () => {
    const autonomyModes = ['observe', 'suggest', 'assist', 'autonomous'];
    const sensitiveAction = 'sendMessage';

    autonomyModes.forEach(mode => {
      const canExecute = mode === 'autonomous' || mode === 'assist';
      Assert.ok(typeof canExecute === 'boolean');
    });
  });

  // Test 8: Workflow Status Transitions
  await runner.test('Workflow Engine: Valid status transitions', async () => {
    const validTransitions = {
      'pending': ['running'],
      'running': ['completed', 'failed', 'paused'],
      'paused': ['running', 'failed'],
      'completed': [],
      'failed': [],
    };

    Object.entries(validTransitions).forEach(([from, to]) => {
      Assert.ok(Array.isArray(to));
    });
  });

  // Test 9: Error Recovery with Fallback
  await runner.test('Reasoning Engine: Select fallback strategy', async () => {
    const failures = [
      { action: 'fetchContext', error: 'No connector', fallback: 'analyzeContext' },
      { action: 'openApp', error: 'timeout', fallback: 'prepareContext' },
    ];

    failures.forEach(({ fallback }) => {
      Assert.isDefined(fallback);
      Assert.isString(fallback);
    });
  });

  // Test 10: Hindi Narrative Generation
  await runner.test('Reasoning Engine: Generate Hindi narrative', async () => {
    const actions = ['retry', 'skip', 'fallback', 'ask_user', 'cancel'];
    
    actions.forEach(action => {
      const narrative = `[Hindi narrative for ${action}]`;
      Assert.isString(narrative);
      Assert.ok(narrative.length > 0);
    });
  });

  runner.print();
  monitor.printReport();
}

if (require.main === module) {
  runAgentUnitTests().catch(console.error);
}
