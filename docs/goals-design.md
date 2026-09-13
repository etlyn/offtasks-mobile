# Goals refinement

The latest instruction extends the contextual floating plus to the Goals list:
it opens New goal. Inside a goal it opens task creation with that goal preselected.
Calendar and Later retain task creation; Notes retains note creation.

- Replaced repeated boxed cards with compact unboxed rows and faint dividers.
- Built-in categories use recognizable outline icons in restrained brand-tinted
  surfaces; custom goals retain the flag. No unrelated accent palette.
- Removed repeated empty-task descriptions and exposed trash buttons.
  Empty-goal removal remains available under Options, followed by confirmation.
- Populated goals retain remaining-task text, compact completion counts, and
  a thin progress indicator; empty goals do not show 0/0 or empty progress bars.
- Moved search to the top-right, using the approved expanding field and reversible
  overlay. The list stays mounted; opening a result layers goal detail over search.
- Native New goal sheet, duplicate validation, discard protection, storage/sync,
  and Reduce Motion behavior are preserved.

Validation: iOS simulator inspection of list, New goal sheet, and goal detail;
component tests cover contextual plus actions, creation, goal preselection,
search/clear/dismiss, and availability of empty-goal options.
