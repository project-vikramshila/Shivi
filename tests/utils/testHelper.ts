/**
 * Test Helper Utilities
 * Common testing utilities for all test suites
 */

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip' | 'error';
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

export class TestRunner {
  private tests: TestResult[] = [];
  private suiteName: string;
  private startTime: number = 0;

  constructor(suiteName: string) {
    this.suiteName = suiteName;
  }

  async test(name: string, fn: () => Promise<void> | void, skip: boolean = false): Promise<TestResult> {
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
    } catch (error) {
      return this.addResult({
        name,
        status: 'fail',
        duration: performance.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private addResult(result: TestResult): TestResult {
    this.tests.push(result);
    return result;
  }

  getSuite(): TestSuite {
    return {
      name: this.suiteName,
      tests: this.tests,
      duration: this.tests.reduce((sum, t) => sum + t.duration, 0),
      passed: this.tests.filter(t => t.status === 'pass').length,
      failed: this.tests.filter(t => t.status === 'fail').length,
      skipped: this.tests.filter(t => t.status === 'skip').length,
    };
  }

  print(): void {
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

export class Assert {
  static equal(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  static deepEqual(actual: any, expected: any, message?: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Objects not equal\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
  }

  static ok(value: any, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  }

  static notOk(value: any, message?: string): void {
    if (value) {
      throw new Error(message || `Expected falsy value, got ${value}`);
    }
  }

  static throws(fn: () => void, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      // Expected
    }
  }

  static doesNotThrow(fn: () => void, message?: string): void {
    try {
      fn();
    } catch (error) {
      throw new Error(message || `Expected function not to throw: ${error}`);
    }
  }

  static includes(str: string, substr: string, message?: string): void {
    if (!str.includes(substr)) {
      throw new Error(message || `Expected "${str}" to include "${substr}"`);
    }
  }

  static notIncludes(str: string, substr: string, message?: string): void {
    if (str.includes(substr)) {
      throw new Error(message || `Expected "${str}" to not include "${substr}"`);
    }
  }

  static notEqual(actual: any, expected: any, message?: string): void {
    if (actual === expected) {
      throw new Error(message || `Expected ${actual} to not equal ${expected}`);
    }
  }

  static isTrue(value: any, message?: string): void {
    if (value !== true) {
      throw new Error(message || `Expected true, got ${value}`);
    }
  }

  static isFalse(value: any, message?: string): void {
    if (value !== false) {
      throw new Error(message || `Expected false, got ${value}`);
    }
  }

  static isDefined(value: any, message?: string): void {
    if (value === undefined) {
      throw new Error(message || 'Expected value to be defined');
    }
  }

  static isNull(value: any, message?: string): void {
    if (value !== null) {
      throw new Error(message || `Expected null, got ${value}`);
    }
  }

  static isString(value: any, message?: string): void {
    if (typeof value !== 'string') {
      throw new Error(message || `Expected string, got ${typeof value}`);
    }
  }

  static isNumber(value: any, message?: string): void {
    if (typeof value !== 'number') {
      throw new Error(message || `Expected number, got ${typeof value}`);
    }
  }

  static isArray(value: any, message?: string): void {
    if (!Array.isArray(value)) {
      throw new Error(message || 'Expected array');
    }
  }

  static lengthEquals(arr: any[], expected: number, message?: string): void {
    if (arr.length !== expected) {
      throw new Error(message || `Expected length ${expected}, got ${arr.length}`);
    }
  }

  static async rejects(fn: () => Promise<any>, message?: string): Promise<void> {
    try {
      await fn();
      throw new Error(message || 'Expected promise to reject');
    } catch (error) {
      // Expected
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeout(ms: number, promise: Promise<any>): Promise<any> {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

export class MockEventBus {
  private listeners: Map<string, Function[]> = new Map();

  subscribe(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  publish(event: string, data: any): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(h => h(data));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  start(label: string): void {
    performance.mark(`${label}-start`);
  }

  end(label: string): void {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0] as PerformanceMeasure;
      
      if (!this.measurements.has(label)) {
        this.measurements.set(label, []);
      }
      this.measurements.get(label)!.push(measure.duration);
    } catch (error) {
      // Measurement failed
    }
  }

  getStats(label: string) {
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

  printReport(): void {
    console.log('\n📊 Performance Report:');
    this.measurements.forEach((values, label) => {
      const stats = this.getStats(label);
      console.log(`  ${label}:`);
      console.log(`    Avg: ${stats.avg.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms (${stats.count} samples)`);
    });
  }

  clear(): void {
    this.measurements.clear();
  }
}
