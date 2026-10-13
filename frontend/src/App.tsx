import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { CityPage } from './pages/CityPage.js';
import { OptimizationPage } from './pages/OptimizationPage.js';
import { SimulatorPage } from './pages/SimulatorPage.js';
import { VehiclesPage } from './pages/VehiclesPage.js';
import { DeliveriesPage } from './pages/DeliveriesPage.js';
import { AdvisorPage } from './pages/AdvisorPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { TrackingPage } from './pages/TrackingPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';

// Simple authentication check
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('routerescue_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth & Customer Tracking Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/track/:token" element={<TrackingPage />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/city" element={<CityPage />} />
          <Route path="/optimization" element={<OptimizationPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/advisor" element={<AdvisorPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
