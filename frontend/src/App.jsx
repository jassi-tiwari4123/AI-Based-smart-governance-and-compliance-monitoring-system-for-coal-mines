import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import CorporateDashboard from './pages/CorporateDashboard';
import MinesList from './pages/MinesList';
import MineDetail from './pages/MineDetail';
import InspectionsList from './pages/InspectionsList';
import CreateInspection from './pages/CreateInspection';
import InspectionDetail from './pages/InspectionDetail';
import ViolationsList from './pages/ViolationsList';
import ViolationDetail from './pages/ViolationDetail';
import IncidentsList from './pages/IncidentsList';
import ContractorsList from './pages/ContractorsList';
import DocumentsList from './pages/DocumentsList';
import GisMapPage from './pages/GisMapPage';
import AiInsightsPage from './pages/AiInsightsPage';
import AiInvestigationPage from './pages/AiInvestigationPage';
import WorkflowsPage from './pages/WorkflowsPage';
import CorrectiveActionsPage from './pages/CorrectiveActionsPage';
import ReportsPage from './pages/ReportsPage';
import AuditTrailPage from './pages/AuditTrailPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedLayout = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F3F3F1] flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#F3F3F1]">
          {children}
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/*"
        element={
          <ProtectedLayout>
            <Routes>
              <Route path="/dashboard" element={<CorporateDashboard />} />
              <Route path="/mines" element={<MinesList />} />
              <Route path="/mines/:id" element={<MineDetail />} />
              <Route path="/inspections" element={<InspectionsList />} />
              <Route path="/inspections/create" element={<CreateInspection />} />
              <Route path="/inspections/:id" element={<InspectionDetail />} />
              <Route path="/violations" element={<ViolationsList />} />
              <Route path="/violations/:id" element={<ViolationDetail />} />
              <Route path="/incidents" element={<IncidentsList />} />
              <Route path="/contractors" element={<ContractorsList />} />
              <Route path="/documents" element={<DocumentsList />} />
              <Route path="/gis" element={<GisMapPage />} />
              <Route path="/ai-insights" element={<AiInsightsPage />} />
              <Route path="/ai-investigation/:id" element={<AiInvestigationPage />} />
              <Route path="/workflows" element={<WorkflowsPage />} />
              <Route path="/corrective-actions" element={<CorrectiveActionsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/audit-trail" element={<AuditTrailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ProtectedLayout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
