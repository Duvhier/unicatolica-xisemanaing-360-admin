import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const InscripcionesTable = ({ inscripciones, coleccion, onMarcarAsistencia, loading }) => {
  if (loading) {
    return <LoadingSpinner message="Cargando inscripciones..." />;
  }

  if (!inscripciones || inscripciones.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">📝</div>
        <p>No hay inscripciones registradas en este evento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Correo</th>
              <th>Programa</th>
              <th>Asistencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inscripciones.map(insc => (
              <tr key={insc._id}>
                <td><strong>{insc.nombre || 'N/A'}</strong></td>
                <td>{insc.cedula || 'N/A'}</td>
                <td>{insc.correo || 'N/A'}</td>
                <td>{insc.programa || 'N/A'}</td>
                <td>
                  <span className={`badge ${insc.asistencia ? 'badge-success' : 'badge-danger'}`}>
                    {insc.asistencia ? '✅ Presente' : '❌ Ausente'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => onMarcarAsistencia(insc._id, coleccion, !insc.asistencia)}
                    className={`btn btn-sm ${insc.asistencia ? 'btn-secondary' : 'btn-success'}`}
                  >
                    {insc.asistencia ? '❌ Desmarcar' : '✅ Marcar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '16px', color: '#718096', fontSize: '14px', fontWeight: '500' }}>
        Total: <strong>{inscripciones.length}</strong> inscripciones
      </div>
    </>
  );
};

export default InscripcionesTable;

