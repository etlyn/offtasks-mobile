import * as React from 'react';
import Svg, { Line, Rect } from 'react-native-svg';

interface TabUpcomingProps {
  color?: string;
  size?: number;
}

export const TabUpcomingIcon = ({
  color = '#71717b',
  size = 20,
}: TabUpcomingProps) => (
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
    <Rect x="6.6" y="9.9" width="1.55" height="1.55" rx="0.4" fill={color} />
    <Rect x="11.85" y="9.9" width="1.55" height="1.55" rx="0.4" fill={color} />
    <Rect x="6.6" y="12.75" width="1.55" height="1.55" rx="0.4" fill={color} />
    <Rect
      x="11.85"
      y="12.75"
      width="1.55"
      height="1.55"
      rx="0.4"
      fill={color}
    />
  </Svg>
);
