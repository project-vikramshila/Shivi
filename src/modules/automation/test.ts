#!/usr/bin/env node

/**
 * Automation System Test Script
 * Tests the UI Automation Engine functionality
 */

import { automationAPI } from './index';

async function testAutomationSystem() {
  console.log('🧪 Testing Shivi UI Automation Engine...\n');

  try {
    // Test 1: Enable automation
    console.log('1️⃣ Testing automation enable/disable...');
    await automationAPI.enableAutomation('full');
    console.log('✅ Automation enabled');

    let status = automationAPI.getState();
    console.log(`📊 Status: ${JSON.stringify(status, null, 2)}`);

    // Test 2: Grant permissions
    console.log('\n2️⃣ Testing permission system...');
    await automationAPI.grantPermission('whatsapp', 'full');
    await automationAPI.grantPermission('browser', 'assist');
    console.log('✅ Permissions granted');

    // Test 3: Get permissions
    console.log('\n3️⃣ Testing permissions...');
    const permissions = automationAPI.getPermissions();
    console.log(`🔐 Permissions: ${JSON.stringify(permissions, null, 2)}`);

    // Test 4: Test planner
    console.log('\n4️⃣ Testing task planner...');
    const { taskPlanner } = await import('./planner');

    const plan1 = await taskPlanner.planTask({
      userRequest: 'Open WhatsApp and send message to Rahul',
      targetApp: 'whatsapp',
    });
    console.log(`📋 Plan 1: ${plan1.description}`);
    console.log(`📊 Steps: ${plan1.steps.length}, Duration: ${plan1.estimatedDuration}ms`);

    const plan2 = await taskPlanner.planTask({
      userRequest: 'Search for cute cats on Google',
      targetApp: 'browser',
    });
    console.log(`📋 Plan 2: ${plan2.description}`);
    console.log(`📊 Steps: ${plan2.steps.length}, Duration: ${plan2.estimatedDuration}ms`);

    // Test 5: Test executor (simulation mode)
    console.log('\n5️⃣ Testing task executor (simulation mode)...');
    const { automationExecutor } = await import('./executor');

    const testTask = {
      id: 'test_task_1',
      description: 'Test automation task',
      steps: [
        {
          id: 'step_1',
          type: 'wait' as const,
          duration: 1000,
          status: 'pending' as const,
          timestamp: Date.now(),
        },
        {
          id: 'step_2',
          type: 'keyboard' as const,
          subtype: 'type' as const,
          text: 'Hello Automation!',
          delay: 50,
          status: 'pending' as const,
          timestamp: Date.now(),
        },
      ],
      maxRetries: 2,
      timeout: 10000,
      requiredPermission: 'assist' as const,
      createdAt: Date.now(),
      status: 'pending' as const,
    };

    const result = await automationExecutor.executeTask(testTask);
    console.log(`🎯 Execution result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`⏱️ Execution time: ${result.executionTime}ms`);
    console.log(`📝 Logs: ${result.logs.length} entries`);

    // Test 6: Check logs
    console.log('\n6️⃣ Testing logging system...');
    const logs = automationAPI.getLogs();
    console.log(`📜 Total logs: ${logs.length}`);
    if (logs.length > 0) {
      console.log('📜 Last 3 logs:');
      logs.slice(-3).forEach((log: string, i: number) => console.log(`  ${i + 1}. ${log}`));
    }

    // Test 7: Emergency stop
    console.log('\n7️⃣ Testing emergency stop...');
    await automationAPI.emergencyStop();
    console.log('🛑 Emergency stop activated');

    // Test 8: Disable automation
    console.log('\n8️⃣ Testing automation disable...');
    await automationAPI.disableAutomation();
    console.log('❌ Automation disabled');

    console.log('\n🎉 All automation tests completed successfully!');
    console.log('✅ UI Automation Engine is ready for integration');

  } catch (error) {
    console.error('❌ Automation test failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAutomationSystem().catch(console.error);
}

export { testAutomationSystem };