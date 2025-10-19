## Offtasks Mobile

This folder hosts the React Native client for Offtasks. It mirrors the dark, card-based aesthetic from the web app while talking to the same Supabase backend for auth and data.

### 1. Prerequisites
- React Native CLI environment set up (Xcode, Android Studio, simulators/emulators).
- Node.js 20 (the repo currently uses 20.19.3; upgrade to ≥20.19.4 to avoid `--ignore-engines`).
- Ruby + Bundler for managing CocoaPods via the supplied `Gemfile`.

### 2. Environment variables
1. Duplicate the sample file and fill in the existing Supabase values used by the web app:
   ```sh
   cd OfftasksMobile
   cp .env.example .env
   ```
2. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` to match `NEXT_PUBLIC_SUPABASE_*` from the root project. These are already public in the web bundle, so reusing them in mobile is safe.

### 3. Install dependencies
```sh
cd OfftasksMobile
# JS dependencies
yarn install --ignore-engines

# iOS native dependencies
bundle install
bundle exec pod install --project-directory=ios
```

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
yarn test
```
Jest is configured to resolve the `@/` alias and to mock `@env` variables.

### 7. Keeping parity with the web app
- Supabase helpers (`src/lib/supabase.ts`) intentionally mirror `src/lib/supabase.ts` from the Next.js app.
- UI colours live in `src/theme/colors.ts` and follow the dark palette used on the web.
- New backend columns/endpoints should be updated in both projects so the experiences stay aligned.
