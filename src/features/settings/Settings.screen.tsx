import React from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/branding/Logo';
import { TopBar } from '@/components/navigation/TopBar';
import { TaskList } from '@/components/task-quick-list';
import { appVersion } from '@/lib/appVersion';
import { getToday } from '@/hooks/useDate';
import { supabaseClient, updateTask } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useTasks } from '@/providers/TasksProvider';
import { useAppTheme } from '@/theme/colors';
import { filterTasksForSearch, getTaskSearchContext } from '@/utils/taskSearch';

import { createStyles } from './Settings.styles';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { tasks, refresh, loading, applyTaskUpdate } = useTasks();
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const searchInputRef = React.useRef<TextInput | null>(null);
  const [searchVisible, setSearchVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const allTasks = React.useMemo(() => Object.values(tasks).flat(), [tasks]);
  const searchResults = React.useMemo(
    () => filterTasksForSearch(allTasks, searchQuery),
    [allTasks, searchQuery],
  );
  const hasSearchQuery = searchQuery.trim().length > 0;

  const handleSignOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert('Sign out failed', (error as Error).message);
    }
  };

  const handleCloseSearch = React.useCallback(() => {
    setSearchQuery('');
    setSearchVisible(false);
    Keyboard.dismiss();
  }, []);

  const handleToggleSearch = React.useCallback(() => {
    if (searchVisible) {
      handleCloseSearch();
      return;
    }

    setSearchVisible(true);
  }, [handleCloseSearch, searchVisible]);

  const handleToggleTask = React.useCallback(
    async (task: (typeof allTasks)[number]) => {
      const nextComplete = !task.isComplete;
      const today = getToday();
      const updates = {
        isComplete: nextComplete,
        completed_at: nextComplete ? today : null,
        target_group: nextComplete ? 'today' : task.target_group,
        date: nextComplete ? today : task.date,
      };

      applyTaskUpdate(task.id, updates);

      try {
        await updateTask(task.id, updates);
      } catch (error) {
        await refresh();
        throw error;
      }
    },
    [applyTaskUpdate, refresh],
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor="transparent"
      />

      <TopBar
        topInset={insets.top}
        titlePrimary="Settings"
        subtitle="Offtasks preferences"
        searchVisible={searchVisible}
        searchValue={searchQuery}
        searchPlaceholder="Search all tasks"
        onSearchChangeText={setSearchQuery}
        onSearchToggle={handleToggleSearch}
        onSearchClose={handleCloseSearch}
        inputRef={searchInputRef}
        leftAction={{
          icon: 'menu',
          label: 'Open navigation menu',
          onPress: () => navigation.dispatch(DrawerActions.openDrawer()),
        }}
      />

      <ScrollView
        style={styles.scroll}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          styles.contentWithTopSpacing,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {searchVisible ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Search results</Text>
            <TaskList
              tasks={hasSearchQuery ? searchResults : []}
              onToggle={handleToggleTask}
              getSecondaryText={task => getTaskSearchContext(task)}
              loading={loading && allTasks.length === 0}
              emptyTitle={
                hasSearchQuery ? 'No matching tasks' : 'Start typing to search'
              }
              emptyDescription={
                hasSearchQuery
                  ? 'Try a different search term.'
                  : 'Results will appear once you enter a search term.'
              }
            />
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <Logo size={64} />
              <Text style={styles.heroTitle}>Offtasks preferences</Text>
              <Text style={styles.heroSubtitle}>
                Tune the mobile experience and manage your account.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              <View style={styles.row}>
                <View>
                  <Text style={styles.rowLabel}>Email</Text>
                  <Text style={styles.rowValue}>
                    {session?.user?.email ?? 'Unknown user'}
                  </Text>
                </View>
              </View>
              <View style={[styles.row, styles.rowSpacing]}>
                <View>
                  <Text style={styles.rowLabel}>Sync status</Text>
                  <Text style={styles.rowValue}>Connected to Supabase</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSignOut}
              >
                <Text style={styles.primaryButtonText}>Sign out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Support</Text>
              <View style={styles.row}>
                <View>
                  <Text style={styles.rowLabel}>Need a hand?</Text>
                  <Text style={styles.rowValue}>
                    Visit offtasks.com/support
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.versionText}>{`Version ${appVersion}`}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
};
