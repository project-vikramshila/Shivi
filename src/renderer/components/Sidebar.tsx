import React from 'react';
import { FiMessageCircle, FiBookOpen, FiBell, FiGrid, FiShield, FiMic, FiHeart, FiSettings, FiZap } from 'react-icons/fi';

type PageId = 'chat' | 'memory' | 'reminders' | 'apps' | 'plugins' | 'agent' | 'automation' | 'permissions' | 'voice' | 'personality' | 'settings';

interface SidebarProps {
  activePage: PageId;
  onSelect: (page: PageId) => void;
}

const items: Array<{ id: PageId; label: string; icon: React.ReactNode }> = [
  { id: 'chat', label: 'Chat', icon: <FiMessageCircle /> },
  { id: 'memory', label: 'Memory', icon: <FiBookOpen /> },
  { id: 'reminders', label: 'Reminders', icon: <FiBell /> },
  { id: 'apps', label: 'Apps', icon: <FiGrid /> },
  { id: 'plugins', label: 'Plugins', icon: <FiGrid /> },
  { id: 'agent', label: 'Agent', icon: <FiZap /> },
  { id: 'automation', label: 'Automation', icon: <FiZap /> },
  { id: 'permissions', label: 'Permissions', icon: <FiShield /> },
  { id: 'voice', label: 'Voice', icon: <FiMic /> },
  { id: 'personality', label: 'Personality', icon: <FiHeart /> },
  { id: 'settings', label: 'Settings', icon: <FiSettings /> },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelect }) => {
  return (
    <aside className="bg-shivi-dark-900 border-r border-white/10 p-5 flex flex-col justify-between">
      <div>
        <div className="mb-8 px-3 py-4 rounded-3xl glass-card">
          <div className="text-2xl font-semibold text-white">Shivi AI</div>
          <div className="mt-2 text-sm text-shivi-pink-200">Hindi-first personal assistant</div>
        </div>
        <nav className="space-y-2">
          {items.map((item) => {
            const active = item.id === activePage;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-3xl text-left transition ${
                  active
                    ? 'bg-gradient-to-r from-pink-600/30 to-purple-600/20 text-white shadow-glow'
                    : 'text-shivi-pink-100 hover:bg-white/5'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-8 px-4 py-5 rounded-3xl glass-card border border-white/10 shadow-glow">
        <div className="text-sm uppercase tracking-[0.2em] text-shivi-pink-300 mb-2">Control</div>
        <div className="text-sm text-white/80">Permission manager, local privacy, and system health live here.</div>
      </div>
    </aside>
  );
};

export default Sidebar;
