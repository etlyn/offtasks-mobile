import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlannerHeader } from '@/components/navigation/PlannerHeader';
import { useAuth } from '@/providers/AuthProvider';
import { GUEST_ID } from '@/lib/localTasks';
import {
  readPlanner,
  writePlanner,
  syncPlanner,
  subscribePlanner,
  plannerSyncProblem,
} from '@/lib/plannerSync';
import { filterNotes, saveNote, type Note } from '@/lib/notes';
import { palette, useAppTheme } from '@/theme/colors';
import { plannerStyles } from './Planner.styles';

export const NotesScreen = () => {
  const userId = useAuth().session?.user.id || GUEST_ID;
  const theme = useAppTheme();
  const styles = plannerStyles(theme);
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [editor, setEditor] = useState<{
    id?: string;
    title: string;
    body: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    let active = true;
    alive.current = true;
    setLoading(true);
    setLoadError(false);
    setNotes([]);
    setEditor(null);
    readPlanner(userId, 'note')
      .then(value => {
        if (active) setNotes(value);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      alive.current = false;
    };
  }, [userId, reload]);

  useEffect(() => {
    const unsubscribe = subscribePlanner(() => {
      readPlanner(userId, 'note')
        .then(value => {
          if (alive.current) setNotes(value);
        })
        .catch(() => undefined);
    });
    void syncPlanner(userId, 'note');
    return unsubscribe;
  }, [userId, reload]);

  const persist = async (next: Note[]) => {
    if (busy.current || loading || loadError) return false;
    busy.current = true;
    setSaving(true);
    try {
      await writePlanner(userId, 'note', next, notes);
      const saved = await readPlanner(userId, 'note');
      if (alive.current) setNotes(saved);
      void syncPlanner(userId, 'note');
      return true;
    } catch {
      if (alive.current)
        Alert.alert(
          'Could not save notes',
          'Your changes were not saved. Please try again.',
        );
      return false;
    } finally {
      busy.current = false;
      if (alive.current) setSaving(false);
    }
  };

  const closeEditor = () => {
    if (busy.current) return;
    const original = notes.find(note => note.id === editor?.id);
    const changed =
      editor &&
      (editor.title !== (original?.title || '') ||
        editor.body !== (original?.body || ''));
    if (!changed) return setEditor(null);
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => setEditor(null) },
    ]);
  };

  const submit = async () => {
    if (!editor || busy.current) return;
    try {
      const next = saveNote(notes, editor, editor.id);
      if ((await persist(next)) && alive.current) setEditor(null);
    } catch (error) {
      Alert.alert('Could not save note', (error as Error).message);
    }
  };

  const remove = () => {
    if (!editor?.id || busy.current) return;
    const id = editor.id;
    Alert.alert(
      'Delete note?',
      userId === GUEST_ID
        ? 'This note will be removed from this device.'
        : 'This note will be removed from your account when synced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (
              (await persist(notes.filter(note => note.id !== id))) &&
              alive.current
            )
              setEditor(null);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <PlannerHeader
        title="Notes"
        actions={[
          {
            icon: 'plus',
            label: 'Add note',
            disabled: loading || loadError || saving,
            onPress: () => setEditor({ title: '', body: '' }),
          },
        ]}
      />
      {plannerSyncProblem(userId) ? (
        <Text accessibilityRole="alert" style={styles.body}>
          {plannerSyncProblem(userId)}
        </Text>
      ) : null}
      <View style={styles.search}>
        <Feather name="search" size={18} color={theme.colors.textMuted} />
        <TextInput
          accessibilityLabel="Search notes"
          placeholder="Search notes"
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          autoCorrect={false}
        />
        {query ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear note search"
            style={styles.iconButton}
            onPress={() => setQuery('')}
          >
            <Feather name="x" size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.segments}>
        {['All', 'Pinned'].map((label, index) => (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: pinnedOnly === !!index }}
            style={[
              styles.segment,
              pinnedOnly === !!index && styles.activeSegment,
            ]}
            onPress={() => setPinnedOnly(!!index)}
          >
            <Text
              style={[
                styles.body,
                pinnedOnly === !!index && styles.activeLabel,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filterNotes(notes, query, pinnedOnly)}
        keyExtractor={note => note.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color={palette.mint} />
            ) : (
              <>
                <Feather
                  name="file-text"
                  size={32}
                  color={theme.colors.textMuted}
                />
                <Text style={styles.body}>
                  {loadError
                    ? 'Notes could not be loaded'
                    : query
                    ? 'No matching notes'
                    : pinnedOnly
                    ? 'No pinned notes'
                    : 'No notes yet'}
                </Text>
                {loadError ? (
                  <Pressable
                    accessibilityRole="button"
                    style={styles.save}
                    onPress={() => setReload(value => value + 1)}
                  >
                    <Text style={styles.saveText}>Retry</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open note ${item.title}`}
                style={styles.grow}
                onPress={() =>
                  setEditor({ id: item.id, title: item.title, body: item.body })
                }
              >
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.body ? (
                  <Text style={styles.body} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.pinned ? 'Unpin' : 'Pin'} ${
                  item.title
                }`}
                accessibilityState={{ selected: item.pinned, disabled: saving }}
                disabled={saving}
                style={styles.iconButton}
                onPress={() =>
                  persist(
                    notes.map(note =>
                      note.id === item.id
                        ? { ...note, pinned: !note.pinned }
                        : note,
                    ),
                  )
                }
              >
                <Feather
                  name="bookmark"
                  size={20}
                  color={item.pinned ? palette.mint : theme.colors.textMuted}
                />
              </Pressable>
            </View>
            <Text style={styles.date}>
              Edited{' '}
              {new Date(item.updatedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
      />
      <Modal
        visible={!!editor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEditor}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close note"
              disabled={saving}
              style={styles.iconButton}
              onPress={closeEditor}
            >
              <Feather name="x" size={22} color={theme.colors.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editor?.id ? 'Edit note' : 'New note'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save note"
              disabled={
                saving || !(editor?.title.trim() || editor?.body.trim())
              }
              onPress={submit}
              style={[
                styles.save,
                (saving || !(editor?.title.trim() || editor?.body.trim())) &&
                  styles.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={palette.mint} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </Pressable>
          </View>
          <TextInput
            accessibilityLabel="Note title"
            placeholder="Title"
            placeholderTextColor={theme.colors.textMuted}
            value={editor?.title || ''}
            onChangeText={title =>
              setEditor(value => value && { ...value, title })
            }
            style={styles.editorTitle}
            maxLength={200}
            editable={!saving}
          />
          <TextInput
            accessibilityLabel="Note body"
            placeholder="Note"
            placeholderTextColor={theme.colors.textMuted}
            value={editor?.body || ''}
            onChangeText={body =>
              setEditor(value => value && { ...value, body })
            }
            style={styles.editorBody}
            multiline
            editable={!saving}
          />
          {editor?.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete note"
              disabled={saving}
              style={[
                styles.iconButton,
                { margin: 18, marginBottom: insets.bottom + 12 },
              ]}
              onPress={remove}
            >
              <Feather name="trash-2" size={22} color={palette.danger} />
            </Pressable>
          ) : null}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
