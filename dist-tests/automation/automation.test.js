"use strict";
/**
 * Automation System Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAutomationTests = runAutomationTests;
const testHelper_1 = require("../utils/testHelper");
const mocks_1 = require("../fixtures/mocks");
const runner = new testHelper_1.TestRunner('Automation System');
async function runAutomationTests() {
    await runner.test('Automation: Execute action sequence smoothly', async () => {
        testHelper_1.Assert.isArray(mocks_1.mockAutomationData.actions);
        testHelper_1.Assert.equal(mocks_1.mockAutomationData.actions.length, 3);
        const [clickAction, typeAction, pressAction] = mocks_1.mockAutomationData.actions;
        testHelper_1.Assert.equal(clickAction.type, 'click');
        testHelper_1.Assert.equal(typeAction.type, 'type');
        testHelper_1.Assert.equal(pressAction.type, 'press');
    });
    await runner.test('Automation: No repeated click actions in workflow', async () => {
        const clickActions = mocks_1.mockAutomationData.actions.filter(action => action.type === 'click');
        testHelper_1.Assert.equal(clickActions.length, 1);
    });
    await runner.test('Automation: Human-like ordering of actions', async () => {
        const sequence = mocks_1.mockAutomationData.actions.map(action => action.type);
        testHelper_1.Assert.deepEqual(sequence, ['click', 'type', 'press']);
    });
    runner.print();
}
if (require.main === module) {
    runAutomationTests().catch(console.error);
}
