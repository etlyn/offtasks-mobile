# Simple tasks, focused Goals

September 12 product refinement, following Giorgi's feedback.

- Calendar and Later task composers expose text and date only. Goal membership and priority already stored on edited tasks are preserved, never silently cleared.
- Goals is the advanced workspace: entering a goal supplies its membership; task creation there exposes optional priority. No global advanced-mode preference.
- Later is the undated backlog, including completed items. Its plus creates an undated task. Calendar uses the selected date without clamping past dates to today.
- Tasks remain on the exact assigned date. Neither Calendar nor widget Today grouping carries unfinished old tasks forward. Completion does not move the task's assigned date.
- Hide-completed, auto-arrange-to-Today, and red-warning preferences are retired and no longer read. Red overdue row/checkbox/text styling is removed.
- Return to Later is a new, separate, account-scoped local opt-in. Default is off, regardless of legacy local/cloud preferences. Enabling it explicitly confirms that unfinished past-date tasks lose their date and move to the undated backlog. Completion, future/today dates, content, goal, and priority are preserved. Processing happens at launch, foreground, refresh, and day rollover while running; no background delivery or notifications are implemented.
- Drawer theme controls use accessible sun/moon selection without visible labels.
- Modal backdrop uses a lightly interpolated native blur, rather than a full material wash. Native material on the sheet and dock is unchanged. Reduce Transparency still omits backdrop blur.
- Tab slides retain their native-driven ease but opt out of interaction blocking and inactive native screen detachment/freezing. This avoids detachment during interrupted custom slides; screen state and the shared header/dock remain mounted.

Verification: 107 tests across 22 suites passed; TypeScript and diff checks passed. Simulator checks covered repeated Goals/Later switches with and without a retained goal detail, simple Calendar/Later composers, goal priority, and light/dark drawer and modal appearance. The originally reported physical-device freeze was not reproduced before the change; device retesting remains important. No existing task records were edited during simulator verification.

## Drawer and composer follow-up

- Drawer controls share one compact surface, with a fine inset divider. Account actions sit together below; sun/moon controls and version share the footer. Existing account and Return to Later confirmations remain.
- The task editor's X dismisses immediately, including changed drafts. There is no discard confirmation. In-flight saves remain protected against double submission and dismissal.
- Task submission shows a gently breathing horizontal mark instead of a rotating spinner. Reduce Motion uses a static mark; no fake completion or measured progress is implied.
- On iOS, date selection is a separate step inside the same detached sheet, replacing the editor with native date wheels. Wheel changes are staged until Done; Back keeps the original date. No date clears the assignment. The text draft survives both paths and keyboard focus returns to the editor.
- Android retains its native date dialog. Optional priority and goal metadata behavior is unchanged.

Follow-up verification: 111 tests across 22 suites pass, with TypeScript and diff checks clean. Debug simulator build succeeded. Drawer light/dark appearance, staged date selection, draft continuity, and direct X dismissal were checked in the simulator without saving or changing existing records.

Drawer-only revision: restored plain, small-icon account actions (one Sign in for sync row for guests; Account and sync, Log out, Delete account for signed-in users). Removed the profile block, solid sign-in banner, and enclosing menu card. Theme remains at the top with an 88×32-point visible track, 15-point icons, and two 44×44-point touch targets; its selection eases over 240ms with Reduce Motion support. Drawer wordmark remains omitted. Account deletion confirmation and Return to Later opt-in behavior are unchanged.

## Statistics refinement

- Replaced the three large metrics with one compact brand-green completion ring, real completed/open counts, and a small Celebrate action. Empty data never implies 100% completion.
- Goal progress shows up to three goals with actual tasks, fine progress bars, completion counts, and navigation to the selected goal or all goals. Empty seeded categories are not counted as completed goals.
- Open/Completed use 30-point visible pills with 44-point touch targets. Task rows retain the shared unboxed style; their subtitles show assigned dates rather than incorrectly calling future-dated tasks Later.
- A brief native-emoji burst rises and rains down on entry with completed tasks, after a successful completion, or when Celebrate is tapped. Native-driven motion does not block interactions, cancels on blur, and does not replay merely because the composer closes. Reduce Motion disables automatic entry celebrations and substitutes a short static acknowledgement for explicit celebrations.
- Verification: 119 tests across 23 suites pass, with TypeScript and diff checks clean. Simulator checks covered the completion ring, compact filters, Goals shortcut, repeated entry, and a recorded emoji burst/rain. Populated-goal and empty-state cases have component-test coverage; existing user records were not modified.

## Personal Goals

- Goal cards now have an initials avatar or native emoji, a curated background color, and a slim eased progress bar for goals with tasks. The three-dot appearance sheet is available for both populated and empty goals. It stages edits until Done, supports a randomized color/emoji choice, and closes without a discard confirmation. Failed saves keep the draft.
- Appearance is stored locally per account and goal name; the sheet makes the on-device scope explicit. No photo upload or cloud appearance sync is implemented. Existing goal names and task synchronization are unchanged. Account-data clearing also clears local appearances.
- New users start with no seeded goals. Existing saved goals and task labels are preserved. The empty state uses small expressive avatar samples and one direct Create a goal action.
- Goal detail replaces the shared wordmark with its name, easing the title change while preserving the header and back/search buttons. The redundant goal title row is removed. The Tasks row has an icon-only priority sort cycling highest, lowest, and default order, with an accessible state description. A thin progress bar sits beneath that row when tasks exist.
- Verification: 126 tests across 24 suites pass, TypeScript and diff checks pass, and targeted ESLint reports no errors. Simulator visual checks used temporary in-memory goals for populated cards, appearance selection/shuffle/cancellation, detail header, and sort states. The fixture was removed; no goal/task records or appearance choices were saved during simulator QA. `build/goals-appearance-preview.png` shows an unsaved preview, while `build/goals-personal-empty.png` shows the restored real-data screen.

## Quiet Notes personality

- Notes retain a text-first layout, with fine-edged rounded paper cards and a small three-dot appearance action. Six optional tones (Paper, Sage, Sand, Rose, Lilac, Mist) are deliberately softer than goal avatars. No emoji grid, avatars, or automatic random colors are added to Notes.
- The compact appearance sheet previews the actual note and eases color changes over 280ms, respecting Reduce Motion. Choices remain drafts until Done; failed saves retain the choice. The optional `tone` field travels with the existing note payload; content, pin state, and updated date are preserved when only appearance changes. Existing notes default to Paper and remain readable without migration.
- The All/Pinned control, shared header, global search, and contextual plus are unchanged. The empty state gets a small paper icon and one understated supporting line. Note editor X now closes directly without a discard confirmation, matching the approved composer behavior.
- Verification: all 131 tests across 25 suites pass; TypeScript, targeted ESLint, and diff checks pass. Tests cover tone preservation through editing, old note compatibility, palette validation, staged selection/cancellation, failed-save retry, and appearance persistence without content/pin/date changes. Simulator checks covered the real Notes list and appearance sheet without the assistant saving changes to existing notes.

## Task composer date transition

- Task sheets now ease their iOS keyboard gap explicitly instead of running a competing KeyboardAvoidingView layout animation. The editor/date content height uses an interruptible 320ms cubic ease-in/out, measured from intrinsic content rather than the scroll viewport to avoid a feedback loop on return.
- Other detached sheets keep their existing keyboard behavior. Date staging, Back/Done/No date, task drafts, and Android's native picker remain intact; Reduce Motion immediately settles geometry.
- Verification: 133 tests across 25 suites pass, plus TypeScript and targeted lint checks. Simulator recording covers the keyboard-to-picker round trip; an unsaved draft was discarded without saving or changing existing tasks.
