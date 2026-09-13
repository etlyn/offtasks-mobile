import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/colors';

export function CalendarYearPicker({
  year,
  onSelect,
  onClose,
  reduceMotion,
}: {
  year: number;
  onSelect: (year: number) => void;
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [firstYear, setFirstYear] = useState(Math.floor(year / 12) * 12);
  const accent = theme.isDark ? '#D8F3E5' : '#152D25';
  const contrast = theme.isDark ? '#101916' : '#FFFFFF';
  const sheetBackground = theme.isDark ? '#1B211F' : '#FAFCFB';
  return (
    <Modal
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss year picker"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          style={[
            s.sheet,
            {
              backgroundColor: sheetBackground,
              paddingBottom: Math.max(insets.bottom, 16),
              maxHeight: height * 0.7,
            },
          ]}
        >
          <View style={s.titleRow}>
            <Text
              accessibilityRole="header"
              style={[s.title, { color: theme.colors.textPrimary }]}
            >
              Choose year
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close year picker"
              onPress={onClose}
              style={s.control}
            >
              <X size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          <View style={s.rangeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous 12 years"
              disabled={firstYear <= 1900}
              onPress={() => setFirstYear(value => value - 12)}
              style={({ pressed }) => [
                s.control,
                (pressed || firstYear <= 1900) && s.dimmed,
              ]}
            >
              <ChevronLeft size={18} color={theme.colors.textPrimary} />
            </Pressable>
            <Text style={[s.range, { color: theme.colors.textSecondary }]}>
              {Math.max(1900, firstYear)}–{Math.min(2199, firstYear + 11)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next 12 years"
              disabled={firstYear + 11 >= 2199}
              onPress={() => setFirstYear(value => value + 12)}
              style={({ pressed }) => [
                s.control,
                (pressed || firstYear + 11 >= 2199) && s.dimmed,
              ]}
            >
              <ChevronRight size={18} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView bounces={false}>
            <View style={s.grid}>
              {Array.from({ length: 12 }, (_, index) => firstYear + index)
                .filter(value => value >= 1900 && value <= 2199)
                .map(value => (
                  <View key={value} style={s.cell}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Choose ${value}`}
                      accessibilityState={{ selected: value === year }}
                      onPress={() => onSelect(value)}
                      style={({ pressed }) => [
                        s.year,
                        {
                          backgroundColor:
                            value === year
                              ? accent
                              : theme.isDark
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(21,45,37,0.045)',
                        },
                        pressed && s.dimmed,
                      ]}
                    >
                      <Text
                        style={[
                          s.yearText,
                          {
                            color:
                              value === year
                                ? contrast
                                : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  </View>
                ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 17, fontWeight: '600' },
  control: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  range: { fontSize: 13, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '25%', padding: 4 },
  year: {
    minHeight: 44,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: { fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  dimmed: { opacity: 0.45 },
});
