import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import Kurse from './pages/Kurse';
import KursDetails from './pages/KursDetails';
import Teilnehmer from './pages/Teilnehmer';
import TeilnehmerDetails from './pages/TeilnehmerDetails';
import Trainer from './pages/Trainer';
import Anwesenheit from './pages/Anwesenheit';
import Stundenplan from './pages/Stundenplan';
import Users from './pages/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              
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
              
              <Route path="/teilnehmer" element={
                <ProtectedRoute roles={['ADMIN', 'TRAINER', 'STAFF']}>
                  <Teilnehmer />
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
          <Toaster position="top-right" />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;