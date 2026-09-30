# Local iPhone release builds

Run these commands from this repository. A paired iPhone with Developer Mode
enabled can connect over the same local network. A signing identity and
provisioning access for the existing Etlyn team are also required.

## Toolchain and dependencies

On an Apple silicon Mac with Homebrew and Xcode installed:

```sh
brew install ruby@3.3
nvm use
export PATH="$(brew --prefix ruby@3.3)/bin:$PATH"
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

yarn install --frozen-lockfile
bundle install
bundle exec pod install --project-directory=ios --deployment
```

`DEVELOPER_DIR` selects Xcode for this shell even if the machine's default still
points to Command Line Tools. Gems are installed in `vendor/bundle` through the
repository's Bundler configuration. Use `bundle exec pod`, since an unrelated
global `pod` executable may still use macOS's old system Ruby.

The Podfile raises dependency resource-bundle deployment targets below React
Native's minimum to that minimum. This keeps the existing iOS 15.1 application
support while satisfying Xcode 27's supported target range.

If a new Ruby version or filesystem changes generated local podspec checksums,
`--deployment` can reject the old checksums. Inspect the difference, run ordinary
`bundle exec pod install --project-directory=ios`, and verify that the `PODS`
dependency versions remain unchanged before accepting the updated lockfile.

## Build and install

List devices and use the intended physical device's identifier:

```sh
xcrun devicectl list devices
export DEVICE_ID='your-paired-iphone-identifier'
export NODE_ENV=production
node scripts/verify-production.mjs &&
xcodebuild \
  -workspace ios/OfftasksMobile.xcworkspace \
  -scheme OfftasksMobile \
  -configuration Release \
  -destination "platform=iOS,id=$DEVICE_ID" \
  -derivedDataPath ios/build/DerivedData \
  -jobs 2 \
  -allowProvisioningUpdates \
  build &&
xcrun devicectl device install app --device "$DEVICE_ID" \
  ios/build/DerivedData/Build/Products/Release-iphoneos/OfftasksMobile.app &&
xcrun devicectl device process launch --device "$DEVICE_ID" \
  --terminate-existing com.etlyn.offtasks
```

When the repository lives on the SSD, the explicit DerivedData path keeps native
build output there too. Two build workers limit concurrent compiler memory use.
The Xcode JavaScript bundle phase passes both script paths as quoted arguments,
so a volume name containing spaces (such as `Etlyn Dev`) is supported.
The Release app includes its JavaScript bundle and does not need Metro.
Installing the same bundle ID updates the existing installation; do not uninstall
the app as a routine troubleshooting step because guest data is device-local.

## iOS 27 startup

The app uses UIKit's scene lifecycle: `AppDelegate` owns the React Native factory,
and `SceneDelegate` starts it in the scene's window. `Info.plist` registers that
delegate and keeps multiple windows disabled. This is required when building
with the iOS 27 SDK; the former app-delegate-only lifecycle builds successfully
but terminates at launch in `UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`.
See [Apple's scene lifecycle migration guide](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle).

After installation, verify that the launched app remains in CoreDevice's running
process list. A successful launch command alone does not confirm healthy startup.
