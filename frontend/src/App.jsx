import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BedManagement from './pages/BedManagement.jsx';
import Triage from './pages/Triage.jsx';
import Patients from './pages/Patients.jsx';
import PatientRecord from './pages/PatientRecord.jsx';
import Allocations from './pages/Allocations.jsx';
import Reservations from './pages/Reservations.jsx';
import Wards from './pages/Wards.jsx';
import Resources from './pages/Resources.jsx';
import PatientTimeline from './pages/PatientTimeline.jsx';
import AmbulanceTracking from './pages/AmbulanceTracking.jsx';
import AnalyticsPage from './pages/Analytics.jsx';
import Notifications from './pages/Notifications.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Settings from './pages/Settings.jsx';

const Protected = ({ children }) => {
  const { user, booting } = useHospital();
  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const RoleRoute = ({ roles, children }) => {
  const { can } = useHospital();
  if (!can(...roles)) return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/beds" element={<Protected><BedManagement /></Protected>} />
        <Route path="/triage" element={<Protected><RoleRoute roles={['ADMIN', 'DOCTOR', 'NURSE']}><Triage /></RoleRoute></Protected>} />
        <Route path="/patients" element={<Protected><Patients /></Protected>} />
        <Route path="/records" element={<Protected><PatientRecord /></Protected>} />
        <Route path="/allocations" element={<Protected><Allocations /></Protected>} />
        <Route path="/reservations" element={<Protected><Reservations /></Protected>} />
        <Route path="/wards" element={<Protected><Wards /></Protected>} />
        <Route path="/resources" element={<Protected><Resources /></Protected>} />
        <Route path="/timeline" element={<Protected><PatientTimeline /></Protected>} />
        <Route path="/ambulances" element={<Protected><AmbulanceTracking /></Protected>} />
        <Route path="/analytics" element={<Protected><RoleRoute roles={['ADMIN', 'DOCTOR', 'NURSE']}><AnalyticsPage /></RoleRoute></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/audit-logs" element={<Protected><RoleRoute roles={['ADMIN']}><AuditLogs /></RoleRoute></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <HospitalProvider>
      <Router>
        <AppRoutes />
      </Router>
    </HospitalProvider>
  );
}
