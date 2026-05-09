export type ReminderItem = {
  id: string;
  title: string;
  details?: string;
  dateTime: string;
  recurring?: string;
  createdAt: string;
};

export class ReminderEngine {
  private reminders: ReminderItem[] = [];

  createReminder(item: Omit<ReminderItem, 'id' | 'createdAt'>) {
    const reminder = {
      ...item,
      id: `reminder-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.reminders.push(reminder);
    return reminder;
  }

  listReminders() {
    return this.reminders;
  }
}
