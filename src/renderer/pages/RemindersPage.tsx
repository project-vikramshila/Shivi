import React, { useState, useEffect } from 'react';
import {
  ReminderDashboard,
  QuickCreateReminder,
  GoogleCalendarConnect,
} from '../../modules/reminders/ui/components';
import type { Reminder } from '../../modules/reminders/core/types';

const RemindersPage = () => {
  const [userId] = useState('user-1'); // In a real app, this would come from auth
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleReminderAction = (action: string, reminder: Reminder) => {
    console.log('Reminder action:', action, reminder);
    // Could show toast notifications or update UI
  };

  const handleReminderCreated = (reminder: Reminder) => {
    console.log('New reminder created:', reminder);
    setShowCreateForm(false);
    // Could refresh the dashboard or show success message
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-[32px] p-8 shadow-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Reminders</p>
            <h1 className="text-3xl font-semibold text-white">Aapke reminders</h1>
            <p className="mt-2 text-white/70">Shivi aapki yaad dilati rahegi 💖</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-3xl bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400"
            >
              {showCreateForm ? 'Cancel' : '+ New Reminder'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Create Form */}
      {showCreateForm && (
        <div className="glass-card rounded-[32px] p-8 shadow-glow">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Create Reminder</h2>
          <QuickCreateReminder
            userId={userId}
            onCreated={handleReminderCreated}
          />
        </div>
      )}

      {/* Google Calendar Integration */}
      <GoogleCalendarConnect
        userId={userId}
        onConnected={() => console.log('Google Calendar connected')}
      />

      {/* Main Dashboard */}
      <ReminderDashboard
        userId={userId}
        onReminderAction={handleReminderAction}
      />

      {/* Tips */}
      <div className="glass-card rounded-[32px] p-8 shadow-glow">
        <h2 className="text-xl font-semibold text-white mb-4">Tips & Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">🗣️ Chat se Reminder</h3>
            <p className="text-sm text-white/60">
              Chat mein "Kal Rahul ko call karna yaad dilana" kahiye aur Shivi automatically reminder bana degi.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">🔄 Recurring Reminders</h3>
            <p className="text-sm text-white/60">
              Daily, weekly, monthly reminders set kar sakte hain. Shivi automatically next occurrence bana degi.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">📅 Calendar Sync</h3>
            <p className="text-sm text-white/60">
              Google Calendar se connect kar ke events ko reminders mein sync kar sakte hain.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">💖 Emotional Style</h3>
            <p className="text-sm text-white/60">
              Reminders warm, playful, ya gentle tone mein aate hain according to your preference.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">🔔 Smart Notifications</h3>
            <p className="text-sm text-white/60">
              Desktop, in-app, aur future voice notifications. Snooze aur priority levels support.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium text-white mb-2">🎯 Contextual</h3>
            <p className="text-sm text-white/60">
              Shivi conversation se samajhti hai ki kab reminder banana hai. Follow-up reminders bhi suggest karti hai.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RemindersPage;
