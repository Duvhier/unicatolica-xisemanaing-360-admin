import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/api';
import '../styles/Login.css';
import fondoLogin from '../assets/fondologin.png';
import logoUnicatolica from '../assets/QR-UNICATOLICA1.png';

const LOGIN_STEPS = {
  LOGIN: 'login',
  VERIFY_2FA: 'verificar_2fa',
  WEBHOOK_CONFIG: 'webhook_config'
};

const TIMEOUTS = {
  RESEND_CODE: 120,
  SESSION_CHECK: 5000
};

const Login = ({ onLoginSuccess }) => {
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
  const [webhookInfo, setWebhookInfo] = useState(null);
  const [configStep, setConfigStep] = useState('checking');

  const passwordRef = useRef(null);
  const twoFARef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    if (savedUser) {
      setCredentials(prev => ({ ...prev, usuario: savedUser }));
      setRememberMe(true);
    }
  }, []);

  const checkExistingAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await apiClient.getActividades();
      onLoginSuccess();
    } catch (error) {
      console.warn('⚠️ Sesión inválida:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
  }, [onLoginSuccess]);

  useEffect(() => {
    checkExistingAuth();
  }, [checkExistingAuth]);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(time => time - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Verificar configuración de webhooks al cargar
  useEffect(() => {
    const checkWebhooks = async () => {
      try {
        setConfigStep('checking');
        const result = await apiClient.verificarWebhooks();
        setWebhookInfo(result);
        
        // Verificar si las colecciones necesarias existen
        const allCollectionsExist = result.collectionsStatus && 
          result.collectionsStatus.twilioMessageLogs && 
          result.collectionsStatus.incomingWhatsAppMessages && 
          result.collectionsStatus.sentMessages;
        
        if (!allCollectionsExist) {
          setConfigStep('needs_setup');
          console.warn('⚠️ Configuración de webhooks incompleta');
        } else {
          setConfigStep('ready');
          console.log('✅ Webhooks configurados correctamente');
        }
      } catch (error) {
        console.error('❌ Error verificando webhooks:', error);
        setConfigStep('error');
        setError('Error verificando configuración de Twilio');
      }
    };

    checkWebhooks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleTwoFACodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setTwoFACode(value);
    clearError();

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

  const clearError = () => {
    if (error) setError('');
  };

  const handleError = (error) => {
    let message = 'Error de conexión. Intenta nuevamente.';
    
    console.error('🔴 Error capturado:', error);

    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    } else if (error.message?.includes('CORS')) {
      message = 'Error de configuración del servidor. Contacta al administrador.';
    } else if (error.status === 400) {
      message = error.message || 'Datos inválidos. Verifica la información ingresada.';
    } else if (error.status === 401) {
      message = 'Credenciales inválidas. Verifica tu usuario y contraseña.';
    } else if (error.status === 429) {
      message = 'Demasiados intentos. Espera unos minutos antes de reintentar.';
    } else if (error.status === 500) {
      message = 'Error del servidor. Intenta más tarde o contacta soporte.';
    } else if (error.message?.includes('Twilio') || error.message?.includes('WhatsApp')) {
      // Errores específicos de Twilio
      if (error.message.includes('sandbox')) {
        message = 'Error de Twilio: Verifica que tu número esté suscrito al sandbox de WhatsApp';
      } else if (error.message.includes('número')) {
        message = error.message;
      } else {
        message = `Error de WhatsApp: ${error.message}`;
      }
    } else if (error.message) {
      message = error.message;
    }

    setError(message);
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    
    console.log('🔐 Iniciando proceso de login...');

    // Validación de campos vacíos
    if (!credentials.usuario?.trim()) {
      setError('Por favor ingresa tu usuario');
      return;
    }

    if (!credentials.password?.trim()) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    if (credentials.password.length < 3) {
      setError('La contraseña debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    clearError();

    try {
      console.log('📤 Enviando credenciales al servidor...');
      
      const data = await apiClient.login(credentials);
      
      console.log('📥 Respuesta recibida:', data);

      // ✅ VALIDACIÓN MEJORADA DE LA RESPUESTA
      if (!data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      if (data.success === false) {
        throw new Error(data.message || 'Error en el inicio de sesión');
      }

      // Verificar que exista información del usuario
      const user = data.user || data.usuario;
      
      if (!user) {
        console.error('❌ Respuesta sin datos de usuario:', data);
        throw new Error('Respuesta del servidor no contiene información del usuario');
      }

      // Obtener el ID del usuario de diferentes posibles ubicaciones
      const userId = user.id || user._id;
      
      if (!userId) {
        console.error('❌ Usuario sin ID:', user);
        throw new Error('No se pudo obtener el ID del usuario');
      }

      console.log('✅ Login exitoso. Usuario ID:', userId);

      // Guardar usuario si "Recordar" está activado
      if (rememberMe) {
        localStorage.setItem('rememberedUser', credentials.usuario.trim());
      }

      setUserData(user);
      
      // Solicitar código 2FA
      await request2FACode(userId);

    } catch (error) {
      console.error('❌ Error en handleLogin:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const request2FACode = async (userId) => {
    try {
      setLoading(true);
      clearError();
      
      console.log('📱 Solicitando código 2FA para usuario:', userId);
      
      const data = await apiClient.solicitarCodigo2FA(userId);
      
      console.log('📥 Respuesta solicitud 2FA:', data);

      if (!data || data.success === false) {
        throw new Error(data?.message || 'Error al solicitar el código de verificación');
      }

      console.log('✅ Código 2FA enviado exitosamente');

      setCurrentStep(LOGIN_STEPS.VERIFY_2FA);
      setTimeRemaining(TIMEOUTS.RESEND_CODE);
      setResendCount(prev => prev + 1);
      
      setTimeout(() => {
        if (twoFARef.current) {
          twoFARef.current.focus();
        }
      }, 100);

    } catch (error) {
      console.error('❌ Error solicitando código 2FA:', error);
      
      // Manejar errores específicos de Twilio
      if (error.message?.includes('Twilio') || error.message?.includes('WhatsApp') || error.message?.includes('sandbox')) {
        handleError(error);
        // Mostrar ayuda específica para configuración de Twilio
        setCurrentStep(LOGIN_STEPS.WEBHOOK_CONFIG);
      } else {
        handleError(error);
        // Volver al login si falla el envío del código
        setCurrentStep(LOGIN_STEPS.LOGIN);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e?.preventDefault();
    
    console.log('🔐 Verificando código 2FA:', twoFACode);

    if (!twoFACode || twoFACode.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    clearError();

    try {
      const userId = userData?.id || userData?._id;
      
      if (!userId) {
        throw new Error('No se encontró el ID del usuario. Intenta iniciar sesión nuevamente.');
      }

      console.log('📤 Enviando código para verificación...');
      
      const data = await apiClient.verificarCodigo2FA(userId, twoFACode);
      
      console.log('📥 Respuesta verificación 2FA:', data);

      if (!data || data.success === false) {
        throw new Error(data?.message || 'Código de verificación inválido');
      }

      if (!data.token) {
        throw new Error('No se recibió el token de autenticación');
      }

      console.log('✅ Código verificado. Token recibido.');

      // Guardar datos de sesión
      localStorage.setItem('token', data.token);
      
      const userToSave = data.user || data.usuario || userData;
      localStorage.setItem('userData', JSON.stringify(userToSave));
      
      console.log('✅ Sesión guardada. Redirigiendo...');
      
      // Pequeño delay para que el usuario vea el cambio
      setTimeout(() => {
        onLoginSuccess();
      }, 300);

    } catch (error) {
      console.error('❌ Error verificando código 2FA:', error);
      handleError(error);
      setTwoFACode('');
      
      // Focus de vuelta en el input
      setTimeout(() => {
        if (twoFARef.current) {
          twoFARef.current.focus();
        }
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCount >= 3) {
      setError('Has excedido el número máximo de reenvíos. Inicia sesión nuevamente.');
      setTimeout(() => backToLogin(), 3000);
      return;
    }

    if (timeRemaining > 0) {
      setError(`Espera ${timeRemaining} segundos antes de reenviar el código.`);
      return;
    }

    const userId = userData?.id || userData?._id;
    if (!userId) {
      setError('Error obteniendo datos de usuario. Inicia sesión nuevamente.');
      setTimeout(() => backToLogin(), 2000);
      return;
    }

    await request2FACode(userId);
  };

  const backToLogin = () => {
    console.log('⬅️ Volviendo al login...');
    setCurrentStep(LOGIN_STEPS.LOGIN);
    setTwoFACode('');
    setUserData(null);
    setResendCount(0);
    setTimeRemaining(0);
    clearError();
  };

  const handleRetryWebhookCheck = async () => {
    try {
      setConfigStep('checking');
      const result = await apiClient.verificarWebhooks();
      setWebhookInfo(result);
      
      const allCollectionsExist = result.collectionsStatus && 
        result.collectionsStatus.twilioMessageLogs && 
        result.collectionsStatus.incomingWhatsAppMessages && 
        result.collectionsStatus.sentMessages;
      
      if (allCollectionsExist) {
        setConfigStep('ready');
        setCurrentStep(LOGIN_STEPS.LOGIN);
      } else {
        setConfigStep('needs_setup');
      }
    } catch (error) {
      setConfigStep('error');
      setError('Error verificando configuración: ' + error.message);
    }
  };

  const handleConfigureWebhooks = () => {
    if (webhookInfo?.webhookUrls) {
      const { statusCallback, incomingMessage } = webhookInfo.webhookUrls;
      
      // Crear mensaje para el usuario con las URLs
      const configMessage = `
CONFIGURACIÓN TWILIO REQUERIDA:

1. Ve a Twilio Sandbox → Settings

2. Configura estas URLs:

STATUS CALLBACK (GET):
${statusCallback}

WHEN A MESSAGE COMES IN (POST):
${incomingMessage}

3. Guarda los cambios

4. Asegúrate de que tu número esté suscrito al sandbox
      `;
      
      // Mostrar en alerta y también en consola
      alert(configMessage);
      console.log('🔧 URLs para configurar en Twilio:', configMessage);
    }
  };

  const renderWebhookConfig = () => (
    <div className="webhook-config">
      <div className="config-header">
        <div className="config-icon">⚙️</div>
        <h3>Configuración Requerida</h3>
        <p>Se necesita configurar los webhooks de Twilio para el envío de códigos por WhatsApp</p>
      </div>

      <div className="config-status">
        <div className={`status-item ${configStep === 'ready' ? 'ready' : 'pending'}`}>
          <span className="status-dot"></span>
          Estado: {configStep === 'ready' ? '✅ Configurado' : '❌ Pendiente'}
        </div>
        
        {webhookInfo?.collectionsStatus && (
          <div className="collections-status">
            <h4>Colecciones en Base de Datos:</h4>
            <div className="collection-list">
              <div className={`collection-item ${webhookInfo.collectionsStatus.twilioMessageLogs ? 'ready' : 'missing'}`}>
                twilioMessageLogs: {webhookInfo.collectionsStatus.twilioMessageLogs ? '✅' : '❌'}
              </div>
              <div className={`collection-item ${webhookInfo.collectionsStatus.incomingWhatsAppMessages ? 'ready' : 'missing'}`}>
                incomingWhatsAppMessages: {webhookInfo.collectionsStatus.incomingWhatsAppMessages ? '✅' : '❌'}
              </div>
              <div className={`collection-item ${webhookInfo.collectionsStatus.sentMessages ? 'ready' : 'missing'}`}>
                sentMessages: {webhookInfo.collectionsStatus.sentMessages ? '✅' : '❌'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="config-actions">
        <button
          type="button"
          className="config-button primary"
          onClick={handleConfigureWebhooks}
          disabled={loading}
        >
          📋 Mostrar URLs para Configurar
        </button>
        
        <button
          type="button"
          className="config-button secondary"
          onClick={handleRetryWebhookCheck}
          disabled={loading}
        >
          🔄 Verificar Nuevamente
        </button>

        <button
          type="button"
          className="config-button"
          onClick={backToLogin}
          disabled={loading}
        >
          ← Volver al Login
        </button>
      </div>

      <div className="config-help">
        <h4>📖 Instrucciones:</h4>
        <ol>
          <li>Accede a tu consola de Twilio</li>
          <li>Ve a "Sandbox" → "WhatsApp Sandbox"</li>
          <li>En "Sandbox Configuration", pega las URLs mostradas</li>
          <li>Guarda los cambios</li>
          <li>Verifica que tu número esté suscrito al sandbox</li>
          <li>Haz clic en "Verificar Nuevamente"</li>
        </ol>
      </div>
    </div>
  );

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
            aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
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

      {configStep !== 'ready' && (
        <div className="config-warning">
          <p>⚠️ La configuración de Twilio no está completa. El envío de códigos podría fallar.</p>
          <button 
            type="button" 
            className="warning-button"
            onClick={() => setCurrentStep(LOGIN_STEPS.WEBHOOK_CONFIG)}
          >
            Ver Configuración
          </button>
        </div>
      )}
    </form>
  );

  const render2FAVerification = () => (
    <form className="login-form" onSubmit={handleVerify2FA} noValidate>
      <div className="security-info">
        <div className="security-icon">🔒</div>
        <h3>Verificación de Seguridad</h3>
        <p>Hemos enviado un código de 6 dígitos a tu WhatsApp</p>
        {userData?.telefono && (
          <p className="user-phone">
            ••••••{userData.telefono.slice(-4)}
          </p>
        )}
        <div className="whatsapp-note">
          💡 <strong>Nota:</strong> Asegúrate de que tu número esté suscrito al sandbox de Twilio WhatsApp
        </div>
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
          maxLength="6"
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
            disabled={loading || resendCount >= 3}
          >
            {resendCount >= 3 
              ? 'Límite de reenvíos alcanzado'
              : `Reenviar código (${3 - resendCount} ${3 - resendCount === 1 ? 'intento' : 'intentos'} restantes)`
            }
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

      <div className="troubleshoot-section">
        <button 
          type="button" 
          className="troubleshoot-button"
          onClick={() => setCurrentStep(LOGIN_STEPS.WEBHOOK_CONFIG)}
        >
          🔧 ¿Problemas con WhatsApp?
        </button>
      </div>
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
              : currentStep === LOGIN_STEPS.VERIFY_2FA
              ? 'Verifica tu identidad'
              : 'Configuración de Twilio'
            }
          </p>
        </div>

        {currentStep === LOGIN_STEPS.LOGIN && renderLoginForm()}
        {currentStep === LOGIN_STEPS.VERIFY_2FA && render2FAVerification()}
        {currentStep === LOGIN_STEPS.WEBHOOK_CONFIG && renderWebhookConfig()}

        {error && (
          <div className="error-message" role="alert">
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