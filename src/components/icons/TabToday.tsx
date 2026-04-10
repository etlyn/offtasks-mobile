import * as React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';

interface TabTodayProps {
  color?: string;
  size?: number;
}

export const TabTodayIcon = ({
  color = '#71717b',
  size = 20,
}: TabTodayProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Line
      x1="6.75"
      y1="3"
      x2="6.75"
      y2="5.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Line
      x1="13.25"
      y1="3"
      x2="13.25"
      y2="5.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Rect
      x="3.5"
      y="4.5"
      width="13"
      height="11.5"
      rx="2.25"
      stroke={color}
      strokeWidth="1.5"
    />
    <Line
      x1="3.5"
      y1="7.75"
      x2="16.5"
      y2="7.75"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);
