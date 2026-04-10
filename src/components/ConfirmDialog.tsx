import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/colors';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  renderInline?: boolean;
  containerStyle?: ViewStyle;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  renderInline = false,
  containerStyle,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (!visible) {
    return null;
  }

  const content = (
    <View
      style={[
        styles.backdrop,
        renderInline && styles.inlineBackdrop,
        containerStyle,
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <View style={styles.sheet}>
        <View style={styles.glow} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={({ pressed }) => [
              styles.action,
              styles.cancelAction,
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.action,
              destructive ? styles.destructiveAction : styles.confirmAction,
              pressed && styles.actionPressed,
            ]}
          >
            <Text
              style={destructive ? styles.destructiveText : styles.confirmText}
            >
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (renderInline) {
    return content;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {content}
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    inlineBackdrop: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 200,
      elevation: 200,
    },
    sheet: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 18,
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.shadow,
      shadowOpacity: 1,
      shadowOffset: { width: 0, height: 18 },
      shadowRadius: 40,
      elevation: 18,
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -48,
      left: 24,
      right: 24,
      height: 96,
      borderRadius: 999,
      backgroundColor: theme.isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(255,255,255,0.55)',
    },
    title: {
      fontSize: 19,
      lineHeight: 26,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    message: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 21,
      color: theme.colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 20,
    },
    action: {
      flex: 1,
      minHeight: 46,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.985 }],
    },
    cancelAction: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
    },
    confirmAction: {
      backgroundColor: theme.colors.tabBarActiveBackground,
      borderColor: theme.colors.tabBarActiveBorder,
    },
    destructiveAction: {
      backgroundColor: theme.colors.dangerSurface,
      borderColor: theme.colors.dangerBorder,
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    confirmText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    destructiveText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#ef4444',
    },
  });
