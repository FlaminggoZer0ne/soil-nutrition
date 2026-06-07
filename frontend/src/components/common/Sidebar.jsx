import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  PenSquare, 
  History, 
  Download, 
  Users, 
  FileText, 
  LogOut,
  Database
} from 'lucide-react';

const Sidebar = ({ currentPage, setCurrentPage, mobileOpen, setMobileOpen }) => {
  const { user, logout, isAdmin } = useAuth();

  const handleMenuClick = (page) => {
    setCurrentPage(page);
    if (setMobileOpen) setMobileOpen(false); // Close mobile menu if open
  };

  if (!user) return null;

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-logo">🌱</span>
        <div>
          <h1 className="sidebar-title">SOIL LAB</h1>
          <p className="sidebar-subtitle">Nutrition Monitor</p>
        </div>
      </div>

      <ul className="sidebar-menu">
        <li className="sidebar-menu-header">Monitoring</li>
        
        <li className={`sidebar-item ${currentPage === 'dashboard' ? 'active' : ''}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('dashboard'); }}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </a>
        </li>

        <li className="sidebar-menu-header">Data Entry</li>
        
        <li className={`sidebar-item ${currentPage === 'input-ph' ? 'active' : ''}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('input-ph'); }}>
            <PenSquare size={18} />
            <span>Input pH Tanah</span>
          </a>
        </li>

        <li className={`sidebar-item ${currentPage === 'history' ? 'active' : ''}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('history'); }}>
            <History size={18} />
            <span>Riwayat Input</span>
          </a>
        </li>

        <li className={`sidebar-item ${currentPage === 'download' ? 'active' : ''}`}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('download'); }}>
            <Download size={18} />
            <span>Download Data</span>
          </a>
        </li>

        {isAdmin && (
          <>
            <li className="sidebar-menu-header">Administrasi</li>
            
            <li className={`sidebar-item ${currentPage === 'pg-blocks' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('pg-blocks'); }}>
                <Database size={18} />
                <span>Manajemen PG & Blok</span>
              </a>
            </li>

            <li className={`sidebar-item ${currentPage === 'users' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('users'); }}>
                <Users size={18} />
                <span>Manajemen User</span>
              </a>
            </li>

            <li className={`sidebar-item ${currentPage === 'logs' ? 'active' : ''}`}>
              <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('logs'); }}>
                <FileText size={18} />
                <span>Log Aktivitas</span>
              </a>
            </li>
          </>
        )}
      </ul>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">
            {user.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name" title={user.nama}>{user.nama}</span>
            <span className="user-role">{user.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Log Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
