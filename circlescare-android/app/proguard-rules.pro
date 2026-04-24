# ── Stack traces ──────────────────────────────────────────────────────────────
# Preserve line numbers so crash reports can map back to source
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── React Native ──────────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# RN modules registered via @ReactMethod / @ReactProp use reflection
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}

# ── Expo / Brownfield ─────────────────────────────────────────────────────────
-keep class expo.modules.** { *; }
-keep class host.exp.exponent.** { *; }
-keep class com.anithaaji.circlescareexpo.** { *; }

# ── OkHttp & Okio (React Native networking) ───────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# ── Kotlin ────────────────────────────────────────────────────────────────────
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
