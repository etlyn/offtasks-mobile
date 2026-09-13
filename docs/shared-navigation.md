# Shared navigation shell

September 12, 2026 — persistent header and taskbar refinement.

- Calendar, Notes, Goals, Later, Statistics, and Account run inside one tab navigator. Statistics and Account are drawer destinations, not extra visible tabs.
- One header host sits outside the sliding page scenes. Menu, `offtasks.` wordmark, search icon, safe-area spacing, backdrop, and touch targets stay in place during navigation. Screens register focused actions instead of drawing another header.
- Tab changes slide horizontally in tab order, with opaque scenes and no cross-fade. Both pages travel one viewport width, including when skipping tabs, using 360ms cubic ease-in/out. Header and dock remain fixed. Reduce Motion disables the spatial transition. Search and native editing-sheet transitions are unchanged.
- The tab navigator is memoized independently of shell/action state. Notes/Goals action updates must not recreate navigation descriptors mid-slide: the installed tab view would otherwise restart the animation and snap its outgoing scene. A real-navigator regression test covers Notes → Goals → Later → Goals → Notes and includes an unisolated negative control. Loaded goals refresh without replacing rows with a spinner; stale reads are ignored.
- Inside a goal, the header menu icon becomes a back arrow in the same glass button and touch target. Back returns to the goal list and gently restores the menu icon. The goal title remains below the shared header without a duplicate back button. Other pages retain their existing navigation behavior.
- The same four-tab glass dock stays mounted, including on Statistics and Account. These auxiliary destinations don't falsely highlight a main tab; the selection fades gently. Existing compact geometry and contextual plus actions are preserved.
- Search remains an intentional, reversible overlay. Its field stays with its page to preserve native input behavior; the persistent header is hidden from touch and accessibility while covered. Native editing sheets still cover the shell.
- Header action registration is focus-scoped, with higher priority for nested goal detail and its search. Blur/unmount restores the appropriate owner.
- Search is now app-wide from every destination. One shell-level overlay searches tasks, notes, and goals together, with no type/page filters. Cancel preserves the source page. The dock has its own persistent host above that overlay.

Verification: simulator checks cover all six destinations, goal detail, Notes/goal/Calendar search entry and dismissal, Statistics filtering, and Account's global search. Automated coverage checks persistent header identity, action ownership/cleanup, input identity, and unchanged four-tab geometry on auxiliary destinations. Existing user data was left unchanged.
