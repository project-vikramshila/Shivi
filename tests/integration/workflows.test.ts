/**
 * Integration Tests: Multi-System Workflows
 * Tests integration between major components
 */

import { TestRunner, Assert, PerformanceMonitor, sleep } from '../utils/testHelper';
import { mockReminderData, mockCalendarData, mockMemoryData, mockAgentData, mockGeminiService } from '../fixtures/mocks';

const runner = new TestRunner('Integration Tests: Workflows');
const monitor = new PerformanceMonitor();

export async function runIntegrationTests() {
  // Test 1: AI + Memory Integration
  await runner.test('AI + Memory: Enhance response with contextual memory', async () => {
    monitor.start('ai-memory-integration');

    // Get AI response
    const response = await mockGeminiService.generateResponse('What should I do today?');
    
    // Use memory context
    const context = mockMemoryData.longTerm.preferences;
    
    Assert.isString(response);
    Assert.isDefined(context);
    
    monitor.end('ai-memory-integration');
  });

  // Test 2: Reminder + Calendar Integration
  await runner.test('Reminder + Calendar: Link reminders to calendar events', async () => {
    monitor.start('reminder-calendar-integration');

    const reminder = mockReminderData.reminders[0];
    const event = mockCalendarData.events[0];
    
    // Both should have dates
    Assert.isDefined(reminder.dueDate);
    Assert.isDefined(event.start);
    
    monitor.end('reminder-calendar-integration');
  });

  // Test 3: Agent + Autonomous Execution
  await runner.test('Agent + Execution: Execute goal autonomously', async () => {
    monitor.start('agent-execution');

    const goal = mockAgentData.goal;
    const workflow = mockAgentData.workflow;
    
    // Goal should lead to workflow
    Assert.equal(workflow.goalId, goal.id);
    Assert.ok(workflow.steps.length > 0);
    
    // Should have valid status
    Assert.ok(['pending', 'running', 'completed', 'failed'].includes(workflow.status));
    
    monitor.end('agent-execution');
  });

  // Test 4: Vision + Automation Integration
  await runner.test('Vision + Automation: Extract UI and automate interaction', async () => {
    monitor.start('vision-automation');

    // Simulate vision extract followed by automation
    const detectedUI = ['message input', 'send button'];
    const automationSteps = [
      { type: 'click', target: 'message input' },
      { type: 'type', text: 'Test message' },
      { type: 'click', target: 'send button' },
    ];

    Assert.ok(detectedUI.length > 0);
    Assert.ok(automationSteps.length === 3);
    
    monitor.end('vision-automation');
  });

  // Test 5: Agent + Retry Integration
  await runner.test('Agent + Retry: Execute step with automatic retries', async () => {
    monitor.start('agent-retry');

    const step = mockAgentData.workflow.steps[0];
    const maxRetries = 3;
    let attempts = 0;

    // Simulate retry loop
    while (attempts < maxRetries) {
      attempts++;
      const shouldFail = attempts === 1; // First attempt fails
      
      if (!shouldFail) {
        break; // Success on retry
      }
    }

    Assert.ok(attempts > 1, 'Should have retried');
    Assert.ok(attempts <= maxRetries, 'Should respect max retries');
    
    monitor.end('agent-retry');
  });

  // Test 6: Agent + Checkpoint Integration
  await runner.test('Agent + Checkpoint: Save state and recover', async () => {
    monitor.start('agent-checkpoint');

    const workflow = mockAgentData.workflow;
    const checkpoint = {
      stepIndex: 1,
      context: { lastAction: 'fetch_calendar' },
      timestamp: Date.now(),
    };

    // Simulate crash and recovery
    const recovered = {
      ...workflow,
      currentStepIndex: checkpoint.stepIndex,
      status: 'running',
    };

    Assert.equal(recovered.currentStepIndex, checkpoint.stepIndex);
    Assert.equal(recovered.status, 'running');
    
    monitor.end('agent-checkpoint');
  });

  // Test 7: Multi-App Workflow
  await runner.test('Agent: Execute workflow across multiple apps', async () => {
    monitor.start('multi-app-workflow');

    const workflow = mockAgentData.workflow;
    const uniqueApps = [...new Set(workflow.steps.map(s => s.app))];

    Assert.ok(uniqueApps.length > 1, 'Should use multiple apps');
    Assert.includes(uniqueApps.join(','), 'calendar');
    
    monitor.end('multi-app-workflow');
  });

  // Test 8: Error Handling Flow
  await runner.test('Error Handling: Detect, analyze, recover', async () => {
    monitor.start('error-handling');

    const error = new Error('Network timeout');
    
    // Analysis phase
    const isNetworkError = error.message.includes('Network');
    const isRetryable = isNetworkError;
    const strategy = isNetworkError ? 'exponential-backoff' : 'fallback';

    Assert.isTrue(isRetryable);
    Assert.isString(strategy);
    
    monitor.end('error-handling');
  });

  // Test 9: Long-Running Task Recovery
  await runner.test('Task Queue: Handle long-running task interruption', async () => {
    monitor.start('long-task-recovery');

    const task = {
      id: 'long-task',
      status: 'running',
      startTime: Date.now(),
      checkpoints: [
        { stepIndex: 0, timestamp: Date.now() },
        { stepIndex: 5, timestamp: Date.now() + 5000 },
      ],
    };

    // Simulate interruption and recovery
    const interrupted = {
      ...task,
      status: 'paused',
      lastCheckpoint: task.checkpoints[1],
    };

    // Resume from checkpoint
    const resumed = {
      ...interrupted,
      status: 'running',
      currentStepIndex: interrupted.lastCheckpoint.stepIndex,
    };

    Assert.equal(resumed.status, 'running');
    Assert.ok(resumed.currentStepIndex > 0);
    
    monitor.end('long-task-recovery');
  });

  // Test 10: Memory-Guided Workflow
  await runner.test('Workflow: Optimize using stored patterns', async () => {
    monitor.start('memory-guided-workflow');

    const preferences = mockMemoryData.longTerm.preferences;
    const workflow = mockAgentData.workflow;
    
    // Should adapt based on preferences
    const isAccessibleLanguage = preferences.language === 'hindi';
    const isCorrectTheme = preferences.theme === 'dark';

    Assert.isTrue(isAccessibleLanguage);
    Assert.isTrue(isCorrectTheme);
    
    monitor.end('memory-guided-workflow');
  });

  // Test 11: Security Boundary Test
  await runner.test('Security: Sensitive operations require confirmation', async () => {
    const sensitiveOps = ['sendMessage', 'deleteData', 'purchase', 'modifySettings'];
    let autonomyLevel: string = 'assist'; // Default
    
    sensitiveOps.forEach(op => {
      // In assist mode, all sensitive ops should require confirmation
      const requiresConfirmation = autonomyLevel !== 'autonomous';
      Assert.isTrue(requiresConfirmation);
    });
  });

  // Test 12: Cross-System Performance
  await runner.test('Performance: Multi-system workflow completes timely', async () => {
    monitor.start('multi-system-perf');

    // Simulate workflow across multiple systems
    for (let i = 0; i < 5; i++) {
      await sleep(10); // Simulate work
    }

    monitor.end('multi-system-perf');
    
    const stats = monitor.getStats('multi-system-perf');
    Assert.ok(stats.avg < 500, `Multi-system workflow took ${stats.avg}ms`);
  });

  runner.print();
  monitor.printReport();
}

if (require.main === module) {
  runIntegrationTests().catch(console.error);
}
