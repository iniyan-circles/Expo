package com.circles.circlescare_android

import android.content.Intent
import android.os.Bundle
import com.circles.circlescare.brownfield.BrownfieldActivity
import com.circles.circlescare.brownfield.showReactNativeFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

class MainActivity :
    BrownfieldActivity(),
    DefaultHardwareBackBtnHandler {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Expo Router reads Linking.getInitialURL() which picks up intent.data automatically,
        // so deep links like circlescareexpo://explore open the correct route without extra wiring.
        showReactNativeFragment("main")
    }

    // Forward new intents to the React Native instance so runtime deep links
    // (when the app is already open) are handled by Expo Router's Linking module.
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
    }

    override fun invokeDefaultOnBackPressed() {
        onBackPressedDispatcher.onBackPressed()
    }
}
