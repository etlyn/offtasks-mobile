# Global search

September 12, 2026 — replaces page-aware search in the app shell.

One fixed Search icon opens the same filter-free field from Calendar, Notes, Goals (including detail), Later, Statistics, and Account. No selected date, goal, pinned filter, task status, or originating page restricts results. The previous Statistics inline task-only field is absent in the shared app shell.

Results combine task content/metadata, note titles/bodies, and goal names. Completed tasks and goals inferred from task labels are included. Exact titles rank first, then prefix/title matches, then body/metadata matches. Duplicate goal names are merged case-insensitively. Rows use coherent outline task, note, and flag icons plus small type labels, faint dividers, and the established green palette—not type-filter chips.

The overlay retains the approved icon-to-field expansion and gentle ease, with Cancel on the second row. The underlying page and dock stay mounted. Cancel restores the source page; selecting a result dismisses search and opens the corresponding task editor, note editor, or goal detail using a one-time navigation request. Query and caret state remain local to the input's React tree.

Local planner data is read for the current account/device workspace and refreshed on planner updates. Partial read failures retain available results and disclose that some items couldn't load, with Retry. No search result changes stored content until the user explicitly saves an editor.
