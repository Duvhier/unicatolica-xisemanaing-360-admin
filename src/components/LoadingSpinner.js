import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = "Cargando...", size = "default" }) => {
  const sizeConfig = {
    small: { icon: 24, text: "text-sm" },
    default: { icon: 40, text: "text-base" },
    large: { icon: 56, text: "text-lg" }
  };

  const config = sizeConfig[size] || sizeConfig.default;

  return (
    <div className="loading-container">
      <div className="loading-content">
        <Loader2 
          size={config.icon} 
          className="loading-spinner-icon" 
        />
        {message && (
          <p className={`loading-text ${config.text}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;