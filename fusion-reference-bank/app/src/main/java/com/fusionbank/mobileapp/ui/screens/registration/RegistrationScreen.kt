package com.fusionbank.mobileapp.ui.screens.registration

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.fusionbank.mobileapp.sdk.Fusion
import com.fusionbank.mobileapp.ui.theme.*

@Composable
fun RegistrationScreen(onRegistered: () -> Unit, onBack: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().background(PrimaryDark).padding(24.dp), verticalArrangement = Arrangement.Center) {
        Card(colors = CardDefaults.cardColors(containerColor = SurfaceDark), shape = RoundedCornerShape(16.dp), modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Create Fusion Customer Identity", color = TextPrimaryDark, style = MaterialTheme.typography.titleLarge)
                Text("Your email becomes the primary security notification channel.", color = TextSecondaryDark)
                OutlinedTextField(name, { name = it }, label = { Text("Full name") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(email, { email = it }, label = { Text("Email address") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(phone, { phone = it }, label = { Text("Mobile number") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(password, { password = it }, label = { Text("Password") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
                error?.let { Text(it, color = StatusRed) }
                Button(onClick = {
                    if (name.isBlank() || !email.contains("@") || phone.length < 7 || password.length < 8) { error = "Enter valid name, email, mobile number and an 8+ character password"; return@Button }
                    loading = true; error = null
                    Fusion.registerCustomer(name, email, phone, password) { result ->
                        loading = false
                        result.onSuccess { onRegistered() }.onFailure { error = it.message ?: "Registration failed" }
                    }
                }, enabled = !loading, modifier = Modifier.fillMaxWidth()) { Text(if (loading) "REGISTERING…" else "REGISTER CUSTOMER") }
                TextButton(onClick = onBack, modifier = Modifier.fillMaxWidth()) { Text("BACK TO LOGIN", color = AccentCyan) }
            }
        }
    }
}
