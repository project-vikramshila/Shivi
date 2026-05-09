/**
 * Mouse Control Engine
 * Handles all mouse-related automation (movement, clicking, dragging, scrolling)
 */

import type { MouseAction } from './types';
import { osInput } from './osinput';

export class MouseEngine {
  private static instance: MouseEngine;
  private isMoving = false;

  static getInstance(): MouseEngine {
    if (!MouseEngine.instance) {
      MouseEngine.instance = new MouseEngine();
    }
    return MouseEngine.instance;
  }

  /**
   * Get current mouse position
   */
  async getCurrentPosition(): Promise<{ x: number; y: number }> {
    return osInput.getMousePosition();
  }

  /**
   * Smooth mouse movement to target position
   * @param x Target X coordinate
   * @param y Target Y coordinate
   * @param duration Duration of movement in milliseconds
   */
  async smoothMove(x: number, y: number, duration: number = 500): Promise<void> {
    if (this.isMoving) {
      await this.waitForMovementComplete();
    }

    this.isMoving = true;
    await osInput.moveMouse(x, y, duration);
    this.isMoving = false;
  }

  /**
   * Instant mouse move
   */
  async moveTo(x: number, y: number): Promise<void> {
    await osInput.moveMouse(x, y, 0);
  }

  /**
   * Click at current position
   */
  async click(button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await osInput.clickMouse(undefined, undefined, button, false);
  }

  /**
   * Double click at current position
   */
  async doubleClick(delay: number = 100): Promise<void> {
    await this.click('left');
    await this.wait(delay);
    await this.click('left');
  }

  /**
   * Click at specific position (with smooth movement first)
   */
  async clickAt(x: number, y: number, duration: number = 300): Promise<void> {
    await this.smoothMove(x, y, duration);
    await this.click('left');
  }

  /**
   * Drag from current position to target
   */
  async drag(toX: number, toY: number, duration: number = 500): Promise<void> {
    const currentPos = await this.getCurrentPosition();
    await osInput.dragMouse(currentPos.x, currentPos.y, toX, toY, duration);
  }

  /**
   * Scroll in a direction
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount: number = 3): Promise<void> {
    const currentPos = await this.getCurrentPosition();
    await osInput.scrollMouse(currentPos.x, currentPos.y, direction, amount);
  }

  /**
   * Wait for a duration
   */
  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Wait for movement to complete
   */
  private async waitForMovementComplete(): Promise<void> {
    while (this.isMoving) {
      await this.wait(50);
    }
  }
}

export const mouseEngine = MouseEngine.getInstance();
