import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CheckCircle, 
  XCircle,
  FileText,
  Clock,
  Edit2,
  Save
} from 'lucide-react';
import '../styles/ParticipantModal.css';

const ParticipantModal = ({ participant, onClose, onUpdate, onMarkAttendance }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    notas: ''
  });

  useEffect(() => {
    if (participant) {
      setEditedData({
        nombre: participant.nombre || '',
        email: participant.email || '',
        telefono: participant.telefono || '',
        notas: participant.notas || ''
      });
    }
  }, [participant]);

  if (!participant) return null;

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate(participant.id, editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData({
      nombre: participant.nombre || '',
      email: participant.email || '',
      telefono: participant.telefono || '',
      notas: participant.notas || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <User size={24} />
            <h2>Perfil del Participante</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Estado de Asistencia */}
          <div className="attendance-status-card">
            <div className={`attendance-badge ${participant.asistencia ? 'attended' : 'not-attended'}`}>
              {participant.asistencia ? (
                <>
                  <CheckCircle size={20} />
                  <span>Asistió al Evento</span>
                </>
              ) : (
                <>
                  <XCircle size={20} />
                  <span>No Asistió</span>
                </>
              )}
            </div>
            <button 
              className={`toggle-attendance-btn ${participant.asistencia ? 'unmark' : 'mark'}`}
              onClick={() => onMarkAttendance(participant.id, !participant.asistencia)}
            >
              {participant.asistencia ? 'Desmarcar Asistencia' : 'Marcar Asistencia'}
            </button>
          </div>

          {/* Información Personal */}
          <div className="info-section">
            <div className="section-header">
              <h3>Información Personal</h3>
              {!isEditing ? (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} />
                  Editar
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSave}>
                    <Save size={16} />
                    Guardar
                  </button>
                  <button className="cancel-btn" onClick={handleCancel}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">
                  <User size={16} />
                  <span>Nombre</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    className="info-input"
                    value={editedData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                  />
                ) : (
                  <div className="info-value">{participant.nombre || 'No disponible'}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Mail size={16} />
                  <span>Email</span>
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    className="info-input"
                    value={editedData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <div className="info-value">{participant.email || 'No disponible'}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Phone size={16} />
                  <span>Teléfono</span>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    className="info-input"
                    value={editedData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                  />
                ) : (
                  <div className="info-value">{participant.telefono || 'No disponible'}</div>
                )}
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Calendar size={16} />
                  <span>Fecha de Inscripción</span>
                </div>
                <div className="info-value">{formatDate(participant.fecha_inscripcion)}</div>
              </div>

              <div className="info-item">
                <div className="info-label">
                  <Clock size={16} />
                  <span>Estado</span>
                </div>
                <div className="info-value">
                  <span className={`status-badge ${participant.estado?.toLowerCase()}`}>
                    {participant.estado || 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="info-section">
            <div className="section-header">
              <h3>
                <FileText size={18} />
                Notas
              </h3>
            </div>
            {isEditing ? (
              <textarea
                className="notes-textarea"
                placeholder="Agrega notas sobre este participante..."
                value={editedData.notas}
                onChange={(e) => handleInputChange('notas', e.target.value)}
                rows={4}
              />
            ) : (
              <div className="notes-content">
                {participant.notas || 'No hay notas disponibles'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantModal;