import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

import logoPaths from '@/assets/logoPaths';

interface TaskAppLogoProps {
  size?: number;
}

export const TaskAppLogo = ({ size = 84 }: TaskAppLogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path d={logoPaths.top} fill="#A5EEDE" />
    <Path d={logoPaths.bottom} fill="#01767B" />
    <Rect x="5.38312" y="4.6217" width="37.221" height="36.1204" rx="7.60514" fill="#FAFAFA" />
    <Path d={logoPaths.mark} fill="#012B2D" />
  </Svg>
);
