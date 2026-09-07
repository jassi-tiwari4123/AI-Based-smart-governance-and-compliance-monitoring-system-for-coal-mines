import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import CorporateDashboard from './pages/CorporateDashboard';
import MineDashboard from './pages/MineDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import ContractorDashboard from './pages/ContractorDashboard';
import MinesList from './pages/MinesList';
import MineDetail from './pages/MineDetail';
import InspectionsList from './pages/InspectionsList';
import CreateInspection from './pages/CreateInspection';
import InspectionDetail from './pages/InspectionDetail';
import ViolationsList from './pages/ViolationsList';
import ViolationDetail from './pages/ViolationDetail';
import IncidentsList from './pages/IncidentsList';
import IncidentDetail from './pages/IncidentDetail';
import ReportIncident from './pages/ReportIncident';
import InspectorIncidentsList from './pages/InspectorIncidentsList';
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
import TeamManagement from './pages/TeamManagement';
import MineManagement from './pages/MineManagement';
import ManagerManagement from './pages/ManagerManagement';
import WorkerManagement from './pages/WorkerManagement';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceReport from './pages/AttendanceReport';

const ROLE_HOME = {
  INSPECTOR:       '/dashboard/inspector',
  MINE_MANAGER:    '/dashboard/mine',
  CORPORATE_ADMIN: '/dashboard',
  CONTRACTOR:      '/dashboard/contractor',
  SUPER_ADMIN:     '/dashboard',
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
};

const ProtectedLayout = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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

// Wraps a page with both ProtectedLayout and ProtectedRoute
const Page = ({ component: Component, path }) => (
  <ProtectedLayout>
    <ProtectedRoute path={path}>
      <Component />
    </ProtectedRoute>
  </ProtectedLayout>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Dashboards */}
      <Route path="/dashboard"              element={<Page component={CorporateDashboard}  path="/dashboard" />} />
      <Route path="/dashboard/inspector"    element={<Page component={InspectorDashboard}  path="/dashboard/inspector" />} />
      <Route path="/dashboard/mine"         element={<Page component={MineDashboard}        path="/dashboard/mine" />} />
      <Route path="/dashboard/contractor"   element={<Page component={ContractorDashboard}  path="/dashboard/contractor" />} />

      {/* Mines */}
      <Route path="/mines"     element={<Page component={MinesList}  path="/mines" />} />
      <Route path="/mines/:id" element={<Page component={MineDetail} path="/mines/:id" />} />

      {/* Inspections */}
      <Route path="/inspections"        element={<Page component={InspectionsList}   path="/inspections" />} />
      <Route path="/inspections/create" element={<Page component={CreateInspection}  path="/inspections/create" />} />
      <Route path="/inspections/:id"    element={<Page component={InspectionDetail}  path="/inspections/:id" />} />

      {/* Violations */}
      <Route path="/violations"     element={<Page component={ViolationsList}  path="/violations" />} />
      <Route path="/violations/:id" element={<Page component={ViolationDetail} path="/violations/:id" />} />

      {/* AI */}
      <Route path="/ai-insights"            element={<Page component={AiInsightsPage}      path="/ai-insights" />} />
      <Route path="/ai-investigation/:id"   element={<Page component={AiInvestigationPage} path="/ai-investigation/:id" />} />

      {/* Incidents */}
      <Route path="/incidents"        element={<Page component={IncidentsList}          path="/incidents" />} />
      <Route path="/incidents/report" element={<Page component={ReportIncident}         path="/incidents/report" />} />
      <Route path="/incidents/mine"   element={<Page component={InspectorIncidentsList} path="/incidents/mine" />} />
      <Route path="/incidents/:id"    element={<Page component={IncidentDetail}         path="/incidents/:id" />} />

      {/* Corrective Actions & Workflows */}
      <Route path="/corrective-actions" element={<Page component={CorrectiveActionsPage} path="/corrective-actions" />} />
      <Route path="/workflows"          element={<Page component={WorkflowsPage}          path="/workflows" />} />
      <Route path="/contractors"        element={<Page component={ContractorsList}         path="/contractors" />} />

      {/* Spatial & Analytics */}
      <Route path="/gis"         element={<Page component={GisMapPage}    path="/gis" />} />
      <Route path="/documents"   element={<Page component={DocumentsList} path="/documents" />} />
      <Route path="/reports"     element={<Page component={ReportsPage}   path="/reports" />} />
      <Route path="/audit-trail" element={<Page component={AuditTrailPage} path="/audit-trail" />} />
      <Route path="/settings"    element={<Page component={SettingsPage}  path="/settings" />} />
      <Route path="/team"             element={<Page component={TeamManagement}  path="/team" />} />
      <Route path="/mine-management"    element={<Page component={MineManagement}    path="/mine-management" />} />
      <Route path="/manager-management" element={<Page component={ManagerManagement}  path="/manager-management" />} />
      <Route path="/workers"     element={<Page component={WorkerManagement} path="/workers" />} />
      <Route path="/attendance"  element={<Page component={MarkAttendance}   path="/attendance" />} />
      <Route path="/attendance/report" element={<Page component={AttendanceReport} path="/attendance/report" />} />

      {/* Fallback */}
      <Route path="*" element={<RootRedirect />} />
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
