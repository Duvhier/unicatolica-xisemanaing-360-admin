// api.js - VERSIÓN CORREGIDA
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://unicatolica-xisemanaing-360-backend.vercel.app'
  : 'http://localhost:4000';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    // Log para debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 API Base URL:', this.baseURL);
    }
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
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? options.body : undefined
      });

      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Si no es JSON, verificar si es HTML (error del servidor)
        if ((text && text.trim().startsWith('<!DOCTYPE')) || (text && text.includes('<html'))) {
          // Extraer mensaje de error del HTML si existe
          const errorMatch = text.match(/<pre>(.*?)<\/pre>/i) || text.match(/<title>(.*?)<\/title>/i);
          const errorText = errorMatch ? errorMatch[1] : 'Error del servidor';
          data = { 
            message: response.status === 500 
              ? `Error interno del servidor (${errorText}). Por favor, contacta al administrador.` 
              : `Error ${response.status}: ${errorText}`
          };
        } else {
          data = { message: text || `Error ${response.status}` };
        }
      }

      if (!response.ok) {
        // Para errores del servidor, lanzar error con mensaje más claro
        const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
        const error = new Error(`Error ${response.status}: ${errorMessage}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ API Error:', error);
      // Mejorar mensaje de error para problemas de conexión
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:4000');
      }
      throw error;
    }
  }

  // ===== MÉTODOS DE AUTENTICACIÓN =====

  /**
   * Paso 1: Login tradicional con usuario y contraseña
   * @param {Object} credentials - Credenciales de usuario
   * @param {string} credentials.usuario - Nombre de usuario
   * @param {string} credentials.password - Contraseña
   */
  async login(credentials) {
    return this.request('/organizador/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  /**
   * Paso 2: Solicitar código de verificación 2FA por WhatsApp
   * @param {string} usuarioId - ID del usuario autenticado
   */
  async solicitarCodigo2FA(usuarioId) {
    return this.request('/organizador/2fa/solicitar', {
      method: 'POST',
      body: JSON.stringify({ usuarioId })
    });
  }

  /**
   * Paso 3: Verificar código 2FA y obtener token de acceso
   * @param {string} usuarioId - ID del usuario
   * @param {string} codigo - Código de 6 dígitos recibido por WhatsApp
   */
  async verificarCodigo2FA(usuarioId, codigo) {
    return this.request('/organizador/2fa/verificar', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, codigo })
    });
  }

  /**
   * Método para renovar token expirado
   * @param {string} refreshToken - Token de refresco
   */
  async renovarToken(refreshToken) {
    return this.request('/organizador/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
  }

  /**
   * Cerrar sesión y revocar tokens
   * @param {string} usuarioId - ID del usuario
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

  // ===== MÉTODOS EXISTENTES DEL DASHBOARD =====

  /**
   * Obtener inscripciones por colección (evento)
   * @param {string} coleccion - ID de la colección/evento
   */
  async getInscripciones(coleccion) {
    return this.request(`/organizador/inscripciones?coleccion=${coleccion}`);
  }

  /**
   * Obtener estadísticas por colección (evento)
   * @param {string} coleccion - ID de la colección/evento
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
   * Marcar/desmarcar asistencia de un usuario
   * @param {string} id - ID de la inscripción
   * @param {string} coleccion - ID de la colección/evento
   * @param {boolean} asistencia - Estado de la asistencia
   */
  async marcarAsistencia(id, coleccion, asistencia) {
    return this.request(`/organizador/asistencia/${id}?coleccion=${coleccion}`, {
      method: 'PUT',
      body: JSON.stringify({ asistencia })
    });
  }

  /**
   * Buscar inscripción por ID
   * @param {string} id - ID de la inscripción
   */
  async buscarInscripcion(id) {
    return this.request(`/organizador/buscar-inscripcion/${id}`);
  }

  // ===== MÉTODOS ADICIONALES DE SEGURIDAD =====

  /**
   * Cambiar contraseña del usuario
   * @param {string} usuarioId - ID del usuario
   * @param {string} passwordActual - Contraseña actual
   * @param {string} nuevaPassword - Nueva contraseña
   */
  async cambiarPassword(usuarioId, passwordActual, nuevaPassword) {
    return this.request('/organizador/cambiar-password', {
      method: 'PUT',
      body: JSON.stringify({ usuarioId, passwordActual, nuevaPassword })
    });
  }

  /**
   * Solicitar recuperación de contraseña
   * @param {string} usuario - Nombre de usuario o email
   */
  async solicitarRecuperacionPassword(usuario) {
    return this.request('/organizador/recuperar-password', {
      method: 'POST',
      body: JSON.stringify({ usuario })
    });
  }

  /**
   * Verificar código de recuperación
   * @param {string} usuario - Nombre de usuario
   * @param {string} codigoRecuperacion - Código de recuperación
   */
  async verificarCodigoRecuperacion(usuario, codigoRecuperacion) {
    return this.request('/organizador/verificar-codigo-recuperacion', {
      method: 'POST',
      body: JSON.stringify({ usuario, codigoRecuperacion })
    });
  }

  /**
   * Restablecer contraseña con código de recuperación
   * @param {string} usuario - Nombre de usuario
   * @param {string} codigoRecuperacion - Código de recuperación
   * @param {string} nuevaPassword - Nueva contraseña
   */
  async restablecerPassword(usuario, codigoRecuperacion, nuevaPassword) {
    return this.request('/organizador/restablecer-password', {
      method: 'POST',
      body: JSON.stringify({ usuario, codigoRecuperacion, nuevaPassword })
    });
  }

  // ===== MÉTODOS DE AUDITORÍA =====

  /**
   * Obtener logs de acceso del usuario
   * @param {string} usuarioId - ID del usuario
   * @param {number} limite - Número máximo de logs a obtener
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