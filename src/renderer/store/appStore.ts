import { create } from 'zustand';

type PageId = 'chat' | 'memory' | 'reminders' | 'apps' | 'plugins' | 'agent' | 'automation' | 'permissions' | 'voice' | 'personality' | 'settings';

type AppState = {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  systemStatus: string;
  setSystemStatus: (status: string) => void;
};

const useAppStore = create<AppState>((set) => ({
  activePage: 'chat',
  systemStatus: 'Ready',
  setActivePage: (page) => set({ activePage: page }),
  setSystemStatus: (status) => set({ systemStatus: status }),
}));

export default useAppStore;
