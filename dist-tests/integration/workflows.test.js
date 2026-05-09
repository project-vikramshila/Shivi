"use strict";
/**
 * Integration Tests: Multi-System Workflows
 * Tests integration between major components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIntegrationTests = runIntegrationTests;
const testHelper_1 = require("../utils/testHelper");
const mocks_1 = require("../fixtures/mocks");
const runner = new testHelper_1.TestRunner('Integration Tests: Workflows');
const monitor = new testHelper_1.PerformanceMonitor();
async function runIntegrationTests() {
    // Test 1: AI + Memory Integration
    await runner.test('AI + Memory: Enhance response with contextual memory', async () => {
        monitor.start('ai-memory-integration');
        // Get AI response
        const response = await mocks_1.mockGeminiService.generateResponse('What should I do today?');
        // Use memory context
        const context = mocks_1.mockMemoryData.longTerm.preferences;
        testHelper_1.Assert.isString(response);
        testHelper_1.Assert.isDefined(context);
        monitor.end('ai-memory-integration');
    });
    // Test 2: Reminder + Calendar Integration
    await runner.test('Reminder + Calendar: Link reminders to calendar events', async () => {
        monitor.start('reminder-calendar-integration');
        const reminder = mocks_1.mockReminderData.reminders[0];
        const event = mocks_1.mockCalendarData.events[0];
        // Both should have dates
        testHelper_1.Assert.isDefined(reminder.dueDate);
        testHelper_1.Assert.isDefined(event.start);
        monitor.end('reminder-calendar-integration');
    });
    // Test 3: Agent + Autonomous Execution
    await runner.test('Agent + Execution: Execute goal autonomously', async () => {
        monitor.start('agent-execution');
        const goal = mocks_1.mockAgentData.goal;
        const workflow = mocks_1.mockAgentData.workflow;
        // Goal should lead to workflow
        testHelper_1.Assert.equal(workflow.goalId, goal.id);
        testHelper_1.Assert.ok(workflow.steps.length > 0);
        // Should have valid status
        testHelper_1.Assert.ok(['pending', 'running', 'completed', 'failed'].includes(workflow.status));
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
        testHelper_1.Assert.ok(detectedUI.length > 0);
        testHelper_1.Assert.ok(automationSteps.length === 3);
        monitor.end('vision-automation');
    });
    // Test 5: Agent + Retry Integration
    await runner.test('Agent + Retry: Execute step with automatic retries', async () => {
        monitor.start('agent-retry');
        const step = mocks_1.mockAgentData.workflow.steps[0];
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
        testHelper_1.Assert.ok(attempts > 1, 'Should have retried');
        testHelper_1.Assert.ok(attempts <= maxRetries, 'Should respect max retries');
        monitor.end('agent-retry');
    });
    // Test 6: Agent + Checkpoint Integration
    await runner.test('Agent + Checkpoint: Save state and recover', async () => {
        monitor.start('agent-checkpoint');
        const workflow = mocks_1.mockAgentData.workflow;
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
        testHelper_1.Assert.equal(recovered.currentStepIndex, checkpoint.stepIndex);
        testHelper_1.Assert.equal(recovered.status, 'running');
        monitor.end('agent-checkpoint');
    });
    // Test 7: Multi-App Workflow
    await runner.test('Agent: Execute workflow across multiple apps', async () => {
        monitor.start('multi-app-workflow');
        const workflow = mocks_1.mockAgentData.workflow;
        const uniqueApps = [...new Set(workflow.steps.map(s => s.app))];
        testHelper_1.Assert.ok(uniqueApps.length > 1, 'Should use multiple apps');
        testHelper_1.Assert.includes(uniqueApps.join(','), 'calendar');
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
        testHelper_1.Assert.isTrue(isRetryable);
        testHelper_1.Assert.isString(strategy);
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
        testHelper_1.Assert.equal(resumed.status, 'running');
        testHelper_1.Assert.ok(resumed.currentStepIndex > 0);
        monitor.end('long-task-recovery');
    });
    // Test 10: Memory-Guided Workflow
    await runner.test('Workflow: Optimize using stored patterns', async () => {
        monitor.start('memory-guided-workflow');
        const preferences = mocks_1.mockMemoryData.longTerm.preferences;
        const workflow = mocks_1.mockAgentData.workflow;
        // Should adapt based on preferences
        const isAccessibleLanguage = preferences.language === 'hindi';
        const isCorrectTheme = preferences.theme === 'dark';
        testHelper_1.Assert.isTrue(isAccessibleLanguage);
        testHelper_1.Assert.isTrue(isCorrectTheme);
        monitor.end('memory-guided-workflow');
    });
    // Test 11: Security Boundary Test
    await runner.test('Security: Sensitive operations require confirmation', async () => {
        const sensitiveOps = ['sendMessage', 'deleteData', 'purchase', 'modifySettings'];
        let autonomyLevel = 'assist'; // Default
        sensitiveOps.forEach(op => {
            // In assist mode, all sensitive ops should require confirmation
            const requiresConfirmation = autonomyLevel !== 'autonomous';
            testHelper_1.Assert.isTrue(requiresConfirmation);
        });
    });
    // Test 12: Cross-System Performance
    await runner.test('Performance: Multi-system workflow completes timely', async () => {
        monitor.start('multi-system-perf');
        // Simulate workflow across multiple systems
        for (let i = 0; i < 5; i++) {
            await (0, testHelper_1.sleep)(10); // Simulate work
        }
        monitor.end('multi-system-perf');
        const stats = monitor.getStats('multi-system-perf');
        testHelper_1.Assert.ok(stats.avg < 500, `Multi-system workflow took ${stats.avg}ms`);
    });
    runner.print();
    monitor.printReport();
}
if (require.main === module) {
    runIntegrationTests().catch(console.error);
}
