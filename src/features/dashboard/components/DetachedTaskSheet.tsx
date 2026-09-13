import React from 'react';
import { DetachedSheet } from '@/components/DetachedSheet';

export function DetachedTaskSheet(
  props: React.ComponentProps<typeof DetachedSheet>,
) {
  return <DetachedSheet {...props} dismissLabel="Dismiss task composer" />;
}
