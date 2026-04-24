# Android Packages — Why There Are 30 of Them

## The short answer

When you publish the brownfield AAR to GitHub Packages, `expo-brownfield` re-publishes not just your AAR but also every Expo and React Native native module that your app depends on. This is intentional. The Android host app (`circlescare-android`) only has **one line** in its dependency list:

```toml
# circlescare-android/gradle/libs.versions.toml
brownfield = { module = "com.circles.circlescare:brownfield", version.ref = "brownfield" }
```

Gradle resolves all 30 packages automatically as transitive dependencies of that one artifact. You never have to manage the other 29 manually.

---

## Why does expo-brownfield re-publish transitive dependencies?

Normally, a library published to Maven Central or JitPack only needs to declare its transitive dependencies in a POM file — Gradle downloads them from their original registries. Expo native modules are **not** on Maven Central or JitPack. They are built from source inside the Expo project.

When `expo prebuild` generates your `android/` directory, it compiles all native modules from `node_modules`. The brownfield publish script then publishes those compiled AARs to GitHub Packages alongside your own AAR. Without this, the Android host app would have no way to resolve them since there is no other remote Maven registry serving them.

---

## The 30 packages explained

### Your artifact (1 package)

| Package | What it is |
|---|---|
| `com.circles.circlescare:brownfield` | Your brownfield AAR — the entry point the host app imports. Contains `BrownfieldActivity`, `ReactNativeFragment`, `ReactNativeHostManager`, `ReactNativeViewFactory`. |

### Expo core (4 packages)

| Package | What it is | Required? |
|---|---|---|
| `host.exp.exponent:expo` | Expo module system core | Yes — bootstraps all Expo modules |
| `host.exp.exponent:expo-modules-core` | Native module registration, JSI bridge | Yes — all modules depend on this |
| `host.exp.exponent:expo-modules-core-jsonutils` | JSON serialisation utilities | Yes — used internally by module system |
| `host.exp.exponent:expo-modules-core-easclient` | EAS client identifiers | Yes — required by expo-updates |

### Expo Brownfield + Dev Menu (3 packages)

| Package | What it is | Required? |
|---|---|---|
| `expo.modules.brownfield:expo-modules-brownfield` | The brownfield integration layer (React Native fragment host, lifecycle wiring) | Yes — core of the integration |
| `host.exp.exponent:expo-dev-menu` | In-app developer menu (shake → Dev Menu) | Debug builds only |
| `host.exp.exponent:expo-interfaces-devmenu` | Interface contract between modules and dev menu | Debug builds only |

### Expo Updates (2 packages)

| Package | What it is | Required? |
|---|---|---|
| `host.exp.exponent:expo-updates` | OTA update runtime — fetches and applies JS bundles from EAS | Yes — powers `eas update` |
| `host.exp.exponent:expo-updates-interface` | Interface contract between updates and the module system | Yes — required by expo-updates |

### Expo Router (1 package)

| Package | What it is | Required? |
|---|---|---|
| `expo.modules.router:expo-modules-router` | Native side of Expo Router (deep link handling, back-stack integration) | Yes — your app uses expo-router |

### Expo UI modules (7 packages)

| Package | What it is | Required? |
|---|---|---|
| `host.exp.exponent:expo-modules-splashscreen` | Native splash screen hold/hide API | Yes — app.json has expo-splash-screen plugin |
| `host.exp.exponent:expo-modules-font` | Font loading via `expo-font` | Yes — app uses expo-font |
| `host.exp.exponent:expo-modules-haptics` | Haptic feedback API | Yes — app uses expo-haptics |
| `expo.modules.image:expo-modules-image` | Optimised image component via expo-image | Yes — app uses expo-image |
| `expo.modules.asset:expo-modules-asset` | Asset resolution (images, fonts from bundle) | Yes — used by router and image |
| `host.exp.exponent:expo-modules-keepawake` | Prevents screen from sleeping | Pulled in by expo core |
| `expo.modules.webview:expo-modules-webview` | WebView component | Pulled in by expo-web-browser |

### Expo infrastructure modules (4 packages)

| Package | What it is | Required? |
|---|---|---|
| `host.exp.exponent:expo-modules-constants` | Device info, manifest constants (`Constants.expoConfig`) | Yes — used by most Expo modules |
| `host.exp.exponent:expo-modules-linking` | Deep link / URL handling (`Linking.openURL`) | Yes — used by expo-router |
| `host.exp.exponent:expo-modules-logbox` | React Native LogBox integration | Yes — wired into RN error overlay |
| `host.exp.exponent:expo-modules-manifests` | Expo manifest parsing (for updates) | Yes — required by expo-updates |
| `host.exp.exponent:expo-modules-structuredheaders` | HTTP structured headers parser | Yes — required by expo-updates for cache headers |
| `host.exp.exponent:expo-modules-webbrowser` | In-app browser (`expo-web-browser`) | Yes — app.json includes expo-web-browser |

### React Native Gesture Handler / Reanimated / Screens (4 packages)

These are third-party libraries from Software Mansion. They ship native Android code and are pulled in because `expo-router` depends on them.

| Package | What it is | Required? |
|---|---|---|
| `com.swmansion.gesturehandler:react-native-gesture-handler` | Touch gesture system (replaces the JS responder system) | Yes — expo-router depends on it |
| `com.swmansion.reanimated:react-native-reanimated` | High-performance animation via JSI | Yes — expo-router uses it for transitions |
| `com.swmansion.worklets:react-native-worklets` | Shared JS runtime for Reanimated worklets | Yes — dependency of reanimated |
| `com.swmansion.rnscreens:react-native-screens` | Native screen containers for navigation | Yes — expo-router uses it |

### Safe Area Context (1 package)

| Package | What it is | Required? |
|---|---|---|
| `com.th3rdwave.safeareacontext:react-native-safe-area-context` | Native insets for notches, navigation bars | Yes — expo-router and most screens use it |

---

## Can any of them be removed?

No — not without removing the corresponding Expo/RN feature from your app. Every package maps to a feature your `app.json` or `expo-router` depends on. Removing one without removing its JS consumer will cause a crash at runtime.

If you want to reduce the package count in a future version, the main levers are:

| To remove | Remove from app.json |
|---|---|
| `expo-dev-menu` (debug only anyway) | Not needed for production, already debug-only |
| `expo-web-browser` | Remove `expo-web-browser` from plugins and dependencies |
| `expo-haptics` | Remove `expo-haptics` from dependencies |
| `expo-keepawake` | Remove `expo-keepawake` from dependencies |

---

## Package naming convention

### Before (wrong — personal name)

```
com.anithaaji.circlescareexpo:brownfield
```

### After (correct — company name)

```
com.circles.circlescare:brownfield
```

The group ID is derived from `android.package` in `app.json`. Changing that field and re-running `expo prebuild` regenerates the entire `android/` directory with the correct namespace. The Maven group ID on all 30 published packages will follow suit on the next publish.

All 30 packages follow the same domain pattern:

| Domain prefix | Owner |
|---|---|
| `com.circles.circlescare` | Your app (Circles) |
| `host.exp.exponent` | Expo SDK modules |
| `expo.modules.*` | Expo feature modules |
| `com.swmansion.*` | Software Mansion (Gesture Handler, Reanimated, Screens) |
| `com.th3rdwave.*` | th3rdwave (Safe Area Context) |

---

## What happens after the package rename

Since the Maven group ID changes from `com.anithaaji.circlescareexpo` to `com.circles.circlescare`, this is treated as a brand-new artifact by Gradle and GitHub Packages. Steps required:

```
1. app.json already updated  →  "package": "com.circles.circlescare"  (version: 1.0.1)
2. libs.versions.toml updated →  module = "com.circles.circlescare:brownfield"  (version: 1.0.1)
3. MainActivity.kt updated   →  imports com.circles.circlescare.brownfield.*

4. Regenerate android/ directory:
   cd circlescare-expo
   npm run publish:android:brownfield
   (runs expo prebuild internally, then publishes under the new group)

5. Build the host app:
   cd circlescare-android
   ./gradlew assembleRelease
```

The old `com.anithaaji.circlescareexpo:brownfield:1.0.0` package remains in GitHub Packages but is no longer referenced by anything. It can be deleted from the GitHub Packages UI if desired.
