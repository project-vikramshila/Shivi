import { platform } from 'os';

// Type definition for robotjs
interface RobotJS {
  moveMouse(x: number, y: number): void;
  mouseClick(button?: string, double?: boolean): void;
  mouseToggle(down?: string, button?: string): void;
  dragMouse(x: number, y: number): void;
  scrollMouse(x: number, y: number): void;
  typeString(string: string): void;
  keyTap(key: string, modifier?: string[]): void;
  keyToggle(key: string, down: string, modifier?: string[]): void;
  getMousePos(): { x: number; y: number };
  getScreenSize(): { width: number; height: number };
}

let robot: RobotJS | null = null;

// Lazy load robotjs on demand
function getRobot(): RobotJS | null {
  if (robot) return robot;
  try {
    robot = require('robotjs');
    return robot;
  } catch (error) {
    console.warn('⚠️ robotjs not available, falling back to simulation mode');
    return null;
  }
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface MouseEvent {
  timestamp: number;
  action: 'move' | 'click' | 'drag' | 'scroll';
  position: MousePosition;
  button?: string;
}

export class OSInputSimulator {
  private simulationMode = true;
  private lastMousePos: MousePosition = { x: 0, y: 0 };
  private eventLog: MouseEvent[] = [];
  private maxLogSize = 100;

  constructor() {
    // Check if robotjs is available
    const robotInstance = getRobot();
    if (robotInstance) {
      this.simulationMode = false;
      try {
        // Test to make sure it works
        this.lastMousePos = robotInstance.getMousePos();
        console.log('✅ OS Input Simulator: Real input mode enabled');
      } catch (error) {
        console.warn('⚠️ OS Input Simulator: Real mode test failed, using simulation');
        this.simulationMode = true;
      }
    } else {
      console.warn('⚠️ OS Input Simulator: Simulation mode (robotjs not installed)');
      this.simulationMode = true;
    }
  }

  // Utility: Delay helper
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Utility: Easing function for smooth mouse movement
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Utility: Log event
  private logEvent(action: string, position: MousePosition, button?: string): void {
    this.eventLog.push({
      timestamp: Date.now(),
      action: action as any,
      position,
      button,
    });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }

  // Mouse movement with smooth easing
  async moveMouse(x: number, y: number, duration = 500): Promise<void> {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      console.log(`🖱️ SIMULATE: Move mouse to (${x}, ${y}) over ${duration}ms`);
      this.lastMousePos = { x, y };
      this.logEvent('move', { x, y });
      await this.delay(duration);
      return;
    }

    // Real implementation with easing
    try {
      const startPos = robot.getMousePos();
      const steps = Math.max(10, Math.ceil(duration / 20));
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const easedT = this.easeInOutCubic(t);
        const currentX = Math.round(startPos.x + (x - startPos.x) * easedT);
        const currentY = Math.round(startPos.y + (y - startPos.y) * easedT);
        robot.moveMouse(currentX, currentY);
        await this.delay(Math.round(duration / steps));
      }

      this.lastMousePos = { x, y };
      this.logEvent('move', { x, y });
    } catch (error) {
      console.warn('Failed to move mouse:', error);
      this.lastMousePos = { x, y };
    }
  }

  // Mouse click
  async clickMouse(x?: number, y?: number, button: 'left' | 'right' | 'middle' = 'left', double = false): Promise<void> {
    if (x !== undefined && y !== undefined) {
      await this.moveMouse(x, y, 300);
    }

    const robot = getRobot();
    const pos = x !== undefined && y !== undefined ? { x, y } : this.lastMousePos;

    if (this.simulationMode || !robot) {
      console.log(`🖱️ SIMULATE: ${double ? 'Double ' : ''}click ${button} at (${pos.x}, ${pos.y})`);
      this.logEvent('click', pos, button);
      await this.delay(100);
      return;
    }

    try {
      robot.mouseClick(button, double);
      this.logEvent('click', pos, button);
      await this.delay(50);
    } catch (error) {
      console.warn('Failed to click mouse:', error);
    }
  }

  // Mouse drag with smooth movement
  async dragMouse(fromX: number, fromY: number, toX: number, toY: number, duration = 800): Promise<void> {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      console.log(`🖱️ SIMULATE: Drag from (${fromX}, ${fromY}) to (${toX}, ${toY}) over ${duration}ms`);
      this.lastMousePos = { x: toX, y: toY };
      this.logEvent('drag', { x: toX, y: toY });
      await this.delay(duration);
      return;
    }

    try {
      await this.moveMouse(fromX, fromY, 300);
      robot.mouseToggle('down');
      await this.moveMouse(toX, toY, duration);
      robot.mouseToggle('up');
      this.logEvent('drag', { x: toX, y: toY });
    } catch (error) {
      console.warn('Failed to drag mouse:', error);
    }
  }

  // Scroll mouse
  async scrollMouse(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right' = 'down', clicks = 3): Promise<void> {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      console.log(`🖱️ SIMULATE: Scroll ${direction} by ${clicks} clicks at (${x}, ${y})`);
      await this.delay(200);
      return;
    }

    try {
      await this.moveMouse(x, y, 200);
      const scrollX = direction === 'left' ? -clicks : direction === 'right' ? clicks : 0;
      const scrollY = direction === 'up' ? -clicks : direction === 'down' ? clicks : 0;
      robot.scrollMouse(scrollX, scrollY);
      this.logEvent('scroll', { x, y });
      await this.delay(300);
    } catch (error) {
      console.warn('Failed to scroll mouse:', error);
    }
  }

  // Type text with human-like delays
  async typeText(text: string, delay = 50): Promise<void> {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      console.log(`⌨️ SIMULATE: Type "${text}" with ${delay}ms delay per char`);
      await this.delay(text.length * delay);
      return;
    }

    try {
      for (const char of text) {
        robot.typeString(char);
        await this.delay(delay + Math.random() * 30);
      }
    } catch (error) {
      console.warn('Failed to type text:', error);
    }
  }

  // Press individual key
  async pressKey(key: string, modifiers: string[] = []): Promise<void> {
    const robot = getRobot();
    const modStr = modifiers.length > 0 ? `${modifiers.join('+')}+` : '';

    if (this.simulationMode || !robot) {
      console.log(`⌨️ SIMULATE: Press ${modStr}${key}`);
      await this.delay(50);
      return;
    }

    try {
      robot.keyTap(key, modifiers.length > 0 ? modifiers : undefined);
      await this.delay(50);
    } catch (error) {
      console.warn('Failed to press key:', error);
    }
  }

  // Hold key for duration
  async holdKey(key: string, duration = 100): Promise<void> {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      console.log(`⌨️ SIMULATE: Hold ${key} for ${duration}ms`);
      await this.delay(duration);
      return;
    }

    try {
      robot.keyToggle(key, 'down');
      await this.delay(duration);
      robot.keyToggle(key, 'up');
    } catch (error) {
      console.warn('Failed to hold key:', error);
    }
  }

  // Press hotkey combination
  async pressHotkey(modifiers: string[], key: string): Promise<void> {
    const robot = getRobot();
    const modStr = modifiers.join('+');

    if (this.simulationMode || !robot) {
      console.log(`⌨️ SIMULATE: Hotkey ${modStr}+${key}`);
      await this.delay(50);
      return;
    }

    try {
      robot.keyTap(key, modifiers);
      await this.delay(50);
    } catch (error) {
      console.warn('Failed to press hotkey:', error);
    }
  }

  // Get current mouse position
  getMousePosition(): MousePosition {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      return this.lastMousePos;
    }

    try {
      return robot.getMousePos();
    } catch (error) {
      console.warn('Failed to get mouse position:', error);
      return this.lastMousePos;
    }
  }

  // Get screen size
  getScreenSize(): { width: number; height: number } {
    const robot = getRobot();

    if (this.simulationMode || !robot) {
      return { width: 1920, height: 1080 };
    }

    try {
      return robot.getScreenSize();
    } catch (error) {
      console.warn('Failed to get screen size:', error);
      return { width: 1920, height: 1080 };
    }
  }

  // Get event log
  getEventLog(): MouseEvent[] {
    return [...this.eventLog];
  }

  // Clear event log
  clearEventLog(): void {
    this.eventLog = [];
  }

  // Check if running in simulation mode
  isSimulationMode(): boolean {
    return this.simulationMode;
  }
}

// Export singleton instance
export const osInput = new OSInputSimulator();