# CI/CD — GitHub Actions Guide

All workflows live in `.github/workflows/`. This document explains what each one does, when it runs, what secrets it needs, and how they fit together.

---

## Workflow map

```
.github/workflows/
├── lint-typecheck.yml          PR gate — blocks merge on TS errors / lint failures
├── build-android-host.yml      Validates Android host compiles; produces APKs
├── publish-brownfield-android.yml  Publishes AAR to GitHub Packages (native change)
├── publish-brownfield-ios.yml  Builds XCFramework and uploads as artifact (native change)
└── ota-update.yml              Pushes JS-only OTA update via EAS (no rebuild)
```

---

## When to use which workflow

```
JS code changed?
  └─→ ota-update.yml  (picks branch: development / preview / production)

Native code changed (new module, Expo SDK bump, RN upgrade)?
  ├─→ publish-brownfield-android.yml  (publishes new AAR version)
  ├─→ publish-brownfield-ios.yml      (builds new XCFramework)
  └─→ build-android-host.yml          (validates host compiles against new AAR)

Pull request opened against main?
  └─→ lint-typecheck.yml  (runs automatically — no action needed)

Push to main (circlescare-android changed)?
  └─→ build-android-host.yml  (runs automatically)
```

---

## Workflow details

### 1. `lint-typecheck.yml` — PR quality gate

**Trigger:** Automatic on every PR and push to `main` that touches `circlescare-expo/`

**What it does:**
- Runs `tsc --noEmit` — fails the PR if there are TypeScript errors
- Runs `expo lint` — fails the PR if ESLint rules are violated

**Secrets needed:** None

**Runner:** `ubuntu-latest`

**When to care:** You don't need to trigger this manually. If your PR is blocked, fix the TypeScript or lint errors locally:
```bash
cd circlescare-expo
npx tsc --noEmit   # see type errors
npm run lint       # see lint errors
```

---

### 2. `build-android-host.yml` — Android host build validation

**Trigger:**
- Automatic on push to `main` or PR when `circlescare-android/` changes
- Manual via **Actions → Build Android Host → Run workflow**

**What it does:**
- Builds `assembleRelease` — production APK (resolves brownfield from GitHub Packages)
- Builds `assembleQa` — QA APK (resolves brownfield from GitHub Packages via release fallback)
- Uploads both APKs as downloadable artifacts (kept 14 days)

**Secrets needed:** None — `settings.gradle.kts` reads `GITHUB_ACTOR` + `GITHUB_TOKEN` (built-in) automatically

**Runner:** `ubuntu-latest`

**Download the APK:**
1. Go to **Actions → Build Android Host → (latest run)**
2. Scroll to **Artifacts**
3. Download `android-release-apk-<run>` or `android-qa-apk-<run>`
4. Install on device: `adb install app-release.apk`

---

### 3. `publish-brownfield-android.yml` — Publish AAR to GitHub Packages

**Trigger:** Manual only — **Actions → Publish Brownfield Android → Run workflow**

**What it does:**
- Installs NDK `27.1.12297006`
- Runs `npm run publish:android:brownfield` inside `circlescare-expo/`
  - Runs `expo prebuild -p android --clean`
  - Publishes `com.circles.circlescare:brownfield:<version>` + all 30 transitive packages to GitHub Packages
- `dry_run = true` runs prebuild only (no upload) — useful to verify the build works

**Secrets needed:** None — uses built-in `GITHUB_TOKEN` which has `write:packages` for this repo

**Runner:** `ubuntu-latest`

**When to run:**
- You bumped `version` in `app.json` and `brownfield` in `libs.versions.toml`
- A native module was added or changed
- Expo SDK was upgraded

**After this workflow completes:**
- Verify at `https://github.com/iniyanmurugavel/circles-roaming-brownfield/packages`
- Run `build-android-host.yml` to confirm the host resolves the new version

---

### 4. `publish-brownfield-ios.yml` — Build XCFramework

**Trigger:** Manual only — **Actions → Publish Brownfield iOS → Run workflow**

**What it does:**
- Runs `expo prebuild -p ios --clean`
- Runs `pod install`
- Builds `circlescareexpobrownfield.xcframework` + `hermesvm.xcframework` via `xcodebuild`
- Uploads both frameworks as a GitHub Actions artifact (kept 30 days)
- `dry_run = true` runs prebuild + pod install only (no xcodebuild) — verifies the project generates cleanly

**Secrets needed:** None

**Runner:** `macos-15` (has Xcode 16 pre-installed)

**After this workflow completes:**
1. Go to **Actions → Publish Brownfield iOS → (latest run) → Artifacts**
2. Download `brownfield-xcframework-<run>.zip`
3. Unzip and copy into the iOS host:
   ```bash
   cp -R circlescareexpobrownfield.xcframework \
     "circlescare-ios/circlescare-ios/"
   cp -R hermesvm.xcframework \
     "circlescare-ios/circlescare-ios/"
   ```
4. Open `circlescare-ios.xcodeproj` in Xcode and build

---

### 5. `ota-update.yml` — OTA JS update via EAS

**Trigger:** Manual only — **Actions → OTA Update (EAS) → Run workflow**

**Inputs:**
| Input | Options | What it targets |
|---|---|---|
| `branch` | `development` | Devices with a development build |
| `branch` | `preview` | Devices with a preview/QA build |
| `branch` | `production` | All production users (matching native version) |
| `message` | Any string | Label shown in EAS dashboard |

**What it does:**
- Bundles the current JS and assets from `circlescare-expo/`
- Pushes the bundle to EAS Update
- Devices on the matching `runtimeVersion` (= `appVersion` from `app.json`) receive the update on next launch

**Secrets needed:** `EXPO_TOKEN` ← **you must add this once**

#### How to add EXPO_TOKEN

1. Go to [expo.dev](https://expo.dev) → Account Settings → Access Tokens
2. Click **Create Token**, name it `ci-ota`, copy the value
3. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
4. Click **New repository secret**
5. Name: `EXPO_TOKEN`, Value: paste the token
6. Click **Add secret**

**Runner:** `ubuntu-latest`

**When to use:**
- Any JS/UI/navigation/asset change that does NOT require a new native build
- Hotfixes to production without a Play Store / App Store release

---

## Secrets reference

| Secret | Required by | How to create |
|---|---|---|
| `GITHUB_TOKEN` | All workflows | Built-in — automatic, no setup |
| `EXPO_TOKEN` | `ota-update.yml` | expo.dev → Account Settings → Access Tokens |

No other secrets are required. The GitHub PAT (`gpr.key`) used locally in `~/.gradle/gradle.properties` is **not needed in CI** — the built-in `GITHUB_TOKEN` covers both publishing and downloading packages within this repo.

---

## Full release checklist — native change

Run these in order:

```
[ ] 1. Bump version in circlescare-expo/app.json          (e.g. 1.0.1 → 1.0.2)
[ ] 2. Bump brownfield in libs.versions.toml              (same value)
[ ] 3. Actions → Publish Brownfield Android → Run         (dry_run: false)
[ ] 4. Actions → Publish Brownfield iOS → Run             (dry_run: false)
[ ] 5. Actions → Build Android Host → Run                 (validates AAR resolves)
[ ] 6. Download XCFramework artifact → copy to circlescare-ios
[ ] 7. Build + archive iOS host in Xcode
```

## Full release checklist — JS-only change

```
[ ] 1. Merge JS changes to main
[ ] 2. Actions → OTA Update (EAS) → Run
         branch: production
         message: "describe what changed"
[ ] 3. Done — no rebuild, no store submission
```

---

## Workflow trigger summary

| Workflow | Auto on PR | Auto on push to main | Manual |
|---|---|---|---|
| `lint-typecheck.yml` | ✅ (expo changes) | ✅ (expo changes) | ✅ |
| `build-android-host.yml` | ✅ (android changes) | ✅ (android changes) | ✅ |
| `publish-brownfield-android.yml` | ✗ | ✗ | ✅ |
| `publish-brownfield-ios.yml` | ✗ | ✗ | ✅ |
| `ota-update.yml` | ✗ | ✗ | ✅ |

Publish and OTA workflows are **intentionally manual** — publishing a new native version or pushing a production OTA is a deliberate action, not something that should happen automatically on every commit.
