import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Users, CheckCircle, XCircle } from 'lucide-react';
import '../styles/AttendanceChart.css';

const AttendanceChart = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="chart-card loading">
        <div className="chart-header">
          <Users size={20} />
          <h3>Gráfico de Asistencia</h3>
        </div>
        <div className="chart-loading">
          <div className="spinner"></div>
          <p>Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="chart-card empty">
        <div className="chart-header">
          <Users size={20} />
          <h3>Gráfico de Asistencia</h3>
        </div>
        <div className="chart-empty">
          <p>Selecciona un evento para ver estadísticas</p>
        </div>
      </div>
    );
  }

  const totalInscripciones = stats.total_inscripciones || 0;
  const totalAsistieron = stats.total_asistieron || 0;
  const noAsistieron = totalInscripciones - totalAsistieron;
  const porcentajeAsistencia = totalInscripciones > 0 
    ? ((totalAsistieron / totalInscripciones) * 100).toFixed(1)
    : 0;

  const data = [
    { name: 'Asistieron', value: totalAsistieron, color: '#10b981' },
    { name: 'No Asistieron', value: noAsistieron, color: '#ef4444' }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalInscripciones > 0 
        ? ((data.value / totalInscripciones) * 100).toFixed(1)
        : 0;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{data.name}</p>
          <p className="tooltip-value">
            {data.value} personas ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <Users size={20} />
        <h3>Gráfico de Asistencia</h3>
      </div>

      {totalInscripciones === 0 ? (
        <div className="chart-empty">
          <p>No hay inscripciones para este evento</p>
        </div>
      ) : (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-summary">
            <div className="summary-item success">
              <CheckCircle size={18} />
              <div className="summary-text">
                <span className="summary-label">Asistieron</span>
                <span className="summary-value">{totalAsistieron}</span>
              </div>
            </div>

            <div className="summary-item danger">
              <XCircle size={18} />
              <div className="summary-text">
                <span className="summary-label">No Asistieron</span>
                <span className="summary-value">{noAsistieron}</span>
              </div>
            </div>

            <div className="summary-percentage">
              <div className="percentage-circle" style={{
                background: `conic-gradient(#10b981 ${porcentajeAsistencia * 3.6}deg, #f3f4f6 0deg)`
              }}>
                <div className="percentage-inner">
                  <span className="percentage-value">{porcentajeAsistencia}%</span>
                </div>
              </div>
              <p className="percentage-label">Tasa de Asistencia</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceChart;