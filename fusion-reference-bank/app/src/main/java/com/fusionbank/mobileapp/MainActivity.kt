package com.fusionbank.mobileapp

import android.os.Bundle
import android.view.KeyEvent
import android.view.MotionEvent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.fusionbank.mobileapp.sdk.Fusion
import com.fusionbank.mobileapp.ui.navigation.NavGraph
import com.fusionbank.mobileapp.ui.theme.FusionTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FusionTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NavGraph()
                }
            }
        }
    }

    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        ev?.let { Fusion.dispatchTouchEvent(it) }
        return super.dispatchTouchEvent(ev)
    }

    override fun onResume() {
        super.onResume()
        Fusion.reportLifecycleEvent("APP_RESUME")
    }

    override fun onPause() {
        Fusion.reportLifecycleEvent("APP_BACKGROUND")
        super.onPause()
    }

    override fun dispatchKeyEvent(event: KeyEvent?): Boolean {
        val consumed = event?.let { Fusion.dispatchKeyEvent(it) } ?: false
        return if (consumed) true else super.dispatchKeyEvent(event)
    }
}
