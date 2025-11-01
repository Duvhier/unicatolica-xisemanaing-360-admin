import React from 'react';

const UserInfoCard = ({ userInfo, onConfirmAsistencia, onCancel, loading }) => {
  if (!userInfo) return null;

  return (
    <div className="user-info-container">
      <h3>👤 Información del Usuario</h3>
      <div className="user-details">
        <div className="user-detail">
          <strong>Nombre</strong>
          <span>{userInfo.nombre || 'N/A'}</span>
        </div>
        <div className="user-detail">
          <strong>Cédula</strong>
          <span>{userInfo.cedula || 'N/A'}</span>
        </div>
        <div className="user-detail">
          <strong>Correo</strong>
          <span>{userInfo.correo || 'N/A'}</span>
        </div>
        <div className="user-detail">
          <strong>Programa</strong>
          <span>{userInfo.programa || 'N/A'}</span>
        </div>
        <div className="user-detail">
          <strong>Estado</strong>
          <span className={`badge ${userInfo.asistencia ? 'badge-success' : 'badge-danger'}`}>
            {userInfo.asistencia ? '✅ Presente' : '❌ Ausente'}
          </span>
        </div>
      </div>
      <div className="action-buttons">
        <button 
          onClick={onConfirmAsistencia}
          className="btn btn-success"
          disabled={loading || userInfo.asistencia}
        >
          {loading ? (
            <>
              <div className="loading-spinner"></div>
              Procesando...
            </>
          ) : userInfo.asistencia ? (
            '✅ Ya confirmada'
          ) : (
            '✅ Confirmar Asistencia'
          )}
        </button>
        <button 
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  );
};

export default UserInfoCard;

