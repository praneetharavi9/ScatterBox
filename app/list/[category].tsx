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
import { Stack, useLocalSearchParams } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useEntries, type Entry } from '@/context/entries-context';

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({ entry, isDark, color }: { entry: Entry; isDark: boolean; color: string }) {
  const cardBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <View style={[styles.row, { backgroundColor: cardBg }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.rowContent}>
        <Text style={[styles.rowText, { color: textColor }]}>{entry.text}</Text>
        <Text style={[styles.rowTime, { color: mutedColor }]}>
          {entry.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ isDark, label }: { isDark: boolean; label: string }) {
  const mutedColor = isDark ? '#4B5563' : '#D1D5DB';
  const textColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon, { color: mutedColor }]}>◎</Text>
      <Text style={[styles.emptyTitle, { color: textColor }]}>Nothing here yet</Text>
      <Text style={[styles.emptySubtitle, { color: textColor }]}>
        Add items manually with{' '}
        <Text style={{ fontWeight: '700', color: mutedColor }}>+</Text>
        {', or dump thoughts\non the Home tab and AI will sort them into '}
        <Text style={{ fontWeight: '600' }}>{label}</Text>.
      </Text>
    </View>
  );
}

// ─── Add item modal ───────────────────────────────────────────────────────────

function AddItemModal({
  visible,
  isDark,
  label,
  color,
  onClose,
  onAdd,
}: {
  visible: boolean;
  isDark: boolean;
  label: string;
  color: string;
  onClose: () => void;
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const cardBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const inputBg = isDark ? '#2A2A2A' : '#F5F5F5';
  const inputBorder = isDark ? '#3A3A3A' : '#E5E7EB';
  const placeholder = isDark ? '#4B5563' : '#9CA3AF';

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
    onClose();
  }

  function handleClose() {
    setText('');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: cardBg }]} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Add to </Text>
            <Text style={[styles.modalTitle, { color }]}>{label}</Text>
          </View>
          <TextInput
            autoFocus
            style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
            placeholder="What needs to go here?"
            placeholderTextColor={placeholder}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            multiline
          />
          <View style={styles.modalActions}>
            <Pressable onPress={handleClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: placeholder }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!text.trim()}
              style={[
                styles.addBtn,
                { backgroundColor: text.trim() ? color : (isDark ? '#3A3A3A' : '#E5E7EB') },
              ]}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ListDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bg = Colors[isDark ? 'dark' : 'light'].background;
  const borderColor = isDark ? '#2D2D2D' : '#E5E7EB';

  const { category } = useLocalSearchParams<{ category: string }>();
  const { entries, addEntry, getList } = useEntries();

  const list = getList(category);
  const label = list?.name ?? category;
  const color = list?.color ?? '#888';

  const items = entries.filter(e => e.category === category);

  const [showAdd, setShowAdd] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen
        options={{
          title: label,
          headerTintColor: color,
          headerRight: () => (
            <Pressable
              onPress={() => setShowAdd(true)}
              style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}>
              <Text style={[styles.headerBtnText, { color }]}>+</Text>
            </Pressable>
          ),
        }}
      />

      {/* Item count subheader */}
      <View style={[styles.subheader, { borderBottomColor: borderColor }]}>
        <View style={[styles.countPill, { backgroundColor: color + '22' }]}>
          <Text style={[styles.countText, { color }]}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ItemRow entry={item} isDark={isDark} color={color} />}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={<EmptyState isDark={isDark} label={label} />}
        showsVerticalScrollIndicator={false}
      />

      <AddItemModal
        visible={showAdd}
        isDark={isDark}
        label={label}
        color={color}
        onClose={() => setShowAdd(false)}
        onAdd={text => addEntry(text, category)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBtnText: {
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  subheader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, gap: 8 },
  listContentEmpty: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  rowContent: { flex: 1, gap: 4 },
  rowText: { fontSize: 15, lineHeight: 22 },
  rowTime: { fontSize: 11 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
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
  modalHeader: { flexDirection: 'row' },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 44,
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
