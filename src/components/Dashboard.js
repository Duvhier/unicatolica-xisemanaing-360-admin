import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import Header from './Header';
import EventSelector from './EventSelector';
import InscripcionesTable from './InscripcionesTable';
import StatsCards from './StatsCards';
import '../styles/Dashboard.css';

const Dashboard = ({ onLogout, onScannerClick }) => {
  const [userName, setUserName] = useState('Administrador');
  const [actividades, setActividades] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [inscripciones, setInscripciones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({
    actividades: true,
    inscripciones: false,
    stats: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    cargarInfoUsuario();
    cargarActividades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarInfoUsuario = () => {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        setUserName(usuario.nombre || usuario.usuario);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const cargarActividades = async () => {
    try {
      setLoading(prev => ({ ...prev, actividades: true }));
      const data = await apiClient.getActividades();
      
      if (data.actividades && data.actividades.length) {
        setActividades(data.actividades);
        if (data.actividades.length > 0) {
          setSelectedEvent(data.actividades[0].coleccion);
        }
      }
    } catch (error) {
      console.error('Error cargando actividades:', error);
      setError('Error al cargar las actividades');
      
      // Si hay error de autenticación, cerrar sesión
      if (error.message.includes('token') || error.message.includes('auth')) {
        onLogout();
      }
    } finally {
      setLoading(prev => ({ ...prev, actividades: false }));
    }
  };

  const cargarInscripciones = async (coleccion) => {
    if (!coleccion) return;

    try {
      setLoading(prev => ({ ...prev, inscripciones: true, stats: true }));
      setError('');

      const [inscripcionesData, statsData] = await Promise.all([
        apiClient.getInscripciones(coleccion),
        apiClient.getStats(coleccion)
      ]);

      if (inscripcionesData.success) {
        setInscripciones(inscripcionesData.inscripciones || []);
      } else {
        setError(inscripcionesData.message || 'Error cargando inscripciones');
      }

      if (statsData.estadisticas) {
        setStats(statsData.estadisticas);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(`Error al cargar los datos: ${error.message}`);
      
      // Si hay error de autenticación, cerrar sesión
      if (error.message.includes('token') || error.message.includes('auth')) {
        onLogout();
      }
    } finally {
      setLoading(prev => ({ ...prev, inscripciones: false, stats: false }));
    }
  };

  const handleEventChange = (coleccion) => {
    setSelectedEvent(coleccion);
    if (coleccion) {
      cargarInscripciones(coleccion);
    } else {
      setInscripciones([]);
      setStats(null);
    }
  };

  const handleMarcarAsistencia = async (id, coleccion, asistencia) => {
    if (!window.confirm(`¿Estás seguro de que quieres ${asistencia ? 'marcar' : 'desmarcar'} la asistencia?`)) {
      return;
    }

    try {
      const result = await apiClient.marcarAsistencia(id, coleccion, asistencia);
      
      if (result.success) {
        alert(`✅ Asistencia ${asistencia ? 'marcada' : 'desmarcada'} correctamente`);
        // Recargar los datos
        cargarInscripciones(coleccion);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      alert(`❌ Error: ${error.message}`);
      
      // Si hay error de autenticación, cerrar sesión
      if (error.message.includes('token') || error.message.includes('auth')) {
        onLogout();
      }
    }
  };

  // handleScannerClick ahora se pasa como prop desde App.js

  useEffect(() => {
    if (selectedEvent) {
      cargarInscripciones(selectedEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  return (
    <div className="dashboard-container">
      <Header 
        userName={userName}
        onScannerClick={onScannerClick}
        onLogout={onLogout}
      />

      <div className="dashboard-header">
        <EventSelector
          actividades={actividades}
          selectedEvent={selectedEvent}
          onEventChange={handleEventChange}
          loading={loading.actividades}
        />
      </div>

      {error && (
        <div className="error-message">
          <div className="icon">❌</div>
          <p>{error}</p>
        </div>
      )}

      <main className="dashboard-main">
        <section className="inscripciones-container">
          <h2 className="section-title">👥 Inscripciones</h2>
          <InscripcionesTable
            inscripciones={inscripciones}
            coleccion={selectedEvent}
            onMarcarAsistencia={handleMarcarAsistencia}
            loading={loading.inscripciones}
          />
        </section>

        <aside className="stats-container">
          <h2 className="section-title">📈 Estadísticas</h2>
          <StatsCards 
            stats={stats} 
            loading={loading.stats}
          />
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;

