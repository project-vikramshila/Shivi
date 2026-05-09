import React from 'react';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import MemoryPage from './pages/MemoryPage';
import RemindersPage from './pages/RemindersPage';
import AppsPage from './pages/AppsPage';
import PluginsPage from './pages/PluginsPage';
import AgentPage from './pages/AgentPage';
import PermissionsPage from './pages/PermissionsPage';
import VoicePage from './pages/VoicePage';
import PersonalityPage from './pages/PersonalityPage';
import SettingsPage from './pages/SettingsPage';
import AutomationPage from './pages/AutomationPage';
import useAppStore from './store/appStore';

const pages = [
  { id: 'chat', label: 'Chat', component: <ChatPage /> },
  { id: 'memory', label: 'Memory', component: <MemoryPage /> },
  { id: 'reminders', label: 'Reminders', component: <RemindersPage /> },
  { id: 'apps', label: 'Apps', component: <AppsPage /> },
  { id: 'plugins', label: 'Plugins', component: <PluginsPage /> },
  { id: 'agent', label: 'Agent', component: <AgentPage /> },
  { id: 'automation', label: 'Automation', component: <AutomationPage /> },
  { id: 'permissions', label: 'Permissions', component: <PermissionsPage /> },
  { id: 'voice', label: 'Voice', component: <VoicePage /> },
  { id: 'personality', label: 'Personality', component: <PersonalityPage /> },
  { id: 'settings', label: 'Settings', component: <SettingsPage /> },
];

const App = () => {
  const activePage = useAppStore((state) => state.activePage);
  const setActivePage = useAppStore((state) => state.setActivePage);

  const active = pages.find((page) => page.id === activePage)?.component || <ChatPage />;

  return (
    <div className="min-h-screen bg-shivi-dark-950 text-white">
      <div className="grid grid-cols-[280px_1fr] h-screen overflow-hidden">
        <Sidebar activePage={activePage} onSelect={setActivePage} />
        <main className="p-6 overflow-auto bg-[radial-gradient(circle_at_top,_rgba(209,102,156,0.16),_transparent_34%),_linear-gradient(180deg,_#0d111a,_#0f172a)]">
          <div className="max-w-7xl mx-auto">
            {active}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
