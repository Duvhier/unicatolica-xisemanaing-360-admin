import React from 'react';
import { 
  User, 
  IdCard, 
  Mail, 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  X,
  Loader2,
  UserCheck,
  Calendar
} from 'lucide-react';

const UserInfoCard = ({ userInfo, onConfirmAsistencia, onCancel, loading }) => {
  if (!userInfo) return null;

  return (
    <div className="user-info-modal">
      <div className="user-info-container">
        {/* Header */}
        <div className="user-info-header">
          <div className="user-info-title">
            <User size={24} />
            <h3>Información del Participante</h3>
          </div>
          <button 
            onClick={onCancel}
            className="btn-close"
            disabled={loading}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Detalles del usuario */}
        <div className="user-details-grid">
          <div className="user-detail-item">
            <div className="user-detail-icon">
              <User size={18} />
            </div>
            <div className="user-detail-content">
              <label>Nombre completo</label>
              <span className="user-detail-value">{userInfo.nombre || 'No disponible'}</span>
            </div>
          </div>

          <div className="user-detail-item">
            <div className="user-detail-icon">
              <IdCard size={18} />
            </div>
            <div className="user-detail-content">
              <label>Número de cédula</label>
              <span className="user-detail-value cedula">{userInfo.cedula || 'No disponible'}</span>
            </div>
          </div>

          <div className="user-detail-item">
            <div className="user-detail-icon">
              <Mail size={18} />
            </div>
            <div className="user-detail-content">
              <label>Correo electrónico</label>
              <span className="user-detail-value email">{userInfo.correo || 'No disponible'}</span>
            </div>
          </div>

          <div className="user-detail-item">
            <div className="user-detail-icon">
              <GraduationCap size={18} />
            </div>
            <div className="user-detail-content">
              <label>Programa académico</label>
              <span className="user-detail-value program">{userInfo.programa || 'No disponible'}</span>
            </div>
          </div>

          <div className="user-detail-item">
            <div className="user-detail-icon">
              <Calendar size={18} />
            </div>
            <div className="user-detail-content">
              <label>Estado de asistencia</label>
              <span className={`status-badge ${userInfo.asistencia ? 'status-present' : 'status-absent'}`}>
                {userInfo.asistencia ? (
                  <>
                    <CheckCircle size={14} />
                    Asistencia confirmada
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    Pendiente por confirmar
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="user-info-actions">
          <button 
            onClick={onConfirmAsistencia}
            className={`btn btn-confirm ${userInfo.asistencia ? 'confirmed' : ''}`}
            disabled={loading || userInfo.asistencia}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="loading-spinner-icon" />
                Procesando...
              </>
            ) : userInfo.asistencia ? (
              <>
                <CheckCircle size={18} />
                Asistencia ya confirmada
              </>
            ) : (
              <>
                <UserCheck size={18} />
                Confirmar asistencia
              </>
            )}
          </button>
          
          <button 
            onClick={onCancel}
            className="btn btn-cancel"
            disabled={loading}
          >
            <X size={18} />
            Cancelar
          </button>
        </div>

        {/* Timestamp de última actualización */}
        {userInfo.ultimaActualizacion && (
          <div className="user-info-footer">
            <span className="timestamp">
              Última actualización: {new Date(userInfo.ultimaActualizacion).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfoCard;