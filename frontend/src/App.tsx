import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import Login from './components/Login';
import RegisterPage from './components/RegisterPage';
import DashboardWorking from './components/DashboardWorking';
import TransactionList from './components/TransactionList';
import Budgets from './components/Budgets';
import Groups from './components/Groups';
import Reports from './components/Reports';
import Profile from './components/Profile';
import GlobalThemeToggle from './components/GlobalThemeToggle';
import { useAuth } from './context/AuthContext';
import UMLDiagram from './components/UMLDiagram';

// Layout that requires authentication
const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div />; // could add a spinner
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Prevent logged in users from seeing login/register again
const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />
              {/* Protected application area */}
              <Route path="/" element={<ProtectedLayout />}> {/* All below require auth */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardWorking />} />
                <Route path="transactions" element={<TransactionList />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="reports" element={<Reports />} />
                <Route path="groups" element={<Groups />} />
                <Route path="profile" element={<Profile />} />
                <Route path="uml" element={<UMLDiagram />} />
              </Route>
              {/* Fallback: anything unknown -> login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <GlobalThemeToggle />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
