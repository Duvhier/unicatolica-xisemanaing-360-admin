import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
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

      // ✅ CORREGIDO: Remover Html5QrcodeScanType que no está definido
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          // ✅ SIMPLIFICADO: Remover supportedScanTypes que causaba error
        },
        false // verbose
      );

      // Configurar callbacks
      scannerRef.current.render(
        (decodedText) => {
          // QR escaneado exitosamente
          console.log('✅ QR escaneado:', decodedText);
          handleQRScanned(decodedText);
        },
        (error) => {
          // Error durante el escaneo (no fatal)
          console.log('ℹ️ Info escaneo:', error);
        }
      );

      setIsScanning(true);
      setMessage({
        text: '🎥 Cámara activa - Escaneando...',
        type: 'info'
      });

    } catch (error) {
      console.error('❌ Error iniciando scanner:', error);
      setScanError(error.message);
      setMessage({
        text: `❌ Error: ${error.message}`,
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
        text: '⏸️ Scanner detenido',
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

      // ✅ CORRECCIÓN: Extraer el ID del objeto JSON del QR
      let inscripcionId = qrData;

      try {
        // Intentar parsear como JSON
        const qrObject = JSON.parse(qrData);
        if (qrObject && qrObject.id) {
          inscripcionId = qrObject.id;
          console.log('✅ ID extraído del QR:', inscripcionId);
        }
      } catch (jsonError) {
        // Si no es JSON válido, usar el valor directamente
        console.log('ℹ️ QR no es JSON, usando valor directo:', qrData);
      }

      // Detener scanner temporalmente
      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      // ✅ CORREGIDO: Pasar solo el ID, no el objeto completo
      const result = await apiClient.buscarInscripcion(inscripcionId, selectedEvent);

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
    // Verificar permisos de cámara primero
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('✅ Permisos de cámara concedidos');
      // Liberar cámara inmediatamente después de verificar permisos
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

    // Si estaba escaneando, reiniciar
    if (isScanning) {
      setTimeout(() => {
        startScanner();
      }, 500);
    }
  };

  const getCameraStatusText = () => {
    if (scanError) return `❌ Error: ${scanError}`;
    if (loading) return '🔄 Cargando...';
    if (isScanning) return '🎥 Cámara activa - Escaneando...';
    return '⏸️ Cámara inactiva';
  };

  const getCameraStatusClass = () => {
    if (scanError) return 'camera-status error';
    if (isScanning) return 'camera-status active';
    return 'camera-status inactive';
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

          {/* Selector de evento */}
          <div className="event-selector">
            <label>Evento:</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              disabled={isScanning}
            >
              <option value="">Seleccionar evento...</option>
              <option value="inscripciones">Inscripciones Generales</option>
              <option value="asistenciainaugural">Asistencia Inaugural</option>
              <option value="liderazgo">Liderazgo</option>
              <option value="hackathon">Hackathon</option>
            </select>
          </div>

          <div className={getCameraStatusClass()}>
            {getCameraStatusText()}
          </div>

          {/* Contenedor del scanner */}
          <div id="qr-reader" className="qr-reader" />

          <div className="scanner-controls">
            <button
              onClick={handleStartScanner}
              className="btn btn-primary"
              disabled={isScanning || loading || !selectedEvent}
            >
              {loading ? '🔄 Iniciando...' :
                isScanning ? '🎥 Escaneando...' : '🎥 Iniciar Scanner'}
            </button>

            <button
              onClick={handleStopScanner}
              className="btn btn-danger"
              disabled={!isScanning || loading}
            >
              ⏹️ Detener Scanner
            </button>

            <button
              onClick={resetScannerState}
              className="btn btn-secondary"
              disabled={loading}
            >
              🔄 Reiniciar
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