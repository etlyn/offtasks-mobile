import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GentlePressable as Pressable } from '@/components/ProductUI';
import { useAppTheme } from '@/theme/colors';

/** Drawer handoff tokens; the planner keeps its existing theme and backdrop. */
export function useDrawerPalette() {
  const theme = useAppTheme();
  return React.useMemo(
    () => ({
      surface: theme.isDark ? '#101916' : theme.colors.surface,
      text: theme.colors.textPrimary,
      secondary: theme.colors.textSecondary,
      muted: theme.colors.textMuted,
      brand: theme.isDark ? '#D8F3E5' : '#152D25',
      inverse: theme.isDark ? '#101916' : '#FFFFFF',
      soft: theme.isDark ? 'rgba(216,243,229,0.06)' : 'rgba(21,45,37,0.04)',
      divider: theme.isDark ? 'rgba(216,243,229,0.1)' : 'rgba(21,45,37,0.1)',
      input: theme.isDark ? 'rgba(216,243,229,0.06)' : 'rgba(21,45,37,0.04)',
      danger: theme.isDark ? '#F4A5A5' : '#A83E3E',
      overlay: theme.colors.overlay,
    }),
    [theme],
  );
}

export function DrawerDestination({
  title,
  onBack,
  children,
  footer,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const colors = useDrawerPalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { backgroundColor: colors.surface }]}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={s.back}
        >
          <ArrowLeft size={18} strokeWidth={1.7} color={colors.brand} />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={[s.heading, { color: colors.text }]}
        >
          {title}
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingBottom: Math.max(insets.bottom, 16) + (footer ? 58 : 24) },
        ]}
      >
        {children}
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </ScrollView>
    </View>
  );
}

export function FlowActionRow({
  icon: Icon,
  title,
  detail,
  onPress,
  disabled,
  chevron,
  danger,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  onPress: () => void;
  disabled?: boolean;
  chevron?: boolean;
  danger?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useDrawerPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[s.row, detail ? s.detailedRow : null]}
    >
      <View
        style={[s.icon, { backgroundColor: colors.soft }]}
        accessible={false}
      >
        <Icon size={18} strokeWidth={1.7} color={colors.brand} />
      </View>
      <View style={s.rowText}>
        <Text
          style={[s.rowTitle, { color: danger ? colors.danger : colors.text }]}
        >
          {title}
        </Text>
        {detail ? (
          <Text style={[s.detail, { color: colors.secondary }]}>{detail}</Text>
        ) : null}
      </View>
      {chevron ? (
        <ChevronRight size={14} strokeWidth={1.7} color={colors.brand} />
      ) : null}
    </Pressable>
  );
}

export function FlowNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const colors = useDrawerPalette();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[s.notice, { backgroundColor: colors.soft }]}
    >
      <Text style={[s.noticeTitle, { color: colors.text }]}>{title}</Text>
      {typeof children === 'string' ? (
        <Text style={[s.noticeDetail, { color: colors.secondary }]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export function FlowButton({
  title,
  onPress,
  disabled,
  secondary,
  danger,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
  accessibilityLabel?: string;
}) {
  const colors = useDrawerPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        { backgroundColor: secondary ? colors.soft : colors.brand },
      ]}
    >
      <Text
        style={[
          s.buttonText,
          {
            color: danger
              ? colors.danger
              : secondary
              ? colors.text
              : colors.inverse,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, fontSize: 17, lineHeight: 22, fontWeight: '600' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28 },
  footer: { marginTop: 'auto', paddingTop: 32 },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  detailedRow: { minHeight: 60 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  detail: { fontSize: 12, lineHeight: 16 },
  notice: { padding: 16, borderRadius: 16, gap: 8 },
  noticeTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  noticeDetail: { fontSize: 13, lineHeight: 20 },
  button: {
    minHeight: 44,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});
