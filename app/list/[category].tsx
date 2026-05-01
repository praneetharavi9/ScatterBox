import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useEntries, type Entry } from '@/context/entries-context';

// ─── 3-dot menu (bottom sheet) ────────────────────────────────────────────────

function EntryMenuSheet({
  entry,
  isDark,
  currentCategory,
  onEdit,
  onDelete,
  onMoveTo,
  onClose,
}: {
  entry: Entry | null;
  isDark: boolean;
  currentCategory: string;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onMoveTo: (id: string, category: string) => void;
  onClose: () => void;
}) {
  const { lists } = useEntries();
  const sheetBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const borderColor = isDark ? '#2D2D2D' : '#E5E7EB';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  if (!entry) return null;
  const otherLists = lists.filter(l => l.id !== currentCategory);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <Pressable style={[styles.menuSheet, { backgroundColor: sheetBg }]} onPress={() => {}}>
          <View style={[styles.menuHandle, { backgroundColor: borderColor }]} />
          <Pressable style={styles.menuItem} onPress={() => { onEdit(); onClose(); }}>
            <Text style={[styles.menuItemText, { color: textColor }]}>Edit</Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: borderColor }]} />
          <Pressable style={styles.menuItem} onPress={() => { onDelete(entry.id); onClose(); }}>
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete</Text>
          </Pressable>
          {otherLists.length > 0 && (
            <>
              <View style={[styles.menuDivider, { backgroundColor: borderColor }]} />
              <Text style={[styles.menuSectionLabel, { color: mutedColor }]}>Move to</Text>
              <ScrollView style={styles.menuListScroll} bounces={false}>
                {otherLists.map(list => (
                  <Pressable
                    key={list.id}
                    style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.6 : 1 }]}
                    onPress={() => { onMoveTo(entry.id, list.id); onClose(); }}>
                    <View style={[styles.menuListDot, { backgroundColor: list.color }]} />
                    <Text style={[styles.menuItemText, { color: textColor }]}>{list.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Multi-select move-to sheet ───────────────────────────────────────────────

function MoveToSheet({
  isDark,
  currentCategory,
  onMoveTo,
  onClose,
}: {
  isDark: boolean;
  currentCategory: string;
  onMoveTo: (category: string) => void;
  onClose: () => void;
}) {
  const { lists } = useEntries();
  const sheetBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const borderColor = isDark ? '#2D2D2D' : '#E5E7EB';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  const otherLists = lists.filter(l => l.id !== currentCategory);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <Pressable style={[styles.menuSheet, { backgroundColor: sheetBg }]} onPress={() => {}}>
          <View style={[styles.menuHandle, { backgroundColor: borderColor }]} />
          <Text style={[styles.menuSectionLabel, { color: mutedColor, paddingBottom: 8 }]}>Move selected to</Text>
          <ScrollView style={styles.menuListScroll} bounces={false}>
            {otherLists.map(list => (
              <Pressable
                key={list.id}
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.6 : 1 }]}
                onPress={() => { onMoveTo(list.id); onClose(); }}>
                <View style={[styles.menuListDot, { backgroundColor: list.color }]} />
                <Text style={[styles.menuItemText, { color: textColor }]}>{list.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────────

function ItemRow({
  entry,
  isDark,
  color,
  selecting,
  selected,
  onPress,
  onLongPress,
  onMenuPress,
}: {
  entry: Entry;
  isDark: boolean;
  color: string;
  selecting: boolean;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onMenuPress: () => void;
}) {
  const cardBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const selectedBg = isDark ? '#1A2E1A' : '#F0FDF4';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: selected ? selectedBg : cardBg },
        pressed && { opacity: 0.7 },
      ]}>
      {selecting ? (
        <View style={[
          styles.checkbox,
          selected
            ? { backgroundColor: '#22C55E', borderColor: '#22C55E' }
            : { backgroundColor: 'transparent', borderColor: mutedColor },
        ]}>
          {selected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      ) : (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <View style={styles.rowContent}>
        <Text style={[styles.rowText, { color: textColor }]}>{entry.text}</Text>
        <Text style={[styles.rowTime, { color: mutedColor }]}>
          {entry.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!selecting && (
        <Pressable
          onPress={onMenuPress}
          hitSlop={12}
          style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.5 : 1 }]}>
          <Text style={[styles.menuBtnText, { color: mutedColor }]}>⋯</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

// ─── Selection action bar ─────────────────────────────────────────────────────

function SelectionBar({
  count,
  isDark,
  canEdit,
  onEdit,
  onDelete,
  onMoveTo,
  onCancel,
}: {
  count: number;
  isDark: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveTo: () => void;
  onCancel: () => void;
}) {
  const barBg = isDark ? '#1E1E1E' : '#fff';
  const borderColor = isDark ? '#2D2D2D' : '#E5E7EB';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const mutedColor = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <View style={[styles.selectionBar, { backgroundColor: barBg, borderTopColor: borderColor }]}>
      <Pressable onPress={onCancel} style={styles.selBarCancel}>
        <Text style={[styles.selBarCancelText, { color: mutedColor }]}>Cancel</Text>
      </Pressable>
      <Text style={[styles.selBarCount, { color: textColor }]}>
        {count} selected
      </Text>
      <View style={styles.selBarActions}>
        {canEdit && (
          <Pressable onPress={onEdit} style={styles.selBarBtn}>
            <Text style={[styles.selBarBtnText, { color: textColor }]}>Edit</Text>
          </Pressable>
        )}
        <Pressable onPress={onMoveTo} style={styles.selBarBtn}>
          <Text style={[styles.selBarBtnText, { color: textColor }]}>Move</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.selBarBtn, styles.selBarDelete]}>
          <Text style={[styles.selBarBtnText, { color: '#EF4444' }]}>Delete</Text>
        </Pressable>
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
  visible, isDark, label, color, onClose, onAdd,
}: {
  visible: boolean; isDark: boolean; label: string; color: string;
  onClose: () => void; onAdd: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const cardBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const inputBg = isDark ? '#2A2A2A' : '#F5F5F5';
  const inputBorder = isDark ? '#3A3A3A' : '#E5E7EB';
  const placeholder = isDark ? '#4B5563' : '#9CA3AF';

  function handleAdd() {
    if (!text.trim()) return;
    onAdd(text.trim()); setText(''); onClose();
  }
  function handleClose() { setText(''); onClose(); }

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
              style={[styles.addBtn, { backgroundColor: text.trim() ? color : (isDark ? '#3A3A3A' : '#E5E7EB') }]}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Edit item modal ──────────────────────────────────────────────────────────

function EditItemModal({
  entry, isDark, color, onSave, onClose,
}: {
  entry: Entry | null; isDark: boolean; color: string;
  onSave: (id: string, text: string) => void; onClose: () => void;
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
          <Text style={[styles.modalTitle, { color: textColor }]}>Edit item</Text>
          <TextInput
            autoFocus
            style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
            placeholderTextColor={placeholder}
            value={text}
            onChangeText={setText}
            multiline
          />
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: placeholder }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => { if (text.trim()) { onSave(entry.id, text.trim()); onClose(); } }}
              disabled={!text.trim()}
              style={[styles.addBtn, { backgroundColor: text.trim() ? color : (isDark ? '#3A3A3A' : '#E5E7EB') }]}>
              <Text style={styles.addBtnText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── List menu sheet ─────────────────────────────────────────────────────────

function ListMenuSheet({
  isDark,
  isBuiltIn,
  onRename,
  onDeleteAll,
  onDeleteList,
  onClose,
}: {
  isDark: boolean;
  isBuiltIn: boolean;
  onRename: () => void;
  onDeleteAll: () => void;
  onDeleteList: () => void;
  onClose: () => void;
}) {
  const sheetBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const borderColor = isDark ? '#2D2D2D' : '#E5E7EB';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <Pressable style={[styles.menuSheet, { backgroundColor: sheetBg }]} onPress={() => {}}>
          <View style={[styles.menuHandle, { backgroundColor: borderColor }]} />
          {!isBuiltIn && (
            <>
              <Pressable style={styles.menuItem} onPress={() => { onRename(); onClose(); }}>
                <Text style={[styles.menuItemText, { color: textColor }]}>Rename</Text>
              </Pressable>
              <View style={[styles.menuDivider, { backgroundColor: borderColor }]} />
            </>
          )}
          <Pressable style={styles.menuItem} onPress={() => { onDeleteAll(); onClose(); }}>
            <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete all items</Text>
          </Pressable>
          {!isBuiltIn && (
            <>
              <View style={[styles.menuDivider, { backgroundColor: borderColor }]} />
              <Pressable style={styles.menuItem} onPress={() => { onDeleteList(); onClose(); }}>
                <Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete list</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Rename modal ─────────────────────────────────────────────────────────────

function RenameModal({
  visible,
  isDark,
  currentName,
  color,
  onSave,
  onClose,
}: {
  visible: boolean;
  isDark: boolean;
  currentName: string;
  color: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  const cardBg = isDark ? '#1E1E1E' : '#fff';
  const textColor = isDark ? '#ECEDEE' : '#11181C';
  const inputBg = isDark ? '#2A2A2A' : '#F5F5F5';
  const inputBorder = isDark ? '#3A3A3A' : '#E5E7EB';
  const placeholder = isDark ? '#4B5563' : '#9CA3AF';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: cardBg }]} onPress={() => {}}>
          <Text style={[styles.modalTitle, { color: textColor }]}>Rename list</Text>
          <TextInput
            autoFocus
            style={[styles.modalInput, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
            placeholder="List name"
            placeholderTextColor={placeholder}
            value={name}
            onChangeText={setName}
            onSubmitEditing={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
            returnKeyType="done"
          />
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: placeholder }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => { if (name.trim()) { onSave(name.trim()); onClose(); } }}
              disabled={!name.trim()}
              style={[styles.addBtn, { backgroundColor: name.trim() ? color : (isDark ? '#3A3A3A' : '#E5E7EB') }]}>
              <Text style={styles.addBtnText}>Save</Text>
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
  const router = useRouter();
  const { entries, addEntry, updateEntryText, updateEntryCategory, deleteEntry, renameList, deleteList, getList } = useEntries();

  const list = getList(category);
  const label = list?.name ?? category;
  const color = list?.color ?? '#888';
  const items = entries.filter(e => e.category === category);

  // List-level state
  const [showListMenu, setShowListMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);

  // Single-item state
  const [showAdd, setShowAdd] = useState(false);
  const [menuEntry, setMenuEntry] = useState<Entry | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMoveToSheet, setShowMoveToSheet] = useState(false);
  const isSelecting = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleItemPress(entry: Entry) {
    if (isSelecting) toggleSelect(entry.id);
    else setMenuEntry(entry);
  }

  function handleLongPress(entry: Entry) {
    if (!isSelecting) setSelectedIds(new Set([entry.id]));
    else toggleSelect(entry.id);
  }

  function cancelSelection() {
    setSelectedIds(new Set());
  }

  async function handleDeleteSelected() {
    await Promise.all([...selectedIds].map(id => deleteEntry(id)));
    setSelectedIds(new Set());
  }

  async function handleDeleteAll() {
    await Promise.all(items.map(e => deleteEntry(e.id)));
  }

  async function handleDeleteList() {
    await deleteList(category);
    router.back();
  }

  async function handleMoveSelected(targetCategory: string) {
    await Promise.all([...selectedIds].map(id => updateEntryCategory(id, targetCategory)));
    setSelectedIds(new Set());
  }

  const selectedEntry = selectedIds.size === 1
    ? items.find(e => selectedIds.has(e.id)) ?? null
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <Stack.Screen
        options={{
          title: isSelecting ? `${selectedIds.size} selected` : label,
          headerTintColor: color,
          headerRight: () => !isSelecting ? (
            <View style={styles.headerBtns}>
              <Pressable
                onPress={() => setShowAdd(true)}
                style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[styles.headerBtnText, { color }]}>+</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowListMenu(true)}
                style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}>
                <Text style={[styles.headerBtnText, { color }]}>⋯</Text>
              </Pressable>
            </View>
          ) : null,
        }}
      />

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
        renderItem={({ item }) => (
          <ItemRow
            entry={item}
            isDark={isDark}
            color={color}
            selecting={isSelecting}
            selected={selectedIds.has(item.id)}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleLongPress(item)}
            onMenuPress={() => setMenuEntry(item)}
          />
        )}
        contentContainerStyle={[styles.listContent, items.length === 0 && styles.listContentEmpty]}
        ListEmptyComponent={<EmptyState isDark={isDark} label={label} />}
        showsVerticalScrollIndicator={false}
      />

      {isSelecting && (
        <SelectionBar
          count={selectedIds.size}
          isDark={isDark}
          canEdit={selectedIds.size === 1}
          onEdit={() => setEditingEntry(selectedEntry)}
          onDelete={handleDeleteSelected}
          onMoveTo={() => setShowMoveToSheet(true)}
          onCancel={cancelSelection}
        />
      )}

      <AddItemModal
        visible={showAdd} isDark={isDark} label={label} color={color}
        onClose={() => setShowAdd(false)}
        onAdd={text => addEntry(text, category)}
      />

      <EntryMenuSheet
        entry={menuEntry} isDark={isDark} currentCategory={category}
        onEdit={() => setEditingEntry(menuEntry)}
        onDelete={id => deleteEntry(id)}
        onMoveTo={(id, cat) => updateEntryCategory(id, cat)}
        onClose={() => setMenuEntry(null)}
      />

      <EditItemModal
        entry={editingEntry} isDark={isDark} color={color}
        onSave={(id, text) => updateEntryText(id, text)}
        onClose={() => { setEditingEntry(null); setSelectedIds(new Set()); }}
      />

      {showMoveToSheet && (
        <MoveToSheet
          isDark={isDark} currentCategory={category}
          onMoveTo={handleMoveSelected}
          onClose={() => setShowMoveToSheet(false)}
        />
      )}

      {showListMenu && (
        <ListMenuSheet
          isDark={isDark}
          isBuiltIn={list?.isBuiltIn ?? true}
          onRename={() => setShowRename(true)}
          onDeleteAll={handleDeleteAll}
          onDeleteList={handleDeleteList}
          onClose={() => setShowListMenu(false)}
        />
      )}

      <RenameModal
        visible={showRename}
        isDark={isDark}
        currentName={label}
        color={color}
        onSave={name => renameList(list?.id ?? category, name)}
        onClose={() => setShowRename(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  headerBtnText: { fontSize: 28, fontWeight: '300', lineHeight: 32 },
  subheader: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countPill: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  countText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, gap: 8 },
  listContentEmpty: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, padding: 14, gap: 12,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  rowContent: { flex: 1, gap: 4 },
  rowText: { fontSize: 15, lineHeight: 22 },
  rowTime: { fontSize: 11 },
  menuBtn: { padding: 4 },
  menuBtnText: { fontSize: 20, letterSpacing: 1 },
  // Selection bar
  selectionBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  selBarCancel: { paddingVertical: 4, paddingRight: 4 },
  selBarCancelText: { fontSize: 14 },
  selBarCount: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  selBarActions: { flexDirection: 'row', gap: 4 },
  selBarBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  selBarDelete: {},
  selBarBtnText: { fontSize: 14, fontWeight: '500' },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  // Bottom sheet
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  menuSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, paddingTop: 12 },
  menuHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  menuItemText: { fontSize: 16 },
  menuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 20 },
  menuSectionLabel: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  menuListScroll: { maxHeight: 240 },
  menuListDot: { width: 10, height: 10, borderRadius: 5 },
  // Modals
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  modalCard: { width: '100%', borderRadius: 16, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row' },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 44,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, alignItems: 'center' },
  cancelBtn: { paddingHorizontal: 4, paddingVertical: 6 },
  cancelText: { fontSize: 15 },
  addBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
