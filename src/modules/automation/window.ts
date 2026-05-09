import { execFile, exec, spawn } from 'child_process';
import { platform } from 'os';
import * as path from 'path';

export interface WindowInfo {
  id: string;
  title: string;
  appName: string;
  bounds: { x: number; y: number; width: number; height: number };
  isMinimized: boolean;
  isActive: boolean;
}

export interface AppInfo {
  name: string;
  executable: string;
  icon?: string;
  isRunning: boolean;
}

export class WindowManager {
  private activeWindows: Map<string, WindowInfo> = new Map();

  constructor() {
    this.initializeWindowDetection();
  }

  private initializeWindowDetection() {
    // Initialize window detection based on platform
    // This is a placeholder - in production, we'd use platform-specific APIs
    setInterval(() => {
      this.updateWindowList();
    }, 1000);
  }

  private async updateWindowList() {
    try {
      if (platform() === 'darwin') {
        await this.updateMacWindows();
      } else if (platform() === 'win32') {
        await this.updateWindowsWindows();
      } else {
        await this.updateLinuxWindows();
      }
    } catch (error) {
      console.warn('Failed to update window list:', error);
    }
  }

  private async updateMacWindows() {
    // Use AppleScript to get window information
    const script = `
      tell application "System Events"
        set windowList to {}
        repeat with proc in (every process whose background only is false)
          try
            tell proc
              repeat with w in (every window)
                set end of windowList to { \\
                  id: (id of w), \\
                  title: (name of w), \\
                  appName: (name of proc), \\
                  bounds: (position of w & size of w), \\
                  isMinimized: (miniaturized of w), \\
                  isActive: false \\
                }
              end repeat
            end tell
          end try
        end repeat
        return windowList
      end tell
    `;

    try {
      const result = await this.executeAppleScript(script);
      const windows = this.parseAppleScriptOutput(result);
      this.updateActiveWindows(windows);
    } catch (error) {
      console.warn('Failed to get Mac windows:', error);
    }
  }

  private async updateWindowsWindows() {
    // Use PowerShell to get window information
    const script = [
      'Add-Type -TypeDefinition @"',
      'using System;',
      'using System.Text;',
      'using System.Runtime.InteropServices;',
      'public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);',
      'public class Win32 {',
      '  [DllImport("user32.dll")]',
      '  public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);',
      '  [DllImport("user32.dll", CharSet=CharSet.Unicode)]',
      '  public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);',
      '  [DllImport("user32.dll")]',
      '  public static extern bool IsWindowVisible(IntPtr hWnd);',
      '  [DllImport("user32.dll")]',
      '  public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);',
      '  [StructLayout(LayoutKind.Sequential)]',
      '  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }',
      '}',
      '@"',
      '',
      '$windows = @()',
      '$callback = [Win32+EnumWindowsProc]{',
      '  param($hwnd, $lparam)',
      '  if ([Win32]::IsWindowVisible($hwnd)) {',
      '    $titleBuilder = New-Object System.Text.StringBuilder 256',
      '    [Win32]::GetWindowText($hwnd, $titleBuilder, 256) | Out-Null',
      '    $title = $titleBuilder.ToString().Trim()',
      '    if ($title) {',
      '      $rect = New-Object Win32+RECT',
      '      [Win32]::GetWindowRect($hwnd, [ref]$rect) | Out-Null',
      '      $windows += @{',
      '        id = $hwnd.ToString()',
      '        title = $title',
      '        bounds = @{',
      '          x = $rect.Left',
      '          y = $rect.Top',
      '          width = $rect.Right - $rect.Left',
      '          height = $rect.Bottom - $rect.Top',
      '        }',
      '      }',
      '    }',
      '  }',
      '  return $true',
      '}',
      '',
      '[Win32]::EnumWindows($callback, 0) | Out-Null',
      '$windows | ConvertTo-Json',
    ].join('\n');

    try {
      const result = await this.executePowerShell(script);
      const windows = this.parsePowerShellOutput(result);
      this.updateActiveWindows(windows);
    } catch (error) {
      console.warn('Failed to get Windows windows:', error);
    }
  }

  private async updateLinuxWindows() {
    // Use wmctrl or xdotool to get window information
    try {
      const result = await this.executeCommand('wmctrl -l -G');
      const windows = this.parseWmctrlOutput(result);
      this.updateActiveWindows(windows);
    } catch (error) {
      console.warn('Failed to get Linux windows:', error);
    }
  }

  private executeAppleScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  private executePowerShell(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedCommand], (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  private parseAppleScriptOutput(output: string): WindowInfo[] {
    try {
      // AppleScript returns a complex nested structure
      // For now, return empty array - would need more complex parsing
      console.log('AppleScript output:', output);
      return [];
    } catch (error) {
      console.warn('Failed to parse AppleScript output:', error);
      return [];
    }
  }

  private parsePowerShellOutput(output: string): WindowInfo[] {
    try {
      const data = JSON.parse(output);
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        appName: 'unknown', // PowerShell doesn't easily give us app name
        bounds: item.bounds,
        isMinimized: false, // Would need additional API calls
        isActive: false, // Would need additional API calls
      }));
    } catch (error) {
      console.warn('Failed to parse PowerShell output:', error);
      return [];
    }
  }

  private parseWmctrlOutput(output: string): WindowInfo[] {
    const windows: WindowInfo[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 8) {
        const [id, desktop, pid, x, y, w, h, ...titleParts] = parts;
        const title = titleParts.join(' ');

        windows.push({
          id,
          title,
          appName: 'unknown', // wmctrl doesn't give app name directly
          bounds: {
            x: parseInt(x),
            y: parseInt(y),
            width: parseInt(w),
            height: parseInt(h),
          },
          isMinimized: false, // Would need additional wmctrl calls
          isActive: false, // Would need additional wmctrl calls
        });
      }
    }

    return windows;
  }

  private updateActiveWindows(windows: WindowInfo[]) {
    // Clear existing windows
    this.activeWindows.clear();

    // Add new windows
    for (const window of windows) {
      this.activeWindows.set(window.id, window);
    }

    console.log(`Updated window list: ${windows.length} windows detected`);
  }

  async launchApp(appName: string): Promise<boolean> {
    try {
      const appConfig = this.getAppConfig(appName);
      if (!appConfig) {
        throw new Error(`Unknown app: ${appName}`);
      }

      if (platform() === 'darwin') {
        await this.executeCommand(`open -a "${appConfig.executable}"`);
      } else if (platform() === 'win32') {
        spawn(appConfig.executable, [], { detached: true, stdio: 'ignore' });
      } else {
        // Linux
        spawn(appConfig.executable, [], { detached: true, stdio: 'ignore' });
      }

      // Wait for app to launch
      await this.waitForApp(appName, 10000);
      return true;
    } catch (error) {
      console.error(`Failed to launch app ${appName}:`, error);
      return false;
    }
  }

  private getAppConfig(appName: string): AppInfo | null {
    const configs: Record<string, AppInfo> = {
      whatsapp: {
        name: 'WhatsApp',
        executable: platform() === 'darwin' ? 'WhatsApp' :
                   platform() === 'win32' ? 'C:\\Program Files\\WhatsApp\\WhatsApp.exe' :
                   'whatsapp-desktop',
        isRunning: false,
      },
      instagram: {
        name: 'Instagram',
        executable: platform() === 'darwin' ? 'Google Chrome' :
                   platform() === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
                   'google-chrome',
        isRunning: false,
      },
      browser: {
        name: 'Browser',
        executable: platform() === 'darwin' ? 'Google Chrome' :
                   platform() === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' :
                   'google-chrome',
        isRunning: false,
      },
    };

    return configs[appName.toLowerCase()] || null;
  }

  private async waitForApp(appName: string, timeout: number): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const windows = await this.getWindowsForApp(appName);
      if (windows.length > 0) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`App ${appName} did not launch within ${timeout}ms`);
  }

  async getWindowsForApp(appName: string): Promise<WindowInfo[]> {
    const allWindows = Array.from(this.activeWindows.values());
    return allWindows.filter((w) =>
      w.appName.toLowerCase().includes(appName.toLowerCase()) ||
      w.title.toLowerCase().includes(appName.toLowerCase())
    );
  }

  async focusWindow(windowId: string): Promise<boolean> {
    const windowInfo = this.activeWindows.get(windowId);
    if (!windowInfo) {
      console.warn(`Window not found: ${windowId}`);
      return false;
    }

    try {
      if (platform() === 'darwin') {
        await this.executeCommand(
          `osascript -e 'tell application "System Events" to set frontmost of process "${windowInfo.appName}" to true'`
        );
      } else if (platform() === 'win32') {
        const script = [
          'Add-Type -TypeDefinition @"',
          'using System;',
          'using System.Runtime.InteropServices;',
          'public class Win32 {',
          '  [DllImport("user32.dll")]',
          '  public static extern bool SetForegroundWindow(IntPtr hWnd);',
          '}',
          '@"',
          `$hwnd = [IntPtr]::new(${windowId})`,
          '[Win32]::SetForegroundWindow($hwnd)',
        ].join('\n');
        await this.executePowerShell(script);
      } else {
        await this.executeCommand(`xdotool windowactivate ${windowId}`);
      }

      console.log(`✅ Focused window ${windowId}`);
      return true;
    } catch (error) {
      console.warn(`Failed to focus window ${windowId}:`, error);
      return false;
    }
  }

  async switchWindow(windowTitle: string): Promise<boolean> {
    const windows = Array.from(this.activeWindows.values());
    const match = windows.find((window) =>
      window.title.toLowerCase().includes(windowTitle.toLowerCase()) ||
      window.appName.toLowerCase().includes(windowTitle.toLowerCase())
    );

    if (!match) {
      console.warn(`No window matched title: ${windowTitle}`);
      return false;
    }

    return this.focusWindow(match.id);
  }

  async getActiveWindow(): Promise<WindowInfo | null> {
    const active = Array.from(this.activeWindows.values()).find((window) => window.isActive);
    if (active) {
      return active;
    }

    if (platform() === 'linux') {
      try {
        const output = await this.executeCommand('xdotool getactivewindow getwindowname');
        return {
          id: 'active',
          title: output.trim(),
          appName: 'unknown',
          bounds: { x: 0, y: 0, width: 0, height: 0 },
          isMinimized: false,
          isActive: true,
        };
      } catch {
        return null;
      }
    }

    return null;
  }

  async isAppRunning(appName: string): Promise<boolean> {
    const windows = await this.getWindowsForApp(appName);
    return windows.length > 0;
  }

  async getAllWindows(): Promise<WindowInfo[]> {
    return Array.from(this.activeWindows.values());
  }

  async minimizeWindow(windowId: string): Promise<boolean> {
    const windowInfo = this.activeWindows.get(windowId);
    if (!windowInfo) {
      return false;
    }

    try {
      if (platform() === 'darwin') {
        await this.executeCommand(
          `osascript -e 'tell application "System Events" to set miniaturized of window id ${windowId} of process "${windowInfo.appName}" to true'`
        );
      } else if (platform() === 'win32') {
        // Windows minimize placeholder
        const script = [
          'Add-Type -TypeDefinition @"',
          'using System;',
          'using System.Runtime.InteropServices;',
          'public class Win32 {',
          '  [DllImport("user32.dll")]',
          '  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);',
          '}',
          '@"',
          `$hwnd = [IntPtr]::new(${windowId})`,
          '[Win32]::ShowWindow($hwnd, 2)',
        ].join('\n');
        await this.executePowerShell(script);
      } else {
        await this.executeCommand(`xdotool windowminimize ${windowId}`);
      }

      return true;
    } catch (error) {
      console.warn(`Failed to minimize window ${windowId}:`, error);
      return false;
    }
  }
}

export const windowManager = new WindowManager();
