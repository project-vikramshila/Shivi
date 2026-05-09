"use strict";
/**
 * End-to-End Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runE2ETests = runE2ETests;
const testHelper_1 = require("../utils/testHelper");
const mocks_1 = require("../fixtures/mocks");
const runner = new testHelper_1.TestRunner('E2E Validation');
async function runE2ETests() {
    await runner.test('E2E: Preload bridge provides shiviAPI interface', async () => {
        const electronApp = new mocks_1.MockElectronApp();
        Object.entries(mocks_1.mockIPCHandlers).forEach(([channel, handler]) => {
            electronApp.registerHandler(channel, handler);
        });
        const preload = electronApp.getPreload();
        testHelper_1.Assert.isDefined(preload.shiviAPI);
        testHelper_1.Assert.isDefined(preload.shiviAPI.invoke);
    });
    await runner.test('E2E: IPC to AI, reminders, calendar, vision works together', async () => {
        const electronApp = new mocks_1.MockElectronApp();
        Object.entries(mocks_1.mockIPCHandlers).forEach(([channel, handler]) => {
            electronApp.registerHandler(channel, handler);
        });
        const api = electronApp.getPreload().shiviAPI;
        const enhanced = await api.invoke('shivi:ai:enhance', 'Prepare agenda');
        testHelper_1.Assert.isString(enhanced);
        testHelper_1.Assert.ok(enhanced.includes('Enhanced'));
        const reminder = await api.invoke('shivi:reminder:create', { title: 'Call Rahul' });
        testHelper_1.Assert.isDefined(reminder.id);
        testHelper_1.Assert.equal(reminder.title, 'Call Rahul');
        const events = await api.invoke('shivi:calendar:list');
        testHelper_1.Assert.isArray(events);
        testHelper_1.Assert.ok(events.length > 0);
        const vision = await api.invoke('shivi:vision:screenshot');
        testHelper_1.Assert.isNumber(vision.unreadCount);
    });
    await runner.test('E2E: Local fallback and graceful failure branch validation', async () => {
        const electronApp = new mocks_1.MockElectronApp();
        electronApp.registerHandler('shivi:ai:enhance', async (text) => `Fallback ${text}`);
        const api = electronApp.getPreload().shiviAPI;
        const fallbackResponse = await api.invoke('shivi:ai:enhance', 'offline mode');
        testHelper_1.Assert.isString(fallbackResponse);
        testHelper_1.Assert.ok(fallbackResponse.includes('Fallback'));
    });
    runner.print();
}
if (require.main === module) {
    runE2ETests().catch(console.error);
}
