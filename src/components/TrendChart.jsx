import React, { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import '../styles/TrendChart.css';

const TrendChart = ({ inscripciones, loading }) => {
  const chartData = useMemo(() => {
    if (!inscripciones || inscripciones.length === 0) return [];

    // Agrupar inscripciones por fecha
    const groupedByDate = {};
    
    inscripciones.forEach(inscripcion => {
      if (!inscripcion.fecha_inscripcion) return;
      
      const date = new Date(inscripcion.fecha_inscripcion);
      const dateKey = date.toLocaleDateString('es-CO', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          fecha: dateKey,
          inscripciones: 0,
          asistieron: 0
        };
      }
      
      groupedByDate[dateKey].inscripciones++;
      if (inscripcion.asistencia) {
        groupedByDate[dateKey].asistieron++;
      }
    });

    // Convertir a array y ordenar por fecha
    return Object.values(groupedByDate)
      .sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        return dateA - dateB;
      })
      .slice(-10); // Últimos 10 días
  }, [inscripciones]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const totalInscripciones = chartData.reduce((sum, day) => sum + day.inscripciones, 0);
    const totalAsistieron = chartData.reduce((sum, day) => sum + day.asistieron, 0);
    const promedioDiario = Math.round(totalInscripciones / chartData.length);
    const tasaAsistencia = totalInscripciones > 0 
      ? ((totalAsistieron / totalInscripciones) * 100).toFixed(1)
      : 0;

    return {
      totalInscripciones,
      totalAsistieron,
      promedioDiario,
      tasaAsistencia
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="trend-tooltip">
          <p className="tooltip-label">{label}</p>
          <div className="tooltip-data">
            <div className="tooltip-item inscripciones">
              <span className="tooltip-dot"></span>
              <span>Inscripciones: {payload[0].value}</span>
            </div>
            <div className="tooltip-item asistieron">
              <span className="tooltip-dot"></span>
              <span>Asistieron: {payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="trend-chart-card loading">
        <div className="chart-header">
          <TrendingUp size={20} />
          <h3>Tendencia de Inscripciones</h3>
        </div>
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>Cargando tendencias...</p>
        </div>
      </div>
    );
  }

  if (!inscripciones || inscripciones.length === 0) {
    return (
      <div className="trend-chart-card empty">
        <div className="chart-header">
          <TrendingUp size={20} />
          <h3>Tendencia de Inscripciones</h3>
        </div>
        <div className="chart-empty">
          <Calendar size={48} />
          <p>No hay datos suficientes para mostrar tendencias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trend-chart-card">
      <div className="chart-header">
        <TrendingUp size={20} />
        <h3>Tendencia de Inscripciones</h3>
      </div>

      {stats && (
        <div className="trend-stats">
          <div className="trend-stat">
            <span className="stat-label">Promedio Diario</span>
            <span className="stat-value">{stats.promedioDiario}</span>
          </div>
          <div className="trend-stat">
            <span className="stat-label">Tasa Global</span>
            <span className="stat-value">{stats.tasaAsistencia}%</span>
          </div>
        </div>
      )}

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorInscripciones" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAsistieron" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="fecha" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="inscripciones"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInscripciones)"
              name="Inscripciones"
            />
            <Area
              type="monotone"
              dataKey="asistieron"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAsistieron)"
              name="Asistieron"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="trend-footer">
        <p className="trend-note">
          📊 Mostrando últimos {chartData.length} días con actividad
        </p>
      </div>
    </div>
  );
};

export default TrendChart;