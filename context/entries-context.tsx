import React, { createContext, useContext, useState } from 'react';

// Category is now a plain string so custom lists work the same as built-ins
export type Category = string;

export interface Entry {
  id: string;
  text: string;
  category: Category | null; // null = pending AI categorization
  createdAt: Date;
}

export interface List {
  id: string;       // used as the category key
  name: string;
  color: string;
  isBuiltIn: boolean;
}

// ─── Built-in lists ───────────────────────────────────────────────────────────

const BUILT_IN_LISTS: List[] = [
  { id: 'todo',      name: 'To-Do',      color: '#2196F3', isBuiltIn: true },
  { id: 'groceries', name: 'Groceries',  color: '#4CAF50', isBuiltIn: true },
  { id: 'ideas',     name: 'Ideas',      color: '#9C27B0', isBuiltIn: true },
  { id: 'braindump', name: 'Brain Dump', color: '#FF9800', isBuiltIn: true },
];

// Kept for backward compat with index.tsx badge rendering
export const CATEGORY_LABELS: Record<string, string> = {
  groceries: 'Groceries',
  todo: 'To-Do',
  ideas: 'Ideas',
  braindump: 'Brain Dump',
};

export const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#4CAF50',
  todo: '#2196F3',
  ideas: '#9C27B0',
  braindump: '#FF9800',
};

// Colors cycled through when creating custom lists
const CUSTOM_COLORS = [
  '#E91E63', '#00BCD4', '#FF5722', '#607D8B',
  '#795548', '#009688', '#3F51B5', '#F44336',
];

// ─── Context ──────────────────────────────────────────────────────────────────

interface EntriesContextValue {
  entries: Entry[];
  lists: List[];
  /** Add a new entry. Pass category to skip AI (manual add). Returns the new id. */
  addEntry: (text: string, category?: Category) => string;
  updateEntryCategory: (id: string, category: Category) => void;
  addList: (name: string) => List;
  getList: (id: string) => List | undefined;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lists, setLists] = useState<List[]>(BUILT_IN_LISTS);

  function addEntry(text: string, category?: Category): string {
    const id = Date.now().toString();
    setEntries(prev => [
      { id, text, category: category ?? null, createdAt: new Date() },
      ...prev,
    ]);
    return id;
  }

  function updateEntryCategory(id: string, category: Category) {
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, category } : e)));
  }

  function addList(name: string): List {
    const customCount = lists.filter(l => !l.isBuiltIn).length;
    const color = CUSTOM_COLORS[customCount % CUSTOM_COLORS.length];
    const id = `custom-${Date.now()}`;
    const newList: List = { id, name: name.trim(), color, isBuiltIn: false };
    setLists(prev => [...prev, newList]);
    // Keep label/color maps in sync for index.tsx badge
    CATEGORY_LABELS[id] = newList.name;
    CATEGORY_COLORS[id] = newList.color;
    return newList;
  }

  function getList(id: string): List | undefined {
    return lists.find(l => l.id === id);
  }

  return (
    <EntriesContext.Provider value={{ entries, lists, addEntry, updateEntryCategory, addList, getList }}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used within EntriesProvider');
  return ctx;
}
