# Expo Brownfield — Complete Build, Publish & Release Guide

This document covers everything you need to develop, publish, and ship the brownfield integration across Android and iOS.

---

## Project structure

```
cl-poc/
├── circlescare-expo/          Expo / React Native source app
│   ├── app.json               version, EAS project ID, brownfield publish config
│   ├── eas.json               EAS Build profiles (dev / preview / production)
│   ├── artifacts/             iOS XCFramework output (built by expo-brownfield)
│   │   ├── circlescareexpobrownfield.xcframework
│   │   └── hermesvm.xcframework
│   └── scripts/
│       ├── publish-brownfield-android.js   Android publish automation
│       └── fix-expo-updates-ndk.js         NDK version patch (applied on npm install)
│
├── circlescare-android/       Native Android host app
│   ├── settings.gradle.kts    GitHub Packages Maven repository
│   ├── app/build.gradle.kts   brownfield dependency
│   └── gradle/libs.versions.toml  brownfield version
│
├── circlescare-ios/           Native iOS host app
│   └── circlescare-ios/
│       ├── ContentView.swift              launches Expo via ReactNativeView
│       ├── circlescareexpobrownfield.xcframework   linked locally
│       └── hermesvm.xcframework                    linked locally
│
└── .github/workflows/
    └── publish-brownfield-android.yml     CI publish for Android
```

---

## Two-layer update model

```
Native layer  →  requires new build + publish
JS/asset layer  →  OTA via EAS Update, no rebuild
```

| Changed | Action |
|---|---|
| Native module, Expo plugin, RN version, node_modules native code | Bump version → publish brownfield → rebuild host apps |
| JS code, screens, assets, styles | EAS Update only (no rebuild) |

---

## Prerequisites

Install these once on your machine.

| Tool | Install command |
|---|---|
| Node 20+ | `brew install node` |
| npm | comes with Node |
| Expo CLI | `npm install -g expo-cli` |
| EAS CLI | `npm install -g eas-cli` |
| Android Studio + SDK | [developer.android.com/studio](https://developer.android.com/studio) |
| Xcode 16+ | Mac App Store |
| CocoaPods | `sudo gem install cocoapods` |
| Java 17 | `brew install openjdk@17` |

NDK `27.1.12297006` — install via Android Studio → SDK Manager → SDK Tools → NDK (Side by side).

---

## One-time credential setup

### GitHub personal access token (classic)

Required for publishing Android artifacts to GitHub Packages and for downloading them on Android host builds.

**Must be a classic token — fine-grained tokens (`github_pat_...`) do not work with GitHub Packages Maven.**

1. Open [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token → Tokens (classic)**
3. Name it `brownfield-local`, expiry 90 days
4. Tick only: `read:packages` and `write:packages`
5. Click **Generate token**, copy the token (`ghp_...`)

Create `~/.gradle/gradle.properties` (on your machine only, never committed):

```properties
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8

gpr.user=iniyanmurugavel
gpr.key=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### EAS login (one-time)

```bash
eas login
```

Log in with your Expo account (`anithaaji`).

---

## Android brownfield — publish to GitHub Packages

Run this whenever native code changes.

### Step 1 — Bump the version

Both files must have the same version. The publish script fails if they differ.

**`circlescare-expo/app.json`**
```json
{ "expo": { "version": "1.0.1" } }
```

**`circlescare-android/gradle/libs.versions.toml`**
```toml
[versions]
brownfield = "1.0.1"
```

GitHub Packages does not allow overwriting a published version — always bump before publishing.

### Step 2 — Publish

```bash
cd circlescare-expo
npm run publish:android:brownfield
```

What happens inside:
1. Reads `gpr.user` / `gpr.key` from `~/.gradle/gradle.properties`
2. Validates credentials and version sync
3. `npm install` (runs NDK patch via postinstall)
4. `expo prebuild -p android --clean` (generates Android project)
5. `./gradlew publishBrownfieldReleasePublicationToGithubPackagesRepository`
6. Uploads AAR + POM + all transitive artifacts to GitHub Packages

Build time: 10–15 min first run, faster after.

### Step 3 — Verify

```
https://github.com/iniyanmurugavel/circles-roaming-brownfield/packages
```

---

## Android host app — build

### Debug build

```bash
cd circlescare-android
./gradlew assembleDebug
```

APK output: `circlescare-android/app/build/outputs/apk/debug/app-debug.apk`

### Release build

```bash
cd circlescare-android
./gradlew assembleRelease
```

APK output: `circlescare-android/app/build/outputs/apk/release/app-release.apk`

### Install on connected device

```bash
cd circlescare-android
./gradlew installDebug
```

Gradle reads `gpr.user` / `gpr.key` from `~/.gradle/gradle.properties` automatically to download the brownfield artifact from GitHub Packages.

### How the Android host loads the Expo screen

`MainActivity.kt` is already wired. It extends `BrownfieldActivity` and calls `showReactNativeFragment("main")` which:

1. Initializes `ReactNativeHostManager` (creates the shared React Native runtime)
2. In debug: wraps the view in a Dev Menu fragment host
3. In release: loads `index.android.bundle` from assets and renders the Expo app full-screen

```kotlin
// circlescare-android/app/src/main/java/.../MainActivity.kt
class MainActivity : BrownfieldActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showReactNativeFragment("main")  // "main" = the root component name
    }
}
```

To embed Expo as a partial screen inside a larger native app instead of full-screen, launch a new `Activity` that extends `BrownfieldActivity` from your existing native activity:

```kotlin
// From any native Activity in the host app
startActivity(Intent(this, ExpoFeatureActivity::class.java))

// ExpoFeatureActivity.kt
class ExpoFeatureActivity : BrownfieldActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showReactNativeFragment("main")
    }
}
```

---

## iOS brownfield — build and link

iOS uses a local XCFramework approach. The XCFramework is built from `circlescare-expo` and then linked directly into the Xcode host project.

### Step 1 — Generate the iOS project

```bash
cd circlescare-expo
npm install
npx expo prebuild -p ios --clean --no-install
```

### Step 2 — Install CocoaPods

```bash
cd circlescare-expo/ios
pod install
```

### Step 3 — Build the XCFramework

```bash
cd circlescare-expo/ios
xcodebuild \
  -workspace circlescare-expo.xcworkspace \
  -scheme brownfield \
  -configuration Release \
  -destination "generic/platform=iOS" \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
  SKIP_INSTALL=NO \
  clean build
```

The XCFramework outputs land in `circlescare-expo/artifacts/`:
- `circlescareexpobrownfield.xcframework`
- `hermesvm.xcframework`

### Step 4 — Copy to the iOS host

```bash
cp -R \
  "/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-expo/artifacts/circlescareexpobrownfield.xcframework" \
  "/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-ios/circlescare-ios/"

cp -R \
  "/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-expo/artifacts/hermesvm.xcframework" \
  "/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-ios/circlescare-ios/"
```

### Step 5 — Build and run the iOS host

Open in Xcode:

```bash
open "/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-ios/circlescare-ios.xcodeproj"
```

Select your simulator or device and press **Cmd+R** to build and run.

### How the iOS host launches Expo

`ContentView.swift` already has the integration wired:

```swift
import circlescareexpobrownfield

struct ContentView: View {
    init() {
        ReactNativeHostManager.shared.initialize()
    }
    var body: some View {
        ReactNativeView(moduleName: "main")
            .ignoresSafeArea()
    }
}
```

No changes needed to the iOS host — just copy the XCFramework and build.

---

## EAS Build — cloud builds (iOS + Android)

EAS Build runs your builds on Expo's cloud servers. Useful when you do not want to run native builds locally, or for producing signed release builds.

### Build profiles (from `eas.json`)

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Dev client with hot reload | Internal (testers) |
| `preview` | Full release behaviour, unsigned | Internal |
| `production` | Signed release build | App Store / Play Store |

### Android EAS Build

```bash
cd circlescare-expo

# Development build
eas build --platform android --profile development

# Preview build (internal testing)
eas build --platform android --profile preview

# Production build (Play Store)
eas build --platform android --profile production
```

> **Important for brownfield:** EAS Build builds the standalone Expo app — it does not build the brownfield AAR or the Android host app. Use EAS Build if you want a standalone Expo APK or AAB for Play Store. Use `./gradlew assembleRelease` in the Android host if you want the brownfield host app.

### iOS EAS Build

```bash
cd circlescare-expo

# Development build
eas build --platform ios --profile development

# Preview build
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production
```

EAS handles signing automatically. For first run it will ask to configure credentials.

### Build both platforms at once

```bash
eas build --platform all --profile preview
```

---

## EAS Update — OTA JS updates (no rebuild)

When only JS, screens, or assets change, you can push an update over the air. Users get it automatically on next app launch.

### How runtime versioning works

`app.json` is configured with:

```json
"runtimeVersion": { "policy": "appVersion" }
```

This means the OTA update channel is tied to `app.json` `version`. An update published for `1.0.0` only reaches devices running the `1.0.0` native build.

### Publish an OTA update

```bash
cd circlescare-expo

# Push to preview channel
eas update --branch preview --message "fix: button label"

# Push to production channel
eas update --branch production --message "feat: new home screen layout"
```

### When to use OTA vs full publish

| Change | Use |
|---|---|
| JS logic, UI, navigation | OTA update only |
| New npm package with native code | Brownfield publish + host rebuild |
| Expo SDK upgrade | Brownfield publish + host rebuild |
| React Native version bump | Brownfield publish + host rebuild |
| New native module (Camera, Maps, etc.) | Brownfield publish + host rebuild |

---

## Full release checklist — native change

Use this when native code changes (new native module, Expo SDK upgrade, etc.).

```
[ ] 1. Bump version in circlescare-expo/app.json
[ ] 2. Bump brownfield version in circlescare-android/gradle/libs.versions.toml  ← same value
[ ] 3. cd circlescare-expo && npm run publish:android:brownfield
[ ] 4. Verify artifact at https://github.com/iniyanmurugavel/circles-roaming-brownfield/packages
[ ] 5. cd circlescare-android && ./gradlew assembleRelease        ← Android host
[ ] 6. cd circlescare-expo && npx expo prebuild -p ios --clean    ← iOS xcframework
[ ] 7. cd circlescare-expo/ios && pod install
[ ] 8. Build brownfield XCFramework (xcodebuild command above)
[ ] 9. Copy XCFramework to circlescare-ios
[ ] 10. Build iOS host in Xcode
```

## Full release checklist — JS-only change

```
[ ] 1. Make JS/asset changes in circlescare-expo
[ ] 2. eas update --branch production --message "your message"
[ ] 3. Done — no rebuild needed
```

---

## CI publish for Android (GitHub Actions)

The workflow `.github/workflows/publish-brownfield-android.yml` runs publish in CI.

The built-in `GITHUB_TOKEN` automatically has `write:packages` — no personal token or secret setup needed in CI.

**Trigger:**
1. Go to [github.com/iniyanmurugavel/circles-roaming-brownfield/actions](https://github.com/iniyanmurugavel/circles-roaming-brownfield/actions)
2. Select **Publish Brownfield Android**
3. Click **Run workflow**
4. Set **Dry run** `false` to publish, `true` to build only

---

## Credential reference

| Credential | Where to put it | Used by |
|---|---|---|
| `gpr.user` / `gpr.key` | `~/.gradle/gradle.properties` | Publish script + Android host build |
| `GITHUB_TOKEN` (Actions) | Automatic — no setup | CI publish |
| EAS account | `eas login` | EAS Build + EAS Update |
| Apple credentials | EAS manages them | iOS App Store builds |
| Android keystore | EAS manages them | Android Play Store builds |

**Never put credentials in:**
- Any tracked file in the repo
- `circlescare-android/local.properties`
- `app.json` or `eas.json` directly

---

## Version compatibility

| Tool | Required version |
|---|---|
| Android Gradle Plugin | 8.9.1 |
| Gradle | 8.11.1 |
| Kotlin | 2.2.20 |
| NDK | 27.1.12297006 |
| Xcode | 16+ |
| Node | 20+ |
| Expo SDK | 55 |
| React Native | 0.83.6 |

---

## Troubleshooting

### Android: 401 Unauthorized on publish or host build

- `~/.gradle/gradle.properties` is missing or has wrong token
- Token is a fine-grained PAT (`github_pat_...`) — must be classic (`ghp_...`)
- Token lacks `write:packages` (publish) or `read:packages` (host build)

Fix: generate a new classic PAT at [github.com/settings/tokens](https://github.com/settings/tokens) and update `gpr.key` in `~/.gradle/gradle.properties`.

### Android: 409 Conflict on publish

Version already published. GitHub Packages does not allow overwriting.

Fix: bump `version` in `app.json` and `brownfield` in `libs.versions.toml`, then re-publish.

### Android: version mismatch error

```
Version mismatch between Expo app and Android host:
  app.json           → 1.0.1
  libs.versions.toml → 1.0.0
```

Fix: make both the same value before running publish.

### Android: Could not find com.anithaaji.circlescareexpo:brownfield

- `~/.gradle/gradle.properties` missing or wrong credentials
- Version in `libs.versions.toml` does not match anything published

Fix: check credentials and that the version exists at the GitHub Packages URL.

### Android: NDK mismatch (CXX1101 / CXX1104)

Fix:
1. Open Android Studio → SDK Manager → SDK Tools → NDK (Side by side)
2. Uninstall broken NDK versions
3. Install `27.1.12297006`

### iOS: XCFramework not found in Xcode

The XCFramework was not copied to `circlescare-ios/circlescare-ios/` after rebuilding.

Fix: repeat Steps 3–4 in the iOS brownfield build section above.

### iOS: module 'circlescareexpobrownfield' not found

The XCFramework is missing from the Xcode project.

Fix: In Xcode → Project settings → Frameworks, Libraries, and Embedded Content — add `circlescareexpobrownfield.xcframework` and `hermesvm.xcframework`.

### EAS Build fails: missing credentials

Run `eas credentials` and follow the prompts to configure Apple or Android signing.
