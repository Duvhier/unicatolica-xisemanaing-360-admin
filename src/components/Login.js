import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  // Estados para el flujo de autenticación
  const [credentials, setCredentials] = useState({ usuario: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para 2FA
  const [pasoActual, setPasoActual] = useState('login'); // 'login', 'solicitar_2fa', 'verificar_2fa'
  const [usuarioData, setUsuarioData] = useState(null);
  const [codigo2FA, setCodigo2FA] = useState('');
  const [contadorReenvio, setContadorReenvio] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // ✅ CORREGIDO: Usar useCallback para checkAuth
  const checkAuth = useCallback(async () => {
    try {
      await apiClient.getActividades();
      onLoginSuccess();
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  }, [onLoginSuccess]);

  // ✅ CORREGIDO: useEffect con dependencias correctas
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    }
  }, [checkAuth]);

  // Timer para reenvío de código
  useEffect(() => {
    let intervalo;
    if (tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((tiempo) => tiempo - 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [tiempoRestante]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleCodigo2FAChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCodigo2FA(value);
    if (error) setError('');
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  // Paso 1: Login tradicional
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!credentials.usuario.trim() || !credentials.password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Verificando credenciales...');
      const data = await apiClient.login(credentials);

      // ✅ ADAPTADO: El backend de Vercel puede tener estructura diferente
      if (!data.success && !data.token) {
        throw new Error(data.message || data.error || 'Credenciales inválidas');
      }

      console.log('✅ Credenciales válidas, procediendo...');
      
      // ✅ ADAPTADO: Manejar diferentes estructuras de respuesta
      let usuarioId;
      let usuarioInfo;

      if (data.usuario) {
        // Estructura: { success: true, usuario: { id, ... } }
        usuarioId = data.usuario.id || data.usuario._id;
        usuarioInfo = data.usuario;
      } else if (data.user) {
        // Estructura: { success: true, user: { id, ... } }
        usuarioId = data.user.id || data.user._id;
        usuarioInfo = data.user;
      } else if (data.data) {
        // Estructura: { success: true, data: { usuario: { id, ... } } }
        usuarioId = data.data.usuario?.id || data.data.usuario?._id;
        usuarioInfo = data.data.usuario;
      } else {
        // Estructura simple: { success: true, id, ... }
        usuarioId = data.id || data._id;
        usuarioInfo = data;
      }

      if (!usuarioId) {
        throw new Error('ID de usuario no encontrado en la respuesta');
      }

      // Guardar datos del usuario temporalmente
      setUsuarioData({
        ...usuarioInfo,
        id: usuarioId
      });

      // ✅ ADAPTADO: Verificar si necesita 2FA o puede acceder directamente
      if (data.token && !data.requires2FA) {
        // Acceso directo sin 2FA
        console.log('✅ Acceso directo concedido');
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(usuarioInfo));
        onLoginSuccess();
      } else {
        // Proceder con 2FA
        console.log('📱 Iniciando flujo 2FA...');
        await solicitarCodigo2FA(usuarioId);
      }

    } catch (err) {
      console.error('❌ Error en login:', err);
      manejarError(err);
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Solicitar código 2FA
  const solicitarCodigo2FA = async (usuarioId) => {
    try {
      setLoading(true);
      console.log('📱 Solicitando código 2FA para usuario:', usuarioId);
      
      const data = await apiClient.solicitarCodigo2FA(usuarioId);

      // ✅ ADAPTADO: Manejar diferentes estructuras de respuesta
      if (!data.success && !data.message) {
        throw new Error(data.error || 'Error al solicitar código de verificación');
      }

      console.log('✅ Código 2FA enviado');
      setPasoActual('verificar_2fa');
      setTiempoRestante(120); // 2 minutos para ingresar el código
      setContadorReenvio(prev => prev + 1);

    } catch (err) {
      console.error('❌ Error solicitando 2FA:', err);
      manejarError(err);
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Verificar código 2FA
  const verificarCodigo2FA = async (e) => {
    e.preventDefault();

    if (!codigo2FA || codigo2FA.length !== 6) {
      setError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔢 Verificando código 2FA...');
      
      // Asegurar que tenemos el ID del usuario
      const usuarioId = usuarioData?.id || usuarioData?._id;
      
      if (!usuarioId) {
        throw new Error('ID de usuario no disponible. Por favor inicia sesión nuevamente.');
      }

      const data = await apiClient.verificarCodigo2FA(usuarioId, codigo2FA);

      // ✅ ADAPTADO: Manejar diferentes estructuras de respuesta
      if (!data.success && !data.token) {
        throw new Error(data.message || data.error || 'Código de verificación inválido');
      }

      if (!data.token) {
        throw new Error('Token de sesión no recibido');
      }

      console.log('✅ Código 2FA válido, acceso concedido');

      // Guardar en localStorage (solo después de verificar 2FA)
      localStorage.setItem('token', data.token);
      
      // ✅ ADAPTADO: Obtener datos del usuario de la respuesta
      const usuarioCompleto = data.usuario || data.user || data.data?.usuario || usuarioData;
      localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));

      onLoginSuccess();

    } catch (err) {
      console.error('❌ Error verificando 2FA:', err);
      manejarError(err);
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código 2FA
  const reenviarCodigo2FA = async () => {
    if (contadorReenvio >= 3) {
      setError('Has excedido el número máximo de reenvíos. Contacta al administrador.');
      return;
    }

    if (tiempoRestante > 0) {
      setError(`Espera ${tiempoRestante} segundos antes de solicitar otro código`);
      return;
    }

    const usuarioId = usuarioData?.id || usuarioData?._id;
    if (!usuarioId) {
      setError('ID de usuario no disponible. Por favor inicia sesión nuevamente.');
      return;
    }

    await solicitarCodigo2FA(usuarioId);
  };

  // Volver al paso de login
  const volverALogin = () => {
    setPasoActual('login');
    setCodigo2FA('');
    setError('');
    setTiempoRestante(0);
    setUsuarioData(null);
  };

  // ✅ ACTUALIZADO: Manejo de errores para el backend de Vercel
  const manejarError = (err) => {
    let errorMessage = 'Error de conexión. Intenta nuevamente.';

    // Manejar errores de red
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } 
    // Manejar errores CORS
    else if (err.message && err.message.includes('CORS')) {
      errorMessage = 'Error de configuración del servidor. Contacta al administrador.';
    }
    // Manejar errores HTTP específicos
    else if (err.status) {
      switch (err.status) {
        case 401:
          errorMessage = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
          break;
        case 403:
          errorMessage = 'Acceso denegado. No tienes permisos para acceder.';
          break;
        case 404:
          errorMessage = 'Servicio no encontrado. Verifica la configuración del backend.';
          break;
        case 429:
          errorMessage = 'Demasiadas solicitudes. Espera unos minutos antes de intentar nuevamente.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intenta más tarde.';
          break;
        case 502:
        case 503:
        case 504:
          errorMessage = 'El servidor no está disponible temporalmente. Intenta más tarde.';
          break;
        default:
          errorMessage = `Error del servidor (${err.status}). Intenta nuevamente.`;
      }
    }
    // Manejar mensajes de error del backend
    else if (err.message && !err.message.includes('<!DOCTYPE') && !err.message.includes('<html')) {
      errorMessage = err.message;
    }
    // Manejar errores de timeout
    else if (err.name === 'TimeoutError' || err.code === 'ECONNABORTED') {
      errorMessage = 'La solicitud tardó demasiado tiempo. Verifica tu conexión e intenta nuevamente.';
    }

    console.error('🔴 Error detallado:', err);
    setError(errorMessage);
  };

  // Renderizar formulario de login tradicional
  const renderLoginForm = () => (
    <form className="login-form" onSubmit={handleLogin}>
      <div className="form-group">
        <label htmlFor="usuario">USUARIO</label>
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
        <label htmlFor="password">CONTRASEÑA</label>
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

      <div className="remember-forgot">
        <label className="remember-me">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={handleRememberMeChange}
            disabled={loading}
          />
          Recordar usuario
        </label>
        <a href="#forgot" className="forgot-password">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        type="submit"
        className="login-button"
        disabled={loading}
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            VERIFICANDO...
          </>
        ) : (
          'CONTINUAR'
        )}
      </button>
    </form>
  );

  // Renderizar formulario de verificación 2FA
  const renderVerificacion2FA = () => (
    <form className="login-form" onSubmit={verificarCodigo2FA}>
      <div className="security-info">
        <div className="security-icon">📱</div>
        <h3>Verificación por WhatsApp</h3>
        <p className="security-message">
          Se ha enviado un código de 6 dígitos por WhatsApp
          {usuarioData?.telefono ? ` al número terminado en ${usuarioData.telefono.slice(-4)}` : ''}
        </p>
        <div className="whatsapp-tip">
          💡 <strong>Tip:</strong> Revisa tu aplicación de WhatsApp
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="codigo2FA">CÓDIGO DE VERIFICACIÓN</label>
        <input
          type="text"
          id="codigo2FA"
          name="codigo2FA"
          className="form-input codigo-2fa"
          placeholder="000000"
          value={codigo2FA}
          onChange={handleCodigo2FAChange}
          disabled={loading}
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <div className="codigo-hint">Ingresa el código de 6 dígitos</div>
      </div>

      <div className="reenvio-codigo">
        <button
          type="button"
          className="btn-reenvio"
          onClick={reenviarCodigo2FA}
          disabled={loading || tiempoRestante > 0 || contadorReenvio >= 3}
        >
          {tiempoRestante > 0 ? `Reenviar en ${tiempoRestante}s` : 'Reenviar código'}
        </button>
        <span className="contador-reenvio">
          {contadorReenvio > 0 && `(${contadorReenvio}/3 intentos)`}
        </span>
      </div>

      <div className="acciones-2fa">
        <button
          type="button"
          className="btn-volver"
          onClick={volverALogin}
          disabled={loading}
        >
          ‹ Volver
        </button>
        <button
          type="submit"
          className="login-button"
          disabled={loading || codigo2FA.length !== 6}
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              VERIFICANDO...
            </>
          ) : (
            'VERIFICAR Y ACCEDER'
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>
            {pasoActual === 'verificar_2fa' ? 'VERIFICACIÓN' : 'INICIAR SESIÓN'}
          </h1>
          <p>
            {pasoActual === 'verificar_2fa'
              ? 'Ingresa el código de seguridad'
              : 'Accede al panel de administración'}
          </p>
        </div>

        {pasoActual === 'login' ? renderLoginForm() : renderVerificacion2FA()}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Información de debug para desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.5rem', 
            background: '#f5f5f5', 
            borderRadius: '4px', 
            fontSize: '0.75rem',
            color: '#666',
            textAlign: 'center'
          }}>
            Backend: {import.meta.env.VITE_API_URL || 'No configurado'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;