package com.fusionbank.mobileapp.ui.screens.registration

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.fusionbank.mobileapp.sdk.Fusion
import com.fusionbank.mobileapp.ui.theme.*

@Composable
fun RegistrationScreen(onRegistered: () -> Unit, onBack: () -> Unit) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var confirmVisible by remember { mutableStateOf(false) }
    var agreedToTerms by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PrimaryDark)
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Create Account",
                    color = TextPrimaryDark,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Your email will be used to log in and receive security alerts.",
                    color = TextSecondaryDark,
                    style = MaterialTheme.typography.bodySmall
                )

                // Full name
                OutlinedTextField(
                    value = fullName,
                    onValueChange = { fullName = it },
                    label = { Text("Full name") },
                    leadingIcon = { Icon(Icons.Default.Person, null, tint = AccentCyan) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue, unfocusedBorderColor = CardBorderDark
                    )
                )

                // Email
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it.trim() },
                    label = { Text("Email address") },
                    leadingIcon = { Icon(Icons.Default.Email, null, tint = AccentCyan) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue, unfocusedBorderColor = CardBorderDark
                    )
                )

                // Phone
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Mobile number (+91…)") },
                    leadingIcon = { Icon(Icons.Default.Phone, null, tint = AccentCyan) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue, unfocusedBorderColor = CardBorderDark
                    )
                )

                // Password
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password (min 8 characters)") },
                    leadingIcon = { Icon(Icons.Default.Lock, null, tint = AccentCyan) },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                null, tint = TextSecondaryDark
                            )
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue, unfocusedBorderColor = CardBorderDark
                    )
                )

                // Confirm password
                OutlinedTextField(
                    value = confirmPassword,
                    onValueChange = { confirmPassword = it },
                    label = { Text("Confirm password") },
                    leadingIcon = { Icon(Icons.Default.Lock, null, tint = AccentCyan) },
                    trailingIcon = {
                        IconButton(onClick = { confirmVisible = !confirmVisible }) {
                            Icon(
                                if (confirmVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                null, tint = TextSecondaryDark
                            )
                        }
                    },
                    visualTransformation = if (confirmVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    isError = confirmPassword.isNotEmpty() && password != confirmPassword,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryBlue, unfocusedBorderColor = CardBorderDark
                    )
                )
                if (confirmPassword.isNotEmpty() && password != confirmPassword) {
                    Text("Passwords do not match", color = StatusRed, style = MaterialTheme.typography.labelSmall)
                }

                // Terms checkbox
                Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(
                        checked = agreedToTerms,
                        onCheckedChange = { agreedToTerms = it },
                        colors = CheckboxDefaults.colors(checkedColor = PrimaryBlue)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "I agree to the Terms of Service and Privacy Policy",
                        color = TextSecondaryDark,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                // Error
                error?.let {
                    Text(it, color = StatusRed, style = MaterialTheme.typography.bodySmall)
                }

                // Register button
                Button(
                    onClick = {
                        when {
                            fullName.isBlank() -> { error = "Please enter your full name"; return@Button }
                            !email.contains('@') || !email.contains('.') -> { error = "Please enter a valid email address"; return@Button }
                            phone.length < 7 -> { error = "Please enter a valid mobile number"; return@Button }
                            password.length < 8 -> { error = "Password must be at least 8 characters"; return@Button }
                            password != confirmPassword -> { error = "Passwords do not match"; return@Button }
                            !agreedToTerms -> { error = "Please accept the Terms of Service"; return@Button }
                            else -> {
                                loading = true
                                error = null
                                Fusion.registerCustomer(fullName, email, phone, password) { result ->
                                    loading = false
                                    result.onSuccess { onRegistered() }
                                        .onFailure { error = it.message ?: "Registration failed. Please try again." }
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
                        Text("CREATE ACCOUNT", fontWeight = FontWeight.Bold)
                    }
                }

                TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) {
                    Text("← Back to Login", color = AccentCyan)
                }
            }
        }
    }
}
