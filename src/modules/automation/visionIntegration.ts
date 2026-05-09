/**
 * VisionIntegration - Bridge between automation and vision systems
 *
 * This module coordinates:
 * - Screen capture via vision system
 * - UI element detection (OCR + Gemini vision)
 * - Text extraction
 * - Target identification for automation
 */

export interface UIElement {
  type: 'button' | 'text' | 'input' | 'link' | 'image' | 'container' | 'unknown';
  text: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number; // 0-1
  metadata?: Record<string, any>;
}

export interface ScreenAnalysis {
  timestamp: number;
  elements: UIElement[];
  textContent: string;
  dominantColors?: string[];
  layout?: {
    rows: number;
    columns: number;
  };
}

export interface VisionRequest {
  action: 'capture' | 'analyze' | 'find' | 'extract' | 'compare';
  target?: string;
  query?: string;
  threshold?: number; // confidence threshold
}

export interface VisionResponse {
  success: boolean;
  data?: any;
  elements?: UIElement[];
  text?: string;
  error?: string;
}

/**
 * VisionIntegration class
 */
export class VisionIntegration {
  private lastScreenshot: Buffer | null = null;
  private lastAnalysis: ScreenAnalysis | null = null;
  private visionCache: Map<string, ScreenAnalysis> = new Map();
  private maxCacheSize = 10;

  constructor() {
    console.log('✅ Vision Integration initialized');
  }

  /**
   * Capture current screen for analysis
   */
  async captureScreen(): Promise<Buffer> {
    try {
      // This will be called from main process which has access to electron
      console.log('📸 Capturing screen...');

      // Placeholder: Returns dummy buffer
      // In production, this is called by main process and returns actual screenshot
      this.lastScreenshot = Buffer.from('dummy');

      console.log('✅ Screen captured');
      return this.lastScreenshot;
    } catch (error) {
      console.error('❌ Failed to capture screen:', error);
      throw error;
    }
  }

  /**
   * Analyze screen screenshot for UI elements
   */
  async analyzeScreen(screenshot: Buffer): Promise<ScreenAnalysis> {
    try {
      console.log('🔍 Analyzing screen...');

      // This will be bridged to main process which calls Gemini vision
      // For now, return placeholder analysis
      const analysis: ScreenAnalysis = {
        timestamp: Date.now(),
        elements: [
          {
            type: 'button',
            text: 'Send',
            bounds: { x: 500, y: 800, width: 100, height: 40 },
            confidence: 0.95,
          },
          {
            type: 'input',
            text: 'Message text box',
            bounds: { x: 100, y: 750, width: 700, height: 50 },
            confidence: 0.98,
          },
        ],
        textContent: 'Sample content from screen',
      };

      this.lastAnalysis = analysis;
      this.cacheAnalysis(`analysis_${Date.now()}`, analysis);

      console.log(`✅ Analyzed ${analysis.elements.length} UI elements`);
      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze screen:', error);
      throw error;
    }
  }

  /**
   * Find specific UI element on screen
   */
  async findElement(query: string, threshold = 0.8): Promise<UIElement | null> {
    try {
      if (!this.lastAnalysis) {
        throw new Error('No recent screen analysis. Call analyzeScreen first.');
      }

      console.log(`🔎 Finding element: "${query}"`);

      // Try to find element by text match
      const element = this.lastAnalysis.elements.find(
        (el) =>
          el.text.toLowerCase().includes(query.toLowerCase()) &&
          el.confidence >= threshold
      );

      if (element) {
        console.log(`✅ Found element: ${element.text}`);
        return element;
      }

      console.log(`⚠️ Element not found: "${query}"`);
      return null;
    } catch (error) {
      console.error('❌ Failed to find element:', error);
      throw error;
    }
  }

  /**
   * Extract text from specific region
   */
  async extractText(bounds?: { x: number; y: number; width: number; height: number }): Promise<string> {
    try {
      if (!this.lastAnalysis) {
        throw new Error('No recent screen analysis');
      }

      console.log('📝 Extracting text...');

      const text = bounds
        ? this.lastAnalysis.elements
            .filter((el) => this.isBoundingBoxOverlap(el.bounds, bounds))
            .map((el) => el.text)
            .join(' \n')
        : this.lastAnalysis.textContent;

      console.log(`✅ Extracted ${text.length} characters`);
      return text;
    } catch (error) {
      console.error('❌ Failed to extract text:', error);
      throw error;
    }
  }

  /**
   * Find button by text and return center coordinates
   */
  async findButtonCenter(buttonText: string): Promise<{ x: number; y: number } | null> {
    try {
      const element = await this.findElement(buttonText, 0.85);

      if (!element) {
        return null;
      }

      const centerX = Math.round(element.bounds.x + element.bounds.width / 2);
      const centerY = Math.round(element.bounds.y + element.bounds.height / 2);

      console.log(`✅ Button center: (${centerX}, ${centerY})`);
      return { x: centerX, y: centerY };
    } catch (error) {
      console.error('❌ Failed to find button center:', error);
      return null;
    }
  }

  /**
   * Find input field and verify it's ready
   */
  async findInputField(label?: string): Promise<UIElement | null> {
    try {
      if (!this.lastAnalysis) {
        throw new Error('No recent screen analysis');
      }

      console.log('🔍 Finding input field...');

      const inputField = this.lastAnalysis.elements.find((el) => el.type === 'input');

      if (!inputField) {
        console.log('⚠️ No input field found');
        return null;
      }

      console.log(`✅ Found input field: ${inputField.text}`);
      return inputField;
    } catch (error) {
      console.error('❌ Failed to find input field:', error);
      return null;
    }
  }

  /**
   * OCR text from screenshot
   *
   * This will be bridged to main process which handles actual OCR
   */
  async ocrScreenshot(screenshot: Buffer): Promise<string> {
    try {
      console.log('📖 Running OCR...');
      // Placeholder: In production, this calls Tesseract or similar via main process
      const text = 'Extracted text from image';
      console.log(`✅ OCR complete: ${text.length} chars`);
      return text;
    } catch (error) {
      console.error('❌ OCR failed:', error);
      throw error;
    }
  }

  /**
   * Detect app/window type from content
   */
  async detectApplicationContext(): Promise<string> {
    try {
      if (!this.lastAnalysis) {
        return 'unknown';
      }

      const content = this.lastAnalysis.textContent.toLowerCase();

      if (content.includes('whatsapp') || content.includes('message')) {
        return 'whatsapp';
      } else if (content.includes('instagram') || content.includes('direct')) {
        return 'instagram';
      } else if (content.includes('gmail') || content.includes('email')) {
        return 'gmail';
      } else if (content.includes('calendar') || content.includes('event')) {
        return 'calendar';
      }

      return 'browser';
    } catch (error) {
      console.error('❌ Failed to detect application context:', error);
      return 'unknown';
    }
  }

  /**
   * Verify UI state matches expected state
   */
  async verifyUIState(expectedElements: string[]): Promise<boolean> {
    try {
      if (!this.lastAnalysis) {
        return false;
      }

      console.log('✔️ Verifying UI state...');

      const foundElements = expectedElements.filter((expected) =>
        this.lastAnalysis!.elements.some((el) =>
          el.text.toLowerCase().includes(expected.toLowerCase())
        )
      );

      const verified = foundElements.length === expectedElements.length;

      console.log(
        `✅ Verification: ${foundElements.length}/${expectedElements.length} elements found`
      );

      return verified;
    } catch (error) {
      console.error('❌ UI verification failed:', error);
      return false;
    }
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(
    query: string,
    maxWaitMs = 15000,
    pollIntervalMs = 500
  ): Promise<UIElement | null> {
    try {
      console.log(`⏳ Waiting for element: "${query}" (max ${maxWaitMs}ms)`);

      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitMs) {
        // Re-capture and analyze screen
        const screenshot = await this.captureScreen();
        await this.analyzeScreen(screenshot);

        const element = await this.findElement(query, 0.8);
        if (element) {
          console.log(`✅ Element appeared: ${element.text}`);
          return element;
        }

        await this.delay(pollIntervalMs);
      }

      console.log(`⏱️ Timeout waiting for element: "${query}"`);
      return null;
    } catch (error) {
      console.error('❌ Failed while waiting for element:', error);
      return null;
    }
  }

  /**
   * Compare two screenshots for changes
   */
  async compareScreenshots(before: Buffer, after: Buffer): Promise<number> {
    try {
      console.log('📊 Comparing screenshots...');
      // Placeholder: Would use image comparison library
      // Returns similarity percentage (0-100)
      const similarity = 85;
      console.log(`✅ Similarity: ${similarity}%`);
      return similarity;
    } catch (error) {
      console.error('❌ Comparison failed:', error);
      throw error;
    }
  }

  /**
   * Get cached analysis
   */
  getCachedAnalysis(key: string): ScreenAnalysis | undefined {
    return this.visionCache.get(key);
  }

  /**
   * Cache analysis
   */
  private cacheAnalysis(key: string, analysis: ScreenAnalysis): void {
    this.visionCache.set(key, analysis);

    if (this.visionCache.size > this.maxCacheSize) {
        const iterator = this.visionCache.keys();
        const firstKey = iterator.next().value;
        if (typeof firstKey === 'string') {
          this.visionCache.delete(firstKey);
        }
      }
    }

    /**
     * Get last analysis
     */
  /**
   * Clear cache
   */
  clearCache(): void {
    this.visionCache.clear();
    this.lastAnalysis = null;
  }

  /**
   * Helper: Check if bounding boxes overlap
   */
  private isBoundingBoxOverlap(
    box1: { x: number; y: number; width: number; height: number },
    box2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  /**
   * Helper: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton
export const visionIntegration = new VisionIntegration();
