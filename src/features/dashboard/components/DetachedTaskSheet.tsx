import React from 'react';
import { DetachedSheet } from '@/components/DetachedSheet';

export function DetachedTaskSheet(
  props: React.ComponentProps<typeof DetachedSheet>,
) {
  return (
    <DetachedSheet
      {...props}
      coordinateKeyboard
      dismissLabel="Dismiss task composer"
    />
  );
}
