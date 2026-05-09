import express from 'express';
import type { Express, Request, Response } from 'express';
import { EventBus } from '../events/eventBus';
import { PluginManager } from '../plugins/pluginManager';
import { WorkflowEngine } from '../workflows/workflowEngine';

export class LocalApiServer {
  private app: Express;
  private server: any;
  private port: number;
  private pluginManager: PluginManager;
  private workflowEngine: WorkflowEngine;
  private eventBus: EventBus;

  constructor(port = 4317, pluginManager: PluginManager, workflowEngine: WorkflowEngine, eventBus: EventBus) {
    this.app = express();
    this.port = port;
    this.pluginManager = pluginManager;
    this.workflowEngine = workflowEngine;
    this.eventBus = eventBus;

    this.app.use(express.json());
    this.installRoutes();
  }

  private installRoutes() {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() });
    });

    this.app.get('/plugins', (_req: Request, res: Response) => {
      res.json(this.pluginManager.listPlugins());
    });

    this.app.post('/plugins/:id/enable', async (req: Request, res: Response) => {
      const success = this.pluginManager.enablePlugin(req.params.id);
      res.json({ success });
    });

    this.app.post('/plugins/:id/disable', async (req: Request, res: Response) => {
      const success = this.pluginManager.disablePlugin(req.params.id);
      res.json({ success });
    });

    this.app.get('/workflows', (_req: Request, res: Response) => {
      res.json(this.workflowEngine.listWorkflows());
    });

    this.app.post('/workflows/:id/execute', async (req: Request, res: Response) => {
      try {
        const result = await this.workflowEngine.executeWorkflow(req.params.id);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    this.app.post('/events/:eventName/publish', async (req: Request, res: Response) => {
      try {
        await this.eventBus.publish(req.params.eventName, req.body || {});
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
  }

  async start() {
    return new Promise<void>((resolve, reject) => {
      this.server = this.app.listen(this.port, '127.0.0.1', (err?: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  async stop() {
    if (!this.server) return;
    return new Promise<void>((resolve, reject) => {
      this.server.close((err?: any) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}
