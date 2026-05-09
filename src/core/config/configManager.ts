import Store from 'electron-store';

export type AppConfig = {
  userLanguage: 'hi' | 'en';
  startupOnBoot: boolean;
  permissionDefaults: Record<string, boolean>;
};

const schema: Record<keyof AppConfig, object> = {
  userLanguage: { type: 'string', default: 'hi' },
  startupOnBoot: { type: 'boolean', default: false },
  permissionDefaults: { type: 'object', default: { read: false, navigate: false, type: false } },
};

// Check if we're in Electron environment
const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';

let configStore: Store<AppConfig> | null = null;

if (isElectron) {
  try {
    configStore = new Store<AppConfig>({
      name: 'shivi-config',
      schema,
    });
  } catch (error) {
    console.warn('Failed to initialize electron-store, falling back to localStorage');
  }
}

export const getConfig = (): AppConfig => {
  if (configStore) {
    return configStore.store;
  }

  // Fallback to localStorage for browser environment
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem('shivi-config');
      if (stored) {
        return { ...schema, ...JSON.parse(stored) } as AppConfig;
      }
    } catch (error) {
      console.warn('Failed to read from localStorage');
    }
  }

  // Return defaults
  return {
    userLanguage: 'hi',
    startupOnBoot: false,
    permissionDefaults: { read: false, navigate: false, type: false },
  };
};

export const setConfig = (config: Partial<AppConfig>) => {
  if (configStore) {
    configStore.store = { ...configStore.store, ...config };
    return;
  }

  // Fallback to localStorage for browser environment
  if (typeof window !== 'undefined') {
    try {
      const current = getConfig();
      const updated = { ...current, ...config };
      window.localStorage.setItem('shivi-config', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to write to localStorage');
    }
  }
};
