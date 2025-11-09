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
  // Función para formatear nombres en formato oración
  const formatNombre = (nombre) => {
    if (!nombre || typeof nombre !== 'string') return '-';
    
    // Convertir a minúsculas primero
    let formatted = nombre.toLowerCase().trim();
    
    // Capitalizar la primera letra de cada palabra
    formatted = formatted.replace(/\b\w/g, char => char.toUpperCase());
    
    // Manejar casos especiales como "Mc", "Mac", etc.
    formatted = formatted.replace(/\b(Mc|Mac|O'|De La|Del|Los|Las|El|La)\b/gi, 
      match => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase());
    
    // Limpiar espacios múltiples
    formatted = formatted.replace(/\s+/g, ' ');
    
    return formatted;
  };

  // Función para formatear el programa
  const formatPrograma = (programa) => {
    if (!programa) return '-';
    
    const programas = {
      'tecnologia-desarrollo-software': 'Tecnología en Desarrollo de Software',
      'ingenieria-sistemas': 'Ingeniería de Sistemas',
      'ingenieria-software': 'Ingeniería de Software',
      'administracion-empresas': 'Administración de Empresas',
      'tecnologia-gestion-redes': 'Tecnología en Gestión de Redes',
      'ingenieria-electronica': 'Ingeniería Electrónica',
      'ingenieria-mecatronica': 'Ingeniería Mecatrónica'
      // Agrega más mapeos según necesites
    };
    
    return programas[programa] || programa.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  // Función para formatear la facultad
  const formatFacultad = (facultad) => {
    if (!facultad) return '-';
    
    const facultades = {
      'ingenieria': 'Ingeniería',
      'ciencias-sociales': 'Ciencias Sociales',
      'ciencias-salud': 'Ciencias de la Salud',
      'educacion': 'Educación',
      'ciencias-administrativas': 'Ciencias Administrativas',
      'derecho': 'Derecho'
      // Agrega más mapeos según necesites
    };
    
    return facultades[facultad] || facultad.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  // Función para formatear el tipo de evento
  const formatTipoEvento = (tipoEvento) => {
    if (!tipoEvento) return '-';
    
    const tipos = {
      'ponencias-investigacion': 'Ponencias de Investigación',
      'talleres-practicos': 'Talleres Prácticos',
      'conferencias': 'Conferencias',
      'paneles': 'Paneles',
      'exposiciones': 'Exposiciones',
      'certificacion': 'Certificación'
      // Agrega más mapeos según necesites
    };
    
    return tipos[tipoEvento] || tipoEvento.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  };

  // Función para obtener y formatear el ID del estudiante (sin ceros a la izquierda)
  const getIdEstudiante = (inscripcion) => {
    // Busca en este orden:
    // 1. idEstudiante (campo directo)
    // 2. qr_data.participante.idEstudiante
    // 3. id (campo directo antiguo)
    const idEstudiante = inscripcion.idEstudiante || 
                        inscripcion.qr_data?.participante?.idEstudiante || 
                        inscripcion.id;
    
    if (!idEstudiante) return '-';
    
    // Eliminar ceros a la izquierda
    const idFormateado = idEstudiante.replace(/^0+/, '');
    
    // Si después de quitar los ceros queda vacío, mostrar el original
    return idFormateado || idEstudiante;
  };

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
      const allIds = inscripciones.map(i => i._id || i.id);
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

  // Determinar qué columnas mostrar basado en los datos disponibles
  const hasCedula = inscripciones.some(i => i.cedula);
  const hasIdEstudiante = inscripciones.some(i => 
    i.idEstudiante || i.qr_data?.participante?.idEstudiante || i.id
  );
  const hasFacultad = inscripciones.some(i => i.facultad);
  const hasPrograma = inscripciones.some(i => i.programa);
  const hasSemestre = inscripciones.some(i => i.semestre);
  const hasTipoEstudiante = inscripciones.some(i => i.tipoEstudiante);
  const hasEvento = inscripciones.some(i => i.evento);
  const hasTipoEvento = inscripciones.some(i => i.tipo_evento);
  const hasHorario = inscripciones.some(i => i.horario);
  const hasLugar = inscripciones.some(i => i.lugar);

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
            {hasCedula && <th>Cédula</th>}
            <th>Email</th>
            <th>Teléfono</th>
            {hasIdEstudiante && <th>ID Estudiante</th>}
            {hasTipoEstudiante && <th>Tipo Estudiante</th>}
            {hasFacultad && <th>Facultad</th>}
            {hasPrograma && <th>Programa</th>}
            {hasSemestre && <th>Semestre</th>}
            {hasEvento && <th>Evento</th>}
            {hasTipoEvento && <th>Tipo Evento</th>}
            {hasHorario && <th>Horario</th>}
            {hasLugar && <th>Lugar</th>}
            <th>Fecha Inscripción</th>
            <th>Asistencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inscripciones.map((inscripcion) => (
            <tr 
              key={inscripcion._id || inscripcion.id}
              className={selectedIds.includes(inscripcion._id || inscripcion.id) ? 'selected' : ''}
            >
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(inscripcion._id || inscripcion.id)}
                  onChange={() => handleSelectOne(inscripcion._id || inscripcion.id)}
                  className="table-checkbox"
                />
              </td>
              <td className="nombre-cell">{formatNombre(inscripcion.nombre)}</td>
              {hasCedula && <td className="cedula-cell">{inscripcion.cedula || '-'}</td>}
              <td className="email-cell">{inscripcion.correo || inscripcion.email || '-'}</td>
              <td>{inscripcion.telefono || '-'}</td>
              {hasIdEstudiante && (
                <td className="id-estudiante-cell">
                  {getIdEstudiante(inscripcion)}
                </td>
              )}
              {hasTipoEstudiante && (
                <td>
                  <span className={`badge ${inscripcion.tipoEstudiante === 'ponente' ? 'badge-ponente' : 'badge-asistente'}`}>
                    {inscripcion.tipoEstudiante === 'ponente' ? 'Ponente' : 
                     inscripcion.tipoEstudiante === 'asistente' ? 'Asistente' : 
                     inscripcion.tipoEstudiante || '-'}
                  </span>
                </td>
              )}
              {hasFacultad && <td>{formatFacultad(inscripcion.facultad)}</td>}
              {hasPrograma && <td>{formatPrograma(inscripcion.programa)}</td>}
              {hasSemestre && <td className="semestre-cell">{inscripcion.semestre || '-'}</td>}
              {hasEvento && <td className="evento-cell">{inscripcion.evento || '-'}</td>}
              {hasTipoEvento && <td className="tipo-evento-cell">{formatTipoEvento(inscripcion.tipo_evento)}</td>}
              {hasHorario && <td className="horario-cell">{inscripcion.horario || '-'}</td>}
              {hasLugar && <td className="lugar-cell">{inscripcion.lugar || '-'}</td>}
              <td className="date-cell">{formatDate(inscripcion.created_at || inscripcion.fecha_inscripcion)}</td>
              <td>
                <span 
                  className={`asistencia-badge ${
                    inscripcion.asistencia === true ? 'asistio' : 
                    inscripcion.asistencia === false ? 'no-asistio' : 'sin-confirmar'
                  }`}
                >
                  {inscripcion.asistencia === true ? (
                    <>
                      <CheckCircle size={14} />
                      Sí
                    </>
                  ) : inscripcion.asistencia === false ? (
                    <>
                      <XCircle size={14} />
                      No
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      Sin confirmar
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
                    className={`toggle-btn ${
                      inscripcion.asistencia === true ? 'unmark' : 'mark'
                    }`}
                    onClick={() => onMarcarAsistencia(
                      inscripcion._id || inscripcion.id,
                      coleccion,
                      inscripcion.asistencia !== true // Si no está confirmado o es false, marcar como true
                    )}
                    title={
                      inscripcion.asistencia === true ? 'Desmarcar asistencia' : 'Marcar como asistió'
                    }
                  >
                    {inscripcion.asistencia === true ? <XCircle size={16} /> : <CheckCircle size={16} />}
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