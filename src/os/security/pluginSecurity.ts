export type PermissionScope =
  | 'memory'
  | 'reminders'
  | 'automation'
  | 'voice'
  | 'vision'
  | 'events'
  | 'system'
  | 'network'
  | 'ui';

export type PluginPermission = {
  scope: PermissionScope;
  description: string;
};

export type PluginManifest = {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  enabled?: boolean;
  permissions: PluginPermission[];
  capabilities: string[];
  entrypoint?: string;
  trusted?: boolean;
};

const SYSTEM_FORBIDDEN_PERMISSIONS: PermissionScope[] = ['system', 'network'];

export class PluginSecurityManager {
  validateManifest(manifest: PluginManifest) {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Plugin manifest must include id, name, and version');
    }

    if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) {
      throw new Error('Plugin manifest must declare permissions');
    }

    manifest.permissions.forEach((permission) => {
      if (!permission.scope) {
        throw new Error(`Plugin ${manifest.id} has invalid permission definition`);
      }
    });

    if (manifest.trusted !== true && manifest.permissions.some((permission) => SYSTEM_FORBIDDEN_PERMISSIONS.includes(permission.scope))) {
      throw new Error(`Untrusted plugins cannot request system-level permission: ${manifest.id}`);
    }

    return true;
  }

  assertAccess(pluginId: string, requiredScope: PermissionScope) {
    // In a real OS layer this would consult a signed policy store.
    // Here we keep the model for plugin isolation and future validation.
    return true;
  }
}
