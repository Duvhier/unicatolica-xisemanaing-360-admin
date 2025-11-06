import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../services/api';
import Header from './Header';
import EventSelector from './EventSelector';
import InscripcionesTable from './InscripcionesTable';
import StatsCards from './StatsCards';
import ExportButton from './ExportButton';
import SearchFilter from './SearchFilter';
import AttendanceChart from './AttendanceChart';
import BulkActions from './BulkActions';
import ParticipantModal from './ParticipantModal';
import ThemeToggle from './ThemeToggle';
import NotificationSystem, { useNotification } from './NotificationSystem';
import TrendChart from './TrendChart';
import EventManager from './EventManager';
import PDFExport from './PDFExport';
import '../styles/Dashboard.css';
import { Users, TrendingUp, Settings } from 'lucide-react';

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
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    asistencia: 'todos'
  });

  // Estados para selección múltiple
  const [selectedIds, setSelectedIds] = useState([]);

  // Estado para el modal de detalles
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // Estado para gestión de eventos
  const [showEventManager, setShowEventManager] = useState(false);

  // Hook de notificaciones
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

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
      showError('Error al cargar las actividades');

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
      setSelectedIds([]);

      const [inscripcionesData, statsData] = await Promise.all([
        apiClient.getInscripciones(coleccion),
        apiClient.getStats(coleccion)
      ]);

      if (inscripcionesData.success) {
        setInscripciones(inscripcionesData.inscripciones || []);
      } else {
        setError(inscripcionesData.message || 'Error cargando inscripciones');
        showError(inscripcionesData.message || 'Error cargando inscripciones');
      }

      if (statsData.estadisticas) {
        setStats(statsData.estadisticas);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError(`Error al cargar los datos: ${error.message}`);
      showError(`Error al cargar los datos: ${error.message}`);

      if (error.message.includes('token') || error.message.includes('auth')) {
        onLogout();
      }
    } finally {
      setLoading(prev => ({ ...prev, inscripciones: false, stats: false }));
    }
  };

  const handleEventChange = (coleccion) => {
    setSelectedEvent(coleccion);
    setSearchTerm('');
    setFilters({ asistencia: 'todos' });
    setSelectedIds([]);
    
    if (coleccion) {
      cargarInscripciones(coleccion);
    } else {
      setInscripciones([]);
      setStats(null);
    }
  };

  const handleMarcarAsistencia = async (id, coleccion, asistencia) => {
    try {
      const result = await apiClient.marcarAsistencia(id, coleccion, asistencia);

      if (result.success) {
        showSuccess(`Asistencia ${asistencia ? 'marcada' : 'desmarcada'} correctamente`);
        cargarInscripciones(coleccion);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error actualizando asistencia:', error);
      showError(`Error: ${error.message}`);

      if (error.message.includes('token') || error.message.includes('auth')) {
        onLogout();
      }
    }
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSelectChange = (ids) => {
    setSelectedIds(ids);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Acciones masivas
  const handleBulkMarkAttendance = async () => {
    try {
      const promises = selectedIds.map(id => 
        apiClient.marcarAsistencia(id, selectedEvent, true)
      );
      
      await Promise.all(promises);
      showSuccess(`Asistencia marcada para ${selectedIds.length} personas`);
      setSelectedIds([]);
      cargarInscripciones(selectedEvent);
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  };

  const handleBulkUnmarkAttendance = async () => {
    try {
      const promises = selectedIds.map(id => 
        apiClient.marcarAsistencia(id, selectedEvent, false)
      );
      
      await Promise.all(promises);
      showSuccess(`Asistencia desmarcada para ${selectedIds.length} personas`);
      setSelectedIds([]);
      cargarInscripciones(selectedEvent);
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  };

  const handleBulkSendEmail = () => {
    const selectedEmails = inscripciones
      .filter(i => selectedIds.includes(i.id))
      .map(i => i.email)
      .filter(Boolean);

    if (selectedEmails.length === 0) {
      showWarning('No hay emails disponibles para los participantes seleccionados');
      return;
    }

    showInfo(`Funcionalidad de envío de emails en desarrollo.\n\nEmails seleccionados: ${selectedEmails.length}`);
  };

  const handleBulkDelete = async () => {
    showWarning('Funcionalidad de eliminación en desarrollo.\n\nPor seguridad, esta función requiere permisos especiales.');
  };

  const handleViewDetails = (participant) => {
    setSelectedParticipant(participant);
  };

  const handleCloseModal = () => {
    setSelectedParticipant(null);
  };

  const handleUpdateParticipant = async (id, data) => {
    try {
      showSuccess('Datos actualizados correctamente');
      cargarInscripciones(selectedEvent);
      setSelectedParticipant(null);
    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  };

  const handleModalMarkAttendance = async (id, asistencia) => {
    await handleMarcarAsistencia(id, selectedEvent, asistencia);
    setSelectedParticipant(null);
  };

  const inscripcionesFiltradas = useMemo(() => {
    let resultado = [...inscripciones];

    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      resultado = resultado.filter(inscripcion => {
        const nombre = (inscripcion.nombre || '').toLowerCase();
        const email = (inscripcion.email || '').toLowerCase();
        const telefono = (inscripcion.telefono || '').toLowerCase();
        
        return nombre.includes(termLower) || 
               email.includes(termLower) || 
               telefono.includes(termLower);
      });
    }

    if (filters.asistencia !== 'todos') {
      resultado = resultado.filter(inscripcion => {
        if (filters.asistencia === 'asistio') {
          return inscripcion.asistencia === true;
        } else if (filters.asistencia === 'no_asistio') {
          return inscripcion.asistencia === false || !inscripcion.asistencia;
        }
        return true;
      });
    }

    return resultado;
  }, [inscripciones, searchTerm, filters]);

  useEffect(() => {
    if (selectedEvent) {
      cargarInscripciones(selectedEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const nombreEventoSeleccionado = useMemo(() => {
    const evento = actividades.find(a => a.coleccion === selectedEvent);
    return evento ? evento.nombre : 'evento';
  }, [actividades, selectedEvent]);

  return (
    <div className="dashboard-container">
      <NotificationSystem />
      
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
        
        <div className="header-actions">
          <button 
            className="manage-events-btn"
            onClick={() => setShowEventManager(true)}
            title="Gestionar eventos"
          >
            <Settings size={18} />
            <span>Gestionar Eventos</span>
          </button>
          <ThemeToggle />
          <PDFExport
            inscripciones={inscripcionesFiltradas}
            nombreEvento={nombreEventoSeleccionado}
            stats={stats}
            disabled={loading.inscripciones || inscripcionesFiltradas.length === 0}
          />
          <ExportButton 
            inscripciones={inscripcionesFiltradas}
            nombreEvento={nombreEventoSeleccionado}
            disabled={loading.inscripciones || inscripcionesFiltradas.length === 0}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="icon">❌</div>
          <p>{error}</p>
        </div>
      )}

      <main className="dashboard-main">
        <section className="inscripciones-container">
          <h2 className="section-title">
            <Users size={20} />
            Inscripciones
          </h2>
          
          <BulkActions
            selectedCount={selectedIds.length}
            onMarkAttendance={handleBulkMarkAttendance}
            onUnmarkAttendance={handleBulkUnmarkAttendance}
            onSendEmail={handleBulkSendEmail}
            onDelete={handleBulkDelete}
            onClearSelection={handleClearSelection}
          />
          
          <SearchFilter
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            totalResults={inscripcionesFiltradas.length}
          />
          
          <InscripcionesTable
            inscripciones={inscripcionesFiltradas}
            coleccion={selectedEvent}
            onMarcarAsistencia={handleMarcarAsistencia}
            loading={loading.inscripciones}
            selectedIds={selectedIds}
            onSelectChange={handleSelectChange}
            onViewDetails={handleViewDetails}
          />
        </section>

        <aside className="stats-container">
          <h2 className="section-title">
            <TrendingUp size={20} />
            Estadísticas
          </h2>
          
          <TrendChart
            inscripciones={inscripciones}
            loading={loading.inscripciones}
          />
          
          <AttendanceChart
            stats={stats}
            loading={loading.stats}
          />
          
          <StatsCards
            stats={stats}
            loading={loading.stats}
          />
        </aside>
      </main>

      {selectedParticipant && (
        <ParticipantModal
          participant={selectedParticipant}
          onClose={handleCloseModal}
          onUpdate={handleUpdateParticipant}
          onMarkAttendance={handleModalMarkAttendance}
        />
      )}

      {showEventManager && (
        <EventManager
          actividades={actividades}
          onRefresh={cargarActividades}
          onClose={() => setShowEventManager(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;