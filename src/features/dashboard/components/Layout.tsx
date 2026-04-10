import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { palette, useAppTheme } from '@/theme/colors';

import { styles } from '../Dashboard.styles';

export interface LayoutProps {
  bottomInset: number;
  loading: boolean;
  onRefresh: () => void;
  onAddTask: () => void;
  showFab: boolean;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
}

export const Layout = ({
  bottomInset,
  loading,
  onRefresh,
  onAddTask,
  showFab,
  filterBar,
  children,
}: LayoutProps) => {
  const theme = useAppTheme();

  return (
    <View style={styles.scroll}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          styles.contentWithTopSpacing,
          { paddingBottom: bottomInset + 180 },
        ]}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={palette.mint}
            colors={[palette.mint]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
      >
        {filterBar}
        {children}
      </ScrollView>

      {showFab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add task"
          style={({ pressed }) => [
            styles.fab,
            { bottom: bottomInset + 100 },
            pressed && styles.fabPressed,
          ]}
          onPress={onAddTask}
        >
          <Feather name="plus" size={24} color={theme.colors.textInverse} />
        </Pressable>
      ) : null}
    </View>
  );
};
