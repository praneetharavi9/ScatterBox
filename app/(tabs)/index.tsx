import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  useEntries,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type Entry,
  type List,
} from '@/context/entries-context';
import { categorizeEntry } from '@/lib/categorize';

// ─── Cluster detection ────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  // articles / prepositions / conjunctions
  'the','a','an','and','or','but','nor','so','yet','for','with','from',
  'into','to','in','on','at','by','up','about','that','this','these',
  'those','than','then','when','where','which','who','whom','whose',
  // pronouns
  'i','me','my','we','our','you','your','he','she','it','its','they',
  'them','their','us','him','her','his',
  // common verbs (present / past / gerund)
  'be','is','are','was','were','been','being',
  'have','has','had','having',
  'do','does','did','done','doing',
  'go','goes','went','gone','going',
  'get','gets','got','getting',
  'make','makes','made','making',
  'take','takes','took','taking',
  'come','comes','came','coming',
  'see','sees','saw','seen','seeing',
  'need','needs','needed','needing',
  'want','wants','wanted','wanting',
  'use','uses','used','using',
  'put','puts','putting',
  'set','sets','setting',
  'give','gives','gave','given','giving',
  'try','tries','tried','trying',
  'eat','eats','ate','eating',
  'cook','cooks','cooked','cooking',
  'buy','buys','bought','buying',
  'add','adds','added','adding',
  'create','creates','created','creating',
  'build','builds','built','building',
  'send','sends','sent','sending',
  'call','calls','called','calling',
  'work','works','worked','working',
  'move','moves','moved','moving',
  'help','helps','helped','helping',
  'deal','deals','dealt',
  'connect','remove','check',
  // auxiliaries / modals
  'will','would','could','should','shall','may','might','must','can',
  // common adjectives / adverbs / fillers
  'new','old','big','small','good','bad','just','also','now','not',
  'still','very','really','more','most','some','any','all','both',
  'each','few','no','up','down','out','off','over','under','again',
  // app-specific noise
  'list','tab','project','name','app','item','items','note','notes',
  'task','tasks','people','person','time','day','week','today',
]);

function detectCluster(
  entries: Entry[],
  lists: List[],
  dismissed: Set<string>,
): { word: string; listName: string; entryIds: string[] } | null {
  const existingNames = new Set(lists.map(l => l.name.toLowerCase()));
  const wordToIds: Record<string, string[]> = {};

  for (const entry of entries) {
    const words = entry.text.toLowerCase().match(/\b[a-z]{3,}\b/g) ?? [];
    const seen = new Set<string>();
    for (const w of words) {
      if (STOP_WORDS.has(w) || seen.has(w) || dismissed.has(w) || existingNames.has(w)) continue;
      seen.add(w);
      wordToIds[w] = wordToIds[w] ?? [];
      wordToIds[w].push(entry.id);
    }
  }

  const best = Object.entries(wordToIds)
    .filter(([, ids]) => ids.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)[0];

  if (!best) return null;
  const [word, entryIds] = best;
  return { word, listName: word.charAt(0).toUpperCase() + word.slice(1), entryIds };
}

// ─── Suggestion banner ────────────────────────────────────────────────────────

function SuggestionBanner({
  suggestion,
  isDark,
  onAccept,
  onDismiss,
}: {
  suggestion: { listName: string; entryIds: string[] };
  isDark: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const bg = isDark ? '#1C2A3A' : '#EFF6FF';
  const textColor = isDark ? '#93C5FD' : '#1D4ED8';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <View style={[styles.suggestion, { backgroundColor: bg }]}>
      <Text style={[styles.suggestionText, { color: textColor }]}>
        Create a "{suggestion.listName}" list for {suggestion.entryIds.length} related entries?
      </Text>
      <View style={styles.suggestionActions}>
        <Pressable onPress={onDismiss} style={styles.suggestionNo}>
          <Text style={[styles.suggestionNoText, { color: mutedColor }]}>No</Text>
        </Pressable>
        <Pressable onPress={onAccept} style={styles.suggestionYes}>
          <Text style={styles.suggestionYesText}>Yes, create it</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  entry,
  isDark,
  onSave,
  onDelete,
  onClose,
}: {
  entry: Entry | null;
  isDark: boolean;
  onSave: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(entry?.text ?? '');
  const cardBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const inputBg = isDark ? '#2A2A2A' : '#F5F5F5';
  const inputBorder = isDark ? '#3A3A3A' : '#E5E7EB';
  const placeholder = isDark ? '#4B5563' : '#9CA3AF';

  if (!entry) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: cardBg }]} onPress={() => {}}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Edit entry</Text>
          <TextInput
            autoFocus
            style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
            placeholderTextColor={placeholder}
            value={text}
            onChangeText={setText}
            multiline
            returnKeyType="default"
          />
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => { onDelete(entry.id); onClose(); }}
              style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
            <View style={styles.modalRight}>
              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <Text style={[styles.cancelText, { color: placeholder }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => { if (text.trim()) { onSave(entry.id, text.trim()); onClose(); } }}
                disabled={!text.trim()}
                style={[styles.saveBtn, { backgroundColor: text.trim() ? '#2196F3' : (isDark ? '#3A3A3A' : '#E5E7EB') }]}>
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  isDark,
  onLongPress,
}: {
  entry: Entry;
  isDark: boolean;
  onLongPress: () => void;
}) {
  const cardBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [styles.card, { backgroundColor: cardBg, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[styles.entryText, { color: textColor }]}>{entry.text}</Text>
      <View style={styles.cardFooter}>
        {entry.category ? (
          <View style={[styles.badge, { backgroundColor: CATEGORY_COLORS[entry.category] + '22' }]}>
            <View style={[styles.badgeDot, { backgroundColor: CATEGORY_COLORS[entry.category] }]} />
            <Text style={[styles.badgeLabel, { color: CATEGORY_COLORS[entry.category] }]}>
              {CATEGORY_LABELS[entry.category]}
            </Text>
          </View>
        ) : (
          <View style={[styles.badge, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
            <Text style={[styles.badgeLabel, { color: mutedColor }]}>categorizing…</Text>
          </View>
        )}
        <Text style={[styles.timestamp, { color: mutedColor }]}>
          {entry.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isDark }: { isDark: boolean }) {
  const mutedColor = isDark ? '#4B5563' : '#D1D5DB';
  const textColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon, { color: mutedColor }]}>◎</Text>
      <Text style={[styles.emptyTitle, { color: textColor }]}>Your mind is clear</Text>
      <Text style={[styles.emptySubtitle, { color: textColor }]}>
        Type anything below — tasks, ideas, groceries.{'\n'}ScatterBox will sort it out.
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DumpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = Colors[isDark ? 'dark' : 'light'].background;
  const text = Colors[isDark ? 'dark' : 'light'].text;
  const tint = Colors[isDark ? 'dark' : 'light'].tint;

  const { entries, lists, addEntry, updateEntryCategory, updateEntryText, deleteEntry, addList } = useEntries();
  const [inputText, setInputText] = useState('');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [suggestion, setSuggestion] = useState<{ word: string; listName: string; entryIds: string[] } | null>(null);
  const dismissedWords = useRef(new Set<string>());
  const listRef = useRef<FlatList>(null);

  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2D2D2D' : '#E5E7EB';
  const placeholderColor = isDark ? '#4B5563' : '#9CA3AF';

  useEffect(() => {
    if (entries.length < 2) return;
    const detected = detectCluster(entries, lists, dismissedWords.current);
    setSuggestion(prev => {
      if (!detected) return null;
      if (prev?.word === detected.word) return prev;
      return detected;
    });
  }, [entries, lists]);

  async function handleAcceptSuggestion() {
    if (!suggestion) return;
    const list = await addList(suggestion.listName);
    await Promise.all(suggestion.entryIds.map(id => updateEntryCategory(id, list.id)));
    setSuggestion(null);
  }

  function handleDismissSuggestion() {
    if (!suggestion) return;
    dismissedWords.current.add(suggestion.word);
    setSuggestion(null);
  }

  async function handleSubmit() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText('');
    const id = await addEntry(trimmed);
    categorizeEntry(trimmed, lists)
      .then(async result => {
        if (result.type === 'new') {
          const list = await addList(result.name);
          await updateEntryCategory(id, list.id);
        } else {
          await updateEntryCategory(id, result.id);
        }
      })
      .catch(() => updateEntryCategory(id, 'braindump'));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: inputBorder }]}>
        <Text style={[styles.appName, { color: text }]}>ScatterBox</Text>
        <Text style={[styles.appTagline, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
          dump it here
        </Text>
      </View>

      {/* Feed */}
      <FlatList
        ref={listRef}
        data={entries}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            isDark={isDark}
            onLongPress={() => setEditingEntry(item)}
          />
        )}
        ListHeaderComponent={
          suggestion ? (
            <SuggestionBanner
              suggestion={suggestion}
              isDark={isDark}
              onAccept={handleAcceptSuggestion}
              onDismiss={handleDismissSuggestion}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.feedContent,
          entries.length === 0 && styles.feedContentEmpty,
        ]}
        ListEmptyComponent={<EmptyState isDark={isDark} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <View style={[styles.inputBar, { borderTopColor: inputBorder, backgroundColor: bg }]}>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: inputBg, color: text, borderColor: inputBorder },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="What's on your mind?"
            placeholderTextColor={placeholderColor}
            multiline
            returnKeyType="default"
            onSubmitEditing={handleSubmit}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!inputText.trim()}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: inputText.trim() ? tint : (isDark ? '#2A2A2A' : '#E5E7EB') },
              pressed && { opacity: 0.8 },
            ]}>
            <Text
              style={[
                styles.sendIcon,
                { color: inputText.trim() ? '#fff' : (isDark ? '#4B5563' : '#9CA3AF') },
              ]}>
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Edit modal */}
      <EditModal
        entry={editingEntry}
        isDark={isDark}
        onSave={(id, newText) => updateEntryText(id, newText)}
        onDelete={id => deleteEntry(id)}
        onClose={() => setEditingEntry(null)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    marginTop: 1,
  },
  feedContent: {
    padding: 16,
    gap: 10,
  },
  feedContentEmpty: {
    flex: 1,
  },
  // Suggestion banner
  suggestion: {
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  suggestionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  suggestionNo: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  suggestionNoText: {
    fontSize: 14,
  },
  suggestionYes: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  suggestionYesText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // Card
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  entryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalRight: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  deleteBtn: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '500',
  },
  cancelBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  cancelText: { fontSize: 15 },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
