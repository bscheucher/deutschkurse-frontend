// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Unauthorized from './pages/Unauthorized';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Kurse from './pages/Kurse';
import KursDetails from './pages/KursDetails';
import KursEdit from './pages/KursEdit';
import Teilnehmer from './pages/Teilnehmer';
import TeilnehmerNew from './pages/TeilnehmerNew';
import TeilnehmerDetails from './pages/TeilnehmerDetails';
import Trainer from './pages/Trainer';
import Anwesenheit from './pages/Anwesenheit';
import Stundenplan from './pages/Stundenplan';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile'; // NEW: Import UserProfile

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

function App() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* NEW: User Profile Route - accessible to all authenticated users */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                
                <Route path="/kurse" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                    <Kurse />
                  </ProtectedRoute>
                } />
                <Route path="/kurse/:id" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                    <KursDetails />
                  </ProtectedRoute>
                } />
                <Route path="/kurse/:id/edit" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                    <KursEdit />
                  </ProtectedRoute>
                } />
                
                <Route path="/teilnehmer" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                    <Teilnehmer />
                  </ProtectedRoute>
                } />
                <Route path="/teilnehmer/new" element={
                  <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                    <TeilnehmerNew />
                  </ProtectedRoute>
                } />
                <Route path="/teilnehmer/:id" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                    <TeilnehmerDetails />
                  </ProtectedRoute>
                } />
                
                <Route path="/trainer" element={
                  <ProtectedRoute roles={['ADMIN', 'STAFF']}>
                    <Trainer />
                  </ProtectedRoute>
                } />
                
                <Route path="/anwesenheit" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER']}>
                    <Anwesenheit />
                  </ProtectedRoute>
                } />
                
                <Route path="/stundenplan" element={
                  <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                    <Stundenplan />
                  </ProtectedRoute>
                } />
                
                <Route path="/users" element={
                  <ProtectedRoute roles={['ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
            
            {/* Enhanced toast configuration with longer durations */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 6000, // Increased default duration
                style: {
                  background: '#363636',
                  color: '#fff',
                  fontSize: '14px',
                  padding: '12px 16px',
                },
                success: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 10000, // Much longer for errors
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                  style: {
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                  },
                },
              }}
            />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;