# Branded loading feedback

`OfftasksLoader` replaces screen-loading indicators for authentication, task lists,
Notes, Goals, and global search. Small action indicators remain separate; a
wordmark does not fit a checkbox or save button.

- Compact 22 pt “offtasks.” with dark green lettering and a lighter brand dot.
- Letters descend 10 pt, staggered 65 ms apart, with a restrained eased overshoot.
- Each letter settles over 520 ms; the full word rests for 600 ms before a
  soft 240 ms fade and repeat. No artificial loading delay is added.
- Transform/opacity motion runs on the native driver and does not block touches.
- Each repeat explicitly resets its values while hidden to avoid native loop
  reset issues. Unmount, navigation blur, and app backgrounding stop the sequence.
- Reduce Motion shows a static wordmark. Assistive technology receives one
  “Loading” busy state, not nine separate letters or repeated announcements.

## Pull-to-refresh

Calendar/Later, Goals, and Statistics retain native pull physics, but use a
transparent `BrandedRefreshControl` instead of the system spinner. The shared
header receives the actual task-refresh state and animates its existing 20 pt
wordmark. Custom goal titles return after the refresh animation settles.

Fast requests finish the current letter entrance before the header rests; this
does not delay data rendering or keep the native refresh control open. The
wordmark stays mounted at its resting size so completion does not swap between
different text geometry. Reduce Motion keeps the wordmark static.
