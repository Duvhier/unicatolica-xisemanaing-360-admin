import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { useScanner } from '../hooks/useScanner';
import Header from './Header';
import UserInfoCard from './UserInfoCard';
import '../styles/Scanner.css';

const Scanner = ({ onDashboardClick, onLogout }) => {
  const [userName, setUserName] = useState('Administrador');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    text: 'Presiona "Iniciar Scanner" para comenzar',
    type: 'info'
  });

  const {
    isScanning,
    scannedData,
    scanError,
    cameraStatus,
    startScanner,
    stopScanner,
    resetScanner
  } = useScanner();

  // Cargar información del usuario y eventos
  useEffect(() => {
    cargarInfoUsuario();
    cargarEventoPorDefecto();
  }, []);

  // Procesar datos escaneados
  useEffect(() => {
    if (scannedData) {
      procesarQR(scannedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedData]);

  // Manejar errores del scanner
  useEffect(() => {
    if (scanError) {
      setMessage({
        text: `Error: ${scanError}`,
        type: 'error'
      });
    }
  }, [scanError]);

  const cargarInfoUsuario = () => {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr);
        setUserName(usuario.nombre || usuario.usuario);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  const cargarEventoPorDefecto = async () => {
    try {
      const data = await apiClient.getActividades();
      if (data.actividades && data.actividades.length > 0) {
        setSelectedEvent(data.actividades[0].coleccion);
      }
    } catch (error) {
      console.error('Error cargando actividades:', error);
      setMessage({
        text: 'Error al cargar los eventos',
        type: 'error'
      });
    }
  };

  const procesarQR = async (qrData) => {
    setLoading(true);
    setUserInfo(null);
    
    try {
      // El QR data debería ser el ID de la inscripción
      const result = await apiClient.buscarInscripcion(qrData);
      
      if (result.success && result.inscripcion) {
        setUserInfo(result.inscripcion);
        setMessage({
          text: '✅ Usuario encontrado correctamente',
          type: 'success'
        });
      } else {
        throw new Error(result.message || 'Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error procesando QR:', error);
      setMessage({
        text: `❌ Error: ${error.message}`,
        type: 'error'
      });
      // Reiniciar después de 3 segundos
      setTimeout(() => {
        resetScannerState();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAsistencia = async () => {
    if (!userInfo || !selectedEvent) return;

    setLoading(true);
    
    try {
      const result = await apiClient.marcarAsistencia(
        userInfo._id, 
        selectedEvent, 
        true
      );
      
      if (result.success) {
        setMessage({
          text: '✅ Asistencia confirmada exitosamente',
          type: 'success'
        });
        // Actualizar información del usuario
        setUserInfo(prev => ({ ...prev, asistencia: true }));
        
        // Reiniciar después de 2 segundos
        setTimeout(() => {
          resetScannerState();
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error confirmando asistencia:', error);
      setMessage({
        text: `❌ Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartScanner = async () => {
    setMessage({
      text: 'Iniciando cámara...',
      type: 'info'
    });
    await startScanner();
  };

  const handleStopScanner = async () => {
    await stopScanner();
    resetScannerState();
  };

  const handleCancel = () => {
    resetScannerState();
  };

  const resetScannerState = () => {
    resetScanner();
    setUserInfo(null);
    setMessage({
      text: 'Presiona "Iniciar Scanner" para comenzar',
      type: 'info'
    });
  };

  const getCameraStatusText = () => {
    const statusMap = {
      inactive: '⏸️ Cámara inactiva',
      starting: '🔄 Iniciando cámara...',
      active: '🎥 Cámara activa - Escaneando...',
      scanned: '✅ QR escaneado correctamente',
      error: '❌ Error de cámara'
    };
    return statusMap[cameraStatus] || statusMap.inactive;
  };

  const getCameraStatusClass = () => {
    return `camera-status ${cameraStatus}`;
  };

  return (
    <div className="admin-container">
      <Header 
        userName={userName}
        onDashboardClick={onDashboardClick}
        onLogout={onLogout}
        showScannerButton={false}
        showDashboardButton={true}
      />

      <main className="scanner-main">
        <div className="scanner-container">
          <h2 className="scanner-title">🔍 Escanear Código QR</h2>
          
          <div className={getCameraStatusClass()}>
            {getCameraStatusText()}
          </div>

          <div id="qr-reader" className="qr-reader">
            {!isScanning && (
              <div style={{ color: '#718096', fontSize: '16px' }}>
                Área de escaneo QR
              </div>
            )}
          </div>
          
          <div className="scanner-controls">
            <button 
              onClick={handleStartScanner}
              className="btn btn-primary"
              disabled={isScanning || loading}
            >
              {isScanning ? '🎥 Escaneando...' : '🎥 Iniciar Scanner'}
            </button>
            <button 
              onClick={handleStopScanner}
              className="btn btn-danger"
              disabled={!isScanning || loading}
            >
              ⏹️ Detener Scanner
            </button>
          </div>

          <div className={`scan-result ${message.type}`}>
            {message.text}
          </div>
        </div>

        {userInfo && (
          <UserInfoCard
            userInfo={userInfo}
            onConfirmAsistencia={handleConfirmAsistencia}
            onCancel={handleCancel}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};

export default Scanner;

