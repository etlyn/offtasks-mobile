# Drawer refinement

September 12, 2026: apply the Etlyn preference lens to the drawer without redesigning the approved header or dock.

- Compact wordmark and 36-point glass close surface inside a 44-point target; header stays visible while settings scroll.
- Quiet account identity row with a rounded-square, neutral brand avatar. Opens Account rather than unexpectedly navigating to Calendar.
- One thin-edged glass Statistics shortcut with a compact completion fraction when tasks exist; no 0/0 empty badge.
- Unboxed preference rows, 15-point labels, 12-point explanations only where useful, coherent 18-point outline icons, and faint inset dividers.
- Preserve native switches, existing preference persistence, and dark-green / pale-mint brand states. Rows use minimum heights and flexible text for larger text sizes.
- Brand-solid guest sign-in action; signed-in account remains available from the profile. Log out and the guarded delete-account action remain available below preferences. Version is quiet footer metadata.
- Subtle shared backdrop, rounded trailing drawer corners, native gesture-driven drawer motion, and gently eased press feedback respecting Reduce Motion. Glass uses the existing native material where available; it is not a claim of UIGlassEffect.

Reference direction comes from Giorgi's stated ChatGPT minimal-layout and Netflix fine-divider preferences, not newly captured reference-app screens.

## Interactive drawer handoff — November 4, 2026

Implemented from [Drawer · Interactive component states / handoff · not routes](https://www.figma.com/design/BOIj901Tj8pYt8oNq3BfYe/Offtasks?node-id=3406-461).
This supersedes the older drawer geometry above; planner header, dock and Notes remain unchanged.

- Full-width, plain journey surfaces with device-safe insets, real account/guest identity, 32-point muted Lucide icon slots, 52-point utility rows, compact explicit sun/moon selection, and footer account action.
- Guest/Signed Off, On and Confirm are owner-scoped Return to Later states; native Enable/Cancel consent explains permanent date removal. Sign-out failure stays inline. Guest Cleanup retries local cleanup only.
- Privacy Off/On/Error uses the real analytics SDK, truthful collection/retention disclosure, and retryable persistence. A failed opt-out save still stops collection for the session.
- Recovery Ready/Expired uses matching password validation, a real reset-link request, and account-bound password update/sign-out. A saved password is never resubmitted when only sign-out needs retrying.
- Account Idle/Syncing/SyncError, Importing/Imported/ImportError, Deleting/DeleteError and native import/delete confirmations use real services. A successful import followed by a refresh failure remains an imported result. Device guest data is never removed by import or account deletion.
- Auth SignIn/Create/ResetLink, SignInBusy/SignInError, CreateBusy/Inbox/ResetSent share a compact form with inline feedback. Existing Google sign-in and ChatGPT connected-app controls remain accessible.

Drawer destinations and auth modes use local component state. The existing Account route remains for onboarding and post-sign-in device-item review; statistics still opens its existing destination. Native status/home chrome and native alerts are not copied as assets. Icons directly reuse the exact installed lucide-react-native 1.45.0 sources identified by Figma. Temporary Inter in the handoff stays native SF Pro in the app, consistent with the approved implementation baseline.

Confirmed account deletion is durably recorded before local cleanup. Retrying it cannot call the deletion service again. Unknown/interrupted outcomes require explicit review before a separate deletion confirmation; a definitive pre-deletion rejection can retry normally. Account identity is rechecked around delayed operations, and imports use the reviewed account token. Confirmed cleanup cannot erase a guest/replacement account's widget snapshot.

Transitions use the existing 320ms gentle easing and Reduce Motion support. Labels and rows can grow with text size, with 44-point controls retained. Verification evidence for the exact delivered source and native app is recorded separately from these implementation notes.
