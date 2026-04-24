package com.circles.circlescare_android

import android.os.Bundle
import com.anithaaji.circlescareexpo.brownfield.BrownfieldActivity
import com.anithaaji.circlescareexpo.brownfield.showReactNativeFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

class MainActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showReactNativeFragment("main")
    }

    override fun invokeDefaultOnBackPressed() {
        super.onBackPressed()
    }
}
