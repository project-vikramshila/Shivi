export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface BackgroundService {
  id: string;
  displayName: string;
  description: string;
  status: ServiceStatus;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export class ServiceManager {
  private services: Record<string, BackgroundService> = {};

  registerService(service: BackgroundService) {
    this.services[service.id] = service;
  }

  listServices() {
    return Object.values(this.services);
  }

  getService(id: string) {
    return this.services[id] || null;
  }

  async startAll() {
    const entries = Object.values(this.services);
    for (const service of entries) {
      try {
        service.status = 'starting';
        await service.start();
        service.status = 'running';
      } catch (error) {
        service.status = 'error';
        console.error(`[service] ${service.id} failed to start`, error);
      }
    }
  }

  async stopAll() {
    const entries = Object.values(this.services);
    for (const service of entries) {
      try {
        await service.stop();
        service.status = 'stopped';
      } catch (error) {
        service.status = 'error';
        console.error(`[service] ${service.id} failed to stop`, error);
      }
    }
  }
}
