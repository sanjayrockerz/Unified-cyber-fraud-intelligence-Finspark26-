package com.fusionbank.mobileapp.ui.screens.forgotpassword

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Email
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.fusionbank.mobileapp.ui.theme.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody

@Composable
fun ForgotPasswordScreen(
    onBack: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var sent by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryDark)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (sent) {
                    // ── Success state ────────────────────────────────────
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Email sent",
                        tint = Color(0xFF10B981),
                        modifier = Modifier.size(56.dp)
                    )
                    Text(
                        "Check your email",
                        color = TextPrimaryDark,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "A password reset link has been sent to $email.\nIt expires in 15 minutes.",
                        color = TextSecondaryDark,
                        style = MaterialTheme.typography.bodySmall,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(8.dp))
                    Button(
                        onClick = onBack,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("← BACK TO LOGIN", fontWeight = FontWeight.Bold)
                    }
                } else {
                    // ── Input state ──────────────────────────────────────
                    Text(
                        "Reset Password",
                        color = TextPrimaryDark,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.align(Alignment.Start)
                    )
                    Text(
                        "Enter your registered email and we'll send you a reset link.",
                        color = TextSecondaryDark,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.align(Alignment.Start)
                    )

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it.trim(); error = null },
                        label = { Text("Email address") },
                        leadingIcon = { Icon(Icons.Default.Email, null, tint = AccentCyan) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryBlue,
                            unfocusedBorderColor = CardBorderDark
                        )
                    )

                    error?.let {
                        Text(it, color = StatusRed, style = MaterialTheme.typography.bodySmall)
                    }

                    Button(
                        onClick = {
                            if (!email.contains('@') || !email.contains('.')) {
                                error = "Please enter a valid email address"
                                return@Button
                            }
                            loading = true
                            error = null
                            // Call the backend forgot-password endpoint
                            CoroutineScope(Dispatchers.IO).launch {
                                try {
                                    val client = okhttp3.OkHttpClient()
                                    val mediaType = "application/json".toMediaTypeOrNull()
                                    val body = """{"email":"$email"}""".toRequestBody(mediaType)
                                    val request = okhttp3.Request.Builder()
                                        .url(com.fusionbank.mobileapp.sdk.Fusion.getBaseUrl() + "api/auth/forgot-password")
                                        .post(body)
                                        .build()
                                    client.newCall(request).execute().use {
                                        kotlinx.coroutines.withContext(Dispatchers.Main) {
                                            loading = false
                                            sent = true
                                        }
                                    }
                                } catch (e: Exception) {
                                    kotlinx.coroutines.withContext(Dispatchers.Main) {
                                        loading = false
                                        // Show success even on error to avoid email enumeration
                                        sent = true
                                    }
                                }
                            }
                        },
                        enabled = !loading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        if (loading) {
                            CircularProgressIndicator(Modifier.size(20.dp), color = TextPrimaryDark, strokeWidth = 2.dp)
                        } else {
                            Text("SEND RESET LINK", fontWeight = FontWeight.Bold)
                        }
                    }

                    TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                        Text("← Back to Login", color = AccentCyan)
                    }
                }
            }
        }
    }
}
