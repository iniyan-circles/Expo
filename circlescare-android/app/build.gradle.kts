import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// Read local.properties for developer-specific overrides (metro host, etc.)
val localProps = Properties().apply {
    rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}
val metroHost: String = localProps.getProperty("metro.host", "localhost")

android {
    namespace = "com.circles.circlescare_android"
    compileSdk = 36

    signingConfigs {
        create("release") {
            storeFile = rootProject.file(localProps.getProperty("signing.storeFile", "circlescare-release.jks"))
            storePassword = localProps.getProperty("signing.storePassword") ?: System.getenv("SIGNING_STORE_PASSWORD")
            keyAlias = localProps.getProperty("signing.keyAlias") ?: System.getenv("SIGNING_KEY_ALIAS")
            keyPassword = localProps.getProperty("signing.keyPassword") ?: System.getenv("SIGNING_KEY_PASSWORD")
        }
    }

    defaultConfig {
        applicationId = "com.circles.circlescare_android"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        // ── debug ────────────────────────────────────────────────────────────
        // Metro dev-server build. Set metro.host=<ip> in local.properties for
        // physical-device iteration; emulators use the localhost default.
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
            buildConfigField("Boolean", "USE_METRO", "true")
            buildConfigField("String", "METRO_HOST", "\"$metroHost\"")
            manifestPlaceholders["metroHost"] = metroHost
        }

        // ── qa ────────────────────────────────────────────────────────────────
        // Release build that resolves brownfield from mavenLocal().
        // Before assembling: run `./gradlew publishToMavenLocal` inside the
        // circlescare-expo project to publish the AAR locally first.
        create("qa") {
            initWith(getByName("release"))
            matchingFallbacks += listOf("release")
            applicationIdSuffix = ".qa"
            isDebuggable = true
            isMinifyEnabled = true
            isShrinkResources = true
            buildConfigField("Boolean", "USE_METRO", "false")
            buildConfigField("String", "METRO_HOST", "\"\"")
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }

        // ── release (production) ──────────────────────────────────────────────
        // Production build. Resolves brownfield from GitHub Packages (remote Maven).
        // Requires gpr.user / gpr.key in gradle.properties or GITHUB_ACTOR /
        // GITHUB_TOKEN env vars.
        release {
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            buildConfigField("Boolean", "USE_METRO", "false")
            buildConfigField("String", "METRO_HOST", "\"\"")
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.brownfield)

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}
