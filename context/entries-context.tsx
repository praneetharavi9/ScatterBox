import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type Category = string;

export interface Entry {
  id: string;
  text: string;
  category: Category | null;
  createdAt: Date;
}

export interface List {
  id: string;
  name: string;
  color: string;
  isBuiltIn: boolean;
}

const BUILT_IN_LISTS: List[] = [
  { id: 'todo',      name: 'To-Do',      color: '#2196F3', isBuiltIn: true },
  { id: 'groceries', name: 'Groceries',  color: '#4CAF50', isBuiltIn: true },
  { id: 'ideas',     name: 'Ideas',      color: '#9C27B0', isBuiltIn: true },
  { id: 'braindump', name: 'Brain Dump', color: '#FF9800', isBuiltIn: true },
];

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

const CUSTOM_COLORS = [
  '#E91E63', '#00BCD4', '#FF5722', '#607D8B',
  '#795548', '#009688', '#3F51B5', '#F44336',
];

interface EntriesContextValue {
  entries: Entry[];
  lists: List[];
  loading: boolean;
  addEntry: (text: string, category?: Category) => Promise<string>;
  updateEntryCategory: (id: string, category: Category) => Promise<void>;
  updateEntryText: (id: string, text: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addList: (name: string) => Promise<List>;
  renameList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  getList: (id: string) => List | undefined;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [lists, setLists] = useState<List[]>(BUILT_IN_LISTS);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setEntries(data.map(row => ({
        id: row.id,
        text: row.text,
        category: row.category ?? null,
        createdAt: new Date(row.created_at),
      })));
    }
  }, []);

  const loadLists = useCallback(async () => {
    const { data } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: true });

    if (data && data.length > 0) {
      const customLists: List[] = data.map(row => ({
        id: row.id,
        name: row.name,
        color: row.color,
        isBuiltIn: false,
      }));
      setLists([...BUILT_IN_LISTS, ...customLists]);
      customLists.forEach(l => {
        CATEGORY_LABELS[l.id] = l.name;
        CATEGORY_COLORS[l.id] = l.color;
      });
    } else {
      setLists(BUILT_IN_LISTS);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      if (session) {
        Promise.all([loadEntries(), loadLists()]).finally(() => setLoading(false));
      } else {
        setEntries([]);
        setLists(BUILT_IN_LISTS);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadEntries, loadLists]);

  async function addEntry(text: string, category?: Category): Promise<string> {
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('entries')
      .insert({ text, category: category ?? null, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    const entry: Entry = {
      id: data.id,
      text: data.text,
      category: data.category ?? null,
      createdAt: new Date(data.created_at),
    };
    setEntries(prev => [entry, ...prev]);
    return data.id;
  }

  async function updateEntryCategory(id: string, category: Category): Promise<void> {
    const { error } = await supabase
      .from('entries')
      .update({ category })
      .eq('id', id);

    if (!error) {
      setEntries(prev => prev.map(e => (e.id === id ? { ...e, category } : e)));
    }
  }

  async function addList(name: string): Promise<List> {
    if (!userId) throw new Error('Not authenticated');

    const customCount = lists.filter(l => !l.isBuiltIn).length;
    const color = CUSTOM_COLORS[customCount % CUSTOM_COLORS.length];
    const id = `custom-${Date.now()}`;
    const newList: List = { id, name: name.trim(), color, isBuiltIn: false };

    // Optimistic update so the list appears immediately
    setLists(prev => [...prev, newList]);
    CATEGORY_LABELS[id] = newList.name;
    CATEGORY_COLORS[id] = newList.color;

    await supabase
      .from('lists')
      .insert({ id, name: name.trim(), color, user_id: userId });

    return newList;
  }

  async function updateEntryText(id: string, text: string): Promise<void> {
    const { error } = await supabase.from('entries').update({ text }).eq('id', id);
    if (!error) setEntries(prev => prev.map(e => (e.id === id ? { ...e, text } : e)));
  }

  async function deleteEntry(id: string): Promise<void> {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (!error) setEntries(prev => prev.filter(e => e.id !== id));
  }

  async function deleteList(id: string): Promise<void> {
    await supabase.from('entries').delete().eq('category', id);
    setEntries(prev => prev.filter(e => e.category !== id));
    await supabase.from('lists').delete().eq('id', id);
    setLists(prev => prev.filter(l => l.id !== id));
    delete CATEGORY_LABELS[id];
    delete CATEGORY_COLORS[id];
  }

  async function renameList(id: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLists(prev => prev.map(l => (l.id === id ? { ...l, name: trimmed } : l)));
    CATEGORY_LABELS[id] = trimmed;
    const list = lists.find(l => l.id === id);
    if (list && !list.isBuiltIn) {
      await supabase.from('lists').update({ name: trimmed }).eq('id', id);
    }
  }

  function getList(id: string): List | undefined {
    return lists.find(l => l.id === id);
  }

  return (
    <EntriesContext.Provider value={{ entries, lists, loading, addEntry, updateEntryCategory, updateEntryText, deleteEntry, addList, renameList, deleteList, getList }}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used within EntriesProvider');
  return ctx;
}
