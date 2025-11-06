import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Calendar,
  Users,
  MapPin,
  Clock,
  X,
  Save
} from 'lucide-react';
import '../styles/EventManager.css';

const EventManager = ({ actividades, onRefresh, onClose }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora: '',
    lugar: '',
    cupo_maximo: '',
    estado: 'activo'
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: '',
      hora: '',
      lugar: '',
      cupo_maximo: '',
      estado: 'activo'
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    try {
      // Aquí llamarías a tu API para crear el evento
      // const result = await apiClient.createEvento(formData);
      
      if (window.showNotification) {
        window.showNotification('✅ Evento creado exitosamente', 'success');
      }
      
      resetForm();
      onRefresh();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`❌ Error: ${error.message}`, 'error');
      }
    }
  };

  const handleEdit = (actividad) => {
    setEditingId(actividad.coleccion);
    setFormData({
      nombre: actividad.nombre || '',
      descripcion: actividad.descripcion || '',
      fecha: actividad.fecha || '',
      hora: actividad.hora || '',
      lugar: actividad.lugar || '',
      cupo_maximo: actividad.cupo_maximo || '',
      estado: actividad.estado || 'activo'
    });
    setIsCreating(true);
  };

  const handleUpdate = async () => {
    try {
      // const result = await apiClient.updateEvento(editingId, formData);
      
      if (window.showNotification) {
        window.showNotification('✅ Evento actualizado exitosamente', 'success');
      }
      
      resetForm();
      onRefresh();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`❌ Error: ${error.message}`, 'error');
      }
    }
  };

  const handleDuplicate = async (actividad) => {
    try {
      // ✅ CORREGIDO: Eliminada la variable newData no utilizada
      // const newData = {
      //   ...actividad,
      //   nombre: `${actividad.nombre} (Copia)`,
      //   coleccion: `${actividad.coleccion}_copy_${Date.now()}`
      // };
      
      // await apiClient.createEvento(newData);
      
      if (window.showNotification) {
        window.showNotification('✅ Evento duplicado exitosamente', 'success');
      }
      
      onRefresh();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`❌ Error: ${error.message}`, 'error');
      }
    }
  };

  const handleDelete = async (coleccion, nombre) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      // await apiClient.deleteEvento(coleccion);
      
      if (window.showNotification) {
        window.showNotification('✅ Evento eliminado exitosamente', 'success');
      }
      
      onRefresh();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`❌ Error: ${error.message}`, 'error');
      }
    }
  };

  const handleToggleStatus = async (coleccion, currentStatus) => {
    try {
      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
      // await apiClient.updateEvento(coleccion, { estado: newStatus });
      
      if (window.showNotification) {
        window.showNotification(`✅ Evento ${newStatus === 'activo' ? 'activado' : 'desactivado'}`, 'success');
      }
      
      onRefresh();
    } catch (error) {
      if (window.showNotification) {
        window.showNotification(`❌ Error: ${error.message}`, 'error');
      }
    }
  };

  return (
    <div className="event-manager-overlay" onClick={onClose}>
      <div className="event-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-manager-header">
          <h2>
            <Calendar size={24} />
            Gestión de Eventos
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="event-manager-body">
          {!isCreating ? (
            <>
              <div className="events-header">
                <button 
                  className="create-event-btn"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus size={18} />
                  Crear Nuevo Evento
                </button>
              </div>

              <div className="events-list">
                {actividades.map(actividad => (
                  <div 
                    key={actividad.coleccion} 
                    className={`event-card ${actividad.estado === 'inactivo' ? 'inactive' : ''}`}
                  >
                    <div className="event-card-header">
                      <h3>{actividad.nombre}</h3>
                      <span className={`status-badge ${actividad.estado}`}>
                        {actividad.estado || 'activo'}
                      </span>
                    </div>

                    <div className="event-card-body">
                      {actividad.descripcion && (
                        <p className="event-description">{actividad.descripcion}</p>
                      )}
                      
                      <div className="event-meta">
                        {actividad.fecha && (
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>{actividad.fecha}</span>
                          </div>
                        )}
                        {actividad.hora && (
                          <div className="meta-item">
                            <Clock size={14} />
                            <span>{actividad.hora}</span>
                          </div>
                        )}
                        {actividad.lugar && (
                          <div className="meta-item">
                            <MapPin size={14} />
                            <span>{actividad.lugar}</span>
                          </div>
                        )}
                        {actividad.cupo_maximo && (
                          <div className="meta-item">
                            <Users size={14} />
                            <span>Cupo: {actividad.cupo_maximo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="event-card-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEdit(actividad)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="action-btn duplicate"
                        onClick={() => handleDuplicate(actividad)}
                        title="Duplicar"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        className="action-btn toggle"
                        onClick={() => handleToggleStatus(actividad.coleccion, actividad.estado)}
                        title={actividad.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      >
                        {actividad.estado === 'activo' ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(actividad.coleccion, actividad.nombre)}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="event-form">
              <h3>{editingId ? 'Editar Evento' : 'Crear Nuevo Evento'}</h3>
              
              <div className="form-grid">
                <div className="form-group full">
                  <label>Nombre del Evento *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Ej: Conferencia de Tecnología 2024"
                    required
                  />
                </div>

                <div className="form-group full">
                  <label>Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Describe el evento..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Hora</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => handleInputChange('hora', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Lugar</label>
                  <input
                    type="text"
                    value={formData.lugar}
                    onChange={(e) => handleInputChange('lugar', e.target.value)}
                    placeholder="Ej: Auditorio Principal"
                  />
                </div>

                <div className="form-group">
                  <label>Cupo Máximo</label>
                  <input
                    type="number"
                    value={formData.cupo_maximo}
                    onChange={(e) => handleInputChange('cupo_maximo', e.target.value)}
                    placeholder="100"
                    min="1"
                  />
                </div>

                <div className="form-group full">
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn-cancel"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-save"
                  onClick={editingId ? handleUpdate : handleCreate}
                >
                  <Save size={18} />
                  {editingId ? 'Actualizar' : 'Crear'} Evento
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventManager;