import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

const Home = lazy(() => import('./pages/Home'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AcademicLogin = lazy(() => import('./pages/AcademicLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const DirectorLogin = lazy(() => import('./pages/DirectorLogin'));
const DirectorDashboard = lazy(() => import('./pages/DirectorDashboard'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#F4F6FF] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#27548A] border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <PageLoader />;
  return isAdmin ? children : <Navigate to="/vector-admin-login" replace />;
};

const AcademicRoute = ({ children, role }) => {
  const { academicUser, academicLoading } = useAuth();
  if (academicLoading) return <PageLoader />;
  if (!academicUser) return <Navigate to={role === 'admin' ? '/directors-batch/admin-login' : '/academic-login'} replace />;
  if (role && academicUser.role !== role) return <Navigate to={role === 'admin' ? '/directors-batch/admin-login' : '/academic-login'} replace />;
  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vector-admin-login" element={<AdminLogin />} />
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/academic-login" element={<AcademicLogin />} />
        <Route path="/student/*" element={
          <AcademicRoute role="student">
            <StudentDashboard />
          </AcademicRoute>
        } />
        <Route path="/directors-batch/admin-login" element={<DirectorLogin />} />
        <Route path="/directors-batch/*" element={
          <AcademicRoute role="admin">
            <DirectorDashboard />
          </AcademicRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#FFFFFF', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif' },
            success: { iconTheme: { primary: '#7ED6A7', secondary: '#fff' } },
            error: { iconTheme: { primary: '#F28B82', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
