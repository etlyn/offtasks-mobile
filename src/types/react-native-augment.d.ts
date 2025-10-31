import type * as React from 'react';
import type {
  ViewProps,
  TextProps,
  ScrollViewProps,
  RefreshControlProps,
  KeyboardAvoidingViewProps,
  ActivityIndicatorProps,
  TextInputProps,
  SwitchProps,
} from 'react-native';

declare module 'react-native' {
  interface View extends React.Component<ViewProps> {}
  interface Text extends React.Component<TextProps> {}
  interface ScrollView extends React.Component<ScrollViewProps> {}
  interface RefreshControl extends React.Component<RefreshControlProps> {}
  interface KeyboardAvoidingView extends React.Component<KeyboardAvoidingViewProps> {}
  interface ActivityIndicator extends React.Component<ActivityIndicatorProps> {}
  interface TextInput extends React.Component<TextInputProps> {}
  interface Switch extends React.Component<SwitchProps> {}
}
