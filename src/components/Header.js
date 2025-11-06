import React from 'react';
import { LogOut, QrCode, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import '../styles/Header.css';

const Header = ({ userName, onScannerClick, onLogout }) => {
  return (
    <header className="dashboard-header-bar">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">📊</div>
          <h1>Dashboard Admin</h1>
        </div>
      </div>

      <div className="header-right">
        <div className="user-info">
          <User size={18} />
          <span className="user-name">{userName}</span>
        </div>

        <ThemeToggle />

        {onScannerClick && (
          <button 
            className="header-btn scanner-btn"
            onClick={onScannerClick}
            title="Escanear QR"
          >
            <QrCode size={18} />
            <span>Escáner</span>
          </button>
        )}

        <button 
          className="header-btn logout-btn"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Header;