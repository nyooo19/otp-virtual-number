import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import Loading from './components/Loading.jsx';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const OtpPage = lazy(() => import('./pages/OtpPage.jsx'));
const DepositPage = lazy(() => import('./pages/DepositPage.jsx'));
const OrdersPage = lazy(() => import('./pages/OrdersPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/otp" element={<ProtectedRoute><OtpPage /></ProtectedRoute>} />
                <Route path="/deposits" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;