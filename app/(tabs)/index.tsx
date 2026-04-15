import React, { useState, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
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
} from '@/context/entries-context';

// ─── Entry card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, isDark }: { entry: Entry; isDark: boolean }) {
  const cardBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
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
    </View>
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

  const { entries, addEntry } = useEntries();
  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList>(null);

  const inputBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const inputBorder = isDark ? '#2D2D2D' : '#E5E7EB';
  const placeholderColor = isDark ? '#4B5563' : '#9CA3AF';

  function handleSubmit() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    addEntry(trimmed);
    setInputText('');
    // TODO: call Claude API to categorize, then call updateEntryCategory(id, category)
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
        renderItem={({ item }) => <EntryCard entry={item} isDark={isDark} />}
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
});
