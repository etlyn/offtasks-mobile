import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useAppTheme } from '@/theme/colors';

import { createStyles } from './DashboardHeader.styles';

export interface DashboardHeaderProps {
  dayLabel: string;
  summary: string;
  caption?: string;
  onButtonPress?: () => void;
  onSearchPress?: () => void;
  buttonIcon?: 'menu' | 'arrow-left';
  showButton?: boolean;
  showSearch?: boolean;
}

export const DashboardHeader = ({
  dayLabel: _dayLabel,
  summary,
  caption,
  onButtonPress,
  onSearchPress,
  buttonIcon = 'menu',
  showButton = true,
  showSearch = true,
}: DashboardHeaderProps) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const iconName = buttonIcon === 'arrow-left' ? 'arrow-left' : 'menu';
  const [completedSummary = summary, totalSummary] = summary
    .split('/')
    .map(value => value.trim());

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {showButton ? (
          <Pressable
            onPress={onButtonPress}
            accessibilityRole="button"
            accessibilityLabel={
              iconName === 'arrow-left' ? 'Go back' : 'Open navigation menu'
            }
            style={({ pressed }) => [
              styles.iconButton,
              !onButtonPress && styles.iconButtonDisabled,
              pressed && onButtonPress && styles.iconButtonPressed,
            ]}
            disabled={!onButtonPress}
          >
            <Feather
              name={iconName}
              size={19}
              color={theme.colors.iconPrimary}
            />
          </Pressable>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}

        <View style={styles.centerContent}>
          <Text style={styles.summary}>
            <Text style={styles.summaryValue}>{completedSummary}</Text>
            {typeof totalSummary === 'string' ? (
              <Text style={styles.summaryMuted}>{` / ${totalSummary}`}</Text>
            ) : null}
          </Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>

        {showSearch ? (
          <Pressable
            onPress={onSearchPress}
            accessibilityRole="button"
            accessibilityLabel="Open task search"
            style={({ pressed }) => [
              styles.iconButton,
              !onSearchPress && styles.iconButtonDisabled,
              pressed && onSearchPress && styles.iconButtonPressed,
            ]}
            disabled={!onSearchPress}
          >
            <Feather name="search" size={18} color={theme.colors.iconPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>
    </View>
  );
};
