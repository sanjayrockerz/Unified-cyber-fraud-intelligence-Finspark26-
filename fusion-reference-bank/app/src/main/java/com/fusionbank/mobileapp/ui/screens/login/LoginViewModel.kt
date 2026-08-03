package com.fusionbank.mobileapp.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fusionbank.mobileapp.sdk.Fusion
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor() : ViewModel() {

    private val _email = MutableStateFlow("")
    val email: StateFlow<String> = _email.asStateFlow()

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun onEmailChanged(newVal: String) {
        _email.value = newVal.trim()
        _errorMessage.value = null
    }

    fun onPasswordChanged(newVal: String) {
        _password.value = newVal
        _errorMessage.value = null
    }

    fun login(onSuccess: () -> Unit) {
        val emailVal = _email.value.trim()
        val passwordVal = _password.value

        // Validate
        if (emailVal.isBlank() || !emailVal.contains('@') || !emailVal.contains('.')) {
            _errorMessage.value = "Please enter a valid email address"
            return
        }
        if (passwordVal.length < 8) {
            _errorMessage.value = "Password must be at least 8 characters"
            return
        }

        _isLoading.value = true
        _errorMessage.value = null

        // Pass email as the username identifier to the backend
        Fusion.login(emailVal, passwordVal) { result ->
            _isLoading.value = false
            result.onSuccess {
                Fusion.lastLoginSecurity.value?.let { security ->
                    if (security.riskScore >= 35f) {
                        _errorMessage.value =
                            "⚠ Suspicious login detected. A security alert has been sent to your email."
                    }
                }
                onSuccess()
            }.onFailure { ex ->
                _errorMessage.value = when {
                    ex.message?.contains("401") == true -> "Incorrect email or password"
                    ex.message?.contains("403") == true -> "Your account has been locked. Contact support."
                    ex.message?.contains("SDK") == true -> "Platform not paired. Please scan the QR code first."
                    else -> ex.message ?: "Login failed. Please try again."
                }
            }
        }
    }
}
