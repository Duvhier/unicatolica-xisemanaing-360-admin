import React from 'react';
import { FileText } from 'lucide-react';
import '../styles/PDFExport.css';

const PDFExport = ({ inscripciones, nombreEvento, stats, disabled }) => {
  const generatePDF = () => {
    if (!inscripciones || inscripciones.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Calcular estadísticas actualizadas
    const totalInscritos = inscripciones.length;
    const totalAsistieron = inscripciones.filter(i => i.asistencia === true).length;
    const totalNoAsistieron = inscripciones.filter(i => i.asistencia === false).length;
    const totalSinConfirmar = totalInscritos - totalAsistieron - totalNoAsistieron;
    const tasaAsistencia = totalInscritos > 0 ? (totalAsistieron / totalInscritos) * 100 : 0;

    // Función para obtener valores anidados de objetos
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => {
        // Manejar arrays como grupo.integrantes[0]
        const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch) {
          const arrayName = arrayMatch[1];
          const index = parseInt(arrayMatch[2]);
          return current && current[arrayName] && current[arrayName][index] ? current[arrayName][index] : '-';
        }
        return current && current[key] !== undefined ? current[key] : '-';
      }, obj);
    };

    // Crear contenido HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte Completo - ${nombreEvento}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            color: #1f2937;
            font-size: 12px;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .header h1 {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 10px;
          }
          
          .header .subtitle {
            color: #6b7280;
            font-size: 14px;
          }
          
          .stats-section {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            text-align: center;
          }
          
          .stat-card.success {
            border-left-color: #10b981;
          }
          
          .stat-card.danger {
            border-left-color: #ef4444;
          }
          
          .stat-card.warning {
            border-left-color: #f59e0b;
          }
          
          .stat-card.info {
            border-left-color: #3b82f6;
          }
          
          .stat-label {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
          }
          
          .stat-description {
            font-size: 9px;
            color: #9ca3af;
            margin-top: 4px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1f2937;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 10px;
          }
          
          thead {
            background: #f3f4f6;
          }
          
          th {
            padding: 8px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
          }
          
          td {
            padding: 6px;
            font-size: 9px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          
          tbody tr:hover {
            background: #f9fafb;
          }
          
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: 600;
          }
          
          .badge.success {
            background: #d1fae5;
            color: #065f46;
          }
          
          .badge.danger {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .badge.warning {
            background: #fef3c7;
            color: #92400e;
          }
          
          .badge.neutral {
            background: #e5e7eb;
            color: #374151;
          }
          
          .summary-section {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #3b82f6;
          }
          
          .summary-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 12px;
            color: #1f2937;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .summary-label {
            color: #6b7280;
            font-size: 11px;
          }
          
          .summary-value {
            font-weight: bold;
            color: #1f2937;
            font-size: 11px;
          }
          
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
          }
          
          .text-small {
            font-size: 8px;
          }
          
          .nowrap {
            white-space: nowrap;
          }
          
          @media print {
            body {
              padding: 15px;
            }
            
            .stats-section {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .summary-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte Completo de Inscripciones</h1>
          <div class="subtitle">${nombreEvento}</div>
          <div class="subtitle">Generado: ${new Date().toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        
        <!-- Sección de estadísticas principales -->
        <div class="stats-section">
          <div class="stat-card info">
            <div class="stat-label">Total Inscritos</div>
            <div class="stat-value">${totalInscritos}</div>
            <div class="stat-description">Usuarios registrados</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">Asistieron</div>
            <div class="stat-value">${totalAsistieron}</div>
            <div class="stat-description">${tasaAsistencia.toFixed(1)}% del total</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-label">No Asistieron</div>
            <div class="stat-value">${totalNoAsistieron}</div>
            <div class="stat-description">Confirmaron no asistencia</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-label">Sin Confirmar</div>
            <div class="stat-value">${totalSinConfirmar}</div>
            <div class="stat-description">${totalInscritos > 0 ? ((totalSinConfirmar / totalInscritos) * 100).toFixed(1) : 0}% del total</div>
          </div>
        </div>
        
        <!-- Resumen detallado -->
        <div class="summary-section">
          <div class="summary-title">📋 Resumen Detallado</div>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Total de inscripciones:</span>
              <span class="summary-value">${totalInscritos}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Asistencia confirmada:</span>
              <span class="summary-value">${totalAsistieron} (${tasaAsistencia.toFixed(1)}%)</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">No asistieron:</span>
              <span class="summary-value">${totalNoAsistieron} (${totalInscritos > 0 ? ((totalNoAsistieron / totalInscritos) * 100).toFixed(1) : 0}%)</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Sin confirmar asistencia:</span>
              <span class="summary-value">${totalSinConfirmar} (${totalInscritos > 0 ? ((totalSinConfirmar / totalInscritos) * 100).toFixed(1) : 0}%)</span>
            </div>
          </div>
        </div>
        
        <h2 class="section-title">👥 Lista Completa de Participantes (${totalInscritos} registrados)</h2>
        
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>ID</th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Tipo Estudiante</th>
              <th>Facultad</th>
              <th>Programa</th>
              <th>Semestre</th>
              <th>Tipo Evento</th>
              <th>Horario</th>
              <th>Lugar</th>
              <th>Ponente 1</th>
              <th>Ponente 2</th>
              <th>Integrante 1</th>
              <th>Integrante 2</th>
              <th>Integrante 3</th>
              <th>Integrante 4</th>
              <th>Proyecto</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th>Institución</th>
              <th>Correo Grupo</th>
              <th>Teléfono Grupo</th>
              <th>Área</th>
              <th>Cargo</th>
              <th>Fecha Creación</th>
              <th>Fecha Actualización</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${inscripciones.map((inscripcion, index) => {
              let estado = 'warning';
              let textoEstado = 'Sin confirmar';
              
              if (inscripcion.asistencia === true) {
                estado = 'success';
                textoEstado = 'Asistió';
              } else if (inscripcion.asistencia === false) {
                estado = 'danger';
                textoEstado = 'No asistió';
              }
              
              return `
                <tr>
                  <td class="nowrap">${index + 1}</td>
                  <td class="text-small">${inscripcion._id || '-'}</td>
                  <td>${inscripcion.nombre || '-'}</td>
                  <td class="nowrap">${inscripcion.cedula || '-'}</td>
                  <td class="text-small">${inscripcion.correo || '-'}</td>
                  <td class="nowrap">${inscripcion.telefono || '-'}</td>
                  <td>${inscripcion.rol || '-'}</td>
                  <td>${inscripcion.tipoEstudiante || '-'}</td>
                  <td>${inscripcion.facultad || '-'}</td>
                  <td>${inscripcion.programa || '-'}</td>
                  <td>${inscripcion.semestre || '-'}</td>
                  <td>${inscripcion.tipo_evento || '-'}</td>
                  <td>${inscripcion.horario || '-'}</td>
                  <td>${inscripcion.lugar || '-'}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'ponentes[0]')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'ponentes[1]')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.integrantes[0]')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.integrantes[1]')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.integrantes[2]')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.integrantes[3]')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.proyecto.nombre')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.proyecto.descripcion')}</td>
                  <td>${getNestedValue(inscripcion, 'grupo.proyecto.categoria')}</td>
                  <td>${getNestedValue(inscripcion, 'grupo.institucion')}</td>
                  <td class="text-small">${getNestedValue(inscripcion, 'grupo.correo')}</td>
                  <td class="nowrap">${getNestedValue(inscripcion, 'grupo.telefono')}</td>
                  <td>${inscripcion.area || '-'}</td>
                  <td>${inscripcion.cargo || '-'}</td>
                  <td class="nowrap text-small">${inscripcion.created_at 
                    ? new Date(inscripcion.created_at).toLocaleDateString('es-CO')
                    : '-'}</td>
                  <td class="nowrap text-small">${inscripcion.updated_at 
                    ? new Date(inscripcion.updated_at).toLocaleDateString('es-CO')
                    : '-'}</td>
                  <td>
                    <span class="badge ${estado}">
                      ${textoEstado}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Este reporte fue generado automáticamente por el Sistema de Gestión de Eventos</p>
          <p>Total de usuarios inscritos: <strong>${totalInscritos}</strong> | Asistencia confirmada: <strong>${totalAsistieron}</strong> | Pendientes por confirmar: <strong>${totalSinConfirmar}</strong></p>
          <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `;

    // Crear ventana nueva para imprimir
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Esperar a que se cargue y luego imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <button 
      className="pdf-export-button"
      onClick={generatePDF}
      disabled={disabled || !inscripciones || inscripciones.length === 0}
      title="Exportar reporte PDF completo"
    >
      <FileText size={18} />
      <span>Exportar PDF Completo</span>
    </button>
  );
};

export default PDFExport;