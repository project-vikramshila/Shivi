import { PluginSecurityManager, PluginPermission, PluginManifest } from '../security/pluginSecurity';
import { EventBus } from '../events/eventBus';

export type PluginCapability =
  | 'workflow'
  | 'automation'
  | 'memory'
  | 'voice'
  | 'vision'
  | 'ui'
  | 'api'
  | 'event';

export type PluginRegistrationContext = {
  eventBus: EventBus;
  permissions: PluginPermission[];
};

export type PluginImplementation = {
  initialize?: (context: PluginRegistrationContext) => Promise<void> | void;
  shutdown?: () => Promise<void> | void;
  onEvent?: (event: string, payload: any) => Promise<void> | void;
  handleAction?: (action: string, payload: any) => Promise<any>;
};

export type PluginDefinition = PluginManifest & {
  enabled: boolean;
  loaded: boolean;
  implementation?: PluginImplementation;
};

export class PluginManager {
  private plugins: Record<string, PluginDefinition> = {};
  private security = new PluginSecurityManager();
  private eventBus?: EventBus;

  initialize(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  registerPlugin(manifest: PluginManifest, implementation?: PluginImplementation) {
    this.security.validateManifest(manifest);

    const plugin: PluginDefinition = {
      ...manifest,
      enabled: manifest.enabled ?? false,
      loaded: false,
      implementation,
    };

    this.plugins[manifest.id] = plugin;

    if (plugin.enabled && implementation && this.eventBus) {
      this.loadPlugin(plugin.id);
    }

    return plugin;
  }

  listPlugins() {
    return Object.values(this.plugins);
  }

  getPlugin(id: string) {
    return this.plugins[id] || null;
  }

  enablePlugin(id: string) {
    const plugin = this.plugins[id];
    if (!plugin) return false;
    plugin.enabled = true;
    if (!plugin.loaded && plugin.implementation && this.eventBus) {
      this.loadPlugin(id);
    }
    return true;
  }

  disablePlugin(id: string) {
    const plugin = this.plugins[id];
    if (!plugin) return false;
    plugin.enabled = false;
    if (plugin.loaded && plugin.implementation) {
      plugin.implementation.shutdown?.();
      plugin.loaded = false;
    }
    return true;
  }

  findPluginsByCapability(capability: PluginCapability) {
    return Object.values(this.plugins).filter((plugin) => plugin.capabilities.includes(capability) && plugin.enabled);
  }

  async executePluginAction(pluginId: string, action: string, payload: any) {
    const plugin = this.plugins[pluginId];
    if (!plugin || !plugin.enabled || !plugin.implementation) {
      throw new Error(`Plugin not available or enabled: ${pluginId}`);
    }
    this.security.assertAccess(plugin.id, 'events');
    if (!plugin.implementation.handleAction) {
      throw new Error(`Plugin ${pluginId} does not support actions`);
    }
    return await plugin.implementation.handleAction(action, payload);
  }

  private loadPlugin(id: string) {
    const plugin = this.plugins[id];
    if (!plugin || !plugin.enabled || plugin.loaded || !plugin.implementation || !this.eventBus) {
      return;
    }

    const context: PluginRegistrationContext = {
      eventBus: this.eventBus,
      permissions: plugin.permissions || [],
    };

    plugin.implementation.initialize?.(context);
    plugin.loaded = true;
  }
}
