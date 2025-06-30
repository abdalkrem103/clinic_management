import React from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import PatientDetails from './components/PatientDetails';
import AppointmentSystem from './components/AppointmentSystem';
import DoctorSchedules from './components/DoctorSchedules';
import XRayAnalysis from './components/XRayAnalysis';
import Inventory from './components/Inventory';
import Payments from './components/Payments';
import Notifications from './components/Notifications';
import ClinicPublic from './pages/ClinicPublic';
import ErrorPage from './pages/ErrorPage';
import ProtectedRoute from './components/ProtectedRoute';
import PatientDashboard from './pages/PatientDashboard';
import Layout from './components/Layout';
import Appointments from './components/Appointments';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDoctors from './pages/AdminDoctors';
import AdminServices from './pages/AdminServices';
import AdminSettings from './pages/AdminSettings';
import './styles/App.css';

function App () {
  return (
    <Router>
      <Routes>
        <Route element={<Login />} path="/login" />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
          path="/dashboard"
        />
        <Route
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
          path="/patient-dashboard"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Appointments />
              </Layout>
            </ProtectedRoute>
          }
          path="/appointments"
        />
        <Route element={<Navigate replace to="/dashboard" />} path="/" />
        <Route element={<ClinicPublic />} path="/clinic" />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Patients />
              </Layout>
            </ProtectedRoute>
          }
          path="/patients"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <PatientDetails />
              </Layout>
            </ProtectedRoute>
          }
          path="/patients/:id"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <DoctorSchedules />
              </Layout>
            </ProtectedRoute>
          }
          path="/doctor-schedule"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <XRayAnalysis />
              </Layout>
            </ProtectedRoute>
          }
          path="/xray-analysis"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
          path="/inventory"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Payments />
              </Layout>
            </ProtectedRoute>
          }
          path="/payments"
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout>
                <Notifications />
              </Layout>
            </ProtectedRoute>
          }
          path="/notifications"
        />
        <Route
          path="/admin-dashboard/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route path="users" element={<AdminUsers />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route index element={<div>مرحبًا بك في لوحة تحكم الأدمن</div>} />
        </Route>
        <Route element={<ErrorPage />} path="*" />
      </Routes>
    </Router>
  );
}

export default App;
