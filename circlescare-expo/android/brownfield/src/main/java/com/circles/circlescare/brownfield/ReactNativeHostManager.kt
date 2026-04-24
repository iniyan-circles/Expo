package com.circles.circlescare.brownfield

import android.app.Activity
import android.app.Application
import android.util.Log
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import com.facebook.react.PackageList
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.ExpoReactHostFactory
import expo.modules.brownfield.BrownfieldNavigationState
import expo.modules.brownfield.closeAndReopenPackagerConnection
import expo.modules.brownfield.fetchManifest
import expo.modules.devmenu.AppInfo
import expo.modules.devmenu.api.DevMenuApi
import expo.modules.manifests.core.ExpoUpdatesManifest
import java.lang.ref.WeakReference

private const val TAG = "ReactNativeHostManager"

class ReactNativeHostManager {
  companion object {
    val shared: ReactNativeHostManager by lazy { ReactNativeHostManager() }
    private var reactHost: ReactHost? = null
  }

  fun getReactHost(): ReactHost? = reactHost

  fun initialize(application: Application) {
    if (reactHost != null) return

    if (!BuildConfig.DEBUG) {
      val assets = application.applicationContext.assets.list("") ?: emptyArray()
      if (!assets.contains("index.android.bundle")) {
        val bundleList = assets
          .filter { it.endsWith(".bundle") }
          .joinToString("\n") { "- $it" }
          .ifEmpty { "None" }
        throw IllegalStateException(
          "Cannot find `index.android.bundle` in assets.\nAvailable JS bundles:\n$bundleList"
        )
      }
    }

    DefaultNewArchitectureEntryPoint.releaseLevel =
      try {
        ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
      } catch (e: IllegalArgumentException) {
        ReleaseLevel.STABLE
      }

    // loadReactNative may have already been called in Application.onCreate() for early
    // TurboModule binding installation. Catch the duplicate-override error gracefully.
    try {
      loadReactNative(application)
    } catch (e: Exception) {
      // Feature flags already overridden — early init already ran, nothing to do.
    }

    BrownfieldLifecycleDispatcher.onApplicationCreate(application)

    reactHost = ExpoReactHostFactory.getDefaultReactHost(
      context = application.applicationContext,
      packageList = PackageList(application).packages
    )

    if (BuildConfig.DEBUG) {
      reactHost?.devSupportManager?.let { devSupportManager ->
        if (devSupportManager is DevSupportManagerBase) {
          DevMenuApi.installWebSocketHandlers(devSupportManager)
          DevMenuApi.uninstallDefaultShakeDetector(devSupportManager)
          closeAndReopenPackagerConnection(devSupportManager)
        }
      }
    }
  }
}

fun Activity.showReactNativeFragment(rootComponent: String = "main") {
  ReactNativeHostManager.shared.initialize(this.application)

  if (BuildConfig.DEBUG) {
    val reactHost = ReactNativeHostManager.shared.getReactHost()
    val fragmentHost = DevMenuApi.createFragmentHost(
      activity = this,
      reactHostHolder = WeakReference(reactHost),
    )
    if (fragmentHost != null) {
      val reactNativeView = ReactNativeViewFactory.createFrameLayout(
        this,
        this as androidx.fragment.app.FragmentActivity,
        rootComponent
      )
      fragmentHost.addView(reactNativeView, ViewGroup.LayoutParams.MATCH_PARENT)
      setContentView(fragmentHost)
      maybeGetAppInfoFromManifest(application, reactHost, this)
    }
  } else {
    setContentView(ReactNativeFragment.createFragmentHost(this, rootComponent))
  }

  setUpNativeBackHandling()
}

fun Activity.setUpNativeBackHandling() {
  val componentActivity = this as? ComponentActivity ?: return

  val backCallback = object : OnBackPressedCallback(true) {
    override fun handleOnBackPressed() {
      if (BrownfieldNavigationState.nativeBackEnabled) {
        isEnabled = false
        componentActivity.onBackPressedDispatcher.onBackPressed()
        isEnabled = true
      } else {
        ReactNativeHostManager.shared.getReactHost()
          ?.currentReactContext
          ?.getNativeModule(DeviceEventManagerModule::class.java)
          ?.emitHardwareBackPressed()
      }
    }
  }

  componentActivity.onBackPressedDispatcher.addCallback(componentActivity, backCallback)
}

internal fun maybeGetAppInfoFromManifest(
  application: Application,
  reactHost: ReactHost?,
  activity: Activity,
) {
  if (reactHost == null) return

  val defaultAppInfo = AppInfo.getAppInfo(application, reactHost)
  fetchManifest(reactHost) { manifest, manifestUrl ->
    if (manifest != null && manifestUrl != null) {
      val updatedAppInfo = defaultAppInfo.copy(
        appName = manifest.getName() ?: defaultAppInfo.appName,
        appVersion = manifest.getVersion() ?: defaultAppInfo.appVersion,
        sdkVersion = (manifest as? ExpoUpdatesManifest)?.getExpoGoSDKVersion() ?: defaultAppInfo.sdkVersion,
        runtimeVersion = (manifest as? ExpoUpdatesManifest)?.getRuntimeVersion() ?: defaultAppInfo.runtimeVersion,
        hostUrl = manifestUrl
      )
      DevMenuApi.model { activity }.value?.updateAppInfo(updatedAppInfo)
      Log.d(TAG, "Dev menu app info updated from manifest")
    }
  }
}
