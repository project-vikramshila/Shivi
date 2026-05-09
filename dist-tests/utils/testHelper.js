"use strict";
/**
 * Test Helper Utilities
 * Common testing utilities for all test suites
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = exports.MockEventBus = exports.Assert = exports.TestRunner = void 0;
exports.sleep = sleep;
exports.timeout = timeout;
class TestRunner {
    constructor(suiteName) {
        this.tests = [];
        this.startTime = 0;
        this.suiteName = suiteName;
    }
    async test(name, fn, skip = false) {
        if (skip) {
            return this.addResult({
                name,
                status: 'skip',
                duration: 0,
            });
        }
        const start = performance.now();
        try {
            await Promise.resolve(fn());
            return this.addResult({
                name,
                status: 'pass',
                duration: performance.now() - start,
            });
        }
        catch (error) {
            return this.addResult({
                name,
                status: 'fail',
                duration: performance.now() - start,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    addResult(result) {
        this.tests.push(result);
        return result;
    }
    getSuite() {
        return {
            name: this.suiteName,
            tests: this.tests,
            duration: this.tests.reduce((sum, t) => sum + t.duration, 0),
            passed: this.tests.filter(t => t.status === 'pass').length,
            failed: this.tests.filter(t => t.status === 'fail').length,
            skipped: this.tests.filter(t => t.status === 'skip').length,
        };
    }
    print() {
        const suite = this.getSuite();
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📋 ${suite.name}`);
        console.log(`${'='.repeat(60)}`);
        suite.tests.forEach(test => {
            const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : test.status === 'skip' ? '⊘' : '⚠️';
            console.log(`${icon} ${test.name} (${test.duration.toFixed(2)}ms)`);
            if (test.error) {
                console.log(`   └─ ${test.error}`);
            }
        });
        console.log(`\n📊 Summary:`);
        console.log(`   Passed: ${suite.passed} | Failed: ${suite.failed} | Skipped: ${suite.skipped}`);
        console.log(`   Total Duration: ${suite.duration.toFixed(2)}ms`);
        console.log(`${'='.repeat(60)}\n`);
    }
}
exports.TestRunner = TestRunner;
class Assert {
    static equal(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }
    static deepEqual(actual, expected, message) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(message || `Objects not equal\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
        }
    }
    static ok(value, message) {
        if (!value) {
            throw new Error(message || `Expected truthy value, got ${value}`);
        }
    }
    static notOk(value, message) {
        if (value) {
            throw new Error(message || `Expected falsy value, got ${value}`);
        }
    }
    static throws(fn, message) {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        }
        catch (error) {
            // Expected
        }
    }
    static doesNotThrow(fn, message) {
        try {
            fn();
        }
        catch (error) {
            throw new Error(message || `Expected function not to throw: ${error}`);
        }
    }
    static includes(str, substr, message) {
        if (!str.includes(substr)) {
            throw new Error(message || `Expected "${str}" to include "${substr}"`);
        }
    }
    static notIncludes(str, substr, message) {
        if (str.includes(substr)) {
            throw new Error(message || `Expected "${str}" to not include "${substr}"`);
        }
    }
    static notEqual(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `Expected ${actual} to not equal ${expected}`);
        }
    }
    static isTrue(value, message) {
        if (value !== true) {
            throw new Error(message || `Expected true, got ${value}`);
        }
    }
    static isFalse(value, message) {
        if (value !== false) {
            throw new Error(message || `Expected false, got ${value}`);
        }
    }
    static isDefined(value, message) {
        if (value === undefined) {
            throw new Error(message || 'Expected value to be defined');
        }
    }
    static isNull(value, message) {
        if (value !== null) {
            throw new Error(message || `Expected null, got ${value}`);
        }
    }
    static isString(value, message) {
        if (typeof value !== 'string') {
            throw new Error(message || `Expected string, got ${typeof value}`);
        }
    }
    static isNumber(value, message) {
        if (typeof value !== 'number') {
            throw new Error(message || `Expected number, got ${typeof value}`);
        }
    }
    static isArray(value, message) {
        if (!Array.isArray(value)) {
            throw new Error(message || 'Expected array');
        }
    }
    static lengthEquals(arr, expected, message) {
        if (arr.length !== expected) {
            throw new Error(message || `Expected length ${expected}, got ${arr.length}`);
        }
    }
    static async rejects(fn, message) {
        try {
            await fn();
            throw new Error(message || 'Expected promise to reject');
        }
        catch (error) {
            // Expected
        }
    }
}
exports.Assert = Assert;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function timeout(ms, promise) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
    ]);
}
class MockEventBus {
    constructor() {
        this.listeners = new Map();
    }
    subscribe(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }
    publish(event, data) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.forEach(h => h(data));
        }
    }
    clear() {
        this.listeners.clear();
    }
}
exports.MockEventBus = MockEventBus;
class PerformanceMonitor {
    constructor() {
        this.measurements = new Map();
    }
    start(label) {
        performance.mark(`${label}-start`);
    }
    end(label) {
        performance.mark(`${label}-end`);
        try {
            performance.measure(label, `${label}-start`, `${label}-end`);
            const measure = performance.getEntriesByName(label)[0];
            if (!this.measurements.has(label)) {
                this.measurements.set(label, []);
            }
            this.measurements.get(label).push(measure.duration);
        }
        catch (error) {
            // Measurement failed
        }
    }
    getStats(label) {
        const measurements = this.measurements.get(label) || [];
        if (measurements.length === 0) {
            return { avg: 0, min: 0, max: 0, count: 0 };
        }
        return {
            avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
            min: Math.min(...measurements),
            max: Math.max(...measurements),
            count: measurements.length,
        };
    }
    printReport() {
        console.log('\n📊 Performance Report:');
        this.measurements.forEach((values, label) => {
            const stats = this.getStats(label);
            console.log(`  ${label}:`);
            console.log(`    Avg: ${stats.avg.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms (${stats.count} samples)`);
        });
    }
    clear() {
        this.measurements.clear();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
