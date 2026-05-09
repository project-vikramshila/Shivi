export const enqueueRemoteMemorySync = async (item: any) => {
  if (typeof window !== 'undefined' && window.shiviApi?.enqueueSync) {
    return window.shiviApi.enqueueSync(item);
  }

  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem('shivi-sync-queue') || '[]';
    const queue = JSON.parse(raw);
    queue.push(item);
    window.localStorage.setItem('shivi-sync-queue', JSON.stringify(queue));
    return item;
  }

  return null;
};

export const forceRemoteSync = async (): Promise<any> => {
  if (typeof window !== 'undefined' && window.shiviApi?.forceSync) {
    return window.shiviApi.forceSync();
  }

  return { error: 'Sync unavailable in this environment' };
};

export const getRemoteSyncStatus = async (): Promise<any> => {
  if (typeof window !== 'undefined' && window.shiviApi?.getSyncStatus) {
    return window.shiviApi.getSyncStatus();
  }

  return { status: 'offline' };
};
