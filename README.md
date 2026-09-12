## Offtasks Mobile

This repository owns the React Native iOS and Android client for Offtasks,
maintained by Etlyn. It was extracted from `etlyn/offtasks.com` with the mobile
Git history preserved. The landing pages and browser app remain in
[offtasks.com](https://github.com/etlyn/offtasks.com).

The app opens a device-local workspace without requiring an account. Sign-in
is optional for cross-device sync. The clients use the same Supabase backend
for auth, tasks, and preferences.
Shared database migrations and Edge Functions remain in
[offtasks.com/supabase](https://github.com/etlyn/offtasks.com/tree/main/supabase).
No sibling checkout is required to install or run this app.

### 1. Prerequisites

- React Native CLI environment set up (Xcode, Android Studio, simulators/emulators).
- Xcode 26 or later for App Store Connect uploads. Apple checks the SDK used to build the archive, so keeping `IPHONEOS_DEPLOYMENT_TARGET` at 15.1 is fine, but the release archive must be produced by the iOS 26 SDK or later.
- Node.js 24 (`nvm use`) and Yarn 1.22.22 (available through `npx yarn@1.22.22`).
- Ruby + Bundler for managing CocoaPods via the supplied `Gemfile`.

### 2. Environment variables

1. From this repository root, duplicate the sample file:
   ```sh
   cp .env.example .env
   ```
2. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the same project as the web client's `VITE_PUBLIC_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_ANON_KEY`. Use only the public anonymous key, never a service-role key; backend access must be protected by Row Level Security.
3. Account deletion requires the Supabase `delete-account` Edge Function to be deployed for the same project. The mobile client sends the active access token to that function and then clears the local native session.

### 3. Install dependencies

```sh
nvm use
# JS dependencies
npx --yes yarn@1.22.22 install --frozen-lockfile

# iOS native dependencies
bundle install
bundle exec pod install --project-directory=ios
```

For Xcode Cloud builds, the repository includes [ios/ci_scripts/ci_post_clone.sh](ios/ci_scripts/ci_post_clone.sh) so the workflow installs `node_modules`, Bundler gems, and CocoaPods before `xcodebuild` starts. The pre-build guard in [ios/ci_scripts/ci_pre_xcodebuild.sh](ios/ci_scripts/ci_pre_xcodebuild.sh) also fails early if the workflow is still using an iPhoneOS SDK older than 26. If App Store Connect reports an old SDK, update the Xcode Cloud workflow's Environment Xcode version to Xcode 26 or later and rebuild the archive.

After the split, reconnect Xcode Cloud to `etlyn/offtasks-mobile`, branch `main`,
and select `ios/OfftasksMobile.xcworkspace` with scheme `OfftasksMobile`.
Remove any old `mobile/` prefix in workflow paths. Retain the existing bundle
IDs, widget App Group, signing team, and App Store Connect application.
Reconfigure environment values and signing access through the secure CI and
Apple account settings; they are not transferred by a Git repository split.
Archive with Xcode 26 or later and distribute through the existing App Store
Connect app. Roll back source by selecting an earlier commit in this repository;
store releases still require a new build number. Android releases likewise need
the existing private release keystore supplied securely, not the debug keystore.

### 4. Run the app

All device runs use **Release** and the production Supabase project. The `ios`
and `android` commands run `verify:production` first, checking HTTPS, anonymous
key/project matching, expiry, and auth health without submitting account credentials.
Do not substitute localhost, staging, or a different project to bypass a failed
check. Confirm the production project in Supabase before changing `.env`.

Device commands set `NODE_ENV=production`. Preflight reads `.env`,
`.env.production`, `.env.local`, then `.env.production.local`, with process
values taking precedence, matching the bundler. Non-production `APP_ENV` or
`BABEL_ENV` overrides are rejected.

```sh
npm run verify:production
yarn ios      # paired iPhone, Release configuration
yarn android
```

Release bundles include JavaScript and do not require Metro. Before a manual
`xcodebuild` invocation, run `npm run verify:production` and pass
`-configuration Release` with `NODE_ENV=production`. Xcode Cloud also runs the same preflight.
`yarn start` remains available for explicit Metro development, not device releases.

Tips for iOS:

- Open the Simulator first (`open -a Simulator`) to speed up the first build.
- If CocoaPods installation fails because of missing headers, open the Xcode workspace once and re-run `bundle exec pod install`.
- Use <kbd>Cmd</kbd> + <kbd>R</kbd> in the simulator to trigger a cold reload.

### 5. Project layout

- The main tabs are Calendar, Notes, Goals, and Later.
- Calendar uses `react-native-calendars`, opens on today, marks scheduled days,
  and filters tasks by the selected date. Unfinished older tasks also appear
  today. New tasks are scheduled for the selected current/future day; historical
  days are view/edit only. Completion preserves a task's scheduled date.
- Guest tasks, notes, goals, and preferences persist in device-local AsyncStorage.
  Uninstalling or clearing app data can remove them; local storage is not an
  encrypted backup. No account is required for the four planner tabs or Statistics.
- Notes supports create/edit/delete, search, pinning, and timestamps. Account
  notes and empty goals use a durable local sync outbox; failed saves retain the
  draft and corrupt storage is not reset. The new backend migration must be
  deployed before account Notes/Goals sync and device import work.
- Goals are task lists backed by existing task labels/categories, with completion
  progress. Lists can be created and empty lists removed without deleting tasks.
  List names are owner-scoped locally and sync for accounts after backend rollout.
  Labels on account tasks still use the existing Supabase task contract. Existing task labels are always
  included. Legacy shared-device category suggestions are not copied between accounts.
- Later retains the existing upcoming/backlog task workflow. Statistics and
  account/preferences remain in the drawer.
- The guest drawer offers **Sign in for sync** using the existing auth flows.
  Signed-in users can select **Account and sync > Import device items** and
  explicitly confirm adding their guest copy to the account. Import retains the
  guest copy and does not replace existing account items. Signing out returns
  to the separate guest workspace. Account tasks remain online-first, unlike
  guest tasks and the Notes/Goals outbox.
- `App.tsx` wires navigation, auth state, and shared providers.
- `src/lib/supabase.ts` configures the Supabase client with AsyncStorage.
- `src/providers/` exposes auth + tasks contexts that mirror the web app behaviour.
- `src/screens/LoginScreen.tsx` implements email/password auth, sign-up, and reset flows.
- `src/screens/TasksScreen.tsx` renders the four task buckets (today, tomorrow, upcoming, closed).
- `src/components/` houses mobile equivalents of list items, headers, and sections.

### 6. Testing

```sh
yarn test --runInBand --watchman=false
npm run test:release
npx tsc --noEmit
```

Jest is configured to resolve the `@/` alias and to mock `@env` variables.
GitHub CI performs a frozen dependency install and runs these tests. Native
compilation, signing, device testing, and store uploads remain separate gates.
`yarn lint` runs the existing ESLint configuration.

The 58 mobile manual acceptance scenarios and a Maestro guest flow live in
[etlyn-e2e/offtasks/mobile](https://github.com/etlyn/etlyn-e2e/tree/main/offtasks/mobile).
From an `etlyn-e2e` checkout, run `yarn e2e:test:offtasks:mobile`.
Manual scenarios are not automated test results.

The September 2026 sign-in investigation reproduced `ENOTFOUND` for the obsolete
project origin inherited from the deployed website. The healthy production
project is `nqsclqtpnosuhoobgyxc` (Task App in Etlyn's Org), verified against all
four checked-in migration versions. The preflight pins this project; configure
its public URL and anonymous key locally before rebuilding. No production
schema changes or authentication bypasses are part of this UI update.

### Device-first Release Gate

The new `20260912000000_device_planner_sync.sql` migration is owned by
`offtasks.com/supabase/migrations`. It adds owner-protected planner records and
a transactional, retry-safe guest import RPC. It has **not been deployed** by
this work. Test the migration, RLS, auth, import, and deletion against an isolated
Supabase environment before a separately authorized production rollout.

See [the readiness report](docs/guest-first-readiness.md) for actual execution
counts and blockers. The web client has no Notes/Goals UI yet; storing those
records in Supabase does not establish web feature parity.

### 7. Keeping parity with the web app

- Supabase helpers (`src/lib/supabase.ts`) mirror the contracts in `etlyn/offtasks.com`.
- UI colours live in `src/theme/colors.ts` and follow the dark palette used on the web.
- New backend columns/endpoints should be updated in both projects so the experiences stay aligned.
