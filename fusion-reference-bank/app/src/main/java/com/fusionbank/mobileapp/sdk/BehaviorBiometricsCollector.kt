package com.fusionbank.mobileapp.sdk

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.SystemClock
import android.util.Log
import android.view.KeyEvent
import android.view.MotionEvent
import com.fusionbank.mobileapp.sdk.models.BehavioralBiometricsRequest
import com.fusionbank.mobileapp.sdk.models.MotionSignatureSample
import com.fusionbank.mobileapp.sdk.models.TouchPressureSample
import com.fusionbank.mobileapp.sdk.models.TypingRhythmSample
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.UUID
import java.util.concurrent.CopyOnWriteArrayList

/**
 * BehaviorBiometricsCollector — Continuous passive behavioral biometrics.
 *
 * Captures three channels:
 *  1. Typing Rhythm   — inter-key interval (ms) + dwell time per keystroke
 *  2. Touch Pressure  — MotionEvent pressure + major axis size
 *  3. Motion/Gait     — SensorManager accelerometer + gyroscope at 50Hz, batched 2s
 *
 * Auto-flushes collected samples every [FLUSH_INTERVAL_MS] ms via [onFlush] callback.
 * Designed for zero-permission operation (no RECORD_AUDIO, no location).
 */
internal class BehaviorBiometricsCollector(
    context: Context,
    private val scope: CoroutineScope,
    private val onFlush: suspend (BehavioralBiometricsRequest) -> Unit,
) : SensorEventListener {

    companion object {
        private const val TAG = "FusionBehaviorCollector"
        private const val FLUSH_INTERVAL_MS = 5_000L          // 5-second flush cycle
        private const val MAX_RHYTHM_SAMPLES = 50
        private const val MAX_MOTION_SAMPLES = 100
        private const val CALIBRATION_SAMPLES = 20            // first N samples = baseline, no anomaly
    }

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    // --- Typing Rhythm state ---
    private var lastKeyDownTime: Long = -1L
    private var lastKeyCode: Int = -1
    private val interKeyIntervals = CopyOnWriteArrayList<Long>()   // ms between key-down events
    private val dwellTimes = CopyOnWriteArrayList<Long>()          // ms between key-down and key-up
    private val keyDownTimes = HashMap<Int, Long>()                // keyCode → down timestamp

    // --- Touch Pressure state ---
    private val pressureSamples = CopyOnWriteArrayList<Float>()
    private val touchSizeSamples = CopyOnWriteArrayList<Float>()

    // --- Motion state ---
    private val accelX = CopyOnWriteArrayList<Float>()
    private val accelY = CopyOnWriteArrayList<Float>()
    private val accelZ = CopyOnWriteArrayList<Float>()
    private val gyroX = CopyOnWriteArrayList<Float>()
    private val gyroY = CopyOnWriteArrayList<Float>()
    private val gyroZ = CopyOnWriteArrayList<Float>()

    private var flushJob: Job? = null
    private var sessionId: String = ""
    private var deviceId: String = ""
    private var sampleCount: Int = 0

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    fun start(sessionId: String, deviceId: String) {
        this.sessionId = sessionId
        this.deviceId = deviceId
        this.sampleCount = 0
        registerSensors()
        scheduleFlush()
        Log.i(TAG, "Behavioral biometrics collector STARTED [session=$sessionId]")
    }

    fun stop() {
        flushJob?.cancel()
        sensorManager.unregisterListener(this)
        clearBuffers()
        Log.i(TAG, "Behavioral biometrics collector STOPPED")
    }

    // -------------------------------------------------------------------------
    // Typing Rhythm — feed from Activity.dispatchKeyEvent()
    // -------------------------------------------------------------------------

    fun onKeyEvent(event: KeyEvent): Boolean {
        val now = SystemClock.elapsedRealtime()
        when (event.action) {
            KeyEvent.ACTION_DOWN -> {
                val keyCode = event.keyCode
                if (lastKeyDownTime > 0) {
                    val interval = now - lastKeyDownTime
                    if (interval in 10..2000) {          // sane range 10ms–2s
                        interKeyIntervals.add(interval)
                        if (interKeyIntervals.size > MAX_RHYTHM_SAMPLES) interKeyIntervals.removeAt(0)
                    }
                }
                lastKeyDownTime = now
                lastKeyCode = event.keyCode
                keyDownTimes[keyCode] = now
            }
            KeyEvent.ACTION_UP -> {
                val downTime = keyDownTimes.remove(event.keyCode)
                if (downTime != null) {
                    val dwell = now - downTime
                    if (dwell in 10..500) {
                        dwellTimes.add(dwell)
                        if (dwellTimes.size > MAX_RHYTHM_SAMPLES) dwellTimes.removeAt(0)
                    }
                }
            }
        }
        return false    // do not consume — pass through to normal input chain
    }

    // -------------------------------------------------------------------------
    // Touch Pressure — feed from Activity.dispatchTouchEvent()
    // -------------------------------------------------------------------------

    fun onTouchEvent(event: MotionEvent) {
        if (event.action == MotionEvent.ACTION_DOWN || event.action == MotionEvent.ACTION_MOVE) {
            val pressure = event.pressure.coerceIn(0f, 1f)
            val size = event.size.coerceIn(0f, 1f)
            pressureSamples.add(pressure)
            touchSizeSamples.add(size)
            if (pressureSamples.size > MAX_RHYTHM_SAMPLES) pressureSamples.removeAt(0)
            if (touchSizeSamples.size > MAX_RHYTHM_SAMPLES) touchSizeSamples.removeAt(0)
        }
    }

    // -------------------------------------------------------------------------
    // Motion — SensorEventListener
    // -------------------------------------------------------------------------

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                accelX.add(event.values[0])
                accelY.add(event.values[1])
                accelZ.add(event.values[2])
                if (accelX.size > MAX_MOTION_SAMPLES) { accelX.removeAt(0); accelY.removeAt(0); accelZ.removeAt(0) }
            }
            Sensor.TYPE_GYROSCOPE -> {
                gyroX.add(event.values[0])
                gyroY.add(event.values[1])
                gyroZ.add(event.values[2])
                if (gyroX.size > MAX_MOTION_SAMPLES) { gyroX.removeAt(0); gyroY.removeAt(0); gyroZ.removeAt(0) }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) { /* no-op */ }

    // -------------------------------------------------------------------------
    // Flush
    // -------------------------------------------------------------------------

    private fun scheduleFlush() {
        flushJob?.cancel()
        flushJob = scope.launch(Dispatchers.IO) {
            while (true) {
                delay(FLUSH_INTERVAL_MS)
                val payload = buildPayload() ?: continue
                try {
                    onFlush(payload)
                    sampleCount++
                    Log.d(TAG, "Biometrics flushed [#$sampleCount] — rhythm=${payload.typingRhythm != null} touch=${payload.touchPressure != null} motion=${payload.motionSignature != null}")
                } catch (e: Exception) {
                    Log.w(TAG, "Biometrics flush failed: ${e.message}")
                }
            }
        }
    }

    private fun buildPayload(): BehavioralBiometricsRequest? {
        // Require at least some data in one channel
        val hasTyping = interKeyIntervals.size >= 3
        val hasTouch = pressureSamples.size >= 3
        val hasMotion = accelX.size >= 10
        if (!hasTyping && !hasTouch && !hasMotion) return null

        val typing = if (hasTyping) {
            val intervals = interKeyIntervals.toList()
            val dwells = dwellTimes.toList()
            TypingRhythmSample(
                sampleCount = intervals.size,
                meanInterKeyIntervalMs = intervals.average().toLong(),
                stdDevInterKeyIntervalMs = stdDev(intervals),
                meanDwellTimeMs = if (dwells.isNotEmpty()) dwells.average().toLong() else 0L,
                stdDevDwellTimeMs = if (dwells.isNotEmpty()) stdDev(dwells) else 0.0,
                minInterKeyMs = intervals.minOrNull() ?: 0L,
                maxInterKeyMs = intervals.maxOrNull() ?: 0L,
                isCalibrating = sampleCount < CALIBRATION_SAMPLES,
            )
        } else null

        val touch = if (hasTouch) {
            val pressures = pressureSamples.toList()
            val sizes = touchSizeSamples.toList()
            TouchPressureSample(
                sampleCount = pressures.size,
                meanPressure = pressures.average().toFloat(),
                stdDevPressure = stdDev(pressures.map { it.toLong() }).toFloat(),
                meanTouchSize = sizes.average().toFloat(),
                minPressure = pressures.minOrNull() ?: 0f,
                maxPressure = pressures.maxOrNull() ?: 0f,
                isCalibrating = sampleCount < CALIBRATION_SAMPLES,
            )
        } else null

        val motion = if (hasMotion) {
            MotionSignatureSample(
                sampleCount = accelX.size,
                accelMeanX = accelX.average().toFloat(),
                accelMeanY = accelY.average().toFloat(),
                accelMeanZ = accelZ.average().toFloat(),
                accelStdX = stdDev(accelX.map { it.toLong() }).toFloat(),
                accelStdY = stdDev(accelY.map { it.toLong() }).toFloat(),
                accelStdZ = stdDev(accelZ.map { it.toLong() }).toFloat(),
                gyroMeanX = if (gyroX.isNotEmpty()) gyroX.average().toFloat() else 0f,
                gyroMeanY = if (gyroY.isNotEmpty()) gyroY.average().toFloat() else 0f,
                gyroMeanZ = if (gyroZ.isNotEmpty()) gyroZ.average().toFloat() else 0f,
                isCalibrating = sampleCount < CALIBRATION_SAMPLES,
            )
        } else null

        return BehavioralBiometricsRequest(
            sessionId = sessionId,
            deviceId = deviceId,
            typingRhythm = typing,
            touchPressure = touch,
            motionSignature = motion,
            capturedAt = System.currentTimeMillis(),
            requestId = "REQ_${UUID.randomUUID().toString().replace("-","").uppercase()}",
            correlationId = "COR_${UUID.randomUUID().toString().replace("-","").uppercase()}",
        )
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private fun registerSensors() {
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
        gyroscope?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_GAME)
        }
    }

    private fun clearBuffers() {
        interKeyIntervals.clear(); dwellTimes.clear(); keyDownTimes.clear()
        pressureSamples.clear(); touchSizeSamples.clear()
        accelX.clear(); accelY.clear(); accelZ.clear()
        gyroX.clear(); gyroY.clear(); gyroZ.clear()
    }

    private fun stdDev(values: List<Long>): Double {
        if (values.size < 2) return 0.0
        val mean = values.average()
        return Math.sqrt(values.sumOf { (it - mean) * (it - mean) } / values.size)
    }
}
