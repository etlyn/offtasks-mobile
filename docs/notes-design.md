# Notes interaction update

Giorgi's latest instruction supersedes the earlier all-tabs task-only plus rule:
the existing floating plus creates a note on Notes. Calendar, Goals, and Later
still create tasks. The dock and plus retain their approved geometry and colors.
The Notes action is disabled while loading, after a load failure, while saving,
and while a note editor is already open.

Search is a top-right header icon, not an always-visible field. It reuses
Calendar's full-width expanding search header, second-row Cancel, gentle
reversible transition, delayed focus, and Reduce Motion support.

The search layer searches all notes, including notes outside the Pinned filter.
The base list remains mounted and hidden from interaction/accessibility while
search is open. Closing clears the query after the exit animation and restores
the original All/Pinned filter and list position. Existing note editing, pinning,
save failures, and discard confirmation remain intact.

Validated with component regression tests and the iOS simulator: floating plus
opens New note, header icon opens the search layer, and Cancel returns to Notes.
