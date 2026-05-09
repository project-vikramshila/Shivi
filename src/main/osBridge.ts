import { ipcMain, webContents } from 'electron';
import { OSCore } from '../os';
import { IPC_CHANNELS } from '../lib/ipc/channels';
import { agentCore } from '../agent';

const shiviOS = OSCore.getInstance();

const rendererEventSubscribers = new Map<number, Set<string>>();

function broadcastEventToRenderers(eventName: string, payload: any) {
  rendererEventSubscribers.forEach((eventNames, senderId) => {
    if (!eventNames.has(eventName)) return;
    const sender = webContents.fromId(senderId);
    if (!sender) return;
    sender.send(`os:event:${eventName}`, payload);
  });
}

shiviOS.eventBus.subscribe('plugin_registered', async (payload) => broadcastEventToRenderers('plugin_registered', payload));
shiviOS.eventBus.subscribe('plugin_enabled', async (payload) => broadcastEventToRenderers('plugin_enabled', payload));
shiviOS.eventBus.subscribe('service_status_changed', async (payload) => broadcastEventToRenderers('service_status_changed', payload));

ipcMain.handle(IPC_CHANNELS.OS.GET_STATUS, async () => {
  return shiviOS.getStatus();
});

ipcMain.handle(IPC_CHANNELS.PLUGIN.LIST, async () => {
  return shiviOS.pluginManager.listPlugins();
});

ipcMain.handle(IPC_CHANNELS.PLUGIN.ENABLE, async (_event, pluginId: string) => {
  const success = shiviOS.pluginManager.enablePlugin(pluginId);
  if (success) {
    await shiviOS.eventBus.publish('plugin_enabled', { pluginId });
  }
  return { success };
});

ipcMain.handle(IPC_CHANNELS.PLUGIN.DISABLE, async (_event, pluginId: string) => {
  const success = shiviOS.pluginManager.disablePlugin(pluginId);
  return { success };
});

ipcMain.handle(IPC_CHANNELS.PLUGIN.GET, async (_event, pluginId: string) => {
  return shiviOS.pluginManager.getPlugin(pluginId);
});

ipcMain.handle(IPC_CHANNELS.WORKFLOW.LIST, async () => {
  return shiviOS.workflowEngine.listWorkflows();
});

ipcMain.handle(IPC_CHANNELS.WORKFLOW.EXECUTE, async (_event, workflowId: string) => {
  try {
    return await shiviOS.workflowEngine.executeWorkflow(workflowId);
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle(IPC_CHANNELS.SKILL.LIST, async () => {
  return shiviOS.skillManager.listSkills();
});

ipcMain.handle(IPC_CHANNELS.SKILL.EXECUTE, async (_event, skillId: string, input: any) => {
  try {
    const result = await shiviOS.skillManager.executeSkill(skillId, input || {});
    return { success: true, result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle(IPC_CHANNELS.EVENT.PUBLISH, async (_event, eventName: string, payload: any) => {
  try {
    await shiviOS.eventBus.publish(eventName, payload);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle(IPC_CHANNELS.EVENT.SUBSCRIBE, async (event, eventName: string) => {
  const senderId = event.sender.id;
  const existing = rendererEventSubscribers.get(senderId) ?? new Set<string>();
  existing.add(eventName);
  rendererEventSubscribers.set(senderId, existing);
  return { success: true };
});

ipcMain.handle(IPC_CHANNELS.EVENT.UNSUBSCRIBE, async (event, eventName: string) => {
  const senderId = event.sender.id;
  const existing = rendererEventSubscribers.get(senderId);
  if (existing) {
    existing.delete(eventName);
    if (existing.size === 0) {
      rendererEventSubscribers.delete(senderId);
    }
  }
  return { success: true };
});

ipcMain.handle(IPC_CHANNELS.AGENT.CREATE_GOAL, async (_event, payload: any) => {
  return agentCore.createGoal(payload);
});

ipcMain.handle(IPC_CHANNELS.AGENT.LIST_GOALS, async () => {
  return agentCore.getGoals();
});

ipcMain.handle(IPC_CHANNELS.AGENT.EXECUTE_GOAL, async (_event, goalId: string) => {
  try {
    return await agentCore.executeGoal(goalId);
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle(IPC_CHANNELS.AGENT.LIST_ACTIVE_WORKFLOWS, async () => {
  return agentCore.listActiveWorkflows();
});

ipcMain.handle(IPC_CHANNELS.AGENT.PAUSE_WORKFLOW, async (_event, workflowId: string) => {
  return agentCore.pauseWorkflow(workflowId);
});

ipcMain.handle(IPC_CHANNELS.AGENT.RESUME_WORKFLOW, async (_event, workflowId: string) => {
  return agentCore.resumeWorkflow(workflowId);
});

ipcMain.handle(IPC_CHANNELS.AGENT.CANCEL_WORKFLOW, async (_event, workflowId: string) => {
  return agentCore.cancelWorkflow(workflowId);
});
