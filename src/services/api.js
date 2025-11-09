// api.js - VERSIÓN CORREGIDA COMPLETA

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
}

export const apiClient = new APIClient();