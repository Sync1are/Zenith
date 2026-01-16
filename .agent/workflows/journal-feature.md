---
description: Journal / Daily Logs Feature Implementation Guide
---

# 📓 Journal / Daily Logs Feature — Complete Implementation Plan

## Overview

A topic-based journaling system for the Zenith time management app, allowing users to create dated logs organized by topics (Work, Study, Personal, etc.).

---

## 🏗️ Architecture Summary

| Layer | Technology | Pattern |
|-------|------------|---------|
| **State** | Zustand + persist | `useJournalStore.tsx` |
| **Storage** | localStorage + Firebase | useFirebaseSync hook |
| **UI** | React + Framer Motion + Tailwind | Existing app patterns |
| **Rich Text** | TipTap or Lexical | New dependency |

---

## 📁 File Structure

```
components/
├── JournalPage.tsx                 # Main journal page container
├── journal/
│   ├── JournalHome.tsx             # Topic grid/list view
│   ├── TopicCard.tsx               # Individual topic card
│   ├── TopicPage.tsx               # Topic detail with entries
│   ├── EntryEditor.tsx             # Rich text entry editor
│   ├── EntryCard.tsx               # Entry preview card
│   ├── JournalCalendar.tsx         # Calendar date picker
│   ├── JournalSearch.tsx           # Search component
│   ├── QuickLogFAB.tsx             # Floating quick-add button
│   ├── MoodSelector.tsx            # Emoji/scale mood picker
│   ├── JournalAnalytics.tsx        # Insights & analytics
│   └── TopicModal.tsx              # Create/Edit topic modal

store/
├── useJournalStore.tsx             # Journal Zustand store

types.ts                            # Add Journal types
```

---

## 🗃️ TypeScript Types (Add to `types.ts`)

```typescript
// ==================== JOURNAL TYPES ====================

export interface JournalTopic {
  id: string;
  name: string;
  color: string;           // Hex color e.g. '#6366f1'
  icon: string;            // Emoji or icon name e.g. '📚' or 'book'
  createdAt: string;       // ISO date string
  entryCount?: number;     // Computed
}

export interface JournalEntry {
  id: string;
  topicId: string;
  date: string;            // YYYY-MM-DD format
  content: string;         // Markdown/HTML content
  plainText?: string;      // Plain text for search
  mood?: number;           // 1-5 scale or null
  moodEmoji?: string;      // Custom emoji
  pinned: boolean;
  attachments?: JournalAttachment[];
  linkedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalAttachment {
  id: string;
  entryId: string;
  fileUrl: string;
  fileName: string;
  fileType: 'image' | 'audio' | 'document';
  createdAt: string;
}

export interface JournalDraft {
  topicId: string;
  date: string;
  content: string;
  lastSaved: string;
}
```

---

## 🏪 Zustand Store: `useJournalStore.tsx`

```typescript
// store/useJournalStore.tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JournalTopic, JournalEntry, JournalDraft } from '../types';

interface JournalStore {
  // State
  topics: JournalTopic[];
  entries: JournalEntry[];
  drafts: JournalDraft[];
  selectedTopicId: string | null;
  selectedDate: string | null;
  searchQuery: string;
  filters: {
    topicIds: string[];
    dateRange: { start: string | null; end: string | null };
    mood: number | null;
    pinnedOnly: boolean;
  };

  // Topic Actions
  addTopic: (topic: Omit<JournalTopic, 'id' | 'createdAt'>) => void;
  updateTopic: (id: string, updates: Partial<JournalTopic>) => void;
  deleteTopic: (id: string) => void;

  // Entry Actions
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  togglePinEntry: (id: string) => void;

  // Draft Actions
  saveDraft: (topicId: string, date: string, content: string) => void;
  getDraft: (topicId: string, date: string) => JournalDraft | null;
  clearDraft: (topicId: string, date: string) => void;

  // Navigation
  setSelectedTopic: (id: string | null) => void;
  setSelectedDate: (date: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<JournalStore['filters']>) => void;
  clearFilters: () => void;

  // Computed / Selectors
  getEntriesForTopic: (topicId: string) => JournalEntry[];
  getEntriesForDate: (date: string) => JournalEntry[];
  getStreak: () => number;
  getWeeklyStats: () => { total: number; mostActiveTopic: string | null };
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      // Initial State
      topics: [],
      entries: [],
      drafts: [],
      selectedTopicId: null,
      selectedDate: null,
      searchQuery: '',
      filters: {
        topicIds: [],
        dateRange: { start: null, end: null },
        mood: null,
        pinnedOnly: false,
      },

      // Topic Actions
      addTopic: (topicData) => {
        const newTopic: JournalTopic = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...topicData,
        };
        set((state) => ({ topics: [...state.topics, newTopic] }));
      },

      updateTopic: (id, updates) => {
        set((state) => ({
          topics: state.topics.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTopic: (id) => {
        set((state) => ({
          topics: state.topics.filter((t) => t.id !== id),
          entries: state.entries.filter((e) => e.topicId !== id),
        }));
      },

      // Entry Actions
      addEntry: (entryData) => {
        const now = new Date().toISOString();
        const newEntry: JournalEntry = {
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
          ...entryData,
        };
        set((state) => ({ entries: [...state.entries, newEntry] }));
        // Clear draft after saving
        get().clearDraft(entryData.topicId, entryData.date);
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        }));
      },

      togglePinEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, pinned: !e.pinned } : e
          ),
        }));
      },

      // Draft Actions
      saveDraft: (topicId, date, content) => {
        const draft: JournalDraft = {
          topicId,
          date,
          content,
          lastSaved: new Date().toISOString(),
        };
        set((state) => ({
          drafts: [
            ...state.drafts.filter((d) => !(d.topicId === topicId && d.date === date)),
            draft,
          ],
        }));
      },

      getDraft: (topicId, date) => {
        return get().drafts.find((d) => d.topicId === topicId && d.date === date) || null;
      },

      clearDraft: (topicId, date) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => !(d.topicId === topicId && d.date === date)),
        }));
      },

      // Navigation
      setSelectedTopic: (id) => set({ selectedTopicId: id }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      clearFilters: () =>
        set({
          filters: {
            topicIds: [],
            dateRange: { start: null, end: null },
            mood: null,
            pinnedOnly: false,
          },
        }),

      // Computed
      getEntriesForTopic: (topicId) => {
        return get().entries.filter((e) => e.topicId === topicId);
      },

      getEntriesForDate: (date) => {
        return get().entries.filter((e) => e.date === date);
      },

      getStreak: () => {
        const entries = get().entries;
        if (entries.length === 0) return 0;

        const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          if (dates.includes(dateStr)) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },

      getWeeklyStats: () => {
        const entries = get().entries;
        const topics = get().topics;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const weekEntries = entries.filter((e) => e.date >= weekAgoStr);
        const topicCounts: Record<string, number> = {};

        weekEntries.forEach((e) => {
          topicCounts[e.topicId] = (topicCounts[e.topicId] || 0) + 1;
        });

        let mostActiveTopic: string | null = null;
        let maxCount = 0;
        Object.entries(topicCounts).forEach(([topicId, count]) => {
          if (count > maxCount) {
            maxCount = count;
            const topic = topics.find((t) => t.id === topicId);
            mostActiveTopic = topic?.name || null;
          }
        });

        return { total: weekEntries.length, mostActiveTopic };
      },
    }),
    {
      name: 'zenith-journal-storage',
    }
  )
);
```

---

## 🎨 UI Components

### 1. JournalPage.tsx (Main Container)

```tsx
// components/JournalPage.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJournalStore } from '../store/useJournalStore';
import JournalHome from './journal/JournalHome';
import TopicPage from './journal/TopicPage';
import EntryEditor from './journal/EntryEditor';
import JournalAnalytics from './journal/JournalAnalytics';
import QuickLogFAB from './journal/QuickLogFAB';
import { BookOpen, BarChart2 } from 'lucide-react';

type JournalView = 'home' | 'topic' | 'editor' | 'analytics';

const JournalPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<JournalView>('home');
  const [viewMode, setViewMode] = useState<'Topics' | 'Calendar' | 'Analytics'>('Topics');
  const selectedTopicId = useJournalStore((s) => s.selectedTopicId);
  const setSelectedTopic = useJournalStore((s) => s.setSelectedTopic);

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    setCurrentView('topic');
  };

  const handleBackToHome = () => {
    setSelectedTopic(null);
    setCurrentView('home');
  };

  const handleNewEntry = () => {
    setCurrentView('editor');
  };

  return (
    <div className="w-full h-full px-6 py-8 overflow-y-auto relative">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              Journal
            </h1>
            <p className="text-white/50 font-medium">
              Capture your thoughts, one day at a time.
            </p>
          </div>

          {/* View Toggle */}
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex relative">
            {(['Topics', 'Calendar', 'Analytics'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  relative px-5 py-2 rounded-lg text-sm font-bold transition-colors z-10
                  ${viewMode === mode ? 'text-black' : 'text-white/40 hover:text-white'}
                `}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="journalActiveTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {viewMode === 'Analytics' ? (
              <JournalAnalytics />
            ) : currentView === 'home' ? (
              <JournalHome 
                viewMode={viewMode} 
                onTopicClick={handleTopicClick}
                onNewEntry={handleNewEntry}
              />
            ) : currentView === 'topic' ? (
              <TopicPage 
                topicId={selectedTopicId!}
                onBack={handleBackToHome}
                onNewEntry={handleNewEntry}
              />
            ) : (
              <EntryEditor 
                topicId={selectedTopicId}
                onClose={() => setCurrentView(selectedTopicId ? 'topic' : 'home')}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Quick Log Floating Button */}
      <QuickLogFAB onClick={handleNewEntry} />
    </div>
  );
};

export default JournalPage;
```

### 2. TopicCard.tsx

```tsx
// components/journal/TopicCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useJournalStore } from '../../store/useJournalStore';
import { JournalTopic } from '../../types';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface TopicCardProps {
  topic: JournalTopic;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic, onClick, onEdit, onDelete }) => {
  const entries = useJournalStore((s) => s.getEntriesForTopic(topic.id));
  const recentEntry = entries.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <div 
        className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm
                   hover:bg-white/8 hover:border-white/20 transition-all duration-300"
        style={{ 
          background: `linear-gradient(135deg, ${topic.color}15 0%, transparent 60%)` 
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${topic.color}25` }}
          >
            {topic.icon}
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); /* open dropdown */ }}
            className="p-2 rounded-lg opacity-0 group-hover:opacity-100 
                       hover:bg-white/10 transition-all text-white/50"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Stats */}
        <h3 className="text-lg font-bold text-white mb-1">{topic.name}</h3>
        <p className="text-sm text-white/50">{entries.length} entries</p>

        {/* Recent Entry Preview */}
        {recentEntry && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-white/40 mb-1">
              {new Date(recentEntry.date).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric' 
              })}
            </p>
            <p className="text-sm text-white/70 line-clamp-2">
              {recentEntry.plainText?.slice(0, 80) || 'No preview available'}...
            </p>
          </div>
        )}

        {/* Arrow indicator */}
        <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 
                        transition-all transform translate-x-0 group-hover:translate-x-1">
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      </div>
    </motion.div>
  );
};

export default TopicCard;
```

### 3. MoodSelector.tsx

```tsx
// components/journal/MoodSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

const MOODS = [
  { value: 1, emoji: '😞', label: 'Awful', color: '#ef4444' },
  { value: 2, emoji: '😕', label: 'Bad', color: '#f97316' },
  { value: 3, emoji: '😐', label: 'Okay', color: '#eab308' },
  { value: 4, emoji: '🙂', label: 'Good', color: '#84cc16' },
  { value: 5, emoji: '😄', label: 'Great', color: '#22c55e' },
];

const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/50 mr-2">Mood:</span>
      {MOODS.map((mood) => (
        <motion.button
          key={mood.value}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(mood.value)}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-xl
            transition-all duration-200
            ${value === mood.value 
              ? 'ring-2 ring-offset-2 ring-offset-black/50' 
              : 'opacity-50 hover:opacity-100'}
          `}
          style={{ 
            backgroundColor: `${mood.color}20`,
            ringColor: mood.color 
          }}
          title={mood.label}
        >
          {mood.emoji}
        </motion.button>
      ))}
    </div>
  );
};

export default MoodSelector;
```

### 4. QuickLogFAB.tsx

```tsx
// components/journal/QuickLogFAB.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Mic, Sparkles } from 'lucide-react';
import { useJournalStore } from '../../store/useJournalStore';

interface QuickLogFABProps {
  onClick: () => void;
}

const QuickLogFAB: React.FC<QuickLogFABProps> = ({ onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const topics = useJournalStore((s) => s.topics);
  const addEntry = useJournalStore((s) => s.addEntry);

  const handleQuickSave = (topicId: string) => {
    if (!quickNote.trim()) return;
    
    addEntry({
      topicId,
      date: new Date().toISOString().split('T')[0],
      content: quickNote,
      plainText: quickNote,
      pinned: false,
    });
    
    setQuickNote('');
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* FAB & Quick Entry Panel */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-[#1a1b23] border border-white/10 rounded-2xl p-4 w-80 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Quick Log</span>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* Input */}
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 
                           text-white placeholder:text-white/30 resize-none focus:outline-none
                           focus:border-indigo-500/50 transition-colors text-sm"
                autoFocus
              />

              {/* Topic Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {topics.slice(0, 4).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleQuickSave(topic.id)}
                    disabled={!quickNote.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium 
                               bg-white/5 hover:bg-white/10 border border-white/10
                               disabled:opacity-30 disabled:cursor-not-allowed
                               transition-all flex items-center gap-1.5"
                    style={{ color: topic.color }}
                  >
                    <span>{topic.icon}</span>
                    {topic.name}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50">
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  onClick={onClick}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Open full editor →
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600
                         flex items-center justify-center shadow-lg shadow-indigo-500/30
                         hover:shadow-indigo-500/50 transition-all"
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default QuickLogFAB;
```

---

## 🔗 App Integration

### 1. Add to App.tsx

```tsx
// In App.tsx imports:
import JournalPage from "./components/JournalPage";

// In renderContent switch:
case "Journal": return <JournalPage />;
```

### 2. Add to Sidebar.tsx

```tsx
// Add to navigation items
{ id: 'Journal', icon: BookOpen, label: 'Journal' }
```

### 3. Add Firebase Sync in App.tsx

```tsx
useFirebaseSync({
  collectionName: 'journal-state',
  store: useJournalStore,
  selector: (state) => ({
    topics: state.topics,
    entries: state.entries,
    drafts: state.drafts,
  }),
});
```

### 4. Update Discord RPC in discordRPC.cjs

```javascript
case 'Journal':
    details = '📓 Writing Journal';
    state = data.topicName ? `Topic: ${data.topicName}` : 'Reflecting';
    break;
```

---

## 📊 Analytics Component Preview

```tsx
// components/journal/JournalAnalytics.tsx
const JournalAnalytics: React.FC = () => {
  const { getStreak, getWeeklyStats } = useJournalStore();
  const streak = getStreak();
  const weeklyStats = getWeeklyStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Streak Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 
                      border border-orange-500/20">
        <div className="text-5xl mb-2">🔥</div>
        <div className="text-4xl font-black text-white">{streak}</div>
        <div className="text-sm text-white/50">Day Streak</div>
      </div>

      {/* Weekly Entries */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 
                      border border-blue-500/20">
        <div className="text-5xl mb-2">📝</div>
        <div className="text-4xl font-black text-white">{weeklyStats.total}</div>
        <div className="text-sm text-white/50">Entries this week</div>
      </div>

      {/* Most Active Topic */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 
                      border border-emerald-500/20">
        <div className="text-5xl mb-2">⭐</div>
        <div className="text-2xl font-black text-white truncate">
          {weeklyStats.mostActiveTopic || 'No entries yet'}
        </div>
        <div className="text-sm text-white/50">Most active topic</div>
      </div>
    </div>
  );
};
```

---

## 📦 Dependencies to Install

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
```

---

## 🚀 Implementation Order

### Phase 1: Core Setup
1. Add types to `types.ts`
2. Create `useJournalStore.tsx`
3. Create `JournalPage.tsx` (basic container)
4. Add to App.tsx routing
5. Add to Sidebar navigation

### Phase 2: Topic Management
6. Create `TopicCard.tsx`
7. Create `TopicModal.tsx` (create/edit)
8. Create `JournalHome.tsx` (topic grid)

### Phase 3: Entry System
9. Create `EntryCard.tsx`
10. Create `TopicPage.tsx` (entry list)
11. Create `EntryEditor.tsx` with TipTap
12. Create `MoodSelector.tsx`

### Phase 4: Quick Features
13. Create `QuickLogFAB.tsx`
14. Implement autosave drafts

### Phase 5: Search & Calendar
15. Create `JournalSearch.tsx`
16. Create `JournalCalendar.tsx`

### Phase 6: Analytics
17. Create `JournalAnalytics.tsx`
18. Add streak tracking
19. Add topic usage charts

### Phase 7: Integrations
20. Add Firebase sync
21. Add Discord RPC
22. Add task linking

---

## 🎯 Design Tokens (Use Existing)

| Token | Usage |
|-------|-------|
| `bg-white/5` | Card backgrounds |
| `border-white/10` | Card borders |
| `text-white/50` | Muted text |
| `rounded-2xl` | Card radius |
| `backdrop-blur-sm` | Glass effect |

---

## 💡 Pro Tips

1. **Autosave**: Debounce draft saves (500ms delay)
2. **Search**: Use plain text field for fast full-text search
3. **Offline**: Zustand persist handles offline storage
4. **Performance**: Virtualize entry lists for 100+ entries
5. **Animations**: Keep Framer Motion transitions subtle (0.2s)

---

*Simple to write. Powerful to reflect. Quietly addictive.*
