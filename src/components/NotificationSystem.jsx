import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import '../styles/NotificationSystem.css';

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  // Mover removeNotification antes de addNotification para evitar dependencia circular
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]); // ✅ Ahora include removeNotification en las dependencias

  useEffect(() => {
    // Exponer funciones globalmente
    window.showNotification = addNotification;
    window.hideNotification = removeNotification;

    return () => {
      delete window.showNotification;
      delete window.hideNotification;
    };
  }, [addNotification, removeNotification]);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-icon">
            {getIcon(notification.type)}
          </div>
          <div className="notification-content">
            <p>{notification.message}</p>
          </div>
          <button 
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            <X size={16} />
          </button>
          {notification.duration > 0 && (
            <div 
              className="notification-progress"
              style={{ animationDuration: `${notification.duration}ms` }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Hook personalizado para usar notificaciones
export const useNotification = () => {
  const showSuccess = (message, duration) => {
    if (window.showNotification) {
      return window.showNotification(message, 'success', duration);
    }
  };

  const showError = (message, duration) => {
    if (window.showNotification) {
      return window.showNotification(message, 'error', duration);
    }
  };

  const showWarning = (message, duration) => {
    if (window.showNotification) {
      return window.showNotification(message, 'warning', duration);
    }
  };

  const showInfo = (message, duration) => {
    if (window.showNotification) {
      return window.showNotification(message, 'info', duration);
    }
  };

  const hide = (id) => {
    if (window.hideNotification) {
      window.hideNotification(id);
    }
  };

  return { showSuccess, showError, showWarning, showInfo, hide };
};

export default NotificationSystem;