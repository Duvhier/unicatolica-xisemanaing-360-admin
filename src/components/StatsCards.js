import React from 'react';
import { Users, UserCheck, UserX, TrendingUp, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const StatsCards = ({ stats, loading }) => {
  if (loading) {
    return <LoadingSpinner message="Cargando estadísticas..." size="small" />;
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-icon" />
        <h3>Sin datos</h3>
        <p>No hay estadísticas disponibles</p>
      </div>
    );
  }

  const {
    totalInscripciones = 0,
    totalAsistencia = 0,
    totalSinAsistencia = 0,
    porcentajeAsistencia = 0
  } = stats;

  const porcentajePresentes = totalInscripciones > 0 
    ? Math.round((totalAsistencia / totalInscripciones) * 100) 
    : 0;
  
  const porcentajeAusentes = totalInscripciones > 0 
    ? Math.round((totalSinAsistencia / totalInscripciones) * 100) 
    : 0;

  return (
    <div className="stats-grid">
      {/* Total Inscritos */}
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon-container primary">
            <Users size={24} />
          </div>
          <span className="stat-number">{totalInscripciones}</span>
        </div>
        <span className="stat-label">Total Inscritos</span>
        <div className="stat-trend">
          <span className="stat-trend-text">Total registrados</span>
        </div>
      </div>

      {/* Asistencia Confirmada */}
      <div className="stat-card success">
        <div className="stat-header">
          <div className="stat-icon-container success">
            <UserCheck size={24} />
          </div>
          <span className="stat-number">{totalAsistencia}</span>
        </div>
        <span className="stat-label">Asistencia Confirmada</span>
        <div className="stat-progress">
          <div 
            className="stat-progress-bar success" 
            style={{ width: `${porcentajePresentes}%` }}
          ></div>
        </div>
        <div className="stat-trend">
          <TrendingUp size={16} />
          <span className="stat-trend-text">{porcentajePresentes}% del total</span>
        </div>
      </div>

      {/* Pendientes */}
      <div className="stat-card warning">
        <div className="stat-header">
          <div className="stat-icon-container warning">
            <UserX size={24} />
          </div>
          <span className="stat-number">{totalSinAsistencia}</span>
        </div>
        <span className="stat-label">Pendientes por Confirmar</span>
        <div className="stat-progress">
          <div 
            className="stat-progress-bar warning" 
            style={{ width: `${porcentajeAusentes}%` }}
          ></div>
        </div>
        <div className="stat-trend">
          <span className="stat-trend-text">{porcentajeAusentes}% del total</span>
        </div>
      </div>

      {/* Porcentaje de Asistencia */}
      <div className="stat-card info">
        <div className="stat-header">
          <div className="stat-icon-container info">
            <TrendingUp size={24} />
          </div>
          <span className="stat-number">{porcentajeAsistencia}%</span>
        </div>
        <span className="stat-label">Tasa de Asistencia</span>
        <div className="stat-progress">
          <div 
            className="stat-progress-bar info" 
            style={{ width: `${porcentajeAsistencia}%` }}
          ></div>
        </div>
        <div className="stat-trend">
          {porcentajeAsistencia >= 70 ? (
            <span className="stat-trend-text positive">✅ Buen rendimiento</span>
          ) : porcentajeAsistencia >= 50 ? (
            <span className="stat-trend-text neutral">⚠️ Puede mejorar</span>
          ) : (
            <span className="stat-trend-text negative">❌ Necesita atención</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;