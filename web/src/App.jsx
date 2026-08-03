import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PageHeader from './components/common/PageHeader';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import { SearchProvider } from './context/SearchContext';
import { NotificationProvider } from './context/NotificationContext';
import { CustomerProvider } from './context/CustomerContext';
import { CaseProvider } from './context/CaseContext';
import { ReplayProvider } from './context/ReplayContext';

const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ThreatDashboard = lazy(() => import('./pages/CyberThreatIntelligencePage'));
const OperationsCenterPage = lazy(() => import('./pages/OperationsCenterPage'));
const CasesPage = lazy(() => import('./pages/CasesPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const InvestigationPage = lazy(() => import('./pages/InvestigationPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SessionIntelligencePage = lazy(() => import('./pages/SessionIntelligencePage'));
const GraphPage = lazy(() => import('./pages/GraphPage'));
const ExecutiveCommandCenterPage = lazy(() => import('./pages/ExecutiveCommandCenterPage'));
const TelemetryPage = lazy(() => import('./pages/TelemetryPage'));
const BankingPage = lazy(() => import('./pages/BankingPage'));
const SyntheticLabPage = lazy(() => import('./pages/SyntheticLabPage'));
const DeveloperPlatformPage = lazy(() => import('./pages/DeveloperPlatformPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const QuantumTrustPage = lazy(() => import('./pages/QuantumTrustPage'));

function Loading() {
  return <div className="p-6 text-soc-muted">Loading platform view…</div>;
}

function RouteSurface({ title, description, children }) {
  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-6 pb-8">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <CaseProvider>
          <CustomerProvider>
            <NotificationProvider>
              <ReplayProvider>
                <SearchProvider>
                  <BrowserRouter>
                    <Suspense fallback={<Loading />}>
                      <Routes>
                        <Route path="/" element={<AppLayout quantumData={null} />}>
                          <Route index element={<OverviewPage />} />
                          <Route path="threats" element={<ThreatDashboard />} />
                          <Route path="copilot" element={<Navigate to="/operations" replace />} />
                          <Route path="operations" element={<OperationsCenterPage />} />
                          <Route path="cases" element={<CasesPage />} />
                          <Route path="customers" element={<CustomersPage />} />
                          <Route path="investigation/:caseId?" element={<RouteSurface title="Investigation" description="Follow linked fraud, cyber, and evidence signals through one focused case workspace."><InvestigationPage /></RouteSurface>} />
                          <Route path="analytics" element={<RouteSurface title="Analytics" description="Measure fusion performance using reproducible security and fraud metrics."><AnalyticsPage /></RouteSurface>} />
                          <Route path="reports" element={<RouteSurface title="Reports" description="Export decision evidence and regulatory-ready incident documentation."><ReportsPage /></RouteSurface>} />
                          <Route path="sessions" element={<RouteSurface title="Session Intelligence" description="Assess trust across the banking session before a transaction is released."><SessionIntelligencePage /></RouteSurface>} />
                          <Route path="graph" element={<RouteSurface title="Graph Runtime" description="Inspect connected accounts, devices, IPs, and mule-network context."><GraphPage /></RouteSurface>} />
                          <Route path="executive" element={<RouteSurface title="Executive Command Center" description="Understand the current risk posture and decision impact at a glance."><ExecutiveCommandCenterPage /></RouteSurface>} />
                          <Route path="telemetry" element={<RouteSurface title="Telemetry" description="Review the latest cyber signals flowing into the fraud decision."><TelemetryPage /></RouteSurface>} />
                          <Route path="banking" element={<RouteSurface title="Banking" description="Inspect transaction context and beneficiary relationships before release."><BankingPage /></RouteSurface>} />
                          <Route path="synthetic-lab" element={<RouteSurface title="Synthetic Lab" description="Generate reproducible banking universes for demonstration and scale testing."><SyntheticLabPage /></RouteSurface>} />
                          <Route path="developer" element={<RouteSurface title="SDK Runtime" description="Connect devices and observe authenticated integration events."><DeveloperPlatformPage /></RouteSurface>} />
                          <Route path="quantum" element={<RouteSurface title="Quantum Trust" description="Review post-quantum cryptographic posture and harvest-now-decrypt-later exposure."><QuantumTrustPage /></RouteSurface>} />
                          <Route path="settings" element={<RouteSurface title="Settings" description="Tune the presentation-layer operating thresholds for the demo environment."><SettingsPage /></RouteSurface>} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </SearchProvider>
              </ReplayProvider>
            </NotificationProvider>
          </CustomerProvider>
        </CaseProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
