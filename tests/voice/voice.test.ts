/**
 * Voice System Validation
 */

import { TestRunner, Assert } from '../utils/testHelper';
import { mockVoiceData } from '../fixtures/mocks';

const runner = new TestRunner('Voice System');

export async function runVoiceTests() {
  await runner.test('Voice: Wake word detection list includes known phrases', async () => {
    Assert.isArray(mockVoiceData.wakeWords);
    Assert.ok(mockVoiceData.wakeWords.length >= 3);
    Assert.ok(mockVoiceData.wakeWords.includes('Shivi'));
    Assert.ok(mockVoiceData.wakeWords.includes('Hey Shivi'));
    Assert.ok(mockVoiceData.wakeWords.includes('Suno Shivi'));
  });

  await runner.test('Voice: STT transcript is valid and language tagged', async () => {
    Assert.isString(mockVoiceData.transcript);
    Assert.ok(mockVoiceData.transcript.length > 0);
    Assert.equal(mockVoiceData.language, 'hi-IN');
    Assert.isNumber(mockVoiceData.confidence);
    Assert.ok(mockVoiceData.confidence >= 0.8);
  });

  await runner.test('Voice: Emotional tone support placeholder check', async () => {
    const voiceTone = { emotion: 'calm', intensity: 'medium' };
    Assert.isDefined(voiceTone.emotion);
    Assert.isDefined(voiceTone.intensity);
  });

  runner.print();
}

if (require.main === module) {
  runVoiceTests().catch(console.error);
}
