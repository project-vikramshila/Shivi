import React, { useEffect, useState } from 'react';

type PluginInfo = {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  enabled: boolean;
  capabilities: string[];
  permissions: Array<{ scope: string; description: string }>;
};

const PluginsPage = () => {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPlugins = async () => {
    setLoading(true);
    try {
      if (!(window as any).shiviApi?.plugins) {
        console.warn('Shivi API plugins not available');
        setPlugins([]);
        return;
      }
      const list = await (window as any).shiviApi.plugins.list();
      setPlugins(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      setPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPlugins();
  }, []);

  const togglePlugin = async (plugin: PluginInfo) => {
    try {
      if (!(window as any).shiviApi?.plugins) {
        console.warn('Shivi API plugins not available');
        return;
      }
      if (plugin.enabled) {
        await (window as any).shiviApi.plugins.disable(plugin.id);
      } else {
        await (window as any).shiviApi.plugins.enable(plugin.id);
      }
      refreshPlugins();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Plugin System</p>
          <h1 className="text-3xl font-semibold text-white">Plugin Manager</h1>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6 space-y-4">
        <p className="text-white/80">Manage Shivi AI plugins, enable trusted extensions, and inspect ecosystem permissions.</p>

        {loading ? (
          <div className="text-shivi-pink-100">Loading plugins…</div>
        ) : plugins.length === 0 ? (
          <div className="text-white/70">No plugins registered yet. This workspace is ready for a plugin ecosystem.</div>
        ) : (
          <div className="grid gap-4">
            {plugins.map((plugin) => (
              <div key={plugin.id} className="rounded-3xl border border-white/10 p-5 bg-shivi-dark-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold text-white">{plugin.name}</div>
                    <div className="text-sm text-shivi-pink-200">{plugin.description}</div>
                    <div className="mt-2 text-xs text-white/60">{plugin.version} • {plugin.author || 'Unknown author'}</div>
                  </div>
                  <button
                    onClick={() => togglePlugin(plugin)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${plugin.enabled ? 'bg-shivi-pink-500 hover:bg-shivi-pink-400' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {plugin.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-white/70">
                  <div>
                    <span className="font-semibold text-white">Capabilities:</span> {plugin.capabilities.join(', ') || 'None'}
                  </div>
                  <div>
                    <span className="font-semibold text-white">Permissions:</span> {plugin.permissions.map((permission) => permission.scope).join(', ') || 'None'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PluginsPage;
