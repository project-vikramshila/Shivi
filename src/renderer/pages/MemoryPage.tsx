import React, { useState, useEffect } from 'react';
import useChatStore from '../store/chatStore';
import { memoryEngine, Memory, MemoryStats } from '../../modules/memory';

const MemoryPage = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeReminders, setActiveReminders] = useState<any[]>([]);

  const searchMemories = useChatStore((state) => state.searchMemories);
  const getActiveReminders = useChatStore((state) => state.getActiveReminders);

  useEffect(() => {
    loadMemoryStats();
    loadActiveReminders();
  }, []);

  const loadMemoryStats = async () => {
    try {
      const memoryStats = memoryEngine.getStats();
      setStats(memoryStats);
    } catch (error) {
      console.warn('Failed to load memory stats:', error);
    }
  };

  const loadActiveReminders = async () => {
    try {
      const reminders = await getActiveReminders();
      setActiveReminders(reminders);
    } catch (error) {
      console.warn('Failed to load reminders:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchMemories(searchQuery);
      setMemories(results);
    } catch (error) {
      console.warn('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const formatMemoryType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-[32px] p-8 shadow-glow">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Memory</p>
            <h1 className="text-3xl font-semibold text-white">Aapki yaadein</h1>
            <p className="mt-2 text-white/70">Shivi aapki har baat ko safely store karti hai</p>
          </div>
        </div>

        {/* Memory Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{stats.totalMemories}</div>
              <div className="text-sm text-white/60">Total Memories</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{stats.byType.conversation || 0}</div>
              <div className="text-sm text-white/60">Conversations</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{stats.byType.reminder || 0}</div>
              <div className="text-sm text-white/60">Reminders</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{activeReminders.length}</div>
              <div className="text-sm text-white/60">Active</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Yaadon mein search karein..."
            className="flex-1 rounded-3xl border border-white/10 bg-shivi-dark-900 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-pink-400 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-3xl bg-pink-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Active Reminders */}
      {activeReminders.length > 0 && (
        <div className="glass-card rounded-[32px] p-8 shadow-glow">
          <h2 className="text-xl font-semibold text-white mb-4">Active Reminders</h2>
          <div className="space-y-3">
            {activeReminders.map((reminder) => (
              <div key={reminder.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{reminder.title}</h3>
                    {reminder.description && (
                      <p className="text-sm text-white/60 mt-1">{reminder.description}</p>
                    )}
                    {reminder.dueDate && (
                      <p className="text-xs text-pink-400 mt-2">
                        Due: {new Date(reminder.dueDate).toLocaleDateString('hi-IN')}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    reminder.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                    reminder.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {reminder.priority}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {memories.length > 0 && (
        <div className="glass-card rounded-[32px] p-8 shadow-glow">
          <h2 className="text-xl font-semibold text-white mb-4">Search Results</h2>
          <div className="space-y-4">
            {memories.map((memory) => (
              <div key={memory.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-medium">
                      {formatMemoryType(memory.type)}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatDate(memory.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-white/40">
                    {Math.round(memory.confidence * 100)}% confidence
                  </div>
                </div>

                {memory.type === 'conversation' && (
                  <div>
                    <p className="text-white font-medium mb-1">User: {memory.userMessage}</p>
                    <p className="text-white/70">Shivi: {memory.shiviResponse}</p>
                    {memory.topics.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {memory.topics.map((topic, index) => (
                          <span key={index} className="px-2 py-1 rounded-full bg-white/10 text-white/60 text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {memory.type === 'reminder' && (
                  <div>
                    <p className="text-white font-medium">{memory.title}</p>
                    {memory.description && (
                      <p className="text-white/70 text-sm mt-1">{memory.description}</p>
                    )}
                  </div>
                )}

                {memory.type === 'entity' && (
                  <div>
                    <p className="text-white font-medium">{memory.name}</p>
                    <p className="text-white/70 text-sm">Type: {memory.type} • Mentions: {memory.mentionCount}</p>
                  </div>
                )}

                {memory.tags.length > 0 && (
                  <div className="flex gap-1 mt-3">
                    {memory.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 rounded-full bg-white/5 text-white/40 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {memories.length === 0 && !isSearching && (
        <div className="glass-card rounded-[32px] p-8 shadow-glow">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold text-white mb-2">Memory System Active</h3>
            <p className="text-white/60">
              Shivi aapki har baat ko safely store karti hai. Search karein ya reminders dekhiye.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default MemoryPage;
