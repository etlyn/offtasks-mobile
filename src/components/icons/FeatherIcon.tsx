/**
 * Lightweight SVG-based icon component replacing react-native-vector-icons/Feather.
 *
 * Uses react-native-svg (already installed) so no font-linking is needed.
 * Only the icons actually used in the app are included.
 */
import React from 'react';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

/**
 * Feather-compatible SVG icon paths.
 * viewBox is always "0 0 24 24", stroke-based, strokeWidth=2, strokeLinecap="round", strokeLinejoin="round".
 */
const ICONS: Record<string, React.ReactNode> = {};

const icon = (name: string, children: (color: string) => React.ReactNode) => {
  ICONS[name] = children;
};

// We register a render-function per icon so colour is injected at render time.

const FeatherIcon = ({ name, size = 24, color = '#000', style }: IconProps) => {
  const renderFn = ICON_RENDERERS[name];
  if (!renderFn) {
    // Fallback: render a simple circle with the first letter
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      </Svg>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {renderFn(color)}
    </Svg>
  );
};

type RenderFn = (color: string) => React.ReactNode;

const ICON_RENDERERS: Record<string, RenderFn> = {
  check: () => <Polyline points="20 6 9 17 4 12" />,
  menu: () => (
    <>
      <Line x1="3" y1="12" x2="21" y2="12" />
      <Line x1="3" y1="6" x2="21" y2="6" />
      <Line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  search: () => (
    <>
      <Circle cx="11" cy="11" r="8" fill="none" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  'pie-chart': () => (
    <>
      <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <Path d="M22 12A10 10 0 0 0 12 2v10z" />
    </>
  ),
  'check-circle': () => (
    <>
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <Polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  sun: () => (
    <>
      <Circle cx="12" cy="12" r="5" fill="none" />
      <Line x1="12" y1="1" x2="12" y2="3" />
      <Line x1="12" y1="21" x2="12" y2="23" />
      <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <Line x1="1" y1="12" x2="3" y2="12" />
      <Line x1="21" y1="12" x2="23" y2="12" />
      <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </>
  ),
  moon: () => <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  'eye-off': () => (
    <>
      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <Line x1="1" y1="1" x2="23" y2="23" />
    </>
  ),
  cpu: () => (
    <>
      <Rect x="4" y="4" width="16" height="16" rx="2" ry="2" fill="none" />
      <Rect x="9" y="9" width="6" height="6" fill="none" />
      <Line x1="9" y1="1" x2="9" y2="4" />
      <Line x1="15" y1="1" x2="15" y2="4" />
      <Line x1="9" y1="20" x2="9" y2="23" />
      <Line x1="15" y1="20" x2="15" y2="23" />
      <Line x1="20" y1="9" x2="23" y2="9" />
      <Line x1="20" y1="14" x2="23" y2="14" />
      <Line x1="1" y1="9" x2="4" y2="9" />
      <Line x1="1" y1="14" x2="4" y2="14" />
    </>
  ),
  'log-out': () => (
    <>
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1="21" y1="12" x2="9" y2="12" />
    </>
  ),
  'chevron-right': () => <Polyline points="9 18 15 12 9 6" />,
  'chevron-left': () => <Polyline points="15 18 9 12 15 6" />,
  'arrow-left': () => (
    <>
      <Line x1="19" y1="12" x2="5" y2="12" />
      <Polyline points="12 19 5 12 12 5" />
    </>
  ),
  tag: () => (
    <>
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <Line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  x: () => (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" />
      <Line x1="6" y1="6" x2="18" y2="18" />
    </>
  ),
  plus: () => (
    <>
      <Line x1="12" y1="5" x2="12" y2="19" />
      <Line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  calendar: () => (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" />
      <Line x1="16" y1="2" x2="16" y2="6" />
      <Line x1="8" y1="2" x2="8" y2="6" />
      <Line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  'alert-circle': () => (
    <>
      <Circle cx="12" cy="12" r="10" fill="none" />
      <Line x1="12" y1="8" x2="12" y2="12" />
      <Line x1="12" y1="16" x2="12.01" y2="16" />
    </>
  ),
  flag: () => <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />,
  'trending-up': () => (
    <>
      <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <Polyline points="17 6 23 6 23 12" />
    </>
  ),
  settings: () => (
    <>
      <Circle cx="12" cy="12" r="3" fill="none" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  user: () => (
    <>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" fill="none" />
    </>
  ),
  trash: () => (
    <>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  'trash-2': () => (
    <>
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Line x1="10" y1="11" x2="10" y2="17" />
      <Line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
  edit: () => (
    <>
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  'more-vertical': () => (
    <>
      <Circle cx="12" cy="12" r="1" fill="currentColor" />
      <Circle cx="12" cy="5" r="1" fill="currentColor" />
      <Circle cx="12" cy="19" r="1" fill="currentColor" />
    </>
  ),
  clock: () => (
    <>
      <Circle cx="12" cy="12" r="10" fill="none" />
      <Polyline points="12 6 12 12 16 14" />
    </>
  ),
  mail: () => (
    <>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" />
      <Polyline points="22 6 12 13 2 6" />
    </>
  ),
  lock: () => (
    <>
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  home: () => (
    <>
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="none" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </>
  ),
  'plus-circle': () => (
    <>
      <Circle cx="12" cy="12" r="10" fill="none" />
      <Line x1="12" y1="8" x2="12" y2="16" />
      <Line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  'chevron-down': () => <Polyline points="6 9 12 15 18 9" />,
  'corner-up-left': () => (
    <>
      <Polyline points="9 14 4 9 9 4" />
      <Path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </>
  ),
  'arrow-up-down': () => (
    <>
      <Line x1="7" y1="3" x2="7" y2="21" />
      <Polyline points="3 7 7 3 11 7" />
      <Line x1="17" y1="21" x2="17" y2="3" />
      <Polyline points="13 17 17 21 21 17" />
    </>
  ),
};

export default FeatherIcon;
