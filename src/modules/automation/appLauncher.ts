import { exec, spawn } from 'child_process';
import { platform } from 'os';
import * as path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface ApplicationConfig {
  name: string;
  executable: string;
  args?: string[];
  workingDir?: string;
  icon?: string;
  category?: string;
  description?: string;
}

export interface ApplicationInstance {
  name: string;
  pid: number;
  executable: string;
  startTime: Date;
}

/**
 * AppLauncher manages application launching and lifecycle
 */
export class AppLauncher {
  private applications: Map<string, ApplicationConfig> = new Map();
  private runningInstances: Map<string, ApplicationInstance> = new Map();

  constructor() {
    this.registerDefaultApplications();
  }

  /**
   * Register default applications based on platform
   */
  private registerDefaultApplications(): void {
    const currentPlatform = platform();

    if (currentPlatform === 'win32') {
      // Windows applications
      this.register('whatsapp', {
        name: 'WhatsApp',
        executable: 'C:\\Program Files\\WindowsApps\\WhatsAppDesktop\\WhatsApp.exe',
        description: 'WhatsApp Desktop',
        category: 'messaging',
      });

      this.register('chrome', {
        name: 'Google Chrome',
        executable: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        description: 'Google Chrome Browser',
        category: 'browser',
      });

      this.register('firefox', {
        name: 'Mozilla Firefox',
        executable: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
        description: 'Mozilla Firefox Browser',
        category: 'browser',
      });

      this.register('edge', {
        name: 'Microsoft Edge',
        executable: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        description: 'Microsoft Edge Browser',
        category: 'browser',
      });

      this.register('notion', {
        name: 'Notion',
        executable: 'C:\\Users\\AppData\\Local\\Programs\\Notion\\Notion.exe',
        description: 'Notion App',
        category: 'productivity',
      });

      this.register('vscode', {
        name: 'Visual Studio Code',
        executable: 'C:\\Users\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
        description: 'Visual Studio Code',
        category: 'development',
      });
    } else if (currentPlatform === 'darwin') {
      // macOS applications
      this.register('whatsapp', {
        name: 'WhatsApp',
        executable: '/Applications/WhatsApp.app/Contents/MacOS/WhatsApp',
        description: 'WhatsApp Desktop',
        category: 'messaging',
      });

      this.register('chrome', {
        name: 'Google Chrome',
        executable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        description: 'Google Chrome Browser',
        category: 'browser',
      });

      this.register('firefox', {
        name: 'Mozilla Firefox',
        executable: '/Applications/Firefox.app/Contents/MacOS/firefox',
        description: 'Mozilla Firefox Browser',
        category: 'browser',
      });

      this.register('safari', {
        name: 'Safari',
        executable: '/Applications/Safari.app/Contents/MacOS/Safari',
        description: 'Apple Safari Browser',
        category: 'browser',
      });

      this.register('notion', {
        name: 'Notion',
        executable: '/Applications/Notion.app/Contents/MacOS/Notion',
        description: 'Notion App',
        category: 'productivity',
      });

      this.register('vscode', {
        name: 'Visual Studio Code',
        executable: '/Applications/Visual Studio Code.app/Contents/MacOS/Code',
        description: 'Visual Studio Code',
        category: 'development',
      });
    } else {
      // Linux applications
      this.register('whatsapp', {
        name: 'WhatsApp',
        executable: 'whatsapp-nativefier',
        description: 'WhatsApp Web',
        category: 'messaging',
      });

      this.register('chrome', {
        name: 'Google Chrome',
        executable: 'google-chrome',
        description: 'Google Chrome Browser',
        category: 'browser',
      });

      this.register('firefox', {
        name: 'Mozilla Firefox',
        executable: 'firefox',
        description: 'Mozilla Firefox Browser',
        category: 'browser',
      });

      this.register('vscode', {
        name: 'Visual Studio Code',
        executable: 'code',
        description: 'Visual Studio Code',
        category: 'development',
      });
    }
  }

  /**
   * Register an application
   */
  register(id: string, config: ApplicationConfig): void {
    this.applications.set(id.toLowerCase(), config);
    console.log(`✅ Registered application: ${config.name}`);
  }

  /**
   * Launch an application
   */
  async launch(appId: string, args?: string[]): Promise<ApplicationInstance> {
    const id = appId.toLowerCase();
    const config = this.applications.get(id);

    if (!config) {
      throw new Error(`Application not found: ${appId}`);
    }

    try {
      console.log(`🚀 Launching ${config.name}...`);

      const allArgs = [...(config.args || []), ...(args || [])];
      const process = spawn(config.executable, allArgs, {
        cwd: config.workingDir,
        detached: true,
      });

      const instance: ApplicationInstance = {
        name: config.name,
        pid: process.pid || 0,
        executable: config.executable,
        startTime: new Date(),
      };

      this.runningInstances.set(`${id}_${instance.pid}`, instance);

      console.log(`✅ Launched ${config.name} (PID: ${instance.pid})`);

      return instance;
    } catch (error) {
      console.error(`❌ Failed to launch ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Close an application by ID
   */
  async close(appId: string, graceful = true): Promise<void> {
    const id = appId.toLowerCase();
    const instances = Array.from(this.runningInstances.values()).filter(
      (inst) => inst.executable.toLowerCase().includes(id) || inst.name.toLowerCase().includes(id)
    );

    if (instances.length === 0) {
      throw new Error(`No running instance found for: ${appId}`);
    }

    for (const instance of instances) {
      try {
        await this.kill(instance.pid, graceful);
      } catch (error) {
        console.warn(`Failed to close ${instance.name}:`, error);
      }
    }
  }

  /**
   * Kill a process by PID
   */
  private async kill(pid: number, graceful = true): Promise<void> {
    const currentPlatform = platform();

    try {
      if (graceful) {
        if (currentPlatform === 'win32') {
          await execPromise(`taskkill /PID ${pid} /T`);
        } else {
          process.kill(-pid, 'SIGTERM');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (this.isProcessRunning(pid)) {
            process.kill(-pid, 'SIGKILL');
          }
        }
      } else {
        if (currentPlatform === 'win32') {
          await execPromise(`taskkill /PID ${pid} /T /F`);
        } else {
          process.kill(-pid, 'SIGKILL');
        }
      }

      // Remove from tracking
      const key = Array.from(this.runningInstances.entries()).find(([, inst]) => inst.pid === pid)?.[0];
      if (key) {
        this.runningInstances.delete(key);
      }

      console.log(`✅ Closed process ${pid}`);
    } catch (error) {
      console.warn(`Failed to kill process ${pid}:`, error);
    }
  }

  /**
   * Check if process is running
   */
  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get list of registered applications
   */
  getApplications(): ApplicationConfig[] {
    return Array.from(this.applications.values());
  }

  /**
   * Get running instances
   */
  getRunningInstances(): ApplicationInstance[] {
    return Array.from(this.runningInstances.values()).filter((inst) => this.isProcessRunning(inst.pid));
  }

  /**
   * Get app by name or ID
   */
  getApplication(id: string): ApplicationConfig | undefined {
    return this.applications.get(id.toLowerCase());
  }

  /**
   * Check if app is running
   */
  isRunning(appId: string): boolean {
    const id = appId.toLowerCase();
    const instances = this.getRunningInstances().filter(
      (inst) => inst.executable.toLowerCase().includes(id) || inst.name.toLowerCase().includes(id)
    );
    return instances.length > 0;
  }
}

// Export singleton
export const appLauncher = new AppLauncher();
