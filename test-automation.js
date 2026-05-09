#!/usr/bin/env node

/**
 * Automation Engine Test Script
 * Tests the complete UI Automation Engine pipeline
 */

const { automationAPI } = require('./dist/modules/automation');

async function testAutomationEngine() {
  console.log('🧪 Testing Shivi UI Automation Engine...\n');

  try {
    // Test 1: Enable automation
    console.log('1. Testing automation enable...');
    const enableResult = await automationAPI.enableAutomation('assist');
    console.log('✅ Automation enabled:', enableResult);

    // Test 2: Get status
    console.log('\n2. Testing status retrieval...');
    const status = await automationAPI.getStatus();
    console.log('✅ Status:', status);

    // Test 3: Plan a simple task
    console.log('\n3. Testing task planning...');
    const plan = await automationAPI.planTask('Open WhatsApp and check for messages');
    console.log('✅ Task planned:', plan);

    // Test 4: Get config
    console.log('\n4. Testing config retrieval...');
    const config = await automationAPI.getConfig();
    console.log('✅ Config:', config);

    // Test 5: Grant permission
    console.log('\n5. Testing permission granting...');
    automationAPI.grantPermission('whatsapp', 'assist');
    console.log('✅ Permission granted for WhatsApp');

    // Test 6: Get logs
    console.log('\n6. Testing log retrieval...');
    const logs = await automationAPI.getLogs();
    console.log('✅ Logs:', logs.length, 'entries');

    console.log('\n🎉 All automation engine tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testAutomationEngine();
}

module.exports = { testAutomationEngine };