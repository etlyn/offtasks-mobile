import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { GentlePressable as Pressable } from './ProductUI';
import { useAppTheme } from '@/theme/colors';

/** One quiet dismiss control and one primary action; the field supplies context. */
export function SheetHeader({
  onClose,
  onSave,
  closeLabel,
  saveLabel,
  action = 'Save',
  busy,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  closeLabel: string;
  saveLabel: string;
  action?: string;
  busy: boolean;
  disabled: boolean;
}) {
  const theme = useAppTheme();
  const brand = theme.isDark ? '#D8F3E5' : '#152D25';
  const contrast = theme.isDark ? '#101916' : '#FFFFFF';
  return (
    <>
      <View style={s.grabberArea}>
        <View style={[s.grabber, { backgroundColor: theme.colors.border }]} />
      </View>
      <View style={s.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          disabled={busy}
          onPress={onClose}
          style={s.close}
        >
          <View
            style={[
              s.closeDisc,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(216,243,229,0.08)'
                  : 'rgba(21,45,37,0.05)',
              },
            ]}
          >
            <X size={18} strokeWidth={1.7} color={brand} />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          disabled={disabled || busy}
          onPress={onSave}
          style={[
            s.save,
            { backgroundColor: brand },
            (disabled || busy) && s.disabled,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={contrast} />
          ) : (
            <Text style={[s.label, { color: contrast }]}>{action}</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}
const s = StyleSheet.create({
  grabberArea: { height: 15, justifyContent: 'center', alignItems: 'center' },
  grabber: { width: 28, height: 3, borderRadius: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 44,
    marginBottom: 4,
  },
  close: {
    width: 44,
    height: 44,
    marginLeft: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDisc: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: {
    minWidth: 64,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
