import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    usuario: 'organizadorDemo',
    password: 'org123'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verificar si ya está autenticado al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar si el token es válido
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      // Intentar obtener actividades para verificar el token
      await apiClient.getActividades();
      onLoginSuccess();
    } catch (error) {
      // Token inválido, limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.usuario.trim() || !credentials.password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Intentando login con:', credentials.usuario);
      const data = await apiClient.login(credentials);
      console.log('📨 Respuesta:', data);

      if (!data.success) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      if (!data.token || !data.usuario) {
        throw new Error('Datos de sesión incompletos');
      }

      // Guardar en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      console.log('✅ Login exitoso!');
      onLoginSuccess();
      
    } catch (err) {
      console.error('❌ Error:', err);
      
      // Manejar errores específicos
      let errorMessage = 'Error de conexión. Intenta nuevamente.';
      
      if (err.message && err.message.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet o contacta al administrador.';
      } else if (err.message && err.message.includes('CORS')) {
        errorMessage = 'Error de configuración del servidor. Contacta al administrador.';
      } else if (err.status === 500) {
        errorMessage = err.message || 'Error interno del servidor. Por favor, contacta al administrador o intenta más tarde.';
      } else if (err.status === 401 || err.status === 403) {
        errorMessage = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
      } else if (err.status === 404) {
        errorMessage = 'Servicio no encontrado. Contacta al administrador.';
      } else if (err.message && !err.message.includes('<!DOCTYPE') && !err.message.includes('<html')) {
        errorMessage = err.message;
      } else if (err.message) {
        // Si el mensaje contiene HTML, usar mensaje genérico
        errorMessage = 'Error del servidor. Por favor, intenta más tarde o contacta al administrador.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 Iniciar Sesión</h1>
          <p>Accede al panel de administración</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="usuario">👤 Usuario</label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              className="form-input"
              placeholder="Ingresa tu usuario"
              value={credentials.usuario}
              onChange={handleInputChange}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="Ingresa tu contraseña"
              value={credentials.password}
              onChange={handleInputChange}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                🚀 Entrar al sistema
              </>
            )}
          </button>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </form>

        <div className="demo-credentials">
          <h3>👨‍💻 Credenciales de Demo</h3>
          <p><strong>Usuario:</strong> organizadorDemo</p>
          <p><strong>Contraseña:</strong> org123</p>
          <p style={{ fontSize: '12px', marginTop: '8px', color: '#78909c' }}>
            Estas credenciales son para fines de demostración
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

