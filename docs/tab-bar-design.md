# Shared glass tab bar

September 12, 2026. Follow-up to the Calendar design: one consistent floating tab bar across Calendar, Notes, Goals, and Later.

## Design decisions

- Apply Giorgi's Etlyn preferences: HBO Max-style outline-to-filled selection semantics, the stated Apple Music/Opal glass-control preference, and restrained fine edges. These are qualities from his preference catalog, not newly inspected app screenshots or copied assets.
- Use a matched, code-native 22-point outline/filled icon set: a crisp calendar grid, note, milestone flag for Goals, and bookmark for Later (saved for later, not a clock).
- A softly tinted selection capsule slides between tabs. Native-driven spring translation and a small press deformation add movement without continuous decorative animation. Selection remains legible through filled icon, label weight, and capsule, not color alone.
- After feedback that the first pass felt oversized and unnaturally bubbly, reduce the dock from 70 to 56 points and the independent plus button from 60 to 46 points. Keep 48-point-high tabs and 11-point labels. These are our compact proportions, not an Apple-mandated tab-bar height; [Apple's guidance](https://developer.apple.com/design/tips/) specifies at least 44 × 44-point touch controls.
- Retain the existing iOS system-thin-material blur, but remove the navigation sheen, inner rim, selection outline, and plus border. Use a quieter external shadow and neutral graphite/silver selection instead of green. The plus is a borderless frosted circle, with no decorative ring. Keep the dotted header branding unchanged.
- Reduce selection press deformation to 2%; the plus uses opacity feedback without scaling. The surface should feel like navigation, not an inflated bubble.
- All main tabs now float over page content. Existing bottom content insets leave room to scroll past the bar. The bar hides for the software keyboard and returns when it closes.

## Native boundary

### Latest refinement

The compact geometry and icon set were approved. Give Calendar 1.2 shares of the dock width versus 1 for each other tab, and soften its selection corners to leave more room around the longer label. Selection translation uses the actual weighted widths. The selection now has its own native blur surface, a soft directional sheen, and a diffuse shadow; it retains no outlined rim. This follows Giorgi's glass-depth preference without restoring the earlier heavy bubble treatment. Checked Calendar in light/dark and selection alignment on Later; saved preferences remain unchanged.

The blue plus experiment was rejected: the global 46-point plus now uses the existing brand `palette.mint` in light mode and `palette.mintMuted` in dark mode, with a brand-colored shadow and no border. To improve light-mode dock separation, add a neutral hairline perimeter overlay, a white translucent wash, and a slightly stronger shadow. The overlay does not affect touch handling or layout measurements. Remove the selection's blue undertone while preserving its approved shape and blur. Visually verified the revised light-mode Calendar in the simulator.

This pass adds no native code or dependencies. It uses the existing `UIVisualEffectView` bridge plus React Native's native animation driver. It is a liquid-inspired glass treatment, **not** Apple's iOS 26 `UIGlassEffect` or a native `UITabBar`. A full native rewrite is not needed for this visual pass; actual system refraction or native interactive tab-bar gestures would be a separate native integration.

Reduce Motion disables spring movement/deformation. The existing Reduce Transparency fallback remains opaque. Native view registration remains isolated from theme/component Fast Refresh.

## Verification

Spacing/lift refinement: derive the dock radius (28), selection radius (24), and 4-point inset from the same geometry. This replaces the selection's former 20-point corners, keeping its end curves concentric with the dock. Remove the selection shadow so it cannot muddy the inner gap. Increase only the outer shadows' softness and vertical offset (dock 12/6, plus 10/5), retaining low opacity and the existing sizes/colors. Verified both Calendar and Later end positions in the simulator; tests assert the shared inset/radius relationship.

Final color correction: the plus matches MonthCalendar's selected day exactly (`#152D25` with white icon in light mode; `#D8F3E5` with `#101916` icon in dark mode). Its shadow uses the same dark green. This supersedes the brighter teal experiment; geometry, glass, and dock edge remain unchanged.

For the compact revision, inspected Calendar, Goals, and Later in light mode, verified Notes navigation and the global task composer, and checked Calendar in a temporary dark preview. Removed the temporary theme override afterward. No tasks or preferences were saved or modified during visual checks.

Automated tests cover tab navigation and prevented presses, all-tab task creation, compact control dimensions and borderless plus, selection-lens sizing, Reduce Motion, and keyboard hide/restore. Static screenshots confirm final states, not a measured frame rate.
