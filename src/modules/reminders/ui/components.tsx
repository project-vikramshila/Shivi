// Shivi AI Reminder UI Components - React Components for Reminder Management
// Elegant, emotionally warm reminder interface

import React, { useState, useEffect } from 'react';
import {
  createReminder,
  queryReminders,
  getReminderStats,
  completeReminder,
  snoozeReminder,
  generateCalendarAuthUrl,
  syncEvents,
  getSyncStatus,
} from '../renderer';
import { Reminder, ReminderStats, NotificationSettings } from '../core/types';

const isReminderApiAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).shiviApi?.reminder;
};

interface ReminderDashboardProps {
  userId: string;
  onReminderAction?: (action: string, reminder: Reminder) => void;
}

export const ReminderDashboard: React.FC<ReminderDashboardProps> = ({
  userId,
  onReminderAction
}) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  useEffect(() => {
    if (!isReminderApiAvailable()) {
      setReminders([]);
      setStats({ total: 0, active: 0, completed: 0, missed: 0, upcoming: 0, overdue: 0 });
      setLoading(false);
      return;
    }

    loadReminders();
    loadStats();
  }, [userId, filter]);

  const loadReminders = async () => {
    if (!isReminderApiAvailable()) {
      setReminders([]);
      setLoading(false);
      return;
    }

    try {
      const query: any = { userId, limit: 50 };

      switch (filter) {
        case 'active':
          query.status = 'active';
          break;
        case 'completed':
          query.status = 'completed';
          break;
        case 'overdue':
          query.status = 'missed';
          break;
      }

      const data = await queryReminders(query);
      setReminders(data || []);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!isReminderApiAvailable()) {
      setStats({ total: 0, active: 0, completed: 0, missed: 0, upcoming: 0, overdue: 0 });
      return;
    }

    try {
      const data = await getReminderStats(userId);
      setStats(data || { total: 0, active: 0, completed: 0, missed: 0, overdue: 0, upcoming: 0 });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats({ total: 0, active: 0, completed: 0, missed: 0, overdue: 0, upcoming: 0 });
    }
  };

  const handleComplete = async (reminderId: string) => {
    try {
      await completeReminder(reminderId);
      await loadReminders();
      await loadStats();

      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder && onReminderAction) {
        onReminderAction('completed', reminder);
      }
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const handleSnooze = async (reminderId: string) => {
    try {
      const snoozeUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await snoozeReminder(reminderId, snoozeUntil);
      await loadReminders();

      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder && onReminderAction) {
        onReminderAction('snoozed', reminder);
      }
    } catch (error) {
      console.error('Failed to snooze reminder:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shivi-purple-500"></div>
    </div>;
  }

  return (
    <div className="reminder-dashboard p-6 bg-gradient-to-br from-shivi-dark-900 to-shivi-dark-800 rounded-xl">
      {/* Stats Header */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Active" value={stats.active} color="blue" />
          <StatCard title="Completed" value={stats.completed} color="green" />
          <StatCard title="Overdue" value={stats.overdue} color="red" />
          <StatCard title="Upcoming" value={stats.upcoming} color="purple" />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'overdue', label: 'Overdue' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-shivi-purple-600 text-white'
                : 'bg-shivi-dark-700 text-gray-300 hover:bg-shivi-dark-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {reminders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {filter === 'all' ? 'No reminders yet' : `No ${filter} reminders`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' ? 'Create your first reminder to get started!' : 'Try a different filter.'}
            </p>
          </div>
        ) : (
          reminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={() => handleComplete(reminder.id)}
              onSnooze={() => handleSnooze(reminder.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 border-blue-500/30',
    green: 'bg-green-500/20 border-green-500/30',
    red: 'bg-red-500/20 border-red-500/30',
    purple: 'bg-purple-500/20 border-purple-500/30',
  };

  return (
    <div className={`p-4 rounded-lg border backdrop-blur-sm ${colorClasses[color]}`}>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </div>
  );
};

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: () => void;
  onSnooze: () => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onComplete, onSnooze }) => {
  const isOverdue = reminder.dueAt && reminder.dueAt < new Date() && !reminder.completed;
  const isDueSoon = reminder.dueAt && !reminder.completed &&
    reminder.dueAt.getTime() - Date.now() < 60 * 60 * 1000; // Within 1 hour

  return (
    <div className={`p-4 rounded-lg border backdrop-blur-sm transition-all hover:scale-[1.02] ${
      reminder.completed
        ? 'bg-green-500/10 border-green-500/30'
        : isOverdue
        ? 'bg-red-500/10 border-red-500/30'
        : isDueSoon
        ? 'bg-yellow-500/10 border-yellow-500/30'
        : 'bg-shivi-dark-700/50 border-shivi-dark-600'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-semibold ${reminder.completed ? 'line-through text-gray-500' : 'text-white'}`}>
            {reminder.title}
          </h3>
          {reminder.description && (
            <p className="text-sm text-gray-400 mt-1">{reminder.description}</p>
          )}
          {reminder.dueAt && (
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-500 mr-2">🕐</span>
              <span className={isOverdue ? 'text-red-400' : isDueSoon ? 'text-yellow-400' : 'text-gray-400'}>
                {reminder.dueAt.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex items-center mt-2 space-x-2">
            <PriorityBadge priority={reminder.priority} />
            {reminder.recurring && <RecurringBadge />}
          </div>
        </div>

        {!reminder.completed && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={onSnooze}
              className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
            >
              Snooze
            </button>
            <button
              onClick={onComplete}
              className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const configs = {
    low: { color: 'bg-gray-500/20 text-gray-400', label: 'Low' },
    medium: { color: 'bg-blue-500/20 text-blue-400', label: 'Medium' },
    high: { color: 'bg-orange-500/20 text-orange-400', label: 'High' },
    urgent: { color: 'bg-red-500/20 text-red-400', label: 'Urgent' },
  };

  const config = configs[priority];

  return (
    <span className={`px-2 py-1 text-xs rounded ${config.color}`}>
      {config.label}
    </span>
  );
};

const RecurringBadge: React.FC = () => (
  <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
    🔄 Recurring
  </span>
);

// Quick Create Component
interface QuickCreateReminderProps {
  userId: string;
  conversationId?: string;
  onCreated?: (reminder: Reminder) => void;
}

export const QuickCreateReminder: React.FC<QuickCreateReminderProps> = ({
  userId,
  conversationId,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isReminderApiAvailable()) return;

    setCreating(true);
    try {
      const reminderData = {
        userId,
        conversationId,
        title: title.trim(),
        dueAt: dueAt ? new Date(dueAt) : undefined,
      };

      const reminder = await createReminder(reminderData);
      setTitle('');
      setDueAt('');

      if (onCreated && reminder) {
        onCreated(reminder);
      }
    } catch (error) {
      console.error('Failed to create reminder:', error);
      alert('Reminder creation is unavailable outside the desktop app.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What should I remind you about? 💭"
        className="flex-1 px-3 py-2 bg-shivi-dark-700 border border-shivi-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-shivi-purple-500"
        disabled={creating}
      />
      <input
        type="datetime-local"
        value={dueAt}
        onChange={(e) => setDueAt(e.target.value)}
        className="px-3 py-2 bg-shivi-dark-700 border border-shivi-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-shivi-purple-500"
        disabled={creating}
      />
      <button
        type="submit"
        disabled={!title.trim() || creating}
        className="px-4 py-2 bg-shivi-purple-600 text-white rounded-lg hover:bg-shivi-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {creating ? 'Creating...' : 'Create 🔔'}
      </button>
    </form>
  );
};

// Google Calendar Integration Component
interface GoogleCalendarConnectProps {
  userId: string;
  onConnected?: () => void;
}

export const GoogleCalendarConnect: React.FC<GoogleCalendarConnectProps> = ({
  userId,
  onConnected
}) => {
  const [connected, setConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!isReminderApiAvailable()) {
      setConnected(false);
      setSyncStatus({ connected: false });
      return;
    }
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    if (!isReminderApiAvailable()) {
      setConnected(false);
      setSyncStatus({ connected: false });
      return;
    }

    try {
      const status = await getSyncStatus(userId);
      setConnected(!!status?.connected);
      setSyncStatus(status || { connected: false });
    } catch (error) {
      console.error('Failed to check connection:', error);
      setConnected(false);
      setSyncStatus({ connected: false });
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const authUrl = await generateCalendarAuthUrl();
      if (!authUrl) {
        throw new Error('Google Calendar auth URL is unavailable in this renderer environment.');
      }
      console.log('Google Calendar auth URL:', authUrl);
      alert(`Please visit this URL to authorize: ${authUrl}`);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Google Calendar connection is unavailable in this environment.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      await syncEvents(userId);
      await checkConnection();
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  };

  if (!isReminderApiAvailable()) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-shivi-dark-900 text-white text-sm">
        Google Calendar sync or reminder features are not available outside the desktop app.
      </div>
    );
  }

  if (connected) {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-green-400 font-semibold">📅 Google Calendar Connected</h3>
            <p className="text-sm text-gray-400">
              Last synced: {syncStatus?.lastSyncAt ? new Date(syncStatus.lastSyncAt).toLocaleString() : 'Never'}
            </p>
          </div>
          <button
            onClick={handleSync}
            className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
          >
            Sync Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-shivi-dark-700/50 border border-shivi-dark-600 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">📅 Connect Google Calendar</h3>
          <p className="text-sm text-gray-400">
            Sync your reminders with Google Calendar for better organization
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
};