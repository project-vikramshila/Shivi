/**
 * Automation System Validation
 */

import { TestRunner, Assert } from '../utils/testHelper';
import { mockAutomationData } from '../fixtures/mocks';

const runner = new TestRunner('Automation System');

export async function runAutomationTests() {
  await runner.test('Automation: Execute action sequence smoothly', async () => {
    Assert.isArray(mockAutomationData.actions);
    Assert.equal(mockAutomationData.actions.length, 3);

    const [clickAction, typeAction, pressAction] = mockAutomationData.actions;
    Assert.equal(clickAction.type, 'click');
    Assert.equal(typeAction.type, 'type');
    Assert.equal(pressAction.type, 'press');
  });

  await runner.test('Automation: No repeated click actions in workflow', async () => {
    const clickActions = mockAutomationData.actions.filter(action => action.type === 'click');
    Assert.equal(clickActions.length, 1);
  });

  await runner.test('Automation: Human-like ordering of actions', async () => {
    const sequence = mockAutomationData.actions.map(action => action.type);
    Assert.deepEqual(sequence, ['click', 'type', 'press']);
  });

  runner.print();
}

if (require.main === module) {
  runAutomationTests().catch(console.error);
}
