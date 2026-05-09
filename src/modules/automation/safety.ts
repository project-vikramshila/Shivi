/**
 * Automation Safety Framework
 * Permission management, action validation, and safety controls
 */

import type {
  AutomationPermissionLevel,
  AutomationPermission,
  AutomationWorkflowStep,
  AutomationConfig,
} from './types';

export class SafetyFramework {
  private static instance: SafetyFramework;
  private permissions: Map<string, AutomationPermission> = new Map();
  private config: AutomationConfig = this.getDefaultConfig();
  private emergencyStopActive = false;
  private blockedApps = [
    'taskmgr', // Task Manager
    'regedit', // Registry Editor
    'diskpart', // Disk Partition
    'cmd.exe', // Command Prompt
    'powershell', // PowerShell
  ];

  static getInstance(): SafetyFramework {
    if (!SafetyFramework.instance) {
      SafetyFramework.instance = new SafetyFramework();
    }
    return SafetyFramework.instance;
  }

  /**
   * Check if automation action is allowed
   */
  async canExecuteAction(
    action: AutomationWorkflowStep,
    appName?: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Emergency stop takes priority
    if (this.emergencyStopActive) {
      return { allowed: false, reason: 'Emergency stop is active' };
    }

    // Check if disabled
    if (!this.config.enabled) {
      return { allowed: false, reason: 'Automation is disabled' };
    }

    // Safe mode restrictions
    if (this.config.safeMode) {
      const safeResult = this.checkSafeModeRestrictions(action);
      if (!safeResult.allowed) {
        return safeResult;
      }
    }

    // Check app-specific permissions
    if (appName) {
      const appPermission = this.getAppPermission(appName);
      if (!appPermission.granted) {
        return { allowed: false, reason: `No permission for app: ${appName}` };
      }

      // Check permission level
      const actionLevel = this.getActionPermissionLevel(action);
      if (!this.hasRequiredPermission(appPermission.permission, actionLevel)) {
        return {
          allowed: false,
          reason: `Insufficient permission level for action in ${appName}`,
        };
      }
    }

    // Check for dangerous patterns
    const patterns = this.checkDangerousPatterns(action);
    if (!patterns.safe) {
      return { allowed: false, reason: patterns.reason };
    }

    return { allowed: true };
  }

  /**
   * Emergency stop - halt all operations immediately
   */
  activateEmergencyStop(): void {
    this.emergencyStopActive = true;
    console.warn('⚠️ EMERGENCY STOP ACTIVATED - All automation halted');
  }

  /**
   * Deactivate emergency stop
   */
  deactivateEmergencyStop(): void {
    this.emergencyStopActive = false;
    console.info('✅ Emergency stop deactivated');
  }

  /**
   * Check if emergency stop is active
   */
  isEmergencyStopped(): boolean {
    return this.emergencyStopActive;
  }

  /**
   * Grant permission for an app
   */
  grantAppPermission(
    appName: string,
    level: AutomationPermissionLevel,
    expiresIn?: number
  ): AutomationPermission {
    const permission: AutomationPermission = {
      id: `perm_${appName}_${Date.now()}`,
      appName,
      permission: level,
      granted: true,
      grantedAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
    };

    this.permissions.set(appName, permission);
    return permission;
  }

  /**
   * Revoke permission for an app
   */
  revokeAppPermission(appName: string): void {
    this.permissions.delete(appName);
  }

  /**
   * Get permission for an app
   */
  getAppPermission(appName: string): AutomationPermission {
    const perm = this.permissions.get(appName);
    
    if (!perm) {
      return {
        id: '',
        appName,
        permission: this.config.defaultPermission,
        granted: false,
      };
    }

    // Check if permission has expired
    if (perm.expiresAt && perm.expiresAt < Date.now()) {
      this.permissions.delete(appName);
      return {
        id: '',
        appName,
        permission: this.config.defaultPermission,
        granted: false,
      };
    }

    return perm;
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): AutomationPermission[] {
    return Array.from(this.permissions.values()).filter(
      (p) => !p.expiresAt || p.expiresAt > Date.now()
    );
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutomationConfig {
    return { ...this.config };
  }

  /**
   * Check safe mode restrictions
   */
  private checkSafeModeRestrictions(
    action: AutomationWorkflowStep
  ): { allowed: boolean; reason?: string } {
    if (action.type === 'keyboard' && action.subtype === 'hotkey') {
      // Block dangerous hotkeys in safe mode
      const dangerousHotkeys = ['alt+f4', 'ctrl+alt+delete', 'keys+r'];
      if (dangerousHotkeys.includes((action as any).key?.toLowerCase())) {
        return { allowed: false, reason: 'Hotkey blocked in safe mode' };
      }
    }

    if (action.type === 'app') {
      // Block dangerous apps in safe mode
      const appName = (action as any).appName?.toLowerCase() || '';
      if (this.blockedApps.some((blocked) => appName.includes(blocked))) {
        return { allowed: false, reason: `App ${appName} is blocked in safe mode` };
      }
    }

    return { allowed: true };
  }

  /**
   * Check for dangerous patterns
   */
  private checkDangerousPatterns(
    action: AutomationWorkflowStep
  ): { safe: boolean; reason?: string } {
    // Prevent rapid repeated clicking
    if (action.type === 'mouse' && action.status === 'executing') {
      // This would be checked at execution time
    }

    // Prevent rapid keyboard mashing
    if (action.type === 'keyboard') {
      // Check for suspiciously fast typing
      const typingAction = action as any;
      if (typingAction.text && typingAction.delay && typingAction.delay < 20) {
        return { safe: false, reason: 'Typing speed too fast - potential infinite loop' };
      }
    }

    return { safe: true };
  }

  /**
   * Get required permission level for an action
   */
  private getActionPermissionLevel(action: AutomationWorkflowStep): AutomationPermissionLevel {
    switch (action.type) {
      case 'vision':
        return 'observe';
      case 'mouse':
      case 'keyboard':
        return action.subtype === 'type' ? 'assist' : 'full';
      case 'app':
      case 'window':
        return 'full';
      default:
        return 'assist';
    }
  }

  /**
   * Check if user has required permission level
   */
  private hasRequiredPermission(
    userLevel: AutomationPermissionLevel,
    requiredLevel: AutomationPermissionLevel
  ): boolean {
    const levels: AutomationPermissionLevel[] = ['observe', 'read', 'assist', 'full'];
    return levels.indexOf(userLevel) >= levels.indexOf(requiredLevel);
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): AutomationConfig {
    return {
      enabled: false,
      defaultPermission: 'read',
      safeMode: true,
      maxConcurrentTasks: 1,
      actionTimeout: 30000,
      mouseSmoothness: 0.7,
      keyboardDelay: 50,
      defaultWaitDuration: 1000,
      screenshotOnError: true,
      logAllActions: true,
    };
  }
}

export const safetyFramework = SafetyFramework.getInstance();
