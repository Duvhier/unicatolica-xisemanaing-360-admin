import React from 'react';
import { FileText } from 'lucide-react';
import '../styles/PDFExport.css';

const PDFExport = ({ inscripciones, nombreEvento, stats, disabled }) => {
  const generatePDF = () => {
    if (!inscripciones || inscripciones.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Crear contenido HTML para el PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte - ${nombreEvento}</title>
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
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .header h1 {
            font-size: 28px;
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
            gap: 20px;
            margin-bottom: 40px;
          }
          
          .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
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
          
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1f2937;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          
          thead {
            background: #f3f4f6;
          }
          
          th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
          }
          
          td {
            padding: 12px;
            font-size: 13px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          tbody tr:hover {
            background: #f9fafb;
          }
          
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
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
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .stats-section {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Inscripciones</h1>
          <div class="subtitle">${nombreEvento}</div>
          <div class="subtitle">Generado: ${new Date().toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>
        
        ${stats ? `
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-label">Total Inscripciones</div>
            <div class="stat-value">${stats.total_inscripciones || 0}</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">Asistieron</div>
            <div class="stat-value">${stats.total_asistieron || 0}</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-label">No Asistieron</div>
            <div class="stat-value">${(stats.total_inscripciones || 0) - (stats.total_asistieron || 0)}</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-label">Tasa de Asistencia</div>
            <div class="stat-value">${stats.total_inscripciones > 0 
              ? ((stats.total_asistieron / stats.total_inscripciones) * 100).toFixed(1) 
              : 0}%</div>
          </div>
        </div>
        ` : ''}
        
        <h2 class="section-title">Lista de Participantes</h2>
        
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Fecha Inscripción</th>
              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody>
            ${inscripciones.map((inscripcion, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${inscripcion.nombre || '-'}</td>
                <td>${inscripcion.email || '-'}</td>
                <td>${inscripcion.telefono || '-'}</td>
                <td>${inscripcion.fecha_inscripcion 
                  ? new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-CO')
                  : '-'}</td>
                <td>
                  <span class="badge ${inscripcion.asistencia ? 'success' : 'danger'}">
                    ${inscripcion.asistencia ? 'Sí' : 'No'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Este reporte fue generado automáticamente por el Sistema de Gestión de Eventos</p>
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
      
      // Opcional: cerrar la ventana después de imprimir
      // printWindow.onafterprint = () => {
      //   printWindow.close();
      // };
    };
  };

  return (
    <button 
      className="pdf-export-button"
      onClick={generatePDF}
      disabled={disabled || !inscripciones || inscripciones.length === 0}
      title="Exportar reporte PDF"
    >
      <FileText size={18} />
      <span>Exportar PDF</span>
    </button>
  );
};

export default PDFExport;