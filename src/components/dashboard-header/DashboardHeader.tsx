import * as React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

import { Logo } from '@/components/branding/Logo';
import { palette } from '@/theme/colors';

import { styles } from './DashboardHeader.styles';

export interface DashboardHeaderProps {
  dayLabel: string;
  summary: string;
  caption?: string;
}

export const DashboardHeader = ({ dayLabel, summary, caption }: DashboardHeaderProps) => {
  const navigation = useNavigation();

  const handleToggleDrawer = React.useCallback(() => {
    navigation.dispatch(DrawerActions.toggleDrawer());
  }, [navigation]);

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
        <TouchableOpacity
          onPress={handleToggleDrawer}
          accessibilityRole="button"
          accessibilityLabel="Open navigation menu"
          style={styles.menuButton}
          activeOpacity={0.8}
        >
          <Feather name="menu" size={22} color={palette.slate900} />
        </TouchableOpacity>
      </View>

      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
};
