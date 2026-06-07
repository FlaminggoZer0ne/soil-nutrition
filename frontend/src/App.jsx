import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import InputPHPage from './pages/user/InputPHPage';
import HistoryPage from './pages/user/HistoryPage';
import DownloadPage from './pages/user/DownloadPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import LogsPage from './pages/admin/LogsPage';
import PGBlocksManagementPage from './pages/admin/PGBlocksManagementPage';
import { Menu, X } from 'lucide-react';

const MainAppContent = () => {
  const { user, loading, isAdmin, isViewer } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-redirect if authenticated and on public pages
  React.useEffect(() => {
    if (user && ['landing', 'login', 'forgot-password'].includes(currentPage)) {
      setCurrentPage('dashboard');
    } else if (!user && !['landing', 'login', 'forgot-password'].includes(currentPage)) {
      setCurrentPage('landing');
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b0f19',
        color: '#ffffff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>🌱</div>
          <h3>Memuat Aplikasi Soil Lab...</h3>
        </div>
      </div>
    );
  }

  // Public Router
  if (!user) {
    switch (currentPage) {
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  }

  // Render Inner Content matching selected page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (isAdmin || isViewer) ? <AdminDashboard /> : <UserDashboard onNavigate={setCurrentPage} />;
      case 'input-ph':
        return isViewer ? <UserDashboard onNavigate={setCurrentPage} /> : <InputPHPage />;
      case 'history':
        return isViewer ? <UserDashboard onNavigate={setCurrentPage} /> : <HistoryPage />;
      case 'download':
        return <DownloadPage />;
      case 'users':
        return isAdmin ? <UserManagementPage /> : (isViewer ? <AdminDashboard /> : <UserDashboard onNavigate={setCurrentPage} />);
      case 'logs':
        return isAdmin ? <LogsPage /> : (isViewer ? <AdminDashboard /> : <UserDashboard onNavigate={setCurrentPage} />);
      case 'pg-blocks':
        return isAdmin ? <PGBlocksManagementPage /> : (isViewer ? <AdminDashboard /> : <UserDashboard onNavigate={setCurrentPage} />);
      default:
        return (isAdmin || isViewer) ? <AdminDashboard /> : <UserDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Toggle Button */}
      <button 
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          color: '#ffffff',
          padding: '8px',
          cursor: 'pointer',
          display: 'none' // Controlled in CSS or responsive media
        }}
        className="mobile-sidebar-toggle"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay" 
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        {renderPageContent()}
      </main>

      {/* Inject custom mobile toggle layout css rule dynamically */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-sidebar-toggle {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
