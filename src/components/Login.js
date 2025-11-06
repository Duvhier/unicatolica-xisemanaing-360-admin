import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';
import '../styles/Login.css';
import fondoLogin from '../assets/fondologin.png';
import logoUnicatolica from '../assets/QR-UNICATOLICA1.png';

// Constantes para mejor mantenibilidad
const LOGIN_STEPS = {
  LOGIN: 'login',
  VERIFY_2FA: 'verificar_2fa'
};

const TIMEOUTS = {
  RESEND_CODE: 120, // 2 minutos
  SESSION_CHECK: 5000 // 5 segundos
};

const Login = ({ onLoginSuccess }) => {
  // Estados
  const [credentials, setCredentials] = useState({ 
    usuario: '', 
    password: '' 
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(LOGIN_STEPS.LOGIN);
  const [userData, setUserData] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Refs
  const passwordRef = useRef(null);
  const twoFARef = useRef(null);

  // Efecto para cargar usuario recordado
  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      setCredentials(prev => ({ ...prev, usuario: savedUser }));
      setRememberMe(true);
    }
  }, []);

  // Efecto para verificar autenticación existente
  const checkExistingAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await apiClient.getActividades();
      onLoginSuccess();
    } catch (error) {
      console.warn('Sesión inválida:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
  }, [onLoginSuccess]);

  useEffect(() => {
    checkExistingAuth();
  }, [checkExistingAuth]);

  // Efecto para el contador de tiempo
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(time => time - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Manejo de cambios en los inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleTwoFACodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTwoFACode(value);
    clearError();

    // Auto-submit cuando se completa el código
    if (value.length === 6) {
      setTimeout(() => handleVerify2FA(), 100);
    }
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
    if (!e.target.checked) {
      localStorage.removeItem('rememberedUser');
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Utilidades
  const clearError = () => {
    if (error) setError('');
  };

  const handleError = (error) => {
    let message = 'Error de conexión. Intenta nuevamente.';
    
    if (error.message?.includes('Failed to fetch')) {
      message = 'No se pudo conectar con el servidor. Verifica tu conexión.';
    } else if (error.message?.includes('CORS')) {
      message = 'Error de configuración del servidor. Contacta al administrador.';
    } else if (error.status === 401) {
      message = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
    } else if (error.status === 429) {
      message = 'Demasiados intentos. Espera unos minutos.';
    } else if (error.message) {
      message = error.message;
    }

    setError(message);
  };

  // Manejo del login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.usuario?.trim() || !credentials.password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (credentials.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setLoading(true);
    clearError();

    try {
      const data = await apiClient.login(credentials);
      
      if (!data.success) {
        throw new Error(data.message || 'Error en el inicio de sesión');
      }

      const userId = data.user?.id || data.user?._id || data.usuario?.id || data.usuario?._id;
      
      if (!userId) {
        throw new Error('Datos de usuario no válidos');
      }

      // Guardar usuario si "Recordar" está activado
      if (rememberMe) {
        localStorage.setItem('rememberedUser', credentials.usuario);
      }

      setUserData(data.user || data.usuario);
      await request2FACode(userId);

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar código 2FA
  const request2FACode = async (userId) => {
    try {
      setLoading(true);
      const data = await apiClient.solicitarCodigo2FA(userId);
      
      if (!data.success) {
        throw new Error(data.message || 'Error al enviar el código');
      }

      setCurrentStep(LOGIN_STEPS.VERIFY_2FA);
      setTimeRemaining(TIMEOUTS.RESEND_CODE);
      setResendCount(prev => prev + 1);
      
      // Focus en el input del código
      setTimeout(() => {
        if (twoFARef.current) {
          twoFARef.current.focus();
        }
      }, 100);

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar código 2FA
  const handleVerify2FA = async (e) => {
    e?.preventDefault();
    
    if (twoFACode.length !== 6) {
      setError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    clearError();

    try {
      const userId = userData?.id || userData?._id;
      const data = await apiClient.verificarCodigo2FA(userId, twoFACode);
      
      if (!data.success) {
        throw new Error(data.message || 'Código inválido');
      }

      // Guardar datos de sesión
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user || data.usuario || userData));
      
      onLoginSuccess();

    } catch (error) {
      handleError(error);
      // Limpiar código en caso de error
      setTwoFACode('');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (resendCount >= 3) {
      setError('Has excedido el número máximo de reenvíos.');
      return;
    }

    if (timeRemaining > 0) {
      setError(`Espera ${timeRemaining} segundos antes de reenviar.`);
      return;
    }

    const userId = userData?.id || userData?._id;
    if (userId) {
      await request2FACode(userId);
    }
  };

  // Volver al login
  const backToLogin = () => {
    setCurrentStep(LOGIN_STEPS.LOGIN);
    setTwoFACode('');
    clearError();
  };

  // Renderizado condicional
  const renderLoginForm = () => (
    <form className="login-form" onSubmit={handleLogin} noValidate>
      <div className="form-group">
        <label htmlFor="usuario" className="form-label">
          Usuario
        </label>
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
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Contraseña
        </label>
        <div className="password-input-container">
          <input
            ref={passwordRef}
            type={passwordVisible ? "text" : "password"}
            id="password"
            name="password"
            className="form-input password-input"
            placeholder="Ingresa tu contraseña"
            value={credentials.password}
            onChange={handleInputChange}
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={togglePasswordVisibility}
            tabIndex="-1"
          >
            {passwordVisible ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={handleRememberMeChange}
            disabled={loading}
          />
          <span className="checkmark"></span>
          Recordar usuario
        </label>
      </div>

      <button 
        type="submit" 
        className="login-button" 
        disabled={loading || !credentials.usuario || !credentials.password}
      >
        {loading ? (
          <div className="button-loading">
            <div className="loading-spinner"></div>
            <span>Verificando...</span>
          </div>
        ) : (
          'Ingresar'
        )}
      </button>
    </form>
  );

  const render2FAVerification = () => (
    <form className="login-form" onSubmit={handleVerify2FA} noValidate>
      <div className="security-info">
        <div className="security-icon">🔒</div>
        <h3>Verificación de Seguridad</h3>
        <p>Hemos enviado un código de 6 dígitos a tu WhatsApp</p>
        <p className="user-email">{userData?.email || userData?.correo || ''}</p>
      </div>

      <div className="form-group">
        <label htmlFor="twoFACode" className="form-label">
          Código de verificación
        </label>
        <input
          ref={twoFARef}
          type="text"
          id="twoFACode"
          name="twoFACode"
          className="form-input code-input"
          placeholder="000000"
          value={twoFACode}
          onChange={handleTwoFACodeChange}
          disabled={loading}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
        />
        <div className="code-hint">Ingresa el código de 6 dígitos</div>
      </div>

      <div className="resend-section">
        {timeRemaining > 0 ? (
          <span className="resend-timer">
            Podrás reenviar en {timeRemaining}s
          </span>
        ) : (
          <button
            type="button"
            className="resend-button"
            onClick={handleResendCode}
            disabled={resendCount >= 3}
          >
            Reenviar código ({3 - resendCount} intentos restantes)
          </button>
        )}
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={loading || twoFACode.length !== 6}
      >
        {loading ? (
          <div className="button-loading">
            <div className="loading-spinner"></div>
            <span>Verificando...</span>
          </div>
        ) : (
          'Verificar y acceder'
        )}
      </button>

      <button 
        type="button" 
        className="back-button" 
        onClick={backToLogin}
        disabled={loading}
      >
        ← Volver al login
      </button>
    </form>
  );

  return (
    <div className="login-page">
      <div 
        className="login-background"
        style={{ backgroundImage: `url(${fondoLogin})` }}
      >
        <div className="login-overlay"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <img 
            src={logoUnicatolica} 
            alt="Unicatólica" 
            className="login-logo" 
          />
          <h1 className="login-title">LumenAsist</h1>
          <p className="login-subtitle">
            {currentStep === LOGIN_STEPS.LOGIN 
              ? 'Accede a tu cuenta' 
              : 'Verifica tu identidad'
            }
          </p>
        </div>

        {currentStep === LOGIN_STEPS.LOGIN 
          ? renderLoginForm() 
          : render2FAVerification()
        }

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="login-footer">
          © 2025 Fundación Universitaria Católica Lumen Gentium
        </div>
      </div>
    </div>
  );
};

export default Login;