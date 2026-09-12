# Guest-first Readiness Report

Evidence date: 2026-09-12 UTC. Verdict: **Not ready for App Store submission.**

Guest-first implementation and local regression checks are complete. The request
to exercise every native action with both a guest and a real test account is
not complete: native automation failed before its first app action, and the
isolated Supabase backend could not start. No production test writes or database
deployments were performed. Mocked contracts below are not real-account E2E.

## Behavior and Coverage

| Feature/actions                                         | Guest behavior                         | Account behavior                                  | Evidence / remaining coverage                                                                                       |
| ------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Launch, four tabs, optional auth/back                   | Calendar opens without account         | Existing session opens account workspace          | Direct Release simulator launch and screenshot; tab navigation component test. Native auth/back journey blocked.    |
| Tasks: create, read, edit, complete, reopen, delete     | Durable serialized local storage       | Existing Supabase task CRUD                       | Repository CRUD/isolation tests; native task UI lifecycle and real API persistence not executed.                    |
| Calendar: dates, today, expand/collapse, overdue tasks  | Local task filtering                   | Same controller                                   | Month navigation component and task selection tests; timezone/midnight/long-list native cases remain.               |
| Later, priorities, labels, search, filters              | Available locally                      | Existing task contract                            | Source wiring reviewed; full UI combinations, swipe deletion, keyboard paths not executed natively.                 |
| Notes: create, edit, delete, search, pin                | Device-local                           | Local outbox plus planner sync                    | Screen CRUD/search/pin tests, failed-save draft/corruption tests. Remote merge/deletion/outage contracts mocked.    |
| Goals: create, detail, progress, remove empty list      | Device-local                           | Local outbox plus planner sync                    | Create/detail screen and summary tests. Native removal, concurrent clients and real backend unverified.             |
| Statistics: metrics, edit, complete, restore, Home      | Uses guest task repository             | Uses account repository                           | Schedule and Home route fixed by review; complete Statistics native journey unexecuted.                             |
| Preferences: theme, hide completed, advanced, auto-move | Owner-scoped local settings            | Local settings with remote preference hydration   | Remote-before-write race guarded; hydration/concurrency/failed-disk UI tests missing.                               |
| Sign-in, signup, email confirmation, reset              | Optional, dismissible auth screen      | Existing Supabase auth flows                      | Empty-submit validation tested without network; real signup/sign-in/reset/expiry not run.                           |
| Import device items                                     | Never automatic                        | Explicit confirmation, retained guest copy        | RPC payload and success/failure retention tests mocked. SQL transaction/idempotency/RLS unvalidated on Supabase.    |
| Sync retry and account separation                       | Guest repositories make no cloud calls | Owner-scoped Notes/Goals, manual Sync now         | Offline outbox, stale snapshot preservation, deletion, owner filter contracts pass; live cross-device sync blocked. |
| Sign-out and account deletion                           | Guest copy retained                    | Backend delete plus account cache/session cleanup | Source reviewed; live deletion/cascade/session revocation not executed.                                             |
| Widget                                                  | Local task snapshot published          | Account snapshot published                        | Bridge wiring only; widget UI and account-switch privacy need native checks.                                        |

## Executed Checks

- Mobile Jest: **8 suites, 23 tests passed**. Suites: account, App,
  localTasks, notes, planner, planner-screens, plannerSync, taskRepository.
- Production configuration guards: **5 tests passed**. Actual read-only auth
  health preflight passed against the pinned Task App project before native builds.
- TypeScript: `tsc --noEmit --pretty false`, passed.
- Scoped ESLint on touched guest/auth/planner source and tests: no errors
  (`--quiet`). Existing inline-style/no-void warnings remain; not a warning-free audit.
- Etlyn E2E provider: **13 tests passed**, including inventory/report isolation.
  Mobile inventory is now **12 features / 58 scenarios**; web remains 11 / 59.
  These inventory tests do not execute application actions.
- Simulator Release compiled, installed, and launched on dedicated iPhone 17 Pro,
  iOS 26.5, simulator `27B93E7C-EFB1-4151-8798-1FC0B2559AF6`.
- Direct screenshot inspected: Calendar opens without auth and all four tabs
  render. A tab-bar overlap found in this check was corrected and rebuilt.
- Maestro 2.10.0 guest flow: **blocked, zero app actions executed**, on two
  attempts. XCTest runner exited with signal kill before connecting. Increasing
  `MAESTRO_DRIVER_STARTUP_TIMEOUT` did not fix it. Do not record this as a pass.
- Real-account E2E: **blocked**. Supabase CLI 2.117.0 initialization succeeded,
  but Docker image pulls exhausted disk and the engine subsequently returned
  `Bad response from Docker engine`. Space was recovered from task-owned build
  artifacts; shared Docker services were not restarted or pruned.

Commands from the mobile root:

```sh
node node_modules/jest/bin/jest.js --runInBand --watchman=false
node --test scripts/verify-production.test.mjs
node node_modules/typescript/bin/tsc --noEmit --pretty false
node scripts/verify-production.mjs
```

Use Node 24.21.0, Xcode 26.6, Release configuration and production env for phone
delivery. Native acceptance guidance and flow live in `etlyn-e2e/offtasks`.

## Bugs Fixed

- Mandatory login no longer blocks device use; guest task actions now persist.
- Account/guest provider state and storage are separated on session changes.
- Remote preferences are read before modified values may be uploaded.
- Task read errors are visible with retry instead of silently showing empty data.
- Statistics completion preserves schedules and Home returns to Calendar.
- Planner saves use deltas so stale screens do not delete newly arrived records.
- Fresh account caches do not upload default goals over server deletions.
- Planner reads paginate, use native-compatible abort signals and preserve local
  edits made during sync. Notes and Goals no longer hide each other's errors.
- Account deletion still attempts local sign-out if planner-cache cleanup fails.
- Signup confirmation guidance now matches email-confirmation-enabled projects.
- Tab bar reserves layout space instead of showing content through its controls.

## Release Blockers and Gaps

1. Validate and deploy the new planner/import migration through the backend
   owner's release process. It is unapplied; Notes/Goals account sync and import
   will report unavailable until the service supports them.
2. Restore an isolated Supabase test environment, use disposable accounts, test
   all auth modes, RLS denial between two users, import twice, rollback on invalid
   payload, deletion cascades, and two-client sync. Clean up test accounts.
3. Fix the XCTest runner environment and execute the native guest flow plus all
   task/notes/goals/preferences/Statistics/auth actions. Keep failed-run evidence.
   Validate restart durability, offline mode, cancellation, duplicate taps,
   storage failures, keyboard dismissal, VoiceOver, Dynamic Type and small screens.
4. Account tasks are online-first: no offline task outbox/cache. Sync is not
   realtime, conflicting edits are last-upload-wins, and Notes lacks automatic
   foreground/refocus sync. Preferences can silently fail local persistence.
   Unscoped legacy preferences are not migrated to the new account keys.
5. Verify production password-reset/confirmation redirects and web recovery.
   Dashboard configuration showed localhost defaults; native delivery does not
   establish email-link correctness. Web Notes/Goals parity is not implemented.
6. Update privacy policy/App Store privacy disclosures for local and synced notes,
   data retention and account deletion; verify auth-token storage requirements.
   Resolve the previously reported credential exposure through controlled key
   rotation. No sensitive key is included in this report or test artifacts.
7. Complete widget/account-switch validation, physical-device launch and offline
   smoke, current screenshots, age rating, support/privacy URLs, review account,
   unique build number, archive validation and TestFlight review. A development-
   signed Release install is not an App Store archive or submission approval.

## Evidence Locations

Ignored mobile artifacts: `build/simulator-guest-final.log`,
`build/phone-guest-final.log`, `build/guest-final-calendar.png`.
Maestro failure logs: `~/.maestro/tests/2026-09-11_203805` and
`~/.maestro/tests/2026-09-11_204218` (local timezone).
Shared manual inventory report is generated with `--default-status pending`,
not passed. No coverage percentage or zero-bug claim is warranted.

## Phone Delivery

Final signed Release **built and installed** on Giorgi's paired iPhone on
2026-09-12 UTC, without uninstalling the existing app. Bundle ID
`com.etlyn.offtasks`, version `1.06`, build `2`, with `OfftasksWidget.appex`.
`codesign --verify --deep --strict` passed. The bundled JavaScript contains the
pinned production origin and neither the obsolete project nor isolated-test
endpoint. Production auth health preflight passed before the build.

Automatic launch was **blocked by the locked phone** (CoreDevice error 10002,
underlying `FBSOpenApplicationErrorDomain` code 7, `Locked`). Unlock the iPhone
and open Offtasks to perform the physical-device smoke check. Installation is
confirmed; phone launch and all-action acceptance are not. No TestFlight upload
or App Store submission was performed, and build numbering was not changed.
