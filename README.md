## Offtasks Mobile

This repository owns the React Native iOS and Android client for Offtasks,
maintained by Etlyn. It was extracted from `etlyn/offtasks.com` with the mobile
Git history preserved. The landing pages and browser app remain in
[offtasks.com](https://github.com/etlyn/offtasks.com).

The clients use the same Supabase backend for auth, tasks, and preferences.
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

```sh
# Terminal 1 – start Metro
yarn start

# Terminal 2 – launch a simulator/device
yarn ios      # defaults to the last-used iOS simulator
# or
yarn android
```

Tips for iOS:

- Open the Simulator first (`open -a Simulator`) to speed up the first build.
- If CocoaPods installation fails because of missing headers, open the Xcode workspace once and re-run `bundle exec pod install`.
- Use <kbd>Cmd</kbd> + <kbd>R</kbd> in the simulator to trigger a cold reload.

### 5. Project layout

- `App.tsx` wires navigation, auth state, and shared providers.
- `src/lib/supabase.ts` configures the Supabase client with AsyncStorage.
- `src/providers/` exposes auth + tasks contexts that mirror the web app behaviour.
- `src/screens/LoginScreen.tsx` implements email/password auth, sign-up, and reset flows.
- `src/screens/TasksScreen.tsx` renders the four task buckets (today, tomorrow, upcoming, closed).
- `src/components/` houses mobile equivalents of list items, headers, and sections.

### 6. Testing

```sh
yarn test --runInBand --watchman=false
```

Jest is configured to resolve the `@/` alias and to mock `@env` variables.
GitHub CI performs a frozen dependency install and runs these tests. Native
compilation, signing, device testing, and store uploads remain separate gates.
`yarn lint` runs the existing ESLint configuration.

The 50 mobile manual acceptance scenarios live in
[etlyn-e2e/offtasks/mobile](https://github.com/etlyn/etlyn-e2e/tree/main/offtasks/mobile).
From an `etlyn-e2e` checkout, run `yarn e2e:test:offtasks:mobile`.
Manual scenarios are not automated test results.

### 7. Keeping parity with the web app

- Supabase helpers (`src/lib/supabase.ts`) mirror the contracts in `etlyn/offtasks.com`.
- UI colours live in `src/theme/colors.ts` and follow the dark palette used on the web.
- New backend columns/endpoints should be updated in both projects so the experiences stay aligned.
