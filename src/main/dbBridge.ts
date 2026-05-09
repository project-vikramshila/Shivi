import { ipcMain } from 'electron';
import { syncService } from '../db/sync/syncService';
import { dbConfig } from '../db/config';

// Initialize the database sync bridge in the Electron main process.
if (dbConfig.cloudSyncEnabled && !dbConfig.localOnlyMode) {
  syncService.startBackgroundSync();
}

ipcMain.handle('memory:enqueue-sync', async (_event, item) => {
  try {
    return await syncService.enqueue(item);
  } catch (error) {
    console.error('Failed to enqueue memory sync item:', error);
    return null;
  }
});

ipcMain.handle('memory:force-sync', async () => {
  try {
    await syncService.processQueue();
    return syncService.getStatus();
  } catch (error) {
    console.error('Failed to force memory sync:', error);
    return { error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('memory:get-sync-status', async () => {
  return syncService.getStatus();
});
