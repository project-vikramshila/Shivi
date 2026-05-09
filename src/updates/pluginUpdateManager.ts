import fs from 'fs';
import path from 'path';
import { logInfo, logWarn, logError } from '../logging/logger';
import { PluginDefinition } from '../modules/plugins/pluginManager';

const pluginStateFile = path.join(process.cwd(), 'plugin-state.json');

export type PluginUpdateState = {
  id: string;
  version: string;
  enabled: boolean;
  lastChecked?: string;
};

export const loadPluginUpdateState = (): PluginUpdateState[] => {
  try {
    if (!fs.existsSync(pluginStateFile)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(pluginStateFile, 'utf-8')) as PluginUpdateState[];
  } catch (error) {
    logError('Failed to load plugin update state', { error: String(error) });
    return [];
  }
};

export const savePluginUpdateState = (state: PluginUpdateState[]) => {
  try {
    fs.writeFileSync(pluginStateFile, JSON.stringify(state, null, 2), 'utf-8');
    logInfo('Plugin update state saved', { count: state.length });
  } catch (error) {
    logError('Failed to save plugin update state', { error: String(error) });
  }
};

export const validatePluginDeployment = (plugin: PluginDefinition) => {
  if (!plugin.id || !plugin.name) {
    logWarn('Invalid plugin manifest', { plugin });
    throw new Error('Plugin manifest must include id and name');
  }

  return true;
};
