export type PermissionCategory = 'read' | 'navigate' | 'type';

export type PermissionRequest = {
  id: string;
  appName: string;
  category: PermissionCategory;
  reason: string;
  granted: boolean;
  requestedAt: string;
};

export class PermissionManager {
  private permissions: Record<string, Record<PermissionCategory, boolean>> = {};

  requestPermission(appName: string, category: PermissionCategory, reason: string) {
    const existing = this.permissions[appName] || { read: false, navigate: false, type: false };
    existing[category] = false;
    this.permissions[appName] = existing;
    return {
      id: `${appName}-${category}-${Date.now()}`,
      appName,
      category,
      reason,
      granted: false,
      requestedAt: new Date().toISOString(),
    };
  }

  grantPermission(appName: string, category: PermissionCategory) {
    this.permissions[appName] = this.permissions[appName] || { read: false, navigate: false, type: false };
    this.permissions[appName][category] = true;
  }

  hasPermission(appName: string, category: PermissionCategory) {
    return this.permissions[appName]?.[category] ?? false;
  }

  getPermissionSummary() {
    return this.permissions;
  }
}
