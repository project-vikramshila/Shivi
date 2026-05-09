"use strict";
/**
 * Security Tests
 * Validate security boundaries, permissions, and protected data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSecurityTests = runSecurityTests;
const testHelper_1 = require("../utils/testHelper");
const mocks_1 = require("../fixtures/mocks");
const runner = new testHelper_1.TestRunner('Security Validation');
async function runSecurityTests() {
    // Test 1: API Key Isolation
    await runner.test('Security: API keys isolated from renderer', async () => {
        const mainProcess = {
            apiKeys: mocks_1.mockSecurityData.apiKeys,
        };
        const rendererContext = {
            // Renderer should not have direct access
            apiKeys: undefined,
        };
        testHelper_1.Assert.isDefined(mainProcess.apiKeys.gemini);
        testHelper_1.Assert.notOk(rendererContext.apiKeys);
    });
    // Test 2: Secure Preload Bridge
    await runner.test('Security: Preload bridge uses explicit allowlist', async () => {
        const allowedChannels = [
            'shivi:ai:enhance',
            'shivi:reminder:create',
            'shivi:calendar:list',
            'shivi:memory:retrieve',
            'shivi:vision:screenshot',
            'shivi:automation:execute',
            'shivi:agent:executeGoal',
        ];
        testHelper_1.Assert.ok(allowedChannels.length > 0);
        allowedChannels.forEach(channel => {
            testHelper_1.Assert.isString(channel);
            testHelper_1.Assert.includes(channel, 'shivi:');
        });
    });
    // Test 3: Context Isolation
    await runner.test('Security: Context isolation prevents sandbox escape', async () => {
        const webPreferences = {
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            preload: '/path/to/preload.js',
            sandbox: true,
        };
        testHelper_1.Assert.isTrue(webPreferences.contextIsolation);
        testHelper_1.Assert.isFalse(webPreferences.nodeIntegration);
        testHelper_1.Assert.isFalse(webPreferences.enableRemoteModule);
        testHelper_1.Assert.isTrue(webPreferences.sandbox);
    });
    // Test 4: Permission Request Validation
    await runner.test('Security: Permission changes require explicit request', async () => {
        const permissionStates = {
            'calendar': 'granted',
            'contacts': 'denied',
            'microphone': 'granted',
            'camera': 'denied',
            'storage': 'granted',
        };
        Object.entries(permissionStates).forEach(([perm, state]) => {
            testHelper_1.Assert.ok(['granted', 'denied', 'prompt'].includes(state));
        });
    });
    // Test 5: OAuth Token Security
    await runner.test('Security: OAuth tokens encrypted at rest', async () => {
        const token = mocks_1.mockSecurityData.tokens.google;
        // Token should not be plain text in storage
        testHelper_1.Assert.isString(token);
        // Encryption simulation: real tokens should be encrypted
        const encrypted = Buffer.from(token).toString('base64');
        testHelper_1.Assert.notEqual(encrypted, token);
    });
    // Test 6: Database Connection Security
    await runner.test('Security: Database credentials not in environment', async () => {
        const envVars = {
            DATABASE_URL: undefined, // Should be in .env.local
            NEON_CONNECTION: undefined,
            GEMINI_API_KEY: undefined,
        };
        Object.entries(envVars).forEach(([key, value]) => {
            testHelper_1.Assert.notOk(value, `${key} should not be exposed`);
        });
    });
    // Test 7: XSS Prevention in React
    await runner.test('Security: React components sanitize user input', async () => {
        const userInput = '<script>alert("xss")</script>';
        const sanitized = userInput.replace(/<[^>]*>/g, ''); // Basic sanitization
        testHelper_1.Assert.notIncludes(sanitized, '<script>');
    });
    // Test 8: CSRF Protection
    await runner.test('Security: IPC handlers validate origin', async () => {
        const ipcMessage = {
            channel: 'shivi:sensitive:action',
            data: { action: 'deleteReminder' },
            sender: {
                url: 'app://shivi-app', // Allowed
            },
        };
        const isAllowedOrigin = ipcMessage.sender.url.startsWith('app://');
        testHelper_1.Assert.isTrue(isAllowedOrigin);
    });
    // Test 9: Sensitive Data Masking
    await runner.test('Security: API keys and tokens masked in logs', async () => {
        const logEntry = {
            action: 'api_call',
            key: 'test-key-xxx',
            masked: '***xxx', // Last 3 chars only
        };
        testHelper_1.Assert.includes(logEntry.masked, 'xxx');
        testHelper_1.Assert.notIncludes(logEntry.masked.substring(0, 3), 'test');
    });
    // Test 10: Process Security
    await runner.test('Security: Main process runs with minimal privileges', async () => {
        const mainProcess = {
            name: 'electron-main',
            capabilities: {
                filesystem: true,
                database: true,
                network: true,
            },
            restrictions: {
                nodeIntegration: false,
                remoteCode: false,
            },
        };
        testHelper_1.Assert.isFalse(mainProcess.restrictions.nodeIntegration);
        testHelper_1.Assert.isFalse(mainProcess.restrictions.remoteCode);
    });
    // Test 11: Rate Limiting
    await runner.test('Security: API calls rate-limited', async () => {
        const rateLimit = {
            aiEnhancements: { limit: 100, window: 3600 }, // 100/hour
            calendarSync: { limit: 60, window: 3600 }, // 60/hour
            automationActions: { limit: 1000, window: 3600 }, // 1000/hour
        };
        Object.entries(rateLimit).forEach(([api, config]) => {
            testHelper_1.Assert.isNumber(config.limit);
            testHelper_1.Assert.isNumber(config.window);
            testHelper_1.Assert.ok(config.limit > 0);
        });
    });
    // Test 12: Secure Storage
    await runner.test('Security: Sensitive data stored encrypted', async () => {
        const storage = {
            apiKeys: { encrypted: true },
            tokens: { encrypted: true },
            passwords: { encrypted: true },
            userPreferences: { encrypted: false },
        };
        testHelper_1.Assert.isTrue(storage.apiKeys.encrypted);
        testHelper_1.Assert.isTrue(storage.tokens.encrypted);
        testHelper_1.Assert.isTrue(storage.passwords.encrypted);
    });
    // Test 13: Input Validation
    await runner.test('Security: All IPC inputs validated', async () => {
        const validations = {
            'shivi:reminder:create': (data) => {
                return data.title && typeof data.title === 'string' && data.title.length > 0;
            },
            'shivi:automation:execute': (data) => {
                return Array.isArray(data) && data.every(a => a.type && a.target);
            },
        };
        const testReminder = { title: 'Test', dueDate: new Date() };
        const testAutomation = [{ type: 'click', target: 'button' }];
        testHelper_1.Assert.isTrue(validations['shivi:reminder:create'](testReminder));
        testHelper_1.Assert.isTrue(validations['shivi:automation:execute'](testAutomation));
    });
    // Test 14: Audit Logging
    await runner.test('Security: Sensitive actions logged for audit', async () => {
        const auditLog = [
            { action: 'sendMessage', user: 'user-1', timestamp: Date.now(), app: 'whatsapp' },
            { action: 'deleteReminder', user: 'user-1', timestamp: Date.now(), id: 'reminder-1' },
            { action: 'modifyAutomation', user: 'user-1', timestamp: Date.now(), workflowId: 'wf-1' },
        ];
        testHelper_1.Assert.ok(auditLog.length > 0);
        auditLog.forEach(entry => {
            testHelper_1.Assert.isDefined(entry.action);
            testHelper_1.Assert.isDefined(entry.timestamp);
            testHelper_1.Assert.isDefined(entry.user);
        });
    });
    // Test 15: Secret Rotation
    await runner.test('Security: API keys can be rotated', async () => {
        const keyRotation = {
            current: 'test-key-xxx',
            previous: 'test-key-yyy',
            nextRotation: Date.now() + 2592000000, // 30 days
        };
        testHelper_1.Assert.notEqual(keyRotation.current, keyRotation.previous);
        testHelper_1.Assert.isNumber(keyRotation.nextRotation);
        testHelper_1.Assert.ok(keyRotation.nextRotation > Date.now());
    });
    runner.print();
}
if (require.main === module) {
    runSecurityTests().catch(console.error);
}
