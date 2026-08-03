package com.fusionbank.mobileapp.ui.screens.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.fusionbank.mobileapp.ui.theme.*

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onRegister: () -> Unit,
    onForgotPassword: () -> Unit = {},
    viewModel: LoginViewModel = hiltViewModel()
) {
    val email by viewModel.email.collectAsState()
    val password by viewModel.password.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    var passwordVisible by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryDark)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // ── Brand Header ─────────────────────────────────────────────
            Icon(
                imageVector = Icons.Default.AccountBalance,
                contentDescription = "Bank Logo",
                tint = PrimaryBlue,
                modifier = Modifier.size(56.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "FUZEN AI",
                style = MaterialTheme.typography.headlineMedium,
                color = TextPrimaryDark,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Fusion National Bank · Adaptive Trust",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondaryDark
            )

            Spacer(modifier = Modifier.height(32.dp))

            // ── Login Card ───────────────────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceDark),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(0.dp)
                ) {
                    Text(
                        text = "Sign In",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextPrimaryDark,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Use your registered email address",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondaryDark,
                        modifier = Modifier.padding(top = 2.dp, bottom = 20.dp)
                    )

                    // Email field
                    OutlinedTextField(
                        value = email,
                        onValueChange = viewModel::onEmailChanged,
                        label = { Text("Email address") },
                        leadingIcon = {
                            Icon(Icons.Default.Email, contentDescription = null, tint = AccentCyan)
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryBlue,
                            unfocusedBorderColor = CardBorderDark
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Password field
                    OutlinedTextField(
                        value = password,
                        onValueChange = viewModel::onPasswordChanged,
                        label = { Text("Password") },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, contentDescription = null, tint = AccentCyan)
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (passwordVisible) "Hide password" else "Show password",
                                    tint = TextSecondaryDark
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryBlue,
                            unfocusedBorderColor = CardBorderDark
                        )
                    )

                    // Forgot password link
                    TextButton(
                        onClick = onForgotPassword,
                        modifier = Modifier.align(Alignment.End).padding(top = 2.dp)
                    ) {
                        Text("Forgot password?", color = AccentCyan, style = MaterialTheme.typography.bodySmall)
                    }

                    // Error message
                    errorMessage?.let { err ->
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = err,
                            color = StatusRed,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Sign-in button
                    Button(
                        onClick = { viewModel.login(onLoginSuccess) },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = TextPrimaryDark,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text("SIGN IN", fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Register link
                    TextButton(
                        onClick = onRegister,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Don't have an account? REGISTER", color = AccentCyan)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Protected by Fuzen AI · End-to-end encrypted",
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondaryDark
            )
        }
    }
}
