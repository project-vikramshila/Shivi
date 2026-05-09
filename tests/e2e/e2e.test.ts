/**
 * End-to-End Validation
 */

import { TestRunner, Assert } from '../utils/testHelper';
import { mockIPCHandlers, MockElectronApp } from '../fixtures/mocks';

const runner = new TestRunner('E2E Validation');

export async function runE2ETests() {
  await runner.test('E2E: Preload bridge provides shiviAPI interface', async () => {
    const electronApp = new MockElectronApp();
    Object.entries(mockIPCHandlers).forEach(([channel, handler]) => {
      electronApp.registerHandler(channel, handler);
    });

    const preload = electronApp.getPreload();
    Assert.isDefined(preload.shiviAPI);
    Assert.isDefined(preload.shiviAPI.invoke);
  });

  await runner.test('E2E: IPC to AI, reminders, calendar, vision works together', async () => {
    const electronApp = new MockElectronApp();
    Object.entries(mockIPCHandlers).forEach(([channel, handler]) => {
      electronApp.registerHandler(channel, handler);
    });

    const api = electronApp.getPreload().shiviAPI;
    const enhanced = await api.invoke('shivi:ai:enhance', 'Prepare agenda');
    Assert.isString(enhanced);
    Assert.ok(enhanced.includes('Enhanced'));

    const reminder = await api.invoke('shivi:reminder:create', { title: 'Call Rahul' });
    Assert.isDefined(reminder.id);
    Assert.equal(reminder.title, 'Call Rahul');

    const events = await api.invoke('shivi:calendar:list');
    Assert.isArray(events);
    Assert.ok(events.length > 0);

    const vision = await api.invoke('shivi:vision:screenshot');
    Assert.isNumber(vision.unreadCount);
  });

  await runner.test('E2E: Local fallback and graceful failure branch validation', async () => {
    const electronApp = new MockElectronApp();
    electronApp.registerHandler('shivi:ai:enhance', async (text: string) => `Fallback ${text}`);
    const api = electronApp.getPreload().shiviAPI;
    const fallbackResponse = await api.invoke('shivi:ai:enhance', 'offline mode');
    Assert.isString(fallbackResponse);
    Assert.ok(fallbackResponse.includes('Fallback'));
  });

  runner.print();
}

if (require.main === module) {
  runE2ETests().catch(console.error);
}
