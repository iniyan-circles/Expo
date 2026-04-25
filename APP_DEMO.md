# CirclesCare App — Demo Guide

End-to-end walkthrough of the app's screens, navigation, deep links, OTA updates, and live theme switching. Use this as the script for any product demo or onboarding session.

---

## 1. What the App Is

CirclesCare is a telecom self-care app built as a **React Native (Expo) brownfield hybrid** — meaning the UI lives entirely in `circlescare-expo` (JS/TS) and is embedded as a compiled library inside a native Android/iOS shell (`circlescare-android` / `circlescare-ios`).

From a user's perspective it looks and feels like a native app. Under the hood, Expo Router handles all navigation, and EAS pushes UI updates over-the-air without touching the app store.

---

## 2. Screen Map

```
App Launch
    │
    └─► Tab Bar (3 tabs)
            │
            ├─► [Tab 1] Home ────────────────► Plan Detail  (stack push)
            │                                       │
            │                                       └─► Back  (stack pop)
            │
            ├─► [Tab 2] Explore
            │
            └─► [Tab 3] Settings
```

Deep links bypass the tab bar and open any route directly:

```
circlescareexpo://          →  Home tab
circlescareexpo://explore   →  Explore tab
circlescareexpo://plan-detail → Plan Detail screen
```

---

## 3. Screen-by-Screen Walkthrough

### 3.1 Home Tab

**Route:** `/` · `app/(tabs)/index.tsx`

The dashboard a user sees on launch.

| Section | What it shows | Interaction |
|---|---|---|
| **Header** | Greeting + plan badge + avatar initials | — |
| **Data Usage card** | GB used / total with a live progress bar | — |
| **Quick Actions** | Top Up · Roaming · Billing · Support | Tappable (stubs) |
| **My Plan card** | Plan name, price, validity, Active badge | **Tap → opens Plan Detail** |
| **Recent Activity** | Last 3 transactions with amounts | — |

**Key detail — My Plan card is the navigation entry point:**

```
Home  ──[tap My Plan card]──►  Plan Detail screen
                                      │
                              [tap ← back]
                                      │
                              Home (returns)
```

---

### 3.2 Plan Detail Screen

**Route:** `/plan-detail` · `app/plan-detail.tsx`

Reached by tapping the My Plan card on Home, or via deep link `circlescareexpo://plan-detail`.

| Section | What it shows |
|---|---|
| **Hero card** | Plan name, price, billing cycle, renewal date, Active badge |
| **Data Usage** | GB used with a per-category breakdown (Streaming / Social / Browsing / Other) |
| **What's Included** | Feature list — data, calls, SMS, roaming, spam protection — each with a green checkmark |
| **Actions** | Change Plan (outline) · Upgrade (filled) · Cancel Plan (red text) |

**Custom navigation header** — no native header bar. Uses a `← chevron-back` button wired to `router.back()`.

---

### 3.3 Explore Tab

**Route:** `/explore` · `app/(tabs)/explore.tsx`

Discovery surface for plans and add-ons.

| Section | What it shows | Interaction |
|---|---|---|
| **Search bar** | Placeholder "Search plans, add-ons…" | Live clear button on input |
| **Category chips** | All · Roaming · Data Add-ons · Deals · Voice & SMS | Tap to activate (highlighted) |
| **Featured Offers** | Horizontal scroll — Asia Roaming, Data Booster, Weekend Unlimited | Each card has a price + Get button |
| **Popular Add-ons** | Vertical list — Global Roaming, Extra 5 GB, Unlimited Calls, Device Protection | Chevron rows |

---

### 3.4 Settings Tab

**Route:** `/settings` · `app/(tabs)/settings.tsx`

Two live, functional sections plus build diagnostics.

#### Color Theme selector

Three options — **Light**, **Dark**, **System** — backed by `ColorSchemeProvider`.

```
User taps "Dark"
    │
    ▼
ColorSchemeContext.setPreference('dark')
    │
    ▼
useColorScheme() returns 'dark' across every component
    │
    ▼
All tabs repaint instantly — no reload required
```

Selecting **System** restores automatic matching with the device OS setting.

#### OTA Updates panel

| State | What the user sees |
|---|---|
| Never checked | "Last checked: Not checked yet" + Check for Update button |
| Checking | Button shows "Checking…" and is disabled |
| Up to date | "Last checked: HH:MM:SS" + Check for Update button |
| Update available | Green "New" badge + "Install Update & Restart" button |

Tapping **Install Update & Restart** calls:
```
Updates.fetchUpdateAsync()  →  download new JS bundle
Updates.reloadAsync()       →  hot-restart the RN layer (no native restart)
```

#### Build Info table

Shows variant, platform, Metro on/off, EAS channel, runtime version, and update ID. Useful for support calls to confirm exactly what binary a user is running.

---

## 4. Navigation Architecture

### Stack structure

```
RootLayout  (ColorSchemeProvider + Stack)
│
├── (tabs)           headerShown: false
│     ├── index      Home
│     ├── explore    Explore
│     └── settings   Settings
│
├── plan-detail      headerShown: false  (custom back button inside screen)
└── modal            presentation: modal
```

### How the theme context flows

```
ColorSchemeProvider  (app/_layout.tsx)
        │
        ▼
AppNavigator  →  ThemeProvider (react-navigation, picks up override)
        │
        └──► useColorScheme() hook  (reads context preference, falls back to system)
                    │
                    ├── ThemedText
                    ├── ThemedView
                    ├── All tab screens
                    └── Plan Detail screen
```

`ColorSchemeProvider` wraps `AppNavigator` — not the other way around — so `useColorScheme` can be called safely inside `AppNavigator` after the context is mounted.

---

## 5. Deep Linking

### Setup

| Layer | What was added |
|---|---|
| `app.json` | `scheme: "circlescareexpo"` (already present) |
| `AndroidManifest.xml` | Intent filter for `circlescareexpo://` scheme |
| `MainActivity.kt` | `onNewIntent` forwards new intents to RN when app is already running |

### How it works

**Cold start (app not running):**
```
OS receives intent  circlescareexpo://explore
    │
    ▼
Android launches MainActivity
    │
    ▼
showReactNativeFragment("main")  — RN boots
    │
    ▼
Expo Router calls Linking.getInitialURL()
    │
    └─► reads intent.data  →  navigates to /explore
```

**Warm start (app already running):**
```
OS sends new intent  circlescareexpo://plan-detail
    │
    ▼
MainActivity.onNewIntent(intent)
    │
    ▼
setIntent(intent)  — updates the activity's intent
    │
    ▼
RN Linking module fires onURL event  →  Expo Router navigates to /plan-detail
```

### Testing deep links from terminal

```bash
# Open Explore tab
adb shell am start \
  -a android.intent.action.VIEW \
  -d "circlescareexpo://explore" \
  com.circles.circlescare

# Open Plan Detail directly
adb shell am start \
  -a android.intent.action.VIEW \
  -d "circlescareexpo://plan-detail" \
  com.circles.circlescare

# Open app root (Home tab)
adb shell am start \
  -a android.intent.action.VIEW \
  -d "circlescareexpo://" \
  com.circles.circlescare
```

For the **debug APK** (package suffix `.debug`):
```bash
adb shell am start \
  -a android.intent.action.VIEW \
  -d "circlescareexpo://explore" \
  com.circles.circlescare_android.debug
```

---

## 6. OTA Update Flow

OTA updates ship a new JS bundle without touching the native shell. This is the path for any UI or logic change that doesn't require a new native module.

```
Developer merges UI fix to main
        │
        ▼
GitHub Actions  →  ota-update.yml  (manual trigger)
        │            or
        │        eas update --branch production --message "..."
        ▼
EAS cloud stores the new JS bundle + assets
        │
        ▼
User opens app  →  expo-updates checks for newer bundle
        │
        ▼
Bundle downloaded in background
        │
        ▼
Next cold start  →  new bundle runs
```

**What OTA can update:**
- All JS/TS code, screen layouts, styles
- Images and static assets bundled with the app
- Navigation structure (Expo Router routes)
- New JS-only npm packages

**What OTA cannot update (requires native publish + host rebuild):**
- New native modules (`expo-camera`, `expo-sensors`, etc.)
- `AndroidManifest.xml` or `Info.plist` changes
- Expo SDK version bumps
- Gradle dependency changes

### Demonstrating OTA live

1. Make a visible UI change in `circlescare-expo` (e.g. change a color or label)
2. Push the change: `eas update --branch production --message "demo: updated home greeting"`
3. On the device, background and reopen the app
4. The Settings tab → OTA section will show **"New"** badge
5. Tap **Install Update & Restart** — the RN layer reloads with the new bundle in ~2 seconds

---

## 7. Theme Switching — Live Demo Steps

1. Open the **Settings** tab (gear icon)
2. Under **Appearance**, tap **Dark** — every screen repaints to dark immediately
3. Navigate to **Home** — dark background, adjusted card colors, white text
4. Navigate to **Explore** — dark search bar, dark offer cards
5. Return to **Settings** → tap **Light** — instant revert
6. Tap **System** — app follows device OS dark mode toggle

**How it works technically:**

`useColorScheme()` reads from `ColorSchemeContext` first. If preference is `'system'`, it falls through to React Native's `useNativeColorScheme()`. All themed components (`ThemedView`, `ThemedText`) and all manual color calculations use this hook, so the entire tree updates in one React re-render.

No AsyncStorage, no reload. The preference is in-memory and resets to `'system'` on cold restart (intentional — the OS setting is the persistent source of truth).

---

## 8. Two-Layer Update Model Summary

```
┌─────────────────────────────────────────────────────┐
│                  Native Layer (slow)                 │
│                                                     │
│  circlescare-android  ←──  brownfield.aar           │
│  circlescare-ios      ←──  xcframework              │
│                                                     │
│  Changes here require:                              │
│    • npm run publish:android:brownfield             │
│    • New APK/IPA build + store submission           │
│    • User must update the app                       │
└─────────────────────────────────────────────────────┘
                       ▲
                       │  consumed by
                       │
┌─────────────────────────────────────────────────────┐
│               JS / Update Layer (fast)               │
│                                                     │
│  circlescare-expo  →  EAS Update  →  user's device  │
│                                                     │
│  Changes here require:                              │
│    • eas update --branch production                 │
│    • No store submission                            │
│    • Users get it on next app open                  │
└─────────────────────────────────────────────────────┘
```

The **runtimeVersion** in `app.json` (set to `appVersion`) is the contract between the two layers. An OTA bundle only runs on a native binary with a matching version — this prevents a new JS bundle from loading against an incompatible old native library.

---

## 9. Quick Demo Checklist

Use this for a live walkthrough:

- [ ] Launch the app — Home dashboard loads with data usage card
- [ ] Tap **My Plan** card — Plan Detail screen slides in
- [ ] Check data breakdown bars (Streaming, Social, Browsing, Other)
- [ ] Tap **← back** — returns to Home
- [ ] Switch to **Explore** tab — search bar, category chips, offer cards
- [ ] Tap a category chip (e.g. Roaming) — chip activates
- [ ] Switch to **Settings** tab — build info, OTA panel, theme selector
- [ ] Tap **Dark** — entire app switches to dark mode
- [ ] Tap **System** — reverts
- [ ] Tap **Check for Update** — polls EAS for new bundle
- [ ] Run deep link: `adb shell am start -a android.intent.action.VIEW -d "circlescareexpo://explore" com.circles.circlescare` — Explore tab opens directly
- [ ] Run deep link to plan-detail: `adb shell am start -a android.intent.action.VIEW -d "circlescareexpo://plan-detail" com.circles.circlescare` — Plan Detail opens directly

---

## 10. Key Files Reference

| File | Purpose |
|---|---|
| `circlescare-expo/app/(tabs)/index.tsx` | Home dashboard |
| `circlescare-expo/app/(tabs)/explore.tsx` | Explore / discover |
| `circlescare-expo/app/(tabs)/settings.tsx` | Settings — theme + OTA + build info |
| `circlescare-expo/app/plan-detail.tsx` | Plan Detail stack screen |
| `circlescare-expo/app/_layout.tsx` | Root layout — ColorSchemeProvider + Stack |
| `circlescare-expo/context/color-scheme.tsx` | Theme preference context |
| `circlescare-expo/hooks/use-color-scheme.ts` | Hook — reads context, falls back to system |
| `circlescare-android/app/src/main/AndroidManifest.xml` | Deep link intent filter |
| `circlescare-android/app/src/main/java/.../MainActivity.kt` | `onNewIntent` for runtime deep links |
