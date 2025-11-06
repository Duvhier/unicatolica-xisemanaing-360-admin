import React from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import '../styles/InscripcionesTable.css';

const InscripcionesTable = ({ 
  inscripciones, 
  coleccion, 
  onMarcarAsistencia, 
  loading,
  selectedIds = [],
  onSelectChange,
  onViewDetails
}) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <p>Cargando inscripciones...</p>
      </div>
    );
  }

  if (!inscripciones || inscripciones.length === 0) {
    return (
      <div className="table-empty">
        <p>No hay inscripciones para mostrar</p>
      </div>
    );
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = inscripciones.map(i => i.id);
      onSelectChange(allIds);
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const isAllSelected = inscripciones.length > 0 && 
    selectedIds.length === inscripciones.length;

  const isSomeSelected = selectedIds.length > 0 && 
    selectedIds.length < inscripciones.length;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="table-wrapper">
      <table className="inscripciones-table">
        <thead>
          <tr>
            <th className="checkbox-cell">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={input => {
                  if (input) input.indeterminate = isSomeSelected;
                }}
                onChange={handleSelectAll}
                className="table-checkbox"
              />
            </th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Fecha Inscripción</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inscripciones.map((inscripcion) => (
            <tr 
              key={inscripcion.id}
              className={selectedIds.includes(inscripcion.id) ? 'selected' : ''}
            >
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(inscripcion.id)}
                  onChange={() => handleSelectOne(inscripcion.id)}
                  className="table-checkbox"
                />
              </td>
              <td className="nombre-cell">{inscripcion.nombre || '-'}</td>
              <td className="email-cell">{inscripcion.email || '-'}</td>
              <td>{inscripcion.telefono || '-'}</td>
              <td className="date-cell">{formatDate(inscripcion.fecha_inscripcion)}</td>
              <td>
                <span 
                  className={`asistencia-badge ${inscripcion.asistencia ? 'asistio' : 'no-asistio'}`}
                >
                  {inscripcion.asistencia ? (
                    <>
                      <CheckCircle size={14} />
                      Sí
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      No
                    </>
                  )}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="view-btn"
                    onClick={() => onViewDetails(inscripcion)}
                    title="Ver detalles"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className={`toggle-btn ${inscripcion.asistencia ? 'unmark' : 'mark'}`}
                    onClick={() => onMarcarAsistencia(
                      inscripcion.id,
                      coleccion,
                      !inscripcion.asistencia
                    )}
                    title={inscripcion.asistencia ? 'Desmarcar' : 'Marcar'}
                  >
                    {inscripcion.asistencia ? <XCircle size={16} /> : <CheckCircle size={16} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InscripcionesTable;