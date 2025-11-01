import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const StatsCards = ({ stats, loading }) => {
  if (loading) {
    return <LoadingSpinner message="Cargando estadísticas..." />;
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="icon">📊</div>
        <p>No hay estadísticas disponibles</p>
      </div>
    );
  }

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-number">{stats.totalInscripciones || 0}</span>
        <span className="stat-label">Total Inscritos</span>
      </div>
      <div className="stat-card success">
        <span className="stat-number">{stats.totalAsistencia || 0}</span>
        <span className="stat-label">Asistencia Confirmada</span>
      </div>
      <div className="stat-card warning">
        <span className="stat-number">{stats.totalSinAsistencia || 0}</span>
        <span className="stat-label">Pendientes</span>
      </div>
      <div className="stat-card">
        <span className="stat-number">{stats.porcentajeAsistencia || 0}%</span>
        <span className="stat-label">Porcentaje de Asistencia</span>
      </div>
    </div>
  );
};

export default StatsCards;

