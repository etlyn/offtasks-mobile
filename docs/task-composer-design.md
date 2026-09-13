# Task composer — simplified entry

The September 12 refinement uses the Etlyn preference lens: a quiet, glass-backed text area, compact controls, brand-green actions, and gently eased disclosure. No new reference-app screenshots were used.

- Default flow: write a task, then Add. Edit mode uses Save and retains its existing date, priority, and goal.
- Remove Today/Tomorrow/Later segmented shortcuts. One date chip opens the native calendar; No date leaves the task unscheduled. Opening/closing the picker never changes the date.
- Priority and Goal are optional, collapsed chips. Only one options panel is open at a time. Choosing a value returns to task entry. No priority and No goal explicitly clear the selection.
- Goal selection uses a searchable list with selected checkmarks. Goal creation requires an explicit Create action; task saving never turns a search query into a new goal. Goal deletion is not part of this focused composer flow and remains on Goals.
- Keep the native page sheet, keyboard avoidance, 44-point interaction targets, short labels, adaptive row heights, and Reduce Motion support. No mandatory metadata step or extra onboarding copy.
- Cancel guards actual draft edits, but searching/browsing options alone is not a draft change. Disable editing, options, cancellation, and repeat saves while submitting or creating a goal. Creation failures stay in the picker with an error.

Validation of the initial pass: 96 automated tests passed, including compact defaults, optional selection/clearing, schedule preservation, draft guards, explicit goal creation, and disabled controls. Simulator checks used unsaved drafts only; existing task data was not changed. Android, large Dynamic Type, and dark-mode visual QA are not claimed by this pass.

## Detached keyboard companion

Follow-up: replace the tall native page sheet with a content-sized transparent-modal overlay, following Giorgi's stated Craft floating-input and Luma/Todoist sheet-interaction preferences (not a newly captured app flow).

- The composer floats inside 12-point side margins and a 12-point keyboard gap, with 28-point corners on every edge and one restrained external shadow. Without the keyboard it clears the bottom safe area.
- Default text area is 88 points high; larger content and option panels scroll within the available height. The header stays reachable above the scrolling content.
- Keyboard avoidance follows native keyboard layout timing. Priority and Goal expand upward without dismissing the keyboard; the native date picker dismisses it to gain room.
- Entry/exit use 360/280ms cubic ease-in/out, with 20-point travel, no scale distortion, and immediate Reduce Motion behavior. Interrupted transitions stop at their current position.
- Draft cleanup and shared-composer unmount happen only after the exit completes, preventing a flash of empty content or an abrupt disappearance. Backdrop/escape use the same guarded dismissal; an open options panel closes first.
- Header follow-up: remove the centered New task/Edit task title and replace visible Cancel text with a quiet 32-point close icon inside a 44-point target. Add (or Save while editing) is the only labeled header action. Keep the existing unsaved-change guard and eased feedback.

## Shared floating modals

- Promote the keyboard-aware container to a shared DetachedSheet used by task creation/editing, Notes, Goals, and the calendar year picker.
- Add the existing native iOS thin-material blur behind the entire sheet, with a restrained tint rather than a heavy shadow. Reduce Transparency uses a dim-only backdrop; the sheet's native material retains its opaque accessibility fallback.
- Notes and Goals use the same close/action header without redundant centered titles. Note fields remain scrollable and compact; goal creation sizes to its single field.
- Keep note drafts mounted until dismissal completes. Year selection and cancellation finish the eased dismissal before returning to the calendar. Keep native destructive/discard confirmations and all saving/error guards.
- Verification: 101 app tests and five production-preflight tests pass. Simulator visual checks cover task, note, goal, and year sheets with keyboard separation. No existing user records were changed during visual checks. Android, large Dynamic Type, and dark-mode visual QA are not claimed.
