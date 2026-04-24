# Circles Hybrid POC - AI Instructions & Memory Context

This file serves as the memory and architectural constraint map for AI coding assistants (like Claude, Cursor, Copilot, etc.) working inside this repository. This heavily details "What To Do" and "What Not To Do" for the cross-platform Brownfield Expo integration.

---

## 🏗 Architectural Memory Context
This project utilizes a **Two-Layer Update Model**. The `circlescare-android` and `circlescare-ios` projects rely on extracting a compiled C++ React Native engine from `circlescare-expo` via Maven caches (AAR) and XCFramework structures. 
- Javascript, UI, and Styles exist entirely inside `circlescare-expo` and are pushed OTA (Over-The-Air) by EAS.
- Native capabilities (Sensors, Android Manifests, SDK updates) require rebuilding the AAR shell from `circlescare-expo` and resolving the dependency in `circlescare-android`. 

---

## ✅ What To Do (Best Practices)

1. **Version Syncing is Mandatory:** If you ever bump a version for a release, you MUST update both files identically:
   - `circlescare-expo/app.json` under `expo.version`
   - `circlescare-android/gradle/libs.versions.toml` under `brownfield` version.
2. **Javascript Development Iteration:** Work completely inside `circlescare-expo` and rely on Metro (`npm start`). Metro feeds the Android Native app live UI code across `localhost:8081` using the `USE_METRO=true` bridge during Debug variants.
3. **Respect Android Variant Separations:**
   - App Name and Icon Background distinctiveness are controlled in `build.gradle.kts` and `src/{variant}/res/values/colors.xml`. 
   - Debug requires `android:networkSecurityConfig` inside `src/debug/AndroidManifest.xml` (not main!).
4. **Publish Transitive Dependencies:** The Android standalone app has 1 direct dependency (`brownfield.aar`), but 30 transitive dependencies (expo-camera, reanimated, etc.). The `./gradlew publishToMavenLocal` inside the expo tooling intentionally generates AARs for all 30 dependencies under exactly the same Maven Namespace `com.circles.circlescare`. 

---

## 🚫 What NOT To Do (Strict Boundaries)

1. **Do NOT Modify the Standalone Native App for UI Tweaks:** Any styling changes, business logic, or navigation adjustments must happen inside `circlescare-expo`. The standalone Android/iOS shells are exclusively designated for Native APIs, SDK loading, and App Store distributions.
2. **Do NOT Commit Credentials:** NEVER commit `local.properties`, `gradle.properties`, or `EXPO_TOKEN` tokens to Git. **Contact Iniyan Murugavel** to obtain these keys for local development or publishing.
3. **Do NOT Override the Master Manifest Error-fully:** Never manually place `android:networkSecurityConfig` directly into `app/src/main/AndroidManifest.xml`. It MUST remain in `app/src/debug/`.
4. **Do NOT Run Manual React Native Links:** Rely solely on `expo prebuild`. Do not use ancient React Native CLI linking code.

By strictly adhering to this document, you prevent architecture desynchronization and ensure that Over-The-Air EAS updates deploy predictably!
