// Usar URL relativa en desarrollo (para usar el proxy) o URL completa en producción
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://unicatolica-xisemanaing-360-backend.vercel.app'
  : ''; // URL vacía para usar proxy en desarrollo

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
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

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers
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
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  async getInscripciones(coleccion) {
    return this.request(`/organizador/inscripciones?coleccion=${coleccion}`);
  }

  async getStats(coleccion) {
    return this.request(`/organizador/stats?coleccion=${coleccion}`);
  }

  async getActividades() {
    return this.request('/api/actividades/todas');
  }

  async marcarAsistencia(id, coleccion, asistencia) {
    return this.request(`/organizador/asistencia/${id}?coleccion=${coleccion}`, {
      method: 'PUT',
      body: JSON.stringify({ asistencia })
    });
  }

  // Métodos de autenticación
  async login(credentials) {
    return this.request('/organizador/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async buscarInscripcion(id) {
    return this.request(`/organizador/buscar-inscripcion/${id}`);
  }
}

export const apiClient = new APIClient();

