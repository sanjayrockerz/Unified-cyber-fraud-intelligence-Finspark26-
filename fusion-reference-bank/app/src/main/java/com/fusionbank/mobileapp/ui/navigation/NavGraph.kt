package com.fusionbank.mobileapp.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.fusionbank.mobileapp.ui.screens.accounts.AccountsScreen
import com.fusionbank.mobileapp.ui.screens.beneficiary.BeneficiaryScreen
import com.fusionbank.mobileapp.ui.screens.bill.BillPaymentScreen
import com.fusionbank.mobileapp.ui.screens.dashboard.DashboardScreen
import com.fusionbank.mobileapp.ui.screens.forgotpassword.ForgotPasswordScreen
import com.fusionbank.mobileapp.ui.screens.login.LoginScreen
import com.fusionbank.mobileapp.ui.screens.registration.RegistrationScreen
import com.fusionbank.mobileapp.ui.screens.pairing.PairingScreen
import com.fusionbank.mobileapp.ui.screens.profile.ProfileScreen
import com.fusionbank.mobileapp.ui.screens.qr.QrPaymentScreen
import com.fusionbank.mobileapp.ui.screens.simulator.SimulatorScreen
import com.fusionbank.mobileapp.ui.screens.splash.SplashScreen
import com.fusionbank.mobileapp.ui.screens.transfer.TransferScreen
import com.fusionbank.mobileapp.ui.screens.trust.TrustPassportScreen

object Destinations {
    const val SPLASH = "splash"
    const val PAIRING = "pairing"
    const val LOGIN = "login"
    const val REGISTRATION = "registration"
    const val FORGOT_PASSWORD = "forgot_password"
    const val DASHBOARD = "dashboard"
    const val ACCOUNTS = "accounts"
    const val TRANSFER = "transfer"
    const val BENEFICIARY = "beneficiary"
    const val QR_PAYMENT = "qr_payment"
    const val BILL_PAYMENT = "bill_payment"
    const val PROFILE = "profile"
    const val SIMULATOR = "simulator"
    const val TRUST_PASSPORT = "trust_passport"
}

@Composable
fun NavGraph(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = Destinations.SPLASH
    ) {

        // ── Splash: detects pairing state, routes accordingly ────────────
        composable(Destinations.SPLASH) {
            SplashScreen(
                onNavigateToLogin = {
                    // Device already paired → skip pairing, go straight to login
                    navController.navigate(Destinations.LOGIN) {
                        popUpTo(Destinations.SPLASH) { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    // Active session restored → go directly to dashboard
                    navController.navigate(Destinations.DASHBOARD) {
                        popUpTo(Destinations.SPLASH) { inclusive = true }
                    }
                }
            )
        }

        // ── Pairing: scan QR or skip if already paired ───────────────────
        composable(Destinations.PAIRING) {
            PairingScreen(
                onPaired = {
                    navController.navigate(Destinations.LOGIN) {
                        popUpTo(Destinations.PAIRING) { inclusive = true }
                    }
                },
                onSkip = {
                    navController.navigate(Destinations.LOGIN) {
                        popUpTo(Destinations.PAIRING) { inclusive = true }
                    }
                }
            )
        }

        // ── Login: email + password ──────────────────────────────────────
        composable(Destinations.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Destinations.DASHBOARD) {
                        popUpTo(Destinations.LOGIN) { inclusive = true }
                    }
                },
                onRegister = {
                    navController.navigate(Destinations.REGISTRATION)
                },
                onForgotPassword = {
                    navController.navigate(Destinations.FORGOT_PASSWORD)
                }
            )
        }

        // ── Registration ─────────────────────────────────────────────────
        composable(Destinations.REGISTRATION) {
            RegistrationScreen(
                onRegistered = {
                    // After registering, go to login (not dashboard — email must be verified)
                    navController.navigate(Destinations.LOGIN) {
                        popUpTo(Destinations.REGISTRATION) { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        // ── Forgot Password ──────────────────────────────────────────────
        composable(Destinations.FORGOT_PASSWORD) {
            ForgotPasswordScreen(
                onBack = { navController.popBackStack() }
            )
        }

        // ── Dashboard ────────────────────────────────────────────────────
        composable(Destinations.DASHBOARD) {
            DashboardScreen(
                onNavigate = { route -> navController.navigate(route) }
            )
        }

        composable(Destinations.ACCOUNTS) {
            AccountsScreen(onBack = { navController.popBackStack() })
        }

        composable(Destinations.TRANSFER) {
            TransferScreen(onBack = { navController.popBackStack() })
        }

        composable(Destinations.BENEFICIARY) {
            BeneficiaryScreen(onBack = { navController.popBackStack() })
        }

        composable(Destinations.QR_PAYMENT) {
            QrPaymentScreen(onBack = { navController.popBackStack() })
        }

        composable(Destinations.BILL_PAYMENT) {
            BillPaymentScreen(onBack = { navController.popBackStack() })
        }

        composable(Destinations.PROFILE) {
            ProfileScreen(
                onBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Destinations.LOGIN) {
                        popUpTo(Destinations.DASHBOARD) { inclusive = true }
                    }
                },
                onOpenSimulator = {
                    navController.navigate(Destinations.SIMULATOR)
                }
            )
        }

        composable(Destinations.SIMULATOR) {
            SimulatorScreen(onBack = { navController.popBackStack() })
        }

        composable(Destinations.TRUST_PASSPORT) {
            TrustPassportScreen(onBack = { navController.popBackStack() })
        }
    }
}
