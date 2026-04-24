# CirclesCare Expo Brownfield

This folder contains the Expo / React Native feature app that is embedded into the native Android host app in `../circlescare-android`.

## How this setup works

This project uses `expo-brownfield`.

That means:

- `circlescare-expo` is not shipped to Android as a standalone app only.
- It is packaged as a native Android library named `brownfield`.
- The Android host app consumes that library from a remote Maven repository.
- JavaScript and assets are embedded into the release artifact at build time.
- Later, compatible JS-only changes can be delivered over-the-air through Expo Updates.

Think of it as two layers:

- Native layer: Android library + native dependencies. This requires a new Android build whenever native code changes.
- Update layer: JS bundle and assets. This can be updated OTA if the `runtimeVersion` matches.

## Project changes in this repo

The brownfield Android integration is configured in:

- `app.json`
- `../circlescare-android/settings.gradle.kts`
- `../circlescare-android/app/build.gradle.kts`

### Expo side

`app.json` configures `expo-brownfield` to publish Android artifacts to GitHub Packages:

```text
https://maven.pkg.github.com/iniyan-circles/Expo
```

It also enables Expo Updates with:

- `updates.url = https://u.expo.dev/f96f88fe-6447-47d9-8534-7cade232eb5c`
- `runtimeVersion.policy = appVersion`

### Android host side

The Android host app:

- adds GitHub Packages as a Maven repository
- depends on `com.anithaaji.circlescareexpo:brownfield:1.0.0`

For local development and release builds, put the credentials in:

```properties
# ~/.gradle/gradle.properties
gpr.user=iniyanmurugavel
gpr.key=YOUR_CLASSIC_GITHUB_PAT
```

The Android host reads credentials from:

- Gradle properties `gpr.user` and `gpr.key`
- fallback environment variables `GITHUB_ACTOR` and `GITHUB_TOKEN`

Do not put GitHub tokens in:

- Android `local.properties`
- tracked repo files
- hardcoded Gradle scripts

If credentials are missing, the project can still open, but Gradle will not be able to resolve `com.anithaaji.circlescareexpo:brownfield:1.0.0` for a real build.

## Brownfield publish flow

### Before publishing: bump the version in both places

GitHub Packages does not allow overwriting an already-published version. Every new native release requires a version bump in **both** files:

1. `circlescare-expo/app.json` — `expo.version`
2. `circlescare-android/gradle/libs.versions.toml` — `brownfield`

Both must match. The publish script enforces this and will fail with a clear error if they differ.

### Local publish (from your machine)

```bash
npm run publish:android:brownfield
```

The script reads credentials from `~/.gradle/gradle.properties`:

```properties
gpr.user=iniyanmurugavel
gpr.key=<your-classic-pat>
```

The token must be a GitHub **personal access token (classic)** with `read:packages` and `write:packages`.

#### How to create a classic PAT

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) (not "tokens (beta)").
2. Click **Generate new token → Generate new token (classic)**.
3. Give it a name, e.g. `brownfield-publish`.
4. Select scopes: `read:packages` and `write:packages`.
5. Click **Generate token** and copy it immediately.
6. Paste into `~/.gradle/gradle.properties`:

```properties
gpr.user=iniyanmurugavel
gpr.key=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Do not put the token in any tracked file. `~/.gradle/gradle.properties` is on your machine only.

The publish script performs:

1. `npm install` (also runs `postinstall` NDK patch)
2. `npx expo prebuild -p android --clean --no-install`
3. `./gradlew publishBrownfieldReleasePublicationToGithubPackagesRepository --stacktrace`

### CI publish (GitHub Actions)

The workflow at `.github/workflows/publish-brownfield-android.yml` publishes from CI without a personal token.

GitHub Actions provides a built-in `GITHUB_TOKEN` that automatically has `write:packages` for this repository. No secret setup is required.

To trigger a publish:

1. Go to the **Actions** tab of `iniyan-circles/Expo`.
2. Select **Publish Brownfield Android**.
3. Click **Run workflow**.
4. Leave **Dry run** as `false` to upload, or set it to `true` to run the build without uploading.

Use the dry run option to confirm the build succeeds before publishing a new version.

### Verify a successful publish

The Maven endpoint is not a browser page. Use one of these instead:

- `https://github.com/iniyan-circles/Expo/packages`
- `https://github.com/users/iniyanmurugavel/packages`

## Run the Expo feature in development

From this folder:

```bash
npm install
npx expo start --dev-client
```

For a local generated Android app build:

```bash
npx expo run:android
```

## Run the native Android host app

From `../circlescare-android`:

```bash
./gradlew installDebug
```

In a real host app, you open the Expo screen from a native `Activity` or `FragmentActivity` by calling the generated brownfield helpers.

Conceptually the host side looks like this:

```kotlin
class ExpoFeatureActivity : BrownfieldActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    showReactNativeFragment("main")
  }
}
```

The generated brownfield module creates a shared `ReactHost`, mounts a React Native view, and handles native back navigation.

## OTA update model

This project is configured with:

```json
"runtimeVersion": {
  "policy": "appVersion"
}
```

That means:

- if only JS changes, you can publish an OTA update
- if native code changes, make a new Android build
- if native code changes, also bump app `version` so incompatible updates are not delivered to old binaries

## Important limitation

Do not treat this as a single flat `.aar` integration.

Expo Brownfield is designed to publish a Maven-style repository containing:

- the brownfield AAR
- metadata
- dependent artifacts

So the correct host integration is a Maven repository:

- remote Maven such as GitHub Packages, Artifactory, or Nexus

Not:

- only one `lib/something.aar` file with no repository metadata

## Troubleshooting

### NDK mismatch

If Gradle fails with errors like:

- `CXX1101`
- `CXX1104`

then the local Android SDK / NDK installation is inconsistent.

Typical fix:

1. Open Android Studio.
2. Go to SDK Manager.
3. Remove the broken NDK side-by-side version.
4. Install the required NDK again.
5. Re-run the brownfield publish command.

For this project, the brownfield Android build should resolve to NDK `27.1.12297006`.

The repo now includes a postinstall script that patches `expo-updates` so it uses the same NDK version as the rest of the Expo / React Native modules.

### GitHub Packages 401 or 403

If Gradle reaches upload and fails with `401 Unauthorized` or `403 Forbidden`, the build succeeded but the token is wrong.

Common causes:

- You used a **fine-grained PAT** instead of a **classic PAT**. Fine-grained tokens do not support GitHub Packages Maven. You must use a classic token.
- The classic PAT was created but is missing the `write:packages` scope (read-only tokens get 403).
- The token was revoked or expired.

Fix: generate a new **classic PAT** (see the local publish section above) and update `~/.gradle/gradle.properties`.

### GitHub Packages 409 or "cannot publish existing version"

GitHub Packages does not allow overwriting a published version. If you see a 409 or similar conflict error, bump the version in both `app.json` and `libs.versions.toml` before running the publish again.

## Useful references

- Expo Brownfield: <https://docs.expo.dev/versions/latest/sdk/brownfield/>
- Expo Updates: <https://docs.expo.dev/versions/latest/sdk/updates/>
- Runtime versions: <https://docs.expo.dev/eas-update/runtime-versions/>
