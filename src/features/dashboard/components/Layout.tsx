import * as React from 'react';
import {
  Dimensions,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useAppTheme } from '@/theme/colors';
import { BrandedRefreshControl } from '@/components/BrandedRefreshControl';

import { styles } from '../Dashboard.styles';

export interface LayoutProps {
  bottomInset: number;
  refreshing: boolean;
  onRefresh: () => void;
  onAddTask: () => void;
  showFab: boolean;
  calendar?: boolean;
  search?: boolean;
  entranceProgress?: Animated.Value;
  onScrollUp?: () => void;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
}

export const Layout = ({
  bottomInset,
  refreshing,
  onRefresh,
  onAddTask,
  showFab,
  calendar = false,
  search = false,
  entranceProgress,
  onScrollUp,
  filterBar,
  children,
}: LayoutProps) => {
  const theme = useAppTheme();
  const scrollRef = React.useRef<ScrollView>(null);
  const dragStart = React.useRef<number | null>(null);
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);

  return (
    <Animated.View
      style={[
        styles.scroll,
        entranceProgress && {
          opacity: entranceProgress.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0, 0, 1],
          }),
          transform: [
            {
              translateY: entranceProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        testID="dashboard-scroll"
        onTouchStart={event => {
          touchStart.current = {
            x: event.nativeEvent.pageX,
            y: event.nativeEvent.pageY,
          };
        }}
        onTouchEnd={() => {
          touchStart.current = null;
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
        onTouchMove={event => {
          if (!onScrollUp || !touchStart.current) return;
          const dy = touchStart.current.y - event.nativeEvent.pageY;
          const dx = Math.abs(touchStart.current.x - event.nativeEvent.pageX);
          if (dy > 36 && dy > dx * 1.2) {
            touchStart.current = null;
            dragStart.current = null;
            onScrollUp();
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }
        }}
        scrollEventThrottle={16}
        onScrollBeginDrag={event => {
          dragStart.current = event.nativeEvent.contentOffset.y;
        }}
        onScrollEndDrag={() => {
          dragStart.current = null;
        }}
        onScroll={event => {
          if (
            onScrollUp &&
            dragStart.current !== null &&
            event.nativeEvent.contentOffset.y - dragStart.current > 24
          ) {
            dragStart.current = null;
            onScrollUp();
            scrollRef.current?.scrollTo({ y: 0, animated: false });
          }
        }}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          styles.contentWithTopSpacing,
          calendar && calendarStyles.content,
          onScrollUp && { minHeight: Dimensions.get('window').height },
          { paddingBottom: bottomInset + 180 },
        ]}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustKeyboardInsets={search}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <BrandedRefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
    </Animated.View>
  );
};

const calendarStyles = StyleSheet.create({
  content: { paddingHorizontal: 24, gap: 14, paddingTop: 0 },
});
