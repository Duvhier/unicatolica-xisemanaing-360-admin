import React from 'react';

const LoadingSpinner = ({ message = "Cargando..." }) => {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingSpinner;

