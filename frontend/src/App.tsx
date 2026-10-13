import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import DocumentList from './pages/DocumentList';
import DocumentDetail from './pages/DocumentDetail';
import DocumentForm from './pages/DocumentForm';
import ComplianceList from './pages/ComplianceList';
import CategoryList from './pages/CategoryList';
import ExpiringSoon from './pages/ExpiringSoon';
import ExpiredDocuments from './pages/ExpiredDocuments';

import React from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="documents" element={<DocumentList />} />
            <Route path="documents/new" element={<DocumentForm />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            <Route path="documents/:id/edit" element={<DocumentForm />} />
            
            <Route path="compliance" element={<ComplianceList />} />
            <Route path="categories" element={<CategoryList />} />
            
            <Route path="expiring-soon" element={<ExpiringSoon />} />
            <Route path="expired" element={<ExpiredDocuments />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
