import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import UploadDashboard from './components/UploadDashboard';
import ClientDataView from './components/ClientDataView';
import ClientDetailView from './components/ClientDetailView';
import ResearchDataView from './components/ResearchDataView';
import NotificationCenter from './components/NotificationCenter';
import FundMappingView from './components/FundMappingView';
import StaffManagement from './components/StaffManagement';
import RmAnalyticsDashboard from './components/RmAnalyticsDashboard';
import RmActionDashboard from './components/RmActionDashboard';
import Login from './components/Login';
import Sidebar from './components/Sidebar';



function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));



  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <Sidebar user={user} onLogout={handleLogout} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Routes>
            {/* Conditional Default Route */}
            <Route path="/" element={
              user?.role === 'ADMIN' ? <RmAnalyticsDashboard /> : <RmActionDashboard />
            } />
            <Route path="/alerts" element={<NotificationCenter user={user} />} />
            <Route path="/upload" element={user?.role === 'ADMIN' ? <UploadDashboard /> : <Navigate to="/" />} />
            <Route path="/clients" element={<ClientDataView />} />
            <Route path="/clients/:id" element={<ClientDetailView />} />
            <Route path="/research" element={<ResearchDataView />} />
            <Route path="/mapping" element={user?.role === 'ADMIN' ? <FundMappingView /> : <Navigate to="/" />} />
            {user?.role === 'ADMIN' && (
              <>
                <Route path="/staff" element={<StaffManagement />} />
                <Route path="/analytics" element={<RmAnalyticsDashboard />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
