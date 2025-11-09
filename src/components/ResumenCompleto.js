import React, { useState, useEffect } from 'react';
import { Download, Users, Calendar, BarChart3, FileText } from 'lucide-react';
import { apiClient } from '../services/api';
import '../styles/ResumenCompleto.css';

const ResumenCompleto = ({ onClose }) => {
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        cargarResumenCompleto();
    }, []);

    const cargarResumenCompleto = async () => {
        try {
            setLoading(true);
            const data = await apiClient.getResumenCompletoEventos();

            if (data.success) {
                setResumen(data.resumen);
            } else {
                setError(data.message || 'Error al cargar el resumen');
            }
        } catch (error) {
            console.error('Error cargando resumen:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        try {
          setExporting(true);
          const response = await apiClient.exportarResumenPDF();
          
          if (response.success) {
            // Descargar el PDF
            const blob = new Blob([response.html], { type: 'text/html' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `resumen-completo-${new Date().toISOString().split('T')[0]}.html`;
            link.click();
            window.URL.revokeObjectURL(url);
          }
        } catch (error) {
          console.error('Error exportando PDF:', error);
          alert('Error al exportar el PDF');
        } finally {
          setExporting(false);
        }
      };

    const handleExport = async (formato) => {
        try {
            setExporting(true);
            const data = await apiClient.exportarDatosCompletos(formato);

            if (data.success && data.downloadUrl) {
                // Descargar el archivo
                window.open(data.downloadUrl, '_blank');
            } else {
                alert('Error al generar el archivo de exportación');
            }
        } catch (error) {
            console.error('Error exportando:', error);
            alert(`Error al exportar: ${error.message}`);
        } finally {
            setExporting(false);
        }
    };

    const exportToCSV = () => {
        if (!resumen) return;

        const eventosData = resumen.eventos.flatMap(evento =>
            evento.inscripciones.map(inscripcion => ({
                'Evento': evento.nombre,
                'Tipo Evento': evento.tipo,
                'Colección': evento.coleccion,
                'Total Inscritos': evento.total_inscritos,
                'Asistieron': evento.total_asistieron,
                'Nombre': inscripcion.nombre,
                'Email': inscripcion.email,
                'Teléfono': inscripcion.telefono,
                'Cédula': inscripcion.cedula,
                'Rol': inscripcion.rol,
                'Facultad': inscripcion.facultad,
                'Programa': inscripcion.programa,
                'Semestre': inscripcion.semestre,
                'Asistencia': inscripcion.asistencia ? 'Sí' : 'No',
                'Fecha Inscripción': inscripcion.fecha_inscripcion,
                'Fecha Actualización': inscripcion.updated_at
            }))
        );

        const headers = Object.keys(eventosData[0] || {});
        const csvContent = [
            headers.join(','),
            ...eventosData.map(row =>
                headers.map(header =>
                    `"${String(row[header] || '').replace(/"/g, '""')}"`
                ).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `resumen-completo-eventos-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="resumen-completo-modal">
                <div className="resumen-loading">
                    <div className="spinner"></div>
                    <p>Cargando resumen completo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="resumen-completo-modal">
                <div className="resumen-error">
                    <p>❌ {error}</p>
                    <button onClick={onClose} className="btn-secondary">Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="resumen-completo-modal">
            <div className="resumen-header">
                <h2>📊 Resumen Completo de Todos los Eventos</h2>
                <button onClick={onClose} className="close-btn">×</button>
            </div>

            <div className="resumen-actions">
                <button
                    onClick={exportToCSV}
                    disabled={exporting}
                    className="export-btn"
                >
                    <Download size={16} />
                    Exportar CSV
                </button>
                <button
                    onClick={() => handleExport('excel')}
                    disabled={exporting}
                    className="export-btn"
                >
                    <FileText size={16} />
                    Exportar Excel
                </button>
                <button
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                    className="export-btn"
                >
                    <FileText size={16} />
                    Exportar PDF
                </button>
            </div>
            <button
                onClick={() => handleExportPDF()}
                disabled={exporting}
                className="export-btn"
            >
                <FileText size={16} />
                Exportar PDF Completo
            </button>

            {resumen && (
                <div className="resumen-content">
                    {/* Estadísticas generales */}
                    <div className="estadisticas-generales">
                        <h3>
                            <BarChart3 size={20} />
                            Estadísticas Generales
                        </h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <Calendar size={24} />
                                <div className="stat-info">
                                    <span className="stat-value">{resumen.total_eventos}</span>
                                    <span className="stat-label">Total Eventos</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <Users size={24} />
                                <div className="stat-info">
                                    <span className="stat-value">{resumen.total_inscripciones}</span>
                                    <span className="stat-label">Total Inscripciones</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <Users size={24} />
                                <div className="stat-info">
                                    <span className="stat-value">{resumen.total_usuarios_unicos}</span>
                                    <span className="stat-label">Usuarios Únicos</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <BarChart3 size={24} />
                                <div className="stat-info">
                                    <span className="stat-value">{resumen.tasa_asistencia_general}%</span>
                                    <span className="stat-label">Tasa Asistencia General</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de eventos */}
                    <div className="eventos-list">
                        <h3>📅 Lista de Eventos</h3>
                        {resumen.eventos.map((evento, index) => (
                            <div key={evento.coleccion} className="evento-card">
                                <div className="evento-header">
                                    <h4>{evento.nombre}</h4>
                                    <span className="evento-tipo">{evento.tipo}</span>
                                </div>

                                <div className="evento-stats">
                                    <div className="evento-stat">
                                        <Users size={16} />
                                        <span>{evento.total_inscritos} inscritos</span>
                                    </div>
                                    <div className="evento-stat">
                                        <span className="asistio">✅ {evento.total_asistieron} asistieron</span>
                                    </div>
                                    <div className="evento-stat">
                                        <span className="tasa-asistencia">
                                            📊 {evento.tasa_asistencia}% de asistencia
                                        </span>
                                    </div>
                                </div>

                                {/* Tabla de inscripciones del evento */}
                                <div className="inscripciones-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Email</th>
                                                <th>Teléfono</th>
                                                <th>Rol</th>
                                                <th>Programa</th>
                                                <th>Asistencia</th>
                                                <th>Fecha Inscripción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {evento.inscripciones.map((inscripcion, idx) => (
                                                <tr key={idx}>
                                                    <td>{inscripcion.nombre}</td>
                                                    <td>{inscripcion.email}</td>
                                                    <td>{inscripcion.telefono || '-'}</td>
                                                    <td>{inscripcion.rol}</td>
                                                    <td>{inscripcion.programa || '-'}</td>
                                                    <td>
                                                        <span className={`badge ${inscripcion.asistencia ? 'asistio' : 'no-asistio'}`}>
                                                            {inscripcion.asistencia ? 'Sí' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {inscripcion.fecha_inscripcion
                                                            ? new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-CO')
                                                            : '-'
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumenCompleto;