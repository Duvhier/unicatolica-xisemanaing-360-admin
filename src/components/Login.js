import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import '../styles/Login.css';

const Login = ({ onLoginSuccess }) => {
  // Estados para el flujo de autenticación
  const [credentials, setCredentials] = useState(false);
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
  }, [onLoginSuccess]); // ← Agregar onLoginSuccess como dependencia

  // ✅ CORREGIDO: useEffect con dependencias correctas
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    }
  }, [checkAuth]); // ← Ahora checkAuth es una dependencia estable

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

      if (!data.success) {
        throw new Error(data.message || 'Credenciales inválidas');
      }

      if (!data.usuario) {
        throw new Error('Datos de usuario incompletos');
      }

      console.log('✅ Credenciales válidas, solicitando 2FA...');
      
      // IMPORTANTE: El backend retorna usuario.id (no usuario._id)
      const usuarioId = data.usuario.id || data.usuario._id;
      
      if (!usuarioId) {
        throw new Error('ID de usuario no encontrado en la respuesta');
      }

      // Guardar datos del usuario temporalmente (sin token aún)
      setUsuarioData({
        ...data.usuario,
        id: usuarioId // Asegurar que tenemos el ID correcto
      });

      // Proceder con 2FA
      await solicitarCodigo2FA(usuarioId);

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

      if (!data.success) {
        throw new Error(data.message || 'Error al solicitar código de verificación');
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

      if (!data.success) {
        throw new Error(data.message || 'Código de verificación inválido');
      }

      if (!data.token) {
        throw new Error('Token de sesión no recibido');
      }

      console.log('✅ Código 2FA válido, acceso concedido');

      // Guardar en localStorage (solo después de verificar 2FA)
      localStorage.setItem('token', data.token);
      
      // Usar los datos del usuario de la respuesta (más completos después del 2FA)
      const usuarioCompleto = data.usuario || usuarioData;
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

  // Manejo centralizado de errores
  const manejarError = (err) => {
    let errorMessage = 'Error de conexión. Intenta nuevamente.';

    if (err.message && err.message.includes('Failed to fetch')) {
      errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:4000';
    } else if (err.message && err.message.includes('NetworkError')) {
      errorMessage = 'Error de red. Verifica tu conexión a internet y que el servidor esté disponible.';
    } else if (err.message && err.message.includes('CORS')) {
      errorMessage = 'Error de configuración del servidor (CORS).';
    } else if (err.status === 500) {
      errorMessage = 'Error interno del servidor. Intenta más tarde.';
    } else if (err.status === 401 || err.status === 403) {
      errorMessage = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
    } else if (err.status === 404) {
      errorMessage = 'Servicio no encontrado. Verifica que el backend esté corriendo.';
    } else if (err.status === 429) {
      errorMessage = err.message || 'Demasiadas solicitudes. Espera unos minutos.';
    } else if (err.message && !err.message.includes('<!DOCTYPE') && !err.message.includes('<html')) {
      errorMessage = err.message;
    }

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
      </div>
    </div>
  );
};

export default Login;