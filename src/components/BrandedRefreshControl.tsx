import React from 'react';
import {
  Platform,
  RefreshControl,
  type RefreshControlProps,
} from 'react-native';

/** Retains native pull physics; feedback lives in the persistent header. */
export function BrandedRefreshControl(props: RefreshControlProps) {
  return (
    <RefreshControl
      {...props}
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
      // Android's refresh control wraps the scroll content; hiding that view
      // would hide the entire list. Only iOS has a standalone indicator view.
      style={
        Platform.OS === 'ios' ? [props.style, { opacity: 0 }] : props.style
      }
    />
  );
}
