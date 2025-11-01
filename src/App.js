import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import './styles/Login.css';
import './styles/Dashboard.css';
import './styles/Scanner.css';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setCurrentView('dashboard');
    }
    setLoading(false);
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setCurrentView('login');
  };

  const handleScannerClick = () => {
    setCurrentView('scanner');
  };

  const handleDashboardClick = () => {
    setCurrentView('dashboard');
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <div style={{ 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#4a5568', margin: 0 }}>Cargando aplicación...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return (
          <Dashboard 
            onLogout={handleLogout}
            onScannerClick={handleScannerClick}
          />
        );
      case 'scanner':
        return (
          <Scanner 
            onDashboardClick={handleDashboardClick}
            onLogout={handleLogout}
          />
        );
      default:
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }
  };

  return (
    <div className="App">
      {renderCurrentView()}
    </div>
  );
}

export default App;

