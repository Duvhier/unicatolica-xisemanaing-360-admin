// api.js - VERSIÓN ACTUALIZADA PARA VERCEL
// Usar variable de entorno VITE_API_URL para mayor flexibilidad

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://unicatolica-xisemanaing-360-backend.vercel.app'
    : 'http://localhost:4000');

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🚀 API Client inicializado con URL:', this.baseURL);
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
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');
    
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
            success: false,
            message: response.status === 500 
              ? `Error interno del servidor (${errorText}). Por favor, contacta al administrador.` 
              : `Error ${response.status}: ${errorText}`
          };
        } else {
          data = { 
            success: false,
            message: text || `Error ${response.status}: ${response.statusText}` 
          };
        }
      }

      console.log(`✅ API Response (${response.status}):`, data);

      if (!response.ok) {
        // Para errores del servidor, lanzar error con mensaje más claro
        const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;

    } catch (error) {
      console.error('❌ API Error:', error);
      
      // Mejorar mensaje de error para problemas de conexión
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        const connectionError = new Error(`No se pudo conectar con el servidor: ${this.baseURL}. Verifica tu conexión a internet y que el backend esté disponible.`);
        connectionError.status = 0;
        throw connectionError;
      }
      
      // Si el error ya tiene un mensaje claro, mantenerlo
      if (error.message && !error.message.includes('Error del servidor')) {
        throw error;
      }
      
      // Error genérico
      const genericError = new Error('Error de conexión con el servidor. Por favor, intenta nuevamente.');
      genericError.status = error.status || 500;
      throw genericError;
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
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  /**
   * Paso 2: Solicitar código de verificación 2FA por WhatsApp
   * @param {string} usuarioId - ID del usuario autenticado
   */
  async solicitarCodigo2FA(usuarioId) {
    return this.request('/api/auth/2fa/solicitar', {
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
    return this.request('/api/auth/2fa/verificar', {
      method: 'POST',
      body: JSON.stringify({ usuarioId, codigo })
    });
  }

  /**
   * Verificar estado de la sesión
   */
  async verificarSesion() {
    return this.request('/api/auth/verificar-sesion');
  }

  // ===== MÉTODOS DE DATOS DEL DASHBOARD =====

  /**
   * Obtener todas las actividades disponibles
   */
  async getActividades() {
    return this.request('/api/actividades');
  }

  /**
   * Obtener inscripciones por colección (evento)
   * @param {string} coleccion - ID de la colección/evento
   */
  async getInscripciones(coleccion) {
    return this.request(`/api/inscripciones/${coleccion}`);
  }

  /**
   * Obtener estadísticas por colección (evento)
   * @param {string} coleccion - ID de la colección/evento
   */
  async getStats(coleccion) {
    return this.request(`/api/stats/${coleccion}`);
  }

  /**
   * Marcar/desmarcar asistencia de un usuario
   * @param {string} id - ID de la inscripción
   * @param {string} coleccion - ID de la colección/evento
   * @param {boolean} asistencia - Estado de la asistencia
   */
  async marcarAsistencia(id, coleccion, asistencia) {
    return this.request(`/api/asistencia/${coleccion}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ asistencia })
    });
  }

  // ===== MÉTODOS PARA ESTADO DE REGISTROS =====

  /**
   * Obtener estado de registros para liderazgo
   */
  async getEstadoLiderazgo() {
    return this.request('/liderazgo/estado-registros');
  }

  /**
   * Obtener estado de registros para inaugural
   */
  async getEstadoInaugural() {
    return this.request('/asistenciainaugural/estado-registros');
  }

  /**
   * Obtener estado de registros para hackathon
   */
  async getEstadoHackathon() {
    return this.request('/inscripciones/estado-registros');
  }

  /**
   * Obtener estado de registros para zona america
   */
  async getEstadoZonaAmerica() {
    return this.request('/visitazonaamerica/estado-registros');
  }

  /**
   * Obtener estado de registros para technological touch
   */
  async getEstadoTechnological() {
    return this.request('/technological/estado-registros');
  }

  // ===== MÉTODOS ADICIONALES =====

  /**
   * Buscar inscripción por ID
   * @param {string} id - ID de la inscripción
   */
  async buscarInscripcion(id) {
    return this.request(`/api/buscar-inscripcion/${id}`);
  }

  /**
   * Obtener logs de acceso del usuario
   * @param {string} usuarioId - ID del usuario
   * @param {number} limite - Número máximo de logs a obtener
   */
  async obtenerLogsAcceso(usuarioId, limite = 50) {
    return this.request(`/api/logs-acceso?usuarioId=${usuarioId}&limite=${limite}`);
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Verificar salud del servidor
   */
  async healthCheck() {
    return this.request('/health');
  }

  /**
   * Obtener información del servidor
   */
  async getServerInfo() {
    return this.request('/api/info');
  }
}

// Crear instancia única del cliente API
export const apiClient = new APIClient();

// Exportar la URL base para uso en otros componentes si es necesario
export { API_BASE_URL };