// api.js - VERSIÓN ACTUALIZADA CON TWILIO WEBHOOKS

// ✅ SOLUCIÓN: Manejo robusto de variables de entorno
const getApiBaseUrl = () => {
  try {
    // Verificar si estamos en un entorno con import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      console.log('🔧 Entorno Vite detectado');
      const mode = import.meta.env.MODE;
      const apiUrl = import.meta.env.VITE_API_URL;
      
      console.log('🔧 Mode:', mode);
      console.log('🔧 VITE_API_URL:', apiUrl);
      
      return apiUrl || 'https://unicatolica-xisemanaing-360-backend.vercel.app';
    }
    
    // Verificar si estamos en un entorno con process.env (Node.js)
    if (typeof process !== 'undefined' && process.env) {
      console.log('🔧 Entorno Node.js detectado');
      const mode = process.env.NODE_ENV;
      const apiUrl = process.env.VITE_API_URL;
      
      console.log('🔧 NODE_ENV:', mode);
      console.log('🔧 VITE_API_URL:', apiUrl);
      
      return apiUrl || 'https://unicatolica-xisemanaing-360-backend.vercel.app';
    }
    
    // Fallback para entornos desconocidos
    console.log('🔧 Entorno desconocido, usando URL por defecto');
    return 'https://unicatolica-xisemanaing-360-backend.vercel.app';
    
  } catch (error) {
    console.error('❌ Error obteniendo variables de entorno:', error);
    // Fallback seguro
    return 'https://unicatolica-xisemanaing-360-backend.vercel.app';
  }
};

const API_BASE_URL = getApiBaseUrl();

console.log('🚀 API Base URL final:', API_BASE_URL);

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🚀 APIClient inicializado con URL:', this.baseURL);
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;

    console.log('🌐 Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      body: options.body ? JSON.parse(options.body) : null
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? options.body : undefined
      });

      console.log('📡 Response status:', response.status, response.statusText);

      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
        console.log('📦 Response data:', data);
      } catch (parseError) {
        console.error('❌ Error parseando respuesta:', parseError);
        // Si no es JSON, verificar si es HTML (error del servidor)
        if ((text && text.trim().startsWith('<!DOCTYPE')) || (text && text.includes('<html'))) {
          const errorMatch = text.match(/<pre>(.*?)<\/pre>/i) || text.match(/<title>(.*?)<\/title>/i);
          const errorText = errorMatch ? errorMatch[1] : 'Error del servidor';
          data = {
            success: false,
            message: response.status === 500
              ? `Error interno del servidor: ${errorText}`
              : `Error ${response.status}: ${errorText}`
          };
        } else {
          data = { 
            success: false, 
            message: text || `Error ${response.status}: ${response.statusText}` 
          };
        }
      }

      if (!response.ok) {
        console.error('❌ Request failed:', {
          status: response.status,
          data: data
        });
        
        const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ API Error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const newError = new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        newError.originalError = error;
        throw newError;
      }
      
      throw error;
    }
  }

  // ===== MÉTODOS DE AUTENTICACIÓN =====

  /**
   * Paso 1: Login tradicional con usuario y contraseña
   */
  async login(credentials) {
    console.log('🔐 Login - Enviando credenciales:', { 
      usuario: credentials.usuario,
      passwordLength: credentials.password?.length 
    });

    // Validación local antes de enviar
    if (!credentials.usuario?.trim() || !credentials.password?.trim()) {
      throw new Error('Usuario y contraseña son requeridos');
    }

    const cleanCredentials = {
      usuario: credentials.usuario.trim(),
      password: credentials.password.trim()
    };

    const response = await this.request('/organizador/login', {
      method: 'POST',
      body: JSON.stringify(cleanCredentials)
    });

    console.log('✅ Login response:', response);
    return response;
  }

  /**
   * Paso 2: Solicitar código de verificación 2FA por WhatsApp
   */
  async solicitarCodigo2FA(usuarioId) {
    console.log('📱 Solicitando código 2FA para:', usuarioId);

    if (!usuarioId) {
      throw new Error('ID de usuario es requerido');
    }

    const response = await this.request('/organizador/2fa/solicitar', {
      method: 'POST',
      body: JSON.stringify({ usuarioId })
    });

    console.log('✅ Código 2FA solicitado:', response);
    return response;
  }

  /**
   * Paso 3: Verificar código 2FA y obtener token de acceso
   */
  async verificarCodigo2FA(usuarioId, codigo) {
    console.log('🔐 Verificando código 2FA:', { usuarioId, codigo });

    if (!usuarioId || !codigo) {
      throw new Error('ID de usuario y código son requeridos');
    }

    if (codigo.length !== 6 || !/^\d+$/.test(codigo)) {
      throw new Error('El código debe ser de 6 dígitos numéricos');
    }

    const response = await this.request('/organizador/2fa/verificar', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, codigo })
    });

    console.log('✅ Código 2FA verificado:', response);
    return response;
  }

  /**
   * Método para renovar token expirado
   */
  async renovarToken(refreshToken) {
    return this.request('/organizador/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }

  /**
   * Cerrar sesión y revocar tokens
   */
  async logout(usuarioId) {
    return this.request('/organizador/logout', {
      method: 'POST',
      body: JSON.stringify({ usuarioId })
    });
  }

  /**
   * Verificar estado de la sesión
   */
  async verificarSesion() {
    return this.request('/organizador/verificar-sesion');
  }

  // ===== MÉTODOS PARA TWILIO WEBHOOKS =====

  /**
   * Verificar configuración de webhooks de Twilio
   */
  async verificarWebhooks() {
    console.log('🔧 Verificando configuración de webhooks...');
    
    const response = await this.request('/organizador/verificar-webhooks');
    
    console.log('✅ Estado de webhooks:', response);
    return response;
  }

  /**
   * Obtener diagnóstico completo de webhooks
   */
  async getWebhookDiagnostic() {
    console.log('🔧 Obteniendo diagnóstico de webhooks...');
    
    const response = await this.request('/webhooks/twilio/diagnostic');
    
    console.log('✅ Diagnóstico de webhooks:', response);
    return response;
  }

  /**
   * Obtener logs de mensajes Twilio
   */
  async getTwilioLogs(limit = 50) {
    console.log('📋 Obteniendo logs de Twilio...');
    
    const response = await this.request(`/organizador/twilio-logs?limit=${limit}`);
    
    console.log('✅ Logs de Twilio obtenidos:', response.logs?.status?.length || 0, 'registros');
    return response;
  }

  /**
   * Diagnóstico completo de Twilio
   */
  async diagnosticoCompletoTwilio() {
    try {
      console.group('🔧 INICIANDO DIAGNÓSTICO COMPLETO TWILIO');
      
      // 1. Verificar webhooks
      console.log('1. Verificando configuración de webhooks...');
      const webhookInfo = await this.verificarWebhooks();
      
      // 2. Verificar logs recientes
      console.log('2. Obteniendo logs recientes...');
      const logs = await this.getTwilioLogs(5);
      
      // 3. Verificar diagnóstico técnico
      console.log('3. Obteniendo diagnóstico técnico...');
      const diagnostic = await this.getWebhookDiagnostic();
      
      console.groupEnd();
      
      const resultado = {
        success: true,
        webhookInfo,
        logs,
        diagnostic,
        summary: {
          webhooksConfigurados: webhookInfo.success,
          totalLogs: (logs.logs?.status?.length || 0) + (logs.logs?.incoming?.length || 0),
          estadoGeneral: webhookInfo.success ? '✅ CONFIGURADO' : '❌ PENDIENTE'
        }
      };
      
      console.log('📊 Resumen del diagnóstico:', resultado.summary);
      return resultado;
      
    } catch (error) {
      console.error('❌ Error en diagnóstico completo de Twilio:', error);
      
      const resultadoError = {
        success: false,
        error: error.message,
        summary: {
          estadoGeneral: '❌ ERROR',
          mensaje: 'No se pudo completar el diagnóstico'
        }
      };
      
      return resultadoError;
    }
  }

  /**
   * Probar envío de mensaje de prueba
   */
  async probarEnvioMensaje(telefono, mensaje = "🔧 Mensaje de prueba de Twilio") {
    console.log('🧪 Probando envío de mensaje a:', telefono);
    
    const response = await this.request('/organizador/probar-mensaje', {
      method: 'POST',
      body: JSON.stringify({ telefono, mensaje })
    });
    
    console.log('✅ Resultado prueba mensaje:', response);
    return response;
  }

  // ===== MÉTODOS DEL DASHBOARD =====

  /**
   * Obtener inscripciones por colección (evento)
   */
  async getInscripciones(coleccion) {
    const data = await this.request(`/organizador/inscripciones?coleccion=${coleccion}`);

    if (data.inscripciones && Array.isArray(data.inscripciones)) {
      data.inscripciones = data.inscripciones.map(inscripcion => ({
        ...inscripcion,
        email: inscripcion.correo,
        id: inscripcion._id || inscripcion.id,
        nombre: this.formatNombre(inscripcion.nombre)
      }));
    }

    return data;
  }

  /**
   * Obtener resumen completo de todos los eventos
   */
  async getResumenCompletoEventos() {
    return this.request('/organizador/resumen-completo-eventos');
  }

  /**
   * Obtener estadísticas generales
   */
  async getEstadisticasGenerales() {
    return this.request('/organizador/estadisticas-generales');
  }

  /**
   * Exportar datos completos
   */
  async exportarDatosCompletos(formato = 'json') {
    return this.request(`/organizador/exportar-datos-completos?formato=${formato}`);
  }

  /**
   * Exportar resumen en PDF
   */
  async exportarResumenPDF() {
    return this.request('/organizador/exportar-resumen-pdf');
  }

  /**
   * Formatear nombre (capitalizar correctamente)
   */
  formatNombre(nombre) {
    if (!nombre || typeof nombre !== 'string') return '-';

    let formatted = nombre.toLowerCase().trim();
    formatted = formatted.replace(/\b\w/g, char => char.toUpperCase());
    formatted = formatted.replace(/\b(Mc|Mac|O'|De La|Del|Los|Las|El|La)\b/gi,
      match => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase());
    formatted = formatted.replace(/\s+/g, ' ');

    return formatted;
  }

  /**
   * Obtener estadísticas por colección
   */
  async getStats(coleccion) {
    return this.request(`/organizador/stats?coleccion=${coleccion}`);
  }

  /**
   * Obtener todas las actividades disponibles
   */
  async getActividades() {
    return this.request('/api/actividades/todas');
  }

  /**
   * Marcar/desmarcar asistencia
   */
  async marcarAsistencia(id, coleccion, asistencia) {
    return this.request(`/organizador/asistencia/${id}?coleccion=${coleccion}`, {
      method: 'PUT',
      body: JSON.stringify({ asistencia })
    });
  }

  /**
   * Buscar inscripción por ID
   */
  async buscarInscripcion(id) {
    const data = await this.request(`/organizador/buscar-inscripcion/${id}`);

    if (data.inscripcion) {
      data.inscripcion = {
        ...data.inscripcion,
        email: data.inscripcion.correo,
        id: data.inscripcion._id || data.inscripcion.id
      };
    }

    return data;
  }

  // ===== MÉTODOS DE SEGURIDAD =====

  /**
   * Cambiar contraseña del usuario
   */
  async cambiarPassword(usuarioId, passwordActual, nuevaPassword) {
    return this.request('/organizador/cambiar-password', {
      method: 'PUT',
      body: JSON.stringify({ usuarioId, passwordActual, nuevaPassword })
    });
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async solicitarRecuperacionPassword(usuario) {
    return this.request('/organizador/recuperar-password', {
      method: 'POST',
      body: JSON.stringify({ usuario })
    });
  }

  /**
   * Verificar código de recuperación
   */
  async verificarCodigoRecuperacion(usuario, codigoRecuperacion) {
    return this.request('/organizador/verificar-codigo-recuperacion', {
      method: 'POST',
      body: JSON.stringify({ usuario, codigoRecuperacion })
    });
  }

  /**
   * Restablecer contraseña
   */
  async restablecerPassword(usuario, codigoRecuperacion, nuevaPassword) {
    return this.request('/organizador/restablecer-password', {
      method: 'POST',
      body: JSON.stringify({ usuario, codigoRecuperacion, nuevaPassword })
    });
  }

  // ===== MÉTODOS DE AUDITORÍA =====

  /**
   * Obtener logs de acceso
   */
  async obtenerLogsAcceso(usuarioId, limite = 50) {
    return this.request(`/organizador/logs-acceso?usuarioId=${usuarioId}&limite=${limite}`);
  }

  /**
   * Obtener estadísticas de seguridad
   */
  async obtenerEstadisticasSeguridad() {
    return this.request('/organizador/estadisticas-seguridad');
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Obtener información del sistema
   */
  async getSystemInfo() {
    return this.request('/organizador/system-info');
  }

  /**
   * Limpiar caché del cliente
   */
  clearCache() {
    console.log('🧹 Limpiando caché del cliente API');
    // Puedes agregar aquí lógica para limpiar caché si es necesario
  }

  /**
   * Verificar salud del servidor
   */
  async healthCheck() {
    try {
      const response = await this.request('/health');
      return {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: response
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Instancia global del cliente API
export const apiClient = new APIClient();

// Utilidades adicionales para Twilio
export const TwilioUtils = {
  /**
   * Formatear número de teléfono para Twilio
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    let formatted = phone.trim().replace(/\D/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '+57' + formatted.substring(1);
    } else if (formatted.startsWith('57') && formatted.length === 12) {
      formatted = '+' + formatted;
    } else if (formatted.length === 10) {
      formatted = '+57' + formatted;
    } else if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return 'whatsapp:' + formatted;
  },

  /**
   * Ocultar número para mostrar en UI
   */
  maskPhoneNumber(phone) {
    if (!phone) return '••••••••••';
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length <= 4) return '••••••••••';
    
    return `••••••${digits.slice(-4)}`;
  },

  /**
   * Validar formato de número
   */
  isValidPhoneNumber(phone) {
    if (!phone) return false;
    
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 12;
  },

  /**
   * Generar instrucciones de configuración
   */
  generateConfigInstructions(webhookUrls) {
    if (!webhookUrls) return '';

    return `
CONFIGURACIÓN TWILIO REQUERIDA:

📋 PASOS A SEGUIR:

1. 🔐 Ve a Twilio Console → WhatsApp → Sandbox
2. ⚙️ En "Sandbox Configuration", configura:
   
   STATUS CALLBACK URL (GET):
   ${webhookUrls.statusCallback}

   WHEN A MESSAGE COMES IN (POST):
   ${webhookUrls.incomingMessage}

3. 💾 Guarda los cambios
4. ✅ Verifica que tu número esté suscrito al sandbox
5. 🔄 Recarga esta página para verificar

⚠️ IMPORTANTE:
• Las URLs deben ser públicas
• Twilio debe poder acceder a tu servidor
• El número debe enviar "join [código]" al sandbox primero
    `;
  }
};

// Exportar utilidades globalmente
export default apiClient;