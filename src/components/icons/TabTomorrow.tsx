import * as React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface TabTomorrowProps {
  color?: string;
  size?: number;
}

export const TabTomorrowIcon = ({
  color = '#71717b',
  size = 20,
}: TabTomorrowProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      d="M7.1 5.75 5.85 4.5a1.4 1.4 0 0 0-1.98 0"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m12.9 5.75 1.25-1.25a1.4 1.4 0 0 1 1.98 0"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="10" cy="10.25" r="4.75" stroke={color} strokeWidth="1.5" />
    <Line
      x1="10"
      y1="8"
      x2="10"
      y2="10.25"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Line
      x1="10"
      y1="10.25"
      x2="11.85"
      y2="11.4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Line
      x1="8.15"
      y1="14.85"
      x2="7.3"
      y2="16.2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Line
      x1="11.85"
      y1="14.85"
      x2="12.7"
      y2="16.2"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);
