plugins {
  id("com.android.library")
  id("org.jetbrains.kotlin.android")
  id("com.facebook.react")
  id("expo-brownfield-setup")
}

group = "com.circles.circlescare"

version = "1.0.2"

react { autolinkLibrariesWithApp() }

android {
  namespace = "com.circles.circlescare.brownfield"
  compileSdk = 36

  buildFeatures { buildConfig = true }

  defaultConfig {
    minSdk = 24
    consumerProguardFiles("consumer-rules.pro")
    buildConfigField(
        "boolean",
        "IS_NEW_ARCHITECTURE_ENABLED",
        properties["newArchEnabled"].toString(),
    )
    buildConfigField("boolean", "IS_HERMES_ENABLED", properties["hermesEnabled"].toString())
    buildConfigField(
        "String",
        "REACT_NATIVE_RELEASE_LEVEL",
        "\"${findProperty("reactNativeReleaseLevel") ?: "stable"}\"",
    )
    buildConfigField(
      "boolean",
      "IS_EDGE_TO_EDGE_ENABLED",
      "true", // Android 16+ enforces edge-to-edge; hardcoded true for brownfield
    )
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
  }
  kotlinOptions { jvmTarget = "17" }
}

// libreact_codegen_rnscreens.so and libreact_codegen_safeareacontext.so are kept in the AAR
// so that host apps without the RN Gradle plugin get all required native deps.

val configureDevMenuInRelease = 
  findProperty("expo.devmenu.configureInRelease")?.toString() == "true"

dependencies {
  val debugOnly: (Any) -> Unit = { notation ->
    debugImplementation(notation)
    if (configureDevMenuInRelease) {
      releaseImplementation(notation)
    }
  }

  api("com.facebook.react:react-android")
  api("com.facebook.hermes:hermes-android")
  compileOnly("androidx.fragment:fragment-ktx:1.6.1")

  debugOnly(project(":expo-brownfield"))
  debugOnly(project(":expo-dev-menu"))
  debugOnly(project(":expo-manifests"))
}
