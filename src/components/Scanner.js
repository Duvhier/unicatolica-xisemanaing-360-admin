import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  QrCode, 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Play, 
  Square,
  AlertCircle,
  CheckCircle,
  Info,
  Users,
  Loader2
} from 'lucide-react';
import { apiClient } from '../services/api';
import Header from './Header';
import UserInfoCard from './UserInfoCard';
import '../styles/Scanner.css';

const Scanner = ({ onDashboardClick, onLogout }) => {
  const [userName, setUserName] = useState('Administrador');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [message, setMessage] = useState({
    text: 'Presiona "Iniciar Scanner" para comenzar',
    type: 'info'
  });

  const scannerRef = useRef(null);

  // Cargar información del usuario y eventos
  useEffect(() => {
    cargarInfoUsuario();
    cargarEventoPorDefecto();

    // Cleanup al desmontar
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.log('Scanner cleanup:', error);
        });
      }
    };
  }, []);

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

  const startScanner = async () => {
    try {
      setLoading(true);
      setMessage({
        text: 'Iniciando cámara...',
        type: 'info'
      });
      setScanError('');

      // Limpiar scanner anterior si existe
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      // Esperar a que el DOM esté listo
      await new Promise(resolve => setTimeout(resolve, 100));

      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        throw new Error('Elemento qr-reader no encontrado');
      }

      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        false // verbose
      );

      // Configurar callbacks
      scannerRef.current.render(
        (decodedText) => {
          console.log('✅ QR escaneado:', decodedText);
          handleQRScanned(decodedText);
        },
        (error) => {
          console.log('ℹ️ Info escaneo:', error);
        }
      );

      setIsScanning(true);
      setMessage({
        text: 'Cámara activa - Escaneando códigos QR...',
        type: 'info'
      });

    } catch (error) {
      console.error('❌ Error iniciando scanner:', error);
      setScanError(error.message);
      setMessage({
        text: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      setIsScanning(false);
      setMessage({
        text: 'Scanner detenido',
        type: 'info'
      });
    } catch (error) {
      console.error('Error deteniendo scanner:', error);
    }
  };

  const handleQRScanned = async (qrData) => {
    setLoading(true);
    setUserInfo(null);

    try {
      console.log('🔍 Procesando QR:', qrData);

      let inscripcionId = qrData;

      try {
        const qrObject = JSON.parse(qrData);
        if (qrObject && qrObject.id) {
          inscripcionId = qrObject.id;
          console.log('✅ ID extraído del QR:', inscripcionId);
        }
      } catch (jsonError) {
        console.log('ℹ️ QR no es JSON, usando valor directo:', qrData);
      }

      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      const result = await apiClient.buscarInscripcion(inscripcionId, selectedEvent);

      if (result.success && result.inscripcion) {
        setUserInfo(result.inscripcion);
        setMessage({
          text: 'Usuario encontrado correctamente',
          type: 'success'
        });
      } else {
        throw new Error(result.message || 'Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error procesando QR:', error);
      setMessage({
        text: `Error: ${error.message}`,
        type: 'error'
      });

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
          text: 'Asistencia confirmada exitosamente',
          type: 'success'
        });
        setUserInfo(prev => ({ ...prev, asistencia: true }));

        setTimeout(() => {
          resetScannerState();
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error confirmando asistencia:', error);
      setMessage({
        text: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('✅ Permisos de cámara concedidos');
      stream.getTracks().forEach(track => track.stop());

      await startScanner();
    } catch (error) {
      console.error('❌ Permisos de cámara denegados:', error);
      setMessage({
        text: 'Permiso de cámara denegado. Por favor permite el acceso a la cámara.',
        type: 'error'
      });
    }
  };

  const handleStopScanner = async () => {
    await stopScanner();
  };

  const handleCancel = () => {
    resetScannerState();
  };

  const resetScannerState = async () => {
    await stopScanner();
    setUserInfo(null);
    setMessage({
      text: 'Presiona "Iniciar Scanner" para comenzar',
      type: 'info'
    });

    if (isScanning) {
      setTimeout(() => {
        startScanner();
      }, 500);
    }
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className="scanner-page">
      <Header
        userName={userName}
        onScannerClick={onDashboardClick}
        onLogout={onLogout}
      />

      <main className="scanner-main">
        <div className="scanner-container">
          {/* Header del Scanner */}
          <div className="scanner-header">
            <div className="scanner-title-section">
              <QrCode size={32} className="scanner-title-icon" />
              <div>
                <h1 className="scanner-title">Escaner de Códigos QR</h1>
                <p className="scanner-subtitle">
                  Escanea códigos QR para registrar asistencias
                </p>
              </div>
            </div>
          </div>

          {/* Selector de evento */}
          <div className="scanner-controls-section">
            <div className="event-selector-container">
              <label className="event-selector-label">
                <Users size={18} />
                Evento a escanear
              </label>
              <select
                className="event-selector"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={isScanning || loading}
              >
                <option value="">Seleccionar evento...</option>
                <option value="inscripciones">Inscripciones Generales</option>
                <option value="asistenciainaugural">Asistencia Inaugural</option>
                <option value="liderazgo">Liderazgo</option>
                <option value="hackathon">Hackathon</option>
              </select>
            </div>

            {/* Estado de la cámara */}
            <div className={`camera-status ${isScanning ? 'active' : 'inactive'} ${scanError ? 'error' : ''}`}>
              <div className="camera-status-indicator">
                <div className={`status-dot ${isScanning ? 'recording' : ''}`}></div>
                <span className="status-text">
                  {scanError ? `Error: ${scanError}` : 
                   loading ? 'Cargando...' : 
                   isScanning ? 'Cámara activa - Escaneando' : 'Cámara inactiva'}
                </span>
              </div>
            </div>
          </div>

          {/* Área del scanner */}
          <div className="scanner-area">
            <div id="qr-reader" className="qr-reader" />
            
            {/* Overlay cuando no está escaneando */}
            {!isScanning && !loading && (
              <div className="scanner-placeholder">
                <CameraOff size={64} className="placeholder-icon" />
                <h3>Cámara inactiva</h3>
                <p>Selecciona un evento y presiona "Iniciar Scanner" para comenzar</p>
              </div>
            )}

            {/* Overlay de carga */}
            {loading && (
              <div className="scanner-loading">
                <Loader2 size={48} className="loading-spinner-icon" />
                <p>Iniciando cámara...</p>
              </div>
            )}
          </div>

          {/* Controles del scanner */}
          <div className="scanner-controls">
            <button
              onClick={handleStartScanner}
              className="btn btn-primary btn-scanner-start"
              disabled={isScanning || loading || !selectedEvent}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="loading-spinner-icon" />
                  Iniciando...
                </>
              ) : isScanning ? (
                <>
                  <Camera size={18} />
                  Escaneando...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Iniciar Scanner
                </>
              )}
            </button>

            <button
              onClick={handleStopScanner}
              className="btn btn-danger"
              disabled={!isScanning || loading}
            >
              <Square size={18} />
              Detener Scanner
            </button>

            <button
              onClick={resetScannerState}
              className="btn btn-secondary"
              disabled={loading}
            >
              <RotateCcw size={18} />
              Reiniciar
            </button>
          </div>

          {/* Mensaje de estado */}
          <div className={`scan-message ${message.type}`}>
            <div className="message-icon">
              {getMessageIcon()}
            </div>
            <div className="message-content">
              <p>{message.text}</p>
            </div>
          </div>
        </div>

        {/* Tarjeta de información del usuario */}
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