import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Keyboard,
  StyleSheet,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DetachedSheet } from '@/components/DetachedSheet';
import { SheetHeader } from '@/components/SheetHeader';
import Feather from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useTaskCreation } from '@/navigation/TaskCreationContext';
import { TaskSearchHeader } from '@/features/dashboard/components/TaskSearch';
import { useSearchTransition } from '@/features/dashboard/components/useSearchTransition';
import { Bookmark, FileText } from 'lucide-react-native';
import {
  GentlePressable as Pressable,
  PageBackdrop,
  QuietEmpty,
} from '@/components/ProductUI';
import { useCalendarTransition } from '@/features/dashboard/components/useCalendarTransition';
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
import { NotesFilter } from './NotesFilter';
import { plannerStyles } from './Planner.styles';

export const NotesScreen = ({
  route,
}: {
  route?: { params?: { openNoteRequest?: { id: string; requestId: number } } };
}) => {
  const userId = useAuth().session?.user.id || GUEST_ID;
  const theme = useAppTheme();
  const { reduceMotion, animateLayout } = useCalendarTransition();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
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
  const titleInput = useRef<TextInput>(null);
  const [editorClosing, setEditorClosing] = useState(false);
  const dismissEditor = () => setEditorClosing(true);
  const [saving, setSaving] = useState(false);
  const handledRequest = useRef<number | null>(null);
  const openRequest = route?.params?.openNoteRequest;
  useEffect(() => {
    if (
      !openRequest ||
      loading ||
      loadError ||
      handledRequest.current === openRequest.requestId
    )
      return;
    handledRequest.current = openRequest.requestId;
    const note = notes.find(item => item.id === openRequest.id);
    if (note) setEditor({ id: note.id, title: note.title, body: note.body });
    else Alert.alert('Note unavailable', 'This note may have been removed.');
  }, [openRequest, loading, loadError, notes]);
  const [searchVisible, setSearchVisible] = useState(false);
  const search = useSearchTransition(searchVisible, reduceMotion, () =>
    setQuery(''),
  );
  const closeSearch = React.useCallback(() => {
    Keyboard.dismiss();
    setSearchVisible(false);
  }, []);
  const setNoteAction = useTaskCreation()?.setNoteAction;
  useEffect(() => {
    setNoteAction?.({
      disabled: loading || loadError || saving || !!editor,
      onPress: () => {
        Keyboard.dismiss();
        setEditor({ title: '', body: '' });
      },
    });
    return () => setNoteAction?.(null);
  }, [setNoteAction, loading, loadError, saving, editor]);
  useFocusEffect(
    React.useCallback(() => {
      const back = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!searchVisible || editor) return false;
        closeSearch();
        return true;
      });
      return () => back.remove();
    }, [searchVisible, editor, closeSearch]),
  );
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
      if (alive.current) {
        animateLayout();
        setNotes(saved);
      }
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
    if (!changed) return dismissEditor();
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: dismissEditor },
    ]);
  };

  const submit = async () => {
    if (!editor || busy.current) return;
    try {
      const next = saveNote(notes, editor, editor.id);
      if ((await persist(next)) && alive.current) dismissEditor();
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
              dismissEditor();
          },
        },
      ],
    );
  };

  const renderList = (searchPage: boolean) => (
    <FlatList
      testID={searchPage ? 'notes-search-results' : 'notes-list'}
      data={filterNotes(
        notes,
        searchPage ? query : '',
        searchPage ? false : pinnedOnly,
      )}
      keyExtractor={note => note.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 110 },
      ]}
      ListEmptyComponent={
        <View style={styles.empty}>
          {loading ? (
            <ActivityIndicator color={brand} />
          ) : (
            <>
              <QuietEmpty
                icon={FileText}
                label={
                  loadError
                    ? 'Notes could not be loaded'
                    : searchPage && query
                    ? 'No matching notes'
                    : !searchPage && pinnedOnly
                    ? 'No pinned notes'
                    : 'No notes yet'
                }
              />
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
              <Bookmark
                size={18}
                strokeWidth={1.6}
                color={item.pinned ? brand : theme.colors.textSecondary}
                fill={item.pinned ? brand : 'none'}
              />
            </Pressable>
          </View>
          <Text style={styles.date}>
            {new Date(item.updatedAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}
    />
  );

  return (
    <View style={styles.root}>
      <PageBackdrop />
      <View
        style={styles.grow}
        testID="notes-underlay"
        pointerEvents={search.mounted ? 'none' : 'auto'}
        accessibilityElementsHidden={search.mounted}
        importantForAccessibility={
          search.mounted ? 'no-hide-descendants' : 'auto'
        }
      >
        <PlannerHeader
          title="Notes"
          actions={[
            {
              icon: 'search',
              label: 'Search notes',
              onPress: () => setSearchVisible(true),
            },
          ]}
        />
        {plannerSyncProblem(userId) ? (
          <Text accessibilityRole="alert" style={styles.body}>
            {plannerSyncProblem(userId)}
          </Text>
        ) : null}
        <NotesFilter
          pinnedOnly={pinnedOnly}
          onChange={value => {
            animateLayout();
            setPinnedOnly(value);
          }}
        />
        {renderList(false)}
      </View>
      {search.mounted ? (
        <View
          testID="notes-search-overlay"
          style={StyleSheet.absoluteFill}
          accessibilityViewIsModal
          onAccessibilityEscape={closeSearch}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.colors.background,
                opacity: search.progress,
              },
            ]}
          >
            <PageBackdrop />
          </Animated.View>
          <TaskSearchHeader
            scope="notes"
            topInset={insets.top}
            value={query}
            onChange={value => {
              animateLayout();
              setQuery(value);
            }}
            onClose={closeSearch}
            progress={search.progress}
            fieldProgress={search.fieldProgress}
            ready={search.ready && !editor}
            resultCount={filterNotes(notes, query, false).length}
          />
          <Animated.View
            style={[
              styles.grow,
              {
                opacity: search.progress,
                transform: [
                  {
                    translateY: search.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {renderList(true)}
          </Animated.View>
        </View>
      ) : null}
      <DetachedSheet
        visible={!!editor && !editorClosing}
        reduceMotion={reduceMotion}
        insetTop={insets.top}
        insetBottom={insets.bottom}
        dismissLabel="Dismiss note editor"
        onClose={closeEditor}
        onShow={() => titleInput.current?.focus()}
        onDismiss={() => {
          setEditor(null);
          setEditorClosing(false);
        }}
      >
        <SheetHeader
          onClose={closeEditor}
          onSave={submit}
          closeLabel="Close note"
          saveLabel="Save note"
          busy={saving}
          disabled={!(editor?.title.trim() || editor?.body.trim())}
        />
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <TextInput
            ref={titleInput}
            selectionColor={brand}
            keyboardAppearance={theme.keyboardAppearance}
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
            selectionColor={brand}
            keyboardAppearance={theme.keyboardAppearance}
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
                { marginHorizontal: 12, marginTop: 4 },
              ]}
              onPress={remove}
            >
              <Feather name="trash-2" size={18} color={palette.danger} />
            </Pressable>
          ) : null}
        </ScrollView>
      </DetachedSheet>
    </View>
  );
};
