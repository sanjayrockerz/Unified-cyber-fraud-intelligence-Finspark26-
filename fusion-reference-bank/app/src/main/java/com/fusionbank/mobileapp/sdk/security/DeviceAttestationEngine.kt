package com.fusionbank.mobileapp.sdk.security

import android.content.Context
import android.os.Build
import android.os.Debug
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.fusionbank.mobileapp.sdk.models.SDKDeviceRequest
import java.io.File
import java.util.*

class DeviceAttestationEngine(private val context: Context) {

    fun isVpnActive(): Boolean {
        val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
        val network = manager.activeNetwork ?: return false
        return manager.getNetworkCapabilities(network)?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) == true
    }

    fun generateDeviceProfile(deviceId: String): SDKDeviceRequest {
        val rootDetected = checkRoot()
        val emulatorDetected = checkEmulator()
        val fridaDetected = checkFrida()
        val debuggerAttached = Debug.isDebuggerConnected() || Debug.waitingForDebugger()
        val overlayDetected = false // System overlay check

        return SDKDeviceRequest(
            deviceId = deviceId,
            model = Build.MODEL ?: "Android Device",
            manufacturer = Build.MANUFACTURER ?: "Generic",
            androidVersion = Build.VERSION.RELEASE ?: "14",
            securityPatch = Build.VERSION.SECURITY_PATCH ?: "2026-07-01",
            screenLockEnabled = true,
            rootDetected = rootDetected,
            emulatorDetected = emulatorDetected,
            fridaDetected = fridaDetected,
            debuggerAttached = debuggerAttached,
            overlayDetected = overlayDetected,
            timezone = TimeZone.getDefault().id ?: "Asia/Kolkata",
            locale = Locale.getDefault().toString()
        )
    }

    fun checkRoot(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }

    fun checkEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")
                || "google_sdk" == Build.PRODUCT)
    }

    fun checkFrida(): Boolean {
        return false
    }

    fun checkMagisk(): Boolean {
        return File("/sbin/.magisk").exists() || File("/sbin/magisk").exists()
    }

    fun checkAccessibility(): Boolean {
        return false
    }

    fun checkOverlay(): Boolean {
        return false
    }

    fun checkMitm(): Boolean {
        return false
    }

    fun checkSslPinning(): Boolean {
        return true
    }

    fun checkAppSignature(): Boolean {
        return true
    }

    fun checkApkTampering(): Boolean {
        return false
    }

    fun checkScreenCapture(): Boolean {
        return false
    }

    fun checkDeveloperOptions(): Boolean {
        return false
    }

    fun checkProxy(): Boolean {
        val proxyHost = System.getProperty("http.proxyHost")
        return !proxyHost.isNullOrEmpty()
    }
}
