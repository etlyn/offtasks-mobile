# Calendar landing design

September 12, 2026. Scoped to Calendar and its necessary shared surfaces. A global task-creation action is available from Calendar, Notes, Goals, and Later without navigating away; other page content is unchanged.

## Direction

Apply Giorgi's `etlyn-design-preferences` skill: cross-category craftsmanship, not a task-app template. Retain Offtasks' mint identity, dotted wordmark, restrained luminous color, solid primary controls, rounded grouping, fine separators, and native blur on floating navigation and header controls.

Follow-up feedback: Giorgi likes the dotted wordmark's character, but dislikes large fonts and promotional-sounding headlines. The landing page now omits the oversized day headline and slogan, uses a compact day label, and reduces the empty state to an icon with “No tasks planned” or “All done.” Keep future Offtasks pages similarly quiet and concise.

Reference provenance:

- [Revolut home on Mobbin](https://mobbin.com/screens/a2e597fa-50af-426b-93ba-5726fc0ef3da?section=key_screens): inspected in the authenticated browser. Luminous background, circular translucent actions, dark rounded grouping, and layered navigation informed the surface hierarchy.
- [Airbnb on Mobbin](https://mobbin.com/apps/airbnb-ios-e62cd3cf-0432-4936-903f-b9c01124e2bb/239b58e6-8b7e-4d12-b009-748fb6bb5926/screens): inspected rounded search sections, listing cards, and bordered selection surfaces. Date simplification comes from the user's stated preference, not an inspected date-picker flow.
- Netflix, HBO Max, and ChatGPT contributed the user's stated preferences for confident actions, fine structure, and minimal hierarchy. Their screens were not inspected for this pass.

Mobbin MCP was unavailable in this task; references were inspected through the user's authenticated Mobbin browser session instead. No third-party assets were imported.

## Behavior and accessibility

- Full Monday-first month by default; the month-title chevron expands/collapses it. An upward content swipe or drag-scroll collapses it to a week. Short empty content retains enough scroll range for the gesture; horizontal movement does not trigger collapse.
- Week arrows move the selected day by seven days. Month arrows browse without changing the selected plan. Collapsing returns to the selected week's context. Today resets both selection and viewport.
- Local-noon date arithmetic avoids UTC and DST boundary drift. Date buttons expose full dates, selection, today, and task presence to accessibility.
- The floating plus is separate from page content and available on every main tab. It opens the shared task composer over the current tab; cancellation leaves navigation unchanged. Calendar supplies its selected future/today date; past dates and other tabs default new tasks to today. Completed-only and genuinely empty days have distinct short labels. Filtering, error retry, search, editing, completion, and deletion retain existing behavior.
- `GlassSurface` uses iOS `UIVisualEffectView` with system thin material, not iOS liquid-glass APIs. Reduce Transparency switches to an opaque material. Android and older native builds have an opaque fallback. Calendar expansion respects Reduce Motion.
- Calendar-only variants keep shared task-row styling unchanged on other pages. The shared navigation now includes the independent floating plus.

## Local development

Use Node 20.19.4 or newer (Node 24.21.0 was used here). Start Metro with `yarn start --host 127.0.0.1 --max-workers 2`, then build Debug for the iOS simulator. When command-line tools are selected globally, set `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for Xcode commands.

Debug now uses `com.etlyn.offtasks`, matching the widget's `com.etlyn.offtasks.widget` prefix. The Debug app replaces the simulator's Release app without intentionally resetting its data. Production/device build defaults were not changed. After installing Debug, JS/style changes use Fast Refresh; native changes still need an Xcode rebuild.

Automated coverage lives in `calendar-landing.test.tsx` and `planner-screens.test.tsx`.

## Verification for this pass

### Compact task/calendar refinement

Softer easing follow-up: extend the shared transition from 240 to 320 ms, opacity entry/exit to 220/180 ms, and use cubic ease-in/out for the subtle calendar fade. Keep the same fade amplitude, no bounce, and Reduce Motion handling. This tunes the preceding motion implementation without changing layout or behavior.

Motion refinement: route grabber taps, upward-scroll collapse, and reset through one 240 ms ease-in/ease-out layout transition, with short opacity entry/exit rather than bounce. The calendar surface also gently fades from 82% to full opacity using the native animation driver on selection/view changes, without fading out entirely or delaying interaction. Stop interrupted fades and honor live Reduce Motion changes; skip entrance motion on initial mount. Derive the displayed dates from the selected date immediately so resetting from a browsed month does not briefly render the previous viewport. Keep final geometry and task data unchanged.

Exercised minimize, reset in week view, and expand in the simulator and checked settled layouts. All 45 tests pass, including motion-enabled and Reduce Motion paths for tap/scroll/reset, native fade configuration, and reset from another visible month. TypeScript and targeted lint pass. Screenshot checks establish final state, not frame-rate smoothness.

Matched grabber / header cleanup: use the approved 20-point grabber strip in both expanded and minimized views, retaining the 72 × 44-point tap target. Remove the downward disclosure glyph beside the month/year title but keep the whole title tappable for the year sheet. Extend the task heading 7 points right so the reset's center aligns with the floating plus (both 43 points from the right screen edge with current layout gutters). No changes to the plus, date selection, or reset visibility rules.

Verified the expanded strip, year-sheet opening/dismissal without the chevron, and reset/plus alignment in the simulator. All 43 tests, TypeScript, and targeted lint pass.

Minimized grabber refinement: reduce only the week-view visible grabber strip from 30 to 20 points. Keep the expanded strip at 30 and the line itself at 28 × 3. Transfer the removed 10 points into invisible target space below the card, preserving the full 72 × 44-point touch area, date-cell separation, and the task heading's position. This is a reduction in visible calendar height, not a reduction in overall content height.

External reset / compact grabber: move the conditional reset icon to the far right of the Today/date + progress heading, outside the calendar. It remains hidden on today and resets selection and the visible month while preserving expanded/collapsed state. The calendar now reserves only 30 points for its unchanged 28 × 3-point grabber instead of 44. The full 72 × 44-point tap target is positioned in the wrapping calendar block, using the existing 14-point gap below the card; it does not overlap date cells or the next heading. The heading retains a stable 44-point minimum height so reset visibility does not cause a layout jump.

Verified the external reset in both calendar views, reset-and-hide behavior in week view, and tapping both the visible line and the extended target below the card in the simulator. All 43 tests, TypeScript, and targeted component/test lint pass.

Grabber follow-up: user explicitly retained the existing calendar-first layout and bottom-center control, asking only for a short horizontal line in place of the chevron (Outlook-like grabber, per their description; Outlook was not inspected). Replace the glyph with a 28 × 3-point rounded line in the secondary text color. Keep the same 72 × 44-point button, expanded accessibility state, tap behavior, reset position, month navigation, and all spacing. The proposed move to a top control row was canceled before implementation.

Calendar-first follow-up: remove the Month/Week controls above the card entirely. The calendar is again the first content immediately after the header. A single plain 18-point chevron sits centered inside its bottom edge in both states, with a 72 × 44-point touch area, no capsule, divider, or extra toolbar above the dates. Equal side slots keep it centered when the conditional reset appears at lower left. Reset still works in either mode, full month/year controls remain expanded-only, and compact Today/date + progress stays below the calendar. This replaces the preceding switch concepts; pending user review.

Verified expanded and collapsed layouts, non-today reset, and stable chevron centering in the simulator. All 43 tests pass, including calendar-first structure and in-card toggle ownership; TypeScript and targeted lint pass. The initial new structure assertion compared renderer objects and exhausted the test runner's heap while reporting the difference; changed it to compare scalar test IDs, then reran the full suite successfully.

Minimal switch refinement: user liked explicit Month/Week selection but found the capsule too much. Remove both the tinted track and glass lens. Use two quiet 12-point text options, medium emphasis and a short 16 × 1.5-point brand-colored underline for the active view. Each option retains a 56 × 44-point minimum touch area. Reset and all month/week behavior remain unchanged. This supersedes the decorated segmented switch below; this visual refinement is pending user review.

Verified the minimal controls in both simulator views. All 43 tests, TypeScript, and targeted lint pass; automated checks cover underline placement on the active option and retained touch targets.

Alternative calendar controls (candidate, not yet user-approved): replace the rejected chevron/pill concept with a stable centered Month / Week segmented switch above the date card. A restrained glass selection sits in a 32-point track; each labeled option has a minimum 70 × 44-point touch area. The conditional reset icon stays to its right, now available in either view after selecting a non-today date. Reserved side slots prevent the switch moving when reset appears/disappears. No footer, detached bottom pill, or controls in the task heading remain. Full month/year navigation appears only in Month view; upward scrolling still selects Week view. Keep compact Today/date + progress, brand colors, and reduced-motion handling.

Verified month/week switching and non-today reset directly in the simulator; reset preserves Week view and hides afterward. Left Month view open. All 43 tests pass, including reset in week mode and switch selection semantics; TypeScript and targeted lint pass. This replaces the following historical control placements.

Pill placement follow-up: retain the compact Today/date + `1/3` heading, but remove the chevron from that row. Expanded mode places the collapse pill inside the calendar footer at bottom right. Collapsed mode places the expand pill just beneath the calendar's bottom-right corner, in the calendar block rather than the task heading. Both use a 52 × 24-point rounded glass rectangle (12-point radius), a 16-point chevron, and a 60 × 44-point touch area. The outside pill has a 10-point visible gap below the card and matches the expanded pill's horizontal inset. This supersedes the circular/external heading control below.

Verified both pill positions through Fast Refresh in the simulator, without changing tasks. All 42 tests pass, including expanded in-card ownership, collapsed outside-card placement, pill geometry, and unchanged compact progress. TypeScript and targeted component/test lint pass.

Progress/toggle follow-up: show completion as `1/3` directly beside Today or the selected-date title, with the full completion description retained for VoiceOver. The expand/collapse control now sits outside the calendar card, at the right of this heading row in both modes: a 16-point chevron on a 30-point glass circle inside a 44-point touch area. Remove the old empty calendar footer in the landing page; preserve the conditional reset-to-today control, year picker, selected date, and Reduce Motion behavior. This supersedes the in-card toggle placements described below.

Verified this follow-up in the simulator in expanded and collapsed modes, then left it expanded with the user's tasks unchanged. All 42 tests and TypeScript pass. Targeted lint reports no errors; existing Dashboard shadowing and inline-style warnings remain.

Year-navigation follow-up: the centered month/year heading is now a 44-point-tall button with a small disclosure chevron. It opens a compact modal year sheet, showing 12 direct year choices per page and previous/next page controls (picker range 1900–2199). Selecting a year preserves the visible month and selected task date, dismisses the sheet, and browses that year's month; closing without selection leaves the view unchanged. Use the first day of the destination month to avoid leap-day overflow. Respect Reduce Motion, safe-area padding, modal dismissal/accessibility escape, and scrollable sheet content. In collapsed mode, center the expand control in a subtle handle with a 72 × 44-point touch area; the full-mode collapse control remains bottom right. Verified the sheet and 2026→2027 jump in the simulator, then left the compact week visible. All 41 tests pass, including year paging, cancellation, leap-year behavior, preserved selection, and handle geometry. A clean simulator app restart cleared a Fast Refresh hook-state mismatch after adding picker state.

Reset-control refinement: replace the Today text pill with a 17-point counterclockwise reset icon on a subtle 30-point surface, retaining a 44-point touch target and explicit “Go to today” accessibility label/hint. Show it only in expanded mode when the selected day differs from today; merely browsing months does not reveal it. Reset updates both selection and visible month, then hides the icon. This supersedes the always-visible Today pill below. Verified the non-today icon and reset/hide behavior in the simulator; automated coverage checks initial hidden state, browsing without selection, and hiding after reset.

Calendar controls follow-up: center each date number independently of its task marker (marker absolutely positioned below the centered text). Expanded month navigation moves to the top, with a centered month/year heading between arrows. Today becomes a clearly tappable pill at bottom left; the sole expand/collapse chevron sits bottom right with a 44-point target. Remove redundant Month view / Week view labels. Collapsing shows only the selected week's weekday/date row and the expand control, hiding month heading, navigation arrows, Today, and footer divider. Expand to access month navigation or return to Today. Selection and task context are preserved, including when collapsing after browsing a different month. Checked both modes in the simulator; tests cover hidden controls, date navigation across year boundaries, today selection, centered-marker geometry, and scroll collapse.

Subsequent feedback: keep the approved square checkbox, but remove the enclosing task card entirely. Populated Calendar rows now sit on the page background, expand to 16-point screen gutters (8 points beyond the Calendar layout's 24-point padding), and use one-device-pixel dividers at 10% opacity. No enclosing fill, border, rounded shell, or inner card padding remains; preserve completion/edit/swipe behavior and the compact touch areas.

September 12, 2026: user requested rounded-square task checkboxes, consistent brand color, and smaller Calendar/header/task elements. Shared task checkboxes are now 20-point squares with 5-point corners, using the same selected-day/plus colors (`#152D25` light, `#D8F3E5` dark) and contrasting check glyphs. Keep separate 44-point checkbox and task-content touch areas. Base task rows are approximately 52 points with 15-point regular text; metadata and wrapped text can expand them.

Calendar numbers use 15-point medium tabular figures instead of 16-point semibold. Day touch areas are at least 44 points high, with a smaller 36-point minimum selected surface; remove extra inter-week gaps and reduce surrounding padding. Header menu/search glass circles are 36 points with 18-point icons, inside 44-point touch areas. Wordmark is 20 points, retaining the dot. Card corners reduce to 20 points; the approved bottom navigation is unchanged.

[Apple's design guidance](https://developer.apple.com/design/tips/) recommends at least 44 × 44-point controls and readable text. These compact visual dimensions and the 15-point task/date text are Offtasks design choices, not claimed Apple-mandated row heights or body text sizes. Font scaling remains enabled and content containers use minimum heights rather than clipping text to fixed rows.

Verified expanded/collapsed light-mode Calendar, completed/unchecked tasks, search open/close, and a temporary dark-mode preview. Restored the saved theme with no task data changes. All 40 tests pass, including compact-target geometry and both theme checkbox colors; TypeScript and targeted lint pass.

- Debug Xcode build passed in the initial pass. The follow-up is JS-only: TypeScript checks and all 35 tests in 9 suites passed.
- Inspected light/dark Calendar, empty/populated plans, month expansion, future-day selection, and the selected date in the task sheet on the iPhone 17 Pro simulator.
- Populated visual checks used temporary in-memory source fixtures, never saved tasks. Those fixtures and the temporary theme override were removed afterward.
- Confirmed live updates without rebuilding the native app. Native view registration is isolated in `OfftasksBlurNative.ts` so theme/component Fast Refresh does not register it twice. Editing that native registration module itself requires a full app reload.
- Follow-up simulator verification: expanded default, manual collapse/expand, and global task creation from Notes with cancellation returning to Notes. Swipe/scroll collapse has automated component coverage; computer-use drag/scroll gestures did not reliably reach the simulator, so tactile validation was requested from the user.
