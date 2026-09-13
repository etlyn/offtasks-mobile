import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/** A matched outline/filled set; the icon silhouette carries selection too. */
export function TabBarIcon({
  route,
  selected,
  color,
  cutout,
}: {
  route: string;
  selected: boolean;
  color: string;
  cutout: string;
}) {
  const detail = selected ? cutout : color;
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {route === 'Notes' ? (
        <>
          <Path
            d="M6 3.5h8l4.5 4.5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
            fill={selected ? color : 'none'}
          />
          <Path d="M13.5 4v5h4.5M8.5 12.5h6M8.5 16h4.5" stroke={detail} />
        </>
      ) : route === 'Goals' ? (
        <>
          <Path d="M5 21V4" />
          <Path
            d="M5 4c4-3 8 3 14 0v10c-6 3-10-3-14 0Z"
            fill={selected ? color : 'none'}
          />
        </>
      ) : route === 'Later' ? (
        <>
          <Path
            d="M7 3.5h10a1.5 1.5 0 0 1 1.5 1.5v16L12 17l-6.5 4V5A1.5 1.5 0 0 1 7 3.5Z"
            fill={selected ? color : 'none'}
          />
        </>
      ) : (
        <>
          <Rect
            x={3}
            y={4.5}
            width={18}
            height={17}
            rx={2.5}
            fill={selected ? color : 'none'}
          />
          <Path d="M7.5 2.5v4M16.5 2.5v4" />
          <Path d="M4 9.5h16" stroke={detail} />
          {[7, 11, 15].map(x =>
            [12.5, 16.5].map(y => (
              <Rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={2}
                height={2}
                rx={0.4}
                fill={detail}
                stroke="none"
              />
            )),
          )}
        </>
      )}
    </Svg>
  );
}
