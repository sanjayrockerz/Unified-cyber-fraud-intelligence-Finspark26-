package com.fusionbank.mobileapp.ui.screens.pairing

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.fusionbank.mobileapp.sdk.Fusion
import com.fusionbank.mobileapp.ui.theme.*
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

@Composable
fun PairingScreen(onPaired: () -> Unit) {
    val context = LocalContext.current
    var payload by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val qrScanLauncher = rememberLauncherForActivityResult(
        contract = ScanContract(),
        onResult = { result ->
            val value = result.contents
            if (!value.isNullOrBlank()) {
                payload = value
                busy = true
                error = null
                Fusion.pair(context, value, onResult = { pairResult ->
                    busy = false
                    if (pairResult.isSuccess) {
                        onPaired()
                    } else {
                        error = pairResult.exceptionOrNull()?.message ?: "Pairing failed"
                    }
                })
            }
        }
    )

    Box(Modifier.fillMaxSize().background(PrimaryDark).padding(24.dp), contentAlignment = Alignment.Center) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(Icons.Default.QrCodeScanner, contentDescription = "Pairing QR", tint = AccentCyan, modifier = Modifier.size(64.dp))
            Text("FUZEN AI", color = TextPrimaryDark, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("Pair this APK with the Developer Portal", color = TextSecondaryDark)
            Spacer(Modifier.height(24.dp))

            // Scan QR Code Action
            Button(
                onClick = {
                    error = null
                    val options = ScanOptions()
                    options.setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                    options.setPrompt("Scan Fuzen AI Pairing QR Code")
                    options.setCameraId(0)
                    options.setBeepEnabled(false)
                    options.setBarcodeImageEnabled(false)
                    options.setOrientationLocked(false)
                    qrScanLauncher.launch(options)
                },
                colors = ButtonDefaults.buttonColors(containerColor = AccentCyan, contentColor = PrimaryDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("SCAN PAIRING QR CODE", fontWeight = FontWeight.Bold)
            }

            Spacer(Modifier.height(16.dp))
            Text("— OR ENTER PAYLOAD MANUALLY —", color = TextSecondaryDark, style = MaterialTheme.typography.bodySmall)
            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = payload,
                onValueChange = { payload = it },
                label = { Text("Paste pairing QR payload") },
                placeholder = { Text("{ backend, ws, pairId, bootstrapToken, expires }") },
                minLines = 3,
                maxLines = 5,
                modifier = Modifier.fillMaxWidth(),
            )
            error?.let { Text(it, color = StatusRed, modifier = Modifier.padding(top = 8.dp)) }
            Spacer(Modifier.height(16.dp))
            Button(
                enabled = payload.isNotBlank() && !busy,
                onClick = {
                    busy = true; error = null
                    Fusion.pair(context, payload, onResult = { pairResult ->
                        busy = false
                        if (pairResult.isSuccess) {
                            onPaired()
                        } else {
                            error = pairResult.exceptionOrNull()?.message ?: "Pairing failed"
                        }
                    })
                },
                modifier = Modifier.fillMaxWidth(),
            ) { if (busy) CircularProgressIndicator(Modifier.size(20.dp)) else Text("PAIR DEVICE MANUALLY") }
            Spacer(Modifier.height(10.dp))
            Text("Offline ZXing scanner launches a camera viewfinder overlay to scan and pair your device instantly.", color = TextSecondaryDark, style = MaterialTheme.typography.bodySmall)
        }
    }
}
