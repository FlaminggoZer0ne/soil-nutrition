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
  const { user, loading, isAdmin, isViewer, logout } = useAuth();
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
      {/* Mobile Top Bar - visible only on mobile */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Buka menu"
        >
          {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-topbar-brand">
          <span>🌱</span>
          <span>SOIL LAB</span>
        </div>

        <button
          className="mobile-logout-btn"
          onClick={() => { if (window.confirm('Keluar dari aplikasi?')) logout(); }}
          aria-label="Logout"
          title="Logout"
        >
          <X size={18} />
          <span>Keluar</span>
        </button>
      </div>

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
