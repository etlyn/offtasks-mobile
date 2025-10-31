import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface TabUpcomingProps {
  color?: string;
  size?: number;
}

export const TabUpcomingIcon = ({ color = '#71717b', size = 20 }: TabUpcomingProps) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path
      fill={color}
      d="M6.667 2c.368 0 .667.298.667.667v.666h5.333v-.666a.667.667 0 1 1 1.333 0v.666h.667c1.84 0 3.333 1.492 3.333 3.334v7.999A3.333 3.333 0 0 1 14.667 18H5.333A3.333 3.333 0 0 1 2 15.333V6.667A3.333 3.333 0 0 1 5.333 3h.667v-.333c0-.369.298-.667.667-.667Zm8 4.666H5.333a2 2 0 0 0-1.999 1.999V15.333c0 1.104.895 2 1.999 2h9.334c1.104 0 1.999-.896 1.999-2V8.665a2 2 0 0 0-2-1.999ZM7.334 11.333a.666.666 0 0 1 0-1.333h5.332a.666.666 0 1 1 0 1.333H7.334Z"
    />
  </Svg>
);
