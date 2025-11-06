import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import '../styles/ExportButton.css';

const ExportButton = ({ inscripciones, nombreEvento, disabled }) => {
  const exportToExcel = () => {
    if (!inscripciones || inscripciones.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar los datos para exportar
    const dataToExport = inscripciones.map((inscripcion, index) => ({
      'No.': index + 1,
      'Nombre': inscripcion.nombre || '',
      'Email': inscripcion.email || '',
      'Teléfono': inscripcion.telefono || '',
      'Fecha Inscripción': inscripcion.fecha_inscripcion 
        ? new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '',
      'Asistencia': inscripcion.asistencia ? 'Sí' : 'No',
      'Estado': inscripcion.estado || 'Pendiente'
    }));

    // Crear el workbook y worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 5 },  // No.
      { wch: 25 }, // Nombre
      { wch: 30 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 18 }, // Fecha Inscripción
      { wch: 10 }, // Asistencia
      { wch: 12 }  // Estado
    ];
    ws['!cols'] = columnWidths;

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones');

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `inscripciones_${nombreEvento || 'evento'}_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <button 
      className="export-button"
      onClick={exportToExcel}
      disabled={disabled || !inscripciones || inscripciones.length === 0}
      title="Exportar a Excel"
    >
      <Download size={18} />
      <span>Exportar Excel</span>
    </button>
  );
};

export default ExportButton;