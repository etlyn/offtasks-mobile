import * as React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { Logo } from '@/components/branding/Logo';
import { palette } from '@/theme/colors';

import { styles } from './DashboardHeader.styles';

export interface DashboardHeaderProps {
  dayLabel: string;
  summary: string;
  caption?: string;
  onButtonPress?: () => void;
  buttonIcon?: 'menu' | 'arrow-left';
  showButton?: boolean;
}

export const DashboardHeader = ({
  dayLabel,
  summary,
  caption,
  onButtonPress,
  buttonIcon = 'menu',
  showButton = true,
}: DashboardHeaderProps) => {
  const iconName = buttonIcon === 'arrow-left' ? 'arrow-left' : 'menu';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoWrapper}>
          <Logo size={40} />
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <Text style={styles.summary}>{summary}</Text>
        </View>
        {showButton ? (
          <TouchableOpacity
            onPress={onButtonPress}
            accessibilityRole="button"
            accessibilityLabel={iconName === 'arrow-left' ? 'Go back' : 'Open navigation menu'}
            style={[styles.menuButton, !onButtonPress && styles.menuButtonDisabled]}
            activeOpacity={0.8}
            disabled={!onButtonPress}
          >
            <Feather name={iconName} size={22} color={palette.slate900} />
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButtonPlaceholder} />
        )}
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
};
