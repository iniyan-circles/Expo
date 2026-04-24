package com.circles.circlescare_android

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import expo.modules.ApplicationLifecycleDispatcher

class MainApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Must run at process start — before any Activity — so the Fabric component
        // descriptor registry is fully initialized when MainActivity.onCreate() fires.
        loadReactNative(this)
        ApplicationLifecycleDispatcher.onApplicationCreate(this)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
    }
}
