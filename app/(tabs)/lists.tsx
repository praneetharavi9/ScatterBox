import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useEntries, type Category, type List } from '@/context/entries-context';

// ─── List card ────────────────────────────────────────────────────────────────

const LIST_ICONS: Record<string, string> = {
  todo: '✓',
  groceries: '◎',
  ideas: '✦',
  braindump: '~',
};

function ListCard({
  list,
  count,
  preview,
  isDark,
  onPress,
}: {
  list: List;
  count: number;
  preview: string | null;
  isDark: boolean;
  onPress: () => void;
}) {
  const cardBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';
  const { color } = list;
  const icon = LIST_ICONS[list.id] ?? list.name[0].toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardBg, opacity: pressed ? 0.75 : 1 },
      ]}>
      <View style={[styles.accentBar, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.iconBadge, { backgroundColor: color + '22' }]}>
            <Text style={[styles.iconText, { color }]}>{icon}</Text>
          </View>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: textColor }]}>{list.name}</Text>
            <Text style={[styles.countBadge, { color, backgroundColor: color + '22' }]}>
              {count}
            </Text>
          </View>
        </View>
        <Text style={[styles.preview, { color: mutedColor }]} numberOfLines={1}>
          {preview ?? 'No items yet'}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: mutedColor }]}>›</Text>
    </Pressable>
  );
}

// ─── Add list modal ───────────────────────────────────────────────────────────

function AddListModal({
  visible,
  isDark,
  onClose,
  onAdd,
}: {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState('');
  const cardBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const inputBg = isDark ? '#2A2A2A' : '#F5F5F5';
  const inputBorder = isDark ? '#3A3A3A' : '#E5E7EB';
  const placeholder = isDark ? '#4B5563' : '#9CA3AF';
  const tint = Colors[isDark ? 'dark' : 'light'].tint;

  function handleAdd() {
    if (!name.trim()) return;
    onAdd(name.trim());
    setName('');
    onClose();
  }

  function handleClose() {
    setName('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: cardBg }]} onPress={() => {}}>
          <Text style={[styles.modalTitle, { color: textColor }]}>New List</Text>
          <TextInput
            autoFocus
            style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
            placeholder="List name…"
            placeholderTextColor={placeholder}
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            maxLength={40}
          />
          <View style={styles.modalActions}>
            <Pressable onPress={handleClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: placeholder }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!name.trim()}
              style={[styles.addBtn, { backgroundColor: name.trim() ? tint : inputBorder }]}>
              <Text style={styles.addBtnText}>Create</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ListsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const bg = Colors[isDark ? 'dark' : 'light'].background;
  const text = Colors[isDark ? 'dark' : 'light'].text;
  const tint = Colors[isDark ? 'dark' : 'light'].tint;
  const borderColor = isDark ? '#2D2D2D' : '#E5E7EB';

  const { entries, lists, addList } = useEntries();
  const [showAddList, setShowAddList] = useState(false);

  const totalCategorized = entries.filter(e => e.category !== null).length;

  function countFor(listId: string) {
    return entries.filter(e => e.category === listId).length;
  }

  function previewFor(listId: string): string | null {
    return entries.find(e => e.category === listId)?.text ?? null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: text }]}>Your Lists</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            {totalCategorized} {totalCategorized === 1 ? 'item' : 'items'} organized
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAddList(true)}
          style={({ pressed }) => [
            styles.addListBtn,
            { backgroundColor: tint + '22', opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.addListIcon, { color: tint }]}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={l => l.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: list }) => (
          <ListCard
            list={list}
            count={countFor(list.id)}
            preview={previewFor(list.id)}
            isDark={isDark}
            onPress={() => router.push(`/list/${list.id}`)}
          />
        )}
      />

      <AddListModal
        visible={showAddList}
        isDark={isDark}
        onClose={() => setShowAddList(false)}
        onAdd={name => addList(name)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { gap: 2 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 13 },
  addListBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addListIcon: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 16, fontWeight: '600' },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  countBadge: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  preview: { fontSize: 13, lineHeight: 18, paddingLeft: 46 },
  chevron: { fontSize: 22, paddingRight: 14 },
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
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    alignItems: 'center',
  },
  cancelBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  cancelText: { fontSize: 15 },
  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
