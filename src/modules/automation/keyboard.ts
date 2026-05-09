/**
 * Keyboard Control Engine
 * Handles all keyboard-related automation (typing, hotkeys, key presses)
 */

import type { KeyboardAction } from './types';
import { osInput } from './osinput';

export class KeyboardEngine {
  private static instance: KeyboardEngine;
  private isTyping = false;
  private lastKeyPressTime = 0;

  static getInstance(): KeyboardEngine {
    if (!KeyboardEngine.instance) {
      KeyboardEngine.instance = new KeyboardEngine();
    }
    return KeyboardEngine.instance;
  }

  /**
   * Type text with human-like delays
   */
  async type(text: string, delay: number = 50): Promise<void> {
    this.isTyping = true;
    await osInput.typeText(text, delay);
    this.isTyping = false;
  }

  /**
   * Press a single key
   */
  async press(key: string): Promise<void> {
    await osInput.pressKey(key);
  }

  /**
   * Press hotkey combination (e.g., Ctrl+C, Alt+Tab)
   */
  async hotkey(...keys: string[]): Promise<void> {
    const modifiers = keys.slice(0, -1);
    const mainKey = keys[keys.length - 1];
    await osInput.pressHotkey(modifiers, mainKey);
  }

  /**
   * Tab key
   */
  async tab(): Promise<void> {
    await this.press('tab');
  }

  /**
   * Enter key
   */
  async enter(): Promise<void> {
    await this.press('return');
  }

  /**
   * Backspace
   */
  async backspace(count: number = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.press('backspace');
      await this.wait(50);
    }
  }

  /**
   * Delete key
   */
  async delete(count: number = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.press('delete');
      await this.wait(50);
    }
  }

  /**
   * Arrow keys
   */
  async arrow(direction: 'up' | 'down' | 'left' | 'right', count: number = 1): Promise<void> {
    const keyMap: Record<string, string> = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
    };

    const key = keyMap[direction];
    for (let i = 0; i < count; i++) {
      await this.press(key);
      await this.wait(50);
    }
  }

  /**
   * Select all (Ctrl+A)
   */
  async selectAll(): Promise<void> {
    await this.hotkey('control', 'a');
  }

  /**
   * Copy (Ctrl+C)
   */
  async copy(): Promise<void> {
    await this.hotkey('control', 'c');
  }

  /**
   * Paste (Ctrl+V)
   */
  async paste(): Promise<void> {
    await this.hotkey('control', 'v');
  }

  /**
   * Cut (Ctrl+X)
   */
  async cut(): Promise<void> {
    await this.hotkey('control', 'x');
  }

  /**
   * Undo (Ctrl+Z)
   */
  async undo(): Promise<void> {
    await this.hotkey('control', 'z');
  }

  /**
   * Redo (Ctrl+Y)
   */
  async redo(): Promise<void> {
    await this.hotkey('control', 'y');
  }

  // Private helper methods

  private async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const keyboardEngine = KeyboardEngine.getInstance();
