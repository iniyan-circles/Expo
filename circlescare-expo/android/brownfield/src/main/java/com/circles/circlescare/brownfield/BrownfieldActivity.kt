package com.circles.circlescare.brownfield

import android.app.Application
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import expo.modules.ApplicationLifecycleDispatcher
import android.view.KeyEvent
import expo.modules.devmenu.api.DevMenuApi

object BrownfieldLifecycleDispatcher {
  fun onApplicationCreate(application: Application) {
    ApplicationLifecycleDispatcher.onApplicationCreate(application)
  }

  fun onConfigurationChanged(application: Application, newConfig: Configuration) {
    ApplicationLifecycleDispatcher.onConfigurationChanged(application, newConfig)
  }
}

open class BrownfieldActivity : AppCompatActivity() {
  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    BrownfieldLifecycleDispatcher.onConfigurationChanged(this.application, newConfig)
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (BuildConfig.DEBUG) {
      val fragment by DevMenuApi.fragment { this }
      if (fragment?.onKeyUp(keyCode, event) == true) {
        return true
      }
    }

    return super.onKeyUp(keyCode, event)
  }
}
