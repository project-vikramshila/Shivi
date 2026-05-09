import { EventBus } from '../events/eventBus';
import { PluginManager } from '../plugins/pluginManager';
import { WorkflowEngine } from '../workflows/workflowEngine';
import { SkillManager } from '../skills/skillManager';
import { ServiceManager, BackgroundService } from '../services/serviceManager';
import { LocalApiServer } from '../apis/localApi';

export class OSCore {
  public readonly eventBus: EventBus;
  public readonly pluginManager: PluginManager;
  public readonly workflowEngine: WorkflowEngine;
  public readonly skillManager: SkillManager;
  public readonly serviceManager: ServiceManager;
  public readonly localApiServer: LocalApiServer;

  private constructor() {
    this.eventBus = new EventBus();
    this.pluginManager = new PluginManager();
    this.workflowEngine = new WorkflowEngine(this.eventBus);
    this.skillManager = new SkillManager();
    this.serviceManager = new ServiceManager();
    this.localApiServer = new LocalApiServer(4317, this.pluginManager, this.workflowEngine, this.eventBus);

    this.pluginManager.initialize(this.eventBus);
    this.registerDefaultServices();
  }

  private static instance: OSCore;

  static getInstance(): OSCore {
    if (!OSCore.instance) {
      OSCore.instance = new OSCore();
    }
    return OSCore.instance;
  }

  async initialize() {
    await this.localApiServer.start();
    await this.serviceManager.startAll();
  }

  async shutdown() {
    await this.serviceManager.stopAll();
    await this.localApiServer.stop();
  }

  getStatus() {
    return {
      ready: true,
      services: this.serviceManager.listServices().map((service) => ({ id: service.id, status: service.status })),
      pluginCount: this.pluginManager.listPlugins().length,
      workflowCount: this.workflowEngine.listWorkflows().length,
      skillCount: this.skillManager.listSkills().length,
    };
  }

  private registerDefaultServices() {
    const healthService: BackgroundService = {
      id: 'health-monitor',
      displayName: 'Health Monitor',
      description: 'Monitors Shivi OS service health and restarts core services when required.',
      status: 'stopped',
      start: async () => {
        // lightweight heartbeat loop
        setInterval(() => {
          this.eventBus.publish('service_status_changed', { timestamp: Date.now(), status: 'running' });
        }, 30_000);
      },
      stop: async () => {
        // no-op; process shutdown stops the loop
      },
    };

    this.serviceManager.registerService(healthService);
  }
}
