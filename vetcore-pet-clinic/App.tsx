import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Routes
import { ProtectedRoute } from './routes/ProtectedRoute';

// Pages
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { StaffManagement } from './pages/admin/StaffManagement';
import { ServicesManagement } from './pages/admin/ServicesManagement';
import { InventoryManagement } from './pages/admin/InventoryManagement';
import { Reports } from './pages/admin/Reports';
import { NotificationLogs } from './pages/admin/NotificationLogs';
import { BillingOverview } from './pages/admin/BillingOverview';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { TodayAppointments } from './pages/doctor/TodayAppointments';
import { MedicalRecordForm } from './pages/doctor/MedicalRecordForm';
import { MedicalRecords } from './pages/doctor/MedicalRecords';
import { PetHistory } from './pages/doctor/PetHistory';

// Receptionist Pages
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { OwnerManagement } from './pages/receptionist/OwnerManagement';
import { AppointmentScheduler } from './pages/receptionist/AppointmentScheduler';
import { BillingInvoices } from './pages/receptionist/BillingInvoices';
import { PaymentProcessing } from './pages/receptionist/PaymentProcessing';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        }
      }} />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="services" element={<ServicesManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<NotificationLogs />} />
              <Route path="billing" element={<BillingOverview />} />
            </Route>
          </Route>

          {/* Doctor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
            <Route path="/doctor" element={<DashboardLayout />}>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="appointments" element={<TodayAppointments />} />
              <Route path="appointments/:id/record" element={<MedicalRecordForm />} />
              <Route path="records" element={<MedicalRecords />} />
              <Route path="history" element={<PetHistory />} />
            </Route>
          </Route>

          {/* Receptionist Routes */}
          <Route element={<ProtectedRoute allowedRoles={['receptionist', 'admin']} />}>
            <Route path="/receptionist" element={<DashboardLayout />}>
              <Route path="dashboard" element={<ReceptionistDashboard />} />
              <Route path="owners" element={<OwnerManagement />} />
              <Route path="appointments" element={<AppointmentScheduler />} />
              <Route path="billing" element={<BillingInvoices />} />
              <Route path="payments" element={<PaymentProcessing />} />
            </Route>
          </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;