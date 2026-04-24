# Circles Brownfield — Developer & Release Guide

Metro development · Dev / QA / Production workflows · Build & Deploy

---

## Table of contents

1. [Quick-start Metro development](#1-quick-start-metro-development)
2. [Environment overview](#2-environment-overview)
3. [Development workflow (DEV)](#3-development-workflow-dev)
4. [QA workflow](#4-qa-workflow)
5. [Production release workflow](#5-production-release-workflow)
6. [Android host build matrix](#6-android-host-build-matrix)
7. [iOS host build matrix](#7-ios-host-build-matrix)
8. [OTA JS-only update (any environment)](#8-ota-js-only-update-any-environment)
9. [When to do a native publish vs OTA](#9-when-to-do-a-native-publish-vs-ota)
10. [Credential setup](#10-credential-setup)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Quick-start Metro development

This gets the Expo app running on a connected device or emulator within minutes, without rebuilding the native host.

### Prerequisites (one-time)

```bash
# From circlescare-expo/
npm install
```

### Start Metro bundler

```bash
cd circlescare-expo
npm start          # or: expo start
```

Metro starts on `http://localhost:8081`. Leave this terminal open.

Options:

| Flag | Purpose |
|---|---|
| `npm start` | Default — press `a` for Android, `i` for iOS |
| `npm start -- --clear` | Clear Metro cache (fixes stale bundle issues) |
| `npm start -- --port 8082` | Use a different port |
| `npm run android` | Start Metro + launch on Android device/emulator |
| `npm run ios` | Start Metro + launch on iOS simulator |

### Connect the Android host app (debug build) to Metro

The debug build contacts Metro at `10.0.2.2:8081` (emulator) or your machine IP (physical device).

For a physical device, shake the device → Dev Menu → **Change Bundle Location** → enter `<your-machine-ip>:8081`.

Or set it via adb before launching:

```bash
adb reverse tcp:8081 tcp:8081
```

Then install the debug APK:

```bash
cd circlescare-android
./gradlew installDebug
```

Any JS change you make in `circlescare-expo/` reloads instantly in the host app (hot reload). No rebuild needed.

---

## 2. Environment overview

| Environment | Channel | Metro needed | Build type | Distribution |
|---|---|---|---|---|
| Development | `development` | Yes | Debug APK | Local device / emulator |
| QA | `preview` | No | Release APK | Internal testers (APK share or EAS) |
| Production | `production` | No | Release APK / AAB | Play Store / App Store |

OTA update channels are tied to the `version` in `app.json` via `"runtimeVersion": { "policy": "appVersion" }`. An OTA pushed to `production` only reaches devices that have installed the matching native build.

---

## 3. Development workflow (DEV)

Use this day-to-day when writing JS/UI code.

### Step 1 — Start Metro

```bash
cd circlescare-expo
npm start
```

### Step 2 — Run on Android (with hot reload)

Option A — use the host app debug APK (recommended for brownfield testing):

```bash
# Terminal 1 — keep Metro running
cd circlescare-expo && npm start

# Terminal 2 — install host APK
cd circlescare-android && ./gradlew installDebug
```

Option B — run the standalone Expo app (faster iteration, no native host):

```bash
cd circlescare-expo
npm run android     # builds & launches standalone Expo app on emulator
```

### Step 3 — Run on iOS simulator (with hot reload)

```bash
cd circlescare-expo
npm run ios         # builds standalone Expo app and opens in simulator
```

### Step 4 — Iterate

Edit any `.tsx` / `.ts` file inside `circlescare-expo/`. The app reloads automatically.

- **Fast Refresh**: component state is preserved across edits
- **Full reload**: shake device → **Reload** (or press `r` in Metro terminal)
- **Dev Menu**: shake device → Dev Menu → Inspector, Performance Monitor, etc.

### When to rebuild the native host during development

Only when you add a new native module, change `app.json` plugins, or upgrade Expo SDK. Otherwise Metro hot reload covers everything.

```bash
# Rebuild Android host after native change
cd circlescare-expo
npm run publish:android:brownfield   # publishes new AAR version

cd circlescare-android
./gradlew assembleDebug && ./gradlew installDebug
```

---

## 4. QA workflow

QA builds are self-contained — no Metro required. The JS bundle is embedded inside the APK.

### Option A — Local release APK (fastest)

```bash
cd circlescare-android
./gradlew assembleRelease
```

APK: `circlescare-android/app/build/outputs/apk/release/app-release.apk`

Share the APK directly with testers via Slack, email, or a file share.

### Option B — EAS internal build (cloud, no local Android Studio needed)

```bash
cd circlescare-expo
eas build --platform android --profile preview
```

EAS builds in the cloud and gives you a download link to share with testers.

```bash
# iOS QA build
eas build --platform ios --profile preview
```

### Push a JS-only QA update (no rebuild)

When only JS changes need QA testing:

```bash
cd circlescare-expo
eas update --branch preview --message "QA: fixed login button tap area"
```

Testers relaunch the app and get the new JS automatically.

---

## 5. Production release workflow

### 5.1 — JS-only change (no native code touched)

```bash
cd circlescare-expo
eas update --branch production --message "feat: updated home screen copy"
```

Done. No rebuild, no store submission. Users get the update on next app launch.

### 5.2 — Native change (new module, Expo SDK bump, RN upgrade)

Follow all steps in order.

#### Step 1 — Bump version (both files must match)

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

#### Step 2 — Publish Android AAR to GitHub Packages

```bash
cd circlescare-expo
npm run publish:android:brownfield
```

This will:
1. Validate credentials and version sync
2. Run `expo prebuild -p android --clean`
3. Run `./gradlew publishBrownfieldReleasePublicationToGithubPackagesRepository`
4. Upload AAR + POM to GitHub Packages

Build time: ~10–15 min first run.

Verify at: `https://github.com/iniyanmurugavel/circles-roaming-brownfield/packages`

#### Step 3 — Build Android release APK / AAB

```bash
cd circlescare-android
./gradlew assembleRelease          # APK for manual testing
./gradlew bundleRelease            # AAB for Play Store upload
```

Or via EAS:

```bash
cd circlescare-expo
eas build --platform android --profile production
```

#### Step 4 — Build iOS XCFramework

```bash
cd circlescare-expo
npm install
npx expo prebuild -p ios --clean --no-install
cd ios && pod install && cd ..
```

Then build the XCFramework:

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

#### Step 5 — Copy XCFramework to iOS host

```bash
ARTIFACTS="/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-expo/artifacts"
IOS_HOST="/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-ios/circlescare-ios"

cp -R "$ARTIFACTS/circlescareexpobrownfield.xcframework" "$IOS_HOST/"
cp -R "$ARTIFACTS/hermesvm.xcframework" "$IOS_HOST/"
```

#### Step 6 — Build iOS host

```bash
open "/Users/iniyan.murugavel/Documents/Circles /hybrid/cl-poc/circlescare-ios/circlescare-ios.xcodeproj"
```

Or via EAS:

```bash
cd circlescare-expo
eas build --platform ios --profile production
```

#### Step 7 — Submit to stores (optional, via EAS)

```bash
eas submit --platform android
eas submit --platform ios
```

---

## 6. Android host build matrix

| Command | What it builds | Metro required | Use case |
|---|---|---|---|
| `./gradlew assembleDebug` | Debug APK (no JS bundle) | Yes | Dev on device |
| `./gradlew installDebug` | Debug APK + install on connected device | Yes | Dev on device |
| `./gradlew assembleRelease` | Release APK (JS bundled) | No | QA / share APK |
| `./gradlew bundleRelease` | Release AAB | No | Play Store upload |
| `eas build --profile development` | Dev client APK | Yes | Dev with EAS dev client |
| `eas build --profile preview` | Release APK (cloud) | No | Internal QA |
| `eas build --profile production` | Signed AAB (cloud) | No | Play Store |

---

## 7. iOS host build matrix

| Method | What it builds | Use case |
|---|---|---|
| Xcode → Run (Cmd+R) | Debug build on simulator/device | Dev iteration |
| Xcode → Archive | Release build | TestFlight / App Store |
| `eas build --platform ios --profile preview` | IPA (cloud) | Internal QA |
| `eas build --platform ios --profile production` | Signed IPA (cloud) | App Store |

---

## 8. OTA JS-only update (any environment)

```bash
cd circlescare-expo

# Development
eas update --branch development --message "wip: test new header"

# QA / Preview
eas update --branch preview --message "fix: form validation error message"

# Production
eas update --branch production --message "feat: updated onboarding flow"
```

Users on a matching native build pick up the update automatically on next launch.

To force an immediate update prompt in the app, use `expo-updates` API:

```ts
import * as Updates from 'expo-updates'

const { isAvailable } = await Updates.checkForUpdateAsync()
if (isAvailable) {
  await Updates.fetchUpdateAsync()
  await Updates.reloadAsync()
}
```

---

## 9. When to do a native publish vs OTA

| Changed | Action |
|---|---|
| JS code, screens, styles, images | OTA update — `eas update` |
| Navigation structure (JS router) | OTA update |
| New npm package — JS only | OTA update |
| New npm package with native code | Native publish → host rebuild |
| Expo plugin added/changed | Native publish → host rebuild |
| Expo SDK version bump | Native publish → host rebuild |
| React Native version bump | Native publish → host rebuild |
| Android permissions / manifest changes | Native publish → host rebuild |
| iOS entitlements / Info.plist changes | Native publish → XCFramework rebuild |

---

## 10. Credential setup

### GitHub PAT (required for Android)

Must be a **classic** token (`ghp_...`). Fine-grained tokens (`github_pat_...`) do not work with GitHub Packages Maven.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token → Tokens (classic)**
3. Scopes: `read:packages` + `write:packages`
4. Add to `~/.gradle/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
gpr.user=iniyanmurugavel
gpr.key=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Verify the token is working:

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ghp_YOUR_TOKEN" \
  https://api.github.com/user
# Should return 200
```

### EAS login (required for EAS Build / Update)

```bash
eas login    # log in as anithaaji
eas whoami   # verify
```

---

## 11. Troubleshooting

### Metro: `EADDRINUSE` port 8081

Another process is using the port.

```bash
lsof -i :8081
kill -9 <PID>
```

Or start on a different port:

```bash
npm start -- --port 8082
```

### Metro: stale cache / module not found

```bash
npm start -- --clear
```

Or nuclear clear:

```bash
cd circlescare-expo
rm -rf node_modules .expo
npm install
npm start -- --clear
```

### Android: 401 on publish or gradle sync

Token is expired or wrong scope.

```bash
# Verify token
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $(grep gpr.key ~/.gradle/gradle.properties | cut -d= -f2)" \
  https://api.github.com/user
```

If not `200`, generate a new classic PAT and update `~/.gradle/gradle.properties`.

### Android: 409 Conflict on publish

Version already exists in GitHub Packages. Bump `version` in `app.json` and `brownfield` in `libs.versions.toml`, then re-publish.

### Android: version mismatch error

```
Version mismatch between Expo app and Android host:
  app.json           → 1.0.1
  libs.versions.toml → 1.0.0
```

Make both the same value before running publish.

### Android: could not find `com.anithaaji.circlescareexpo:brownfield`

- Credentials missing or invalid in `~/.gradle/gradle.properties`
- Version in `libs.versions.toml` does not match any published version

Check what versions are available at:
`https://github.com/iniyanmurugavel/circles-roaming-brownfield/packages`

### Android: NDK mismatch (CXX1101 / CXX1104)

Install the correct NDK via Android Studio → SDK Manager → SDK Tools → NDK (Side by side) → `27.1.12297006`.

### iOS: module `circlescareexpobrownfield` not found

XCFramework not copied or not linked in Xcode.

1. Re-run Steps 4–5 from the production release workflow above
2. In Xcode → target → **Frameworks, Libraries, and Embedded Content** → verify both `circlescareexpobrownfield.xcframework` and `hermesvm.xcframework` are listed

### EAS Build fails: missing credentials

```bash
eas credentials
```

Follow the prompts to configure Apple or Android signing.

---

## Version compatibility reference

| Tool | Version |
|---|---|
| Android Gradle Plugin | 8.9.1 |
| Gradle | 8.11.1 |
| Kotlin | 2.2.20 |
| NDK | 27.1.12297006 |
| Expo SDK | 55 |
| React Native | 0.83.6 |
| Node | 20+ |
| Xcode | 16+ |
| EAS CLI | 18.7.0+ |
