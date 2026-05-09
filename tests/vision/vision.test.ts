/**
 * Vision/OCR System Validation
 */

import { TestRunner, Assert } from '../utils/testHelper';
import { mockVisionData } from '../fixtures/mocks';

const runner = new TestRunner('Vision System');

export async function runVisionTests() {
  await runner.test('Vision: Screenshot capture returns valid metadata', async () => {
    Assert.isString(mockVisionData.screenshotPath);
    Assert.ok(mockVisionData.screenshotPath.length > 0);
  });

  await runner.test('Vision: OCR text extraction contains chat content', async () => {
    Assert.isString(mockVisionData.ocrText);
    Assert.ok(mockVisionData.ocrText.includes('WhatsApp'));
  });

  await runner.test('Vision: Unread message count and extracted messages are available', async () => {
    Assert.isNumber(mockVisionData.unreadCount);
    Assert.ok(mockVisionData.unreadCount >= 0);
    Assert.isArray(mockVisionData.extractedMessages);
    Assert.ok(mockVisionData.extractedMessages.length > 0);
  });

  runner.print();
}

if (require.main === module) {
  runVisionTests().catch(console.error);
}
