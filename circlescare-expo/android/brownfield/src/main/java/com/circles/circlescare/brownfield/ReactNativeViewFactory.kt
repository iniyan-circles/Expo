package com.circles.circlescare.brownfield

import android.content.Context
import android.os.Bundle
import android.widget.FrameLayout
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactDelegate

object ReactNativeViewFactory {
  fun createFrameLayout(
      context: Context,
      activity: FragmentActivity,
      rootComponent: String,
      launchOptions: Bundle? = null,
  ): FrameLayout {
    val reactHost = ReactNativeHostManager.shared.getReactHost()
      ?: error("ReactHost is null — call ReactNativeHostManager.initialize() before creating views")

    val reactDelegate = ReactDelegate(activity, reactHost, rootComponent, launchOptions)

    activity.lifecycle.addObserver(
        object : DefaultLifecycleObserver {
          override fun onResume(owner: LifecycleOwner) {
            reactDelegate.onHostResume()
          }

          override fun onPause(owner: LifecycleOwner) {
            reactDelegate.onHostPause()
          }

          override fun onDestroy(owner: LifecycleOwner) {
            reactDelegate.onHostDestroy()
            owner.lifecycle.removeObserver(this)
          }
        }
    )

    reactDelegate.loadApp()
    return reactDelegate.reactRootView
      ?: error("ReactRootView is null after loadApp() — ReactHost may have been destroyed")
  }
}
