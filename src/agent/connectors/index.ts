import type { AppConnector, AppConnectorId, AppContextSnapshot } from '../core/types';

class BaseConnector implements AppConnector {
  id: AppConnectorId;
  displayName: string;
  enabled = true;
  lastSync = Date.now();

  constructor(id: AppConnectorId, displayName: string) {
    this.id = id;
    this.displayName = displayName;
  }

  async fetchContext(): Promise<AppContextSnapshot> {
    this.lastSync = Date.now();
    return {
      appId: this.id,
      lastUpdated: Date.now(),
      summary: `Latest ${this.displayName} activity captured for recent tasks.`,
      unseenCount: Math.floor(Math.random() * 8),
      recentItems: [
        { id: `${this.id}-item-1`, title: `${this.displayName} item 1`, snippet: `Recent item from ${this.displayName}`, timestamp: Date.now() - 3600000 },
      ],
    };
  }

  async search(query: string): Promise<string[]> {
    return [`Search result for ${query} in ${this.displayName}`];
  }

  async summarizeRecentActivity(limit = 5): Promise<string> {
    return `Summary of the last ${limit} items in ${this.displayName}.`;
  }

  async execute(action: string, params: Record<string, any>): Promise<any> {
    // Default implementation - connectors that support execution should override this
    throw new Error(`${this.displayName} does not support execution of action: ${action}`);
  }
}

class ConnectorRegistry {
  private connectors: Map<AppConnectorId, AppConnector> = new Map();

  constructor() {
    this.registerConnector(new BaseConnector('whatsapp', 'WhatsApp'));
    this.registerConnector(new BaseConnector('instagram', 'Instagram'));
    this.registerConnector(new BaseConnector('browser', 'Browser'));
    this.registerConnector(new BaseConnector('calendar', 'Calendar'));
    this.registerConnector(new BaseConnector('email', 'Email'));
    this.registerConnector(new BaseConnector('files', 'Files'));
    this.registerConnector(new BaseConnector('notes', 'Notes'));
  }

  registerConnector(connector: AppConnector) {
    this.connectors.set(connector.id, connector);
  }

  getConnector(appId: AppConnectorId): AppConnector | undefined {
    return this.connectors.get(appId);
  }

  listConnectors(): AppConnector[] {
    return Array.from(this.connectors.values());
  }
}

export const connectorRegistry = new ConnectorRegistry();
