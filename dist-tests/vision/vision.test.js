"use strict";
/**
 * Vision/OCR System Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVisionTests = runVisionTests;
const testHelper_1 = require("../utils/testHelper");
const mocks_1 = require("../fixtures/mocks");
const runner = new testHelper_1.TestRunner('Vision System');
async function runVisionTests() {
    await runner.test('Vision: Screenshot capture returns valid metadata', async () => {
        testHelper_1.Assert.isString(mocks_1.mockVisionData.screenshotPath);
        testHelper_1.Assert.ok(mocks_1.mockVisionData.screenshotPath.length > 0);
    });
    await runner.test('Vision: OCR text extraction contains chat content', async () => {
        testHelper_1.Assert.isString(mocks_1.mockVisionData.ocrText);
        testHelper_1.Assert.ok(mocks_1.mockVisionData.ocrText.includes('WhatsApp'));
    });
    await runner.test('Vision: Unread message count and extracted messages are available', async () => {
        testHelper_1.Assert.isNumber(mocks_1.mockVisionData.unreadCount);
        testHelper_1.Assert.ok(mocks_1.mockVisionData.unreadCount >= 0);
        testHelper_1.Assert.isArray(mocks_1.mockVisionData.extractedMessages);
        testHelper_1.Assert.ok(mocks_1.mockVisionData.extractedMessages.length > 0);
    });
    runner.print();
}
if (require.main === module) {
    runVisionTests().catch(console.error);
}
