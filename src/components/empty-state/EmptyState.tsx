import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useAppTheme } from '@/theme/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  compact?: boolean;
}

export const EmptyState = ({
  icon = 'inbox',
  title,
  description,
  compact = false,
}: EmptyStateProps) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={22} color={theme.colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 180,
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    containerCompact: {
      minHeight: 132,
      paddingVertical: 16,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark
        ? 'rgba(148, 163, 184, 0.18)'
        : 'rgba(148, 163, 184, 0.12)',
      marginBottom: 14,
    },
    title: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    description: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textMuted,
      textAlign: 'center',
      maxWidth: 240,
    },
  });
