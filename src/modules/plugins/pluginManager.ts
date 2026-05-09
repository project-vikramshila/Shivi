export type PluginDefinition = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
};

export class PluginManager {
  private plugins: Record<string, PluginDefinition> = {};

  register(plugin: PluginDefinition) {
    this.plugins[plugin.id] = plugin;
  }

  listPlugins() {
    return Object.values(this.plugins);
  }

  enablePlugin(id: string) {
    if (this.plugins[id]) {
      this.plugins[id].enabled = true;
    }
  }

  disablePlugin(id: string) {
    if (this.plugins[id]) {
      this.plugins[id].enabled = false;
    }
  }
}
