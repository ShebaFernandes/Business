import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { ProductsPage } from './components/pages/ProductsPage';
import { CampaignsPage } from './components/pages/CampaignsPage';
import { SettingsPage } from './components/pages/SettingsPage';
import VoiceAgent from './components/VoiceAgent';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        {/* Voice Agent available on all pages */}
        <VoiceAgent agentId={import.meta.env.VITE_RETELL_AGENT_ID} />
      </>
    );
  }

  if (!user.onboardingComplete) {
    return (
      <>
        <Routes>
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="*" element={<Navigate to="/onboarding" />} />
        </Routes>
        {/* Voice Agent available during onboarding */}
        <VoiceAgent agentId={import.meta.env.VITE_RETELL_AGENT_ID} />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      {/* Voice Agent available across all authenticated pages */}
      <VoiceAgent agentId={import.meta.env.VITE_RETELL_AGENT_ID} />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <AppContent />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;