"use strict";
/**
 * Voice System Validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVoiceTests = runVoiceTests;
const testHelper_1 = require("../utils/testHelper");
const mocks_1 = require("../fixtures/mocks");
const runner = new testHelper_1.TestRunner('Voice System');
async function runVoiceTests() {
    await runner.test('Voice: Wake word detection list includes known phrases', async () => {
        testHelper_1.Assert.isArray(mocks_1.mockVoiceData.wakeWords);
        testHelper_1.Assert.ok(mocks_1.mockVoiceData.wakeWords.length >= 3);
        testHelper_1.Assert.ok(mocks_1.mockVoiceData.wakeWords.includes('Shivi'));
        testHelper_1.Assert.ok(mocks_1.mockVoiceData.wakeWords.includes('Hey Shivi'));
        testHelper_1.Assert.ok(mocks_1.mockVoiceData.wakeWords.includes('Suno Shivi'));
    });
    await runner.test('Voice: STT transcript is valid and language tagged', async () => {
        testHelper_1.Assert.isString(mocks_1.mockVoiceData.transcript);
        testHelper_1.Assert.ok(mocks_1.mockVoiceData.transcript.length > 0);
        testHelper_1.Assert.equal(mocks_1.mockVoiceData.language, 'hi-IN');
        testHelper_1.Assert.isNumber(mocks_1.mockVoiceData.confidence);
        testHelper_1.Assert.ok(mocks_1.mockVoiceData.confidence >= 0.8);
    });
    await runner.test('Voice: Emotional tone support placeholder check', async () => {
        const voiceTone = { emotion: 'calm', intensity: 'medium' };
        testHelper_1.Assert.isDefined(voiceTone.emotion);
        testHelper_1.Assert.isDefined(voiceTone.intensity);
    });
    runner.print();
}
if (require.main === module) {
    runVoiceTests().catch(console.error);
}
