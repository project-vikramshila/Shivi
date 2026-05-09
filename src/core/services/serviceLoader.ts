export type ServiceMetadata = {
  name: string;
  version: string;
  enabled: boolean;
  description: string;
};

export class ServiceLoader {
  private services: Record<string, ServiceMetadata> = {};

  register(service: ServiceMetadata) {
    this.services[service.name] = service;
  }

  listServices() {
    return Object.values(this.services);
  }

  getService(name: string) {
    return this.services[name];
  }
}
