package com.circles.circlescare_android

import android.app.Application
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint

class CirclesApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Must run before any Activity so TurboModule bindings are installed
        // before the JS runtime executes the first line of the bundle.
        DefaultNewArchitectureEntryPoint.releaseLevel = ReleaseLevel.STABLE
        loadReactNative(this)
    }
}
