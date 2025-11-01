import React from 'react';

const Header = ({ 
  userName, 
  onScannerClick, 
  onDashboardClick, 
  onLogout,
  showScannerButton = true,
  showDashboardButton = false 
}) => {
  return (
    <header className={showDashboardButton ? "admin-header" : "dashboard-header"}>
      <div className={showDashboardButton ? "header-content" : "header-top"}>
        <h1>
          {showDashboardButton ? '📱 Scanner QR' : '📊 Panel de Administración'}
        </h1>
        <div className="user-info">
          {!showDashboardButton && (
            <div className="user-details">
              <div className="welcome">Bienvenido,</div>
              <div className="name">{userName}</div>
            </div>
          )}
          {showDashboardButton && (
            <span>{userName}</span>
          )}
          {showScannerButton && (
            <button onClick={onScannerClick} className="btn btn-primary">
              📱 Scanner QR
            </button>
          )}
          {showDashboardButton && (
            <button onClick={onDashboardClick} className="btn btn-secondary">
              📊 Volver al Dashboard
            </button>
          )}
          <button onClick={onLogout} className="btn btn-danger">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

