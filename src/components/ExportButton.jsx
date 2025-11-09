import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/ExportButton.css';

const ExportButton = ({ inscripciones, nombreEvento, disabled }) => {
  // Función para obtener valores anidados de objetos
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      // Manejar arrays como grupo.integrantes[0]
      const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const arrayName = arrayMatch[1];
        const index = parseInt(arrayMatch[2]);
        return current && current[arrayName] && current[arrayName][index] ? current[arrayName][index] : '';
      }
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  };

  const exportToExcel = () => {
    if (!inscripciones || inscripciones.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar los datos para exportar con todos los campos solicitados
    const dataToExport = inscripciones.map((inscripcion, index) => ({
      'No.': index + 1,
      '_id': inscripcion._id || '',
      'Nombre': inscripcion.nombre || '',
      'Cédula': inscripcion.cedula || '',
      'Correo': inscripcion.correo || '',
      'Teléfono': inscripcion.telefono || '',
      'Rol': inscripcion.rol || '',
      'ID': inscripcion.id || '',
      'Tipo Estudiante': inscripcion.tipoEstudiante || '',
      'Facultad': inscripcion.facultad || '',
      'Programa': inscripcion.programa || '',
      'Semestre': inscripcion.semestre || '',
      'Tipo Evento': inscripcion.tipo_evento || '',
      'Horario': inscripcion.horario || '',
      'Lugar': inscripcion.lugar || '',
      'Ponente 1': getNestedValue(inscripcion, 'ponentes[0]'),
      'Ponente 2': getNestedValue(inscripcion, 'ponentes[1]'),
      'Integrante 1': getNestedValue(inscripcion, 'grupo.integrantes[0]'),
      'Integrante 2': getNestedValue(inscripcion, 'grupo.integrantes[1]'),
      'Integrante 3': getNestedValue(inscripcion, 'grupo.integrantes[2]'),
      'Integrante 4': getNestedValue(inscripcion, 'grupo.integrantes[3]'),
      'Nombre Proyecto': getNestedValue(inscripcion, 'grupo.proyecto.nombre'),
      'Descripción Proyecto': getNestedValue(inscripcion, 'grupo.proyecto.descripcion'),
      'Categoría Proyecto': getNestedValue(inscripcion, 'grupo.proyecto.categoria'),
      'Institución': getNestedValue(inscripcion, 'grupo.institucion'),
      'Correo Grupo': getNestedValue(inscripcion, 'grupo.correo'),
      'Teléfono Grupo': getNestedValue(inscripcion, 'grupo.telefono'),
      'Área': inscripcion.area || '',
      'Cargo': inscripcion.cargo || '',
      'Fecha Creación': inscripcion.created_at 
        ? new Date(inscripcion.created_at).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '',
      'Fecha Actualización': inscripcion.updated_at 
        ? new Date(inscripcion.updated_at).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '',
      'Asistencia': inscripcion.asistencia === true ? 'Sí' : inscripcion.asistencia === false ? 'No' : 'Sin confirmar',
      'Estado': inscripcion.estado || 'Pendiente'
    }));

    // Crear el workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Ajustar ancho de columnas para todos los campos
    const columnWidths = [
      { wch: 5 },   // No.
      { wch: 20 },  // _id
      { wch: 25 },  // Nombre
      { wch: 15 },  // Cédula
      { wch: 30 },  // Correo
      { wch: 15 },  // Teléfono
      { wch: 15 },  // Rol
      { wch: 15 },  // ID
      { wch: 15 },  // Tipo Estudiante
      { wch: 20 },  // Facultad
      { wch: 25 },  // Programa
      { wch: 10 },  // Semestre
      { wch: 15 },  // Tipo Evento
      { wch: 20 },  // Horario
      { wch: 20 },  // Lugar
      { wch: 25 },  // Ponente 1
      { wch: 25 },  // Ponente 2
      { wch: 25 },  // Integrante 1
      { wch: 25 },  // Integrante 2
      { wch: 25 },  // Integrante 3
      { wch: 25 },  // Integrante 4
      { wch: 25 },  // Nombre Proyecto
      { wch: 40 },  // Descripción Proyecto
      { wch: 20 },  // Categoría Proyecto
      { wch: 25 },  // Institución
      { wch: 25 },  // Correo Grupo
      { wch: 15 },  // Teléfono Grupo
      { wch: 20 },  // Área
      { wch: 20 },  // Cargo
      { wch: 20 },  // Fecha Creación
      { wch: 20 },  // Fecha Actualización
      { wch: 12 },  // Asistencia
      { wch: 15 }   // Estado
    ];
    ws['!cols'] = columnWidths;

    // Agregar estilo a los encabezados
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ c: C, r: 0 });
      if (!ws[address]) continue;
      ws[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones Completo');

    // Crear una hoja adicional con resumen estadístico
    const statsData = [
      { 'Estadística': 'Total Inscritos', 'Valor': inscripciones.length },
      { 'Estadística': 'Asistieron', 'Valor': inscripciones.filter(i => i.asistencia === true).length },
      { 'Estadística': 'No Asistieron', 'Valor': inscripciones.filter(i => i.asistencia === false).length },
      { 'Estadística': 'Sin Confirmar', 'Valor': inscripciones.filter(i => i.asistencia === undefined || i.asistencia === null).length },
      { 'Estadística': 'Tasa de Asistencia', 'Valor': `${(inscripciones.filter(i => i.asistencia === true).length / inscripciones.length * 100).toFixed(1)}%` }
    ];

    const wsStats = XLSX.utils.json_to_sheet(statsData);
    wsStats['!cols'] = [{ wch: 20 }, { wch: 15 }];
    
    // Estilo para la hoja de estadísticas
    const statsRange = XLSX.utils.decode_range(wsStats['!ref']);
    for (let C = statsRange.s.c; C <= statsRange.e.c; ++C) {
      const address = XLSX.utils.encode_cell({ c: C, r: 0 });
      if (!wsStats[address]) continue;
      wsStats[address].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "10B981" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `reporte_completo_${nombreEvento || 'evento'}_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <button 
      className="export-button"
      onClick={exportToExcel}
      disabled={disabled || !inscripciones || inscripciones.length === 0}
      title="Exportar a Excel con todos los datos"
    >
      <Download size={18} />
      <span>Exportar Excel Completo</span>
    </button>
  );
};

export default ExportButton;