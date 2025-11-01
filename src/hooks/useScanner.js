import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanError, setScanError] = useState('');
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const scannerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      const cleanup = async () => {
        try {
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop().catch(() => {});
          }
        } catch (error) {
          console.log('Cleanup completed');
        }
      };
      cleanup();
    };
  }, []);

  const startScanner = useCallback(async () => {
    try {
      console.log('🚀 Iniciando scanner...');
      
      // Limpiar estado previo
      setScanError('');
      setScannedData(null);
      
      if (!isMountedRef.current) return;
      setCameraStatus('starting');

      // Verificar que el elemento DOM existe
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        throw new Error('Elemento qr-reader no encontrado en el DOM');
      }

      // Limpiar cualquier instancia previa
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (err) {
          console.log('Limpiando instancia previa...');
        }
        scannerRef.current = null;
      }

      // Pequeña pausa para asegurar que el DOM esté listo
      await new Promise(resolve => setTimeout(resolve, 100));

      // Crear nueva instancia del scanner
      scannerRef.current = new Html5Qrcode("qr-reader");
      
      console.log('📷 Obteniendo cámaras disponibles...');
      const cameras = await Html5Qrcode.getCameras();
      
      if (!isMountedRef.current) return;

      if (cameras && cameras.length > 0) {
        console.log(`✅ ${cameras.length} cámara(s) encontrada(s)`);
        
        // Usar la cámara trasera si está disponible, sino la primera
        const rearCamera = cameras.find(cam => 
          cam.label.toLowerCase().includes('back') || 
          cam.label.toLowerCase().includes('rear') ||
          cam.label.toLowerCase().includes('environment')
        );
        
        const cameraId = rearCamera ? rearCamera.id : cameras[0].id;
        
        console.log('🎥 Iniciando cámara...');
        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // QR escaneado exitosamente
            console.log('✅ QR escaneado:', decodedText);
            
            if (!isMountedRef.current) return;
            
            setScannedData(decodedText);
            setCameraStatus('scanned');
            
            // Detener scanner después de escanear exitosamente
            setTimeout(async () => {
              try {
                if (scannerRef.current && scannerRef.current.isScanning) {
                  await scannerRef.current.stop();
                  setIsScanning(false);
                  setCameraStatus('inactive');
                }
              } catch (error) {
                console.log('Scanner detenido después de escaneo');
                setIsScanning(false);
                setCameraStatus('inactive');
              }
            }, 100);
          },
          (errorMessage) => {
            // Error durante el escaneo (no crítico)
            // No mostramos errores comunes como "NotFoundException"
            if (errorMessage && 
                !errorMessage.includes('NotFoundException') &&
                !errorMessage.includes('No multi format readers configured') &&
                !errorMessage.includes('No QR code found')) {
              console.log('ℹ️ Info escaneo:', errorMessage);
            }
          }
        );
        
        if (isMountedRef.current) {
          setIsScanning(true);
          setCameraStatus('active');
          console.log('✅ Scanner iniciado correctamente');
        }
      } else {
        throw new Error('No se encontraron cámaras disponibles. Verifica los permisos.');
      }
    } catch (error) {
      console.error('❌ Error iniciando scanner:', error);
      
      if (isMountedRef.current) {
        let errorMessage = error.message;
        
        // Mensajes de error más amigables
        if (errorMessage.includes('NotAllowedError')) {
          errorMessage = 'Permiso de cámara denegado. Por favor permite el acceso a la cámara.';
        } else if (errorMessage.includes('NotFoundError')) {
          errorMessage = 'No se encontró cámara disponible.';
        } else if (errorMessage.includes('NotSupportedError')) {
          errorMessage = 'Tu navegador no soporta el escaneo de QR.';
        } else if (errorMessage.includes('InsecureContextError')) {
          errorMessage = 'Se requiere HTTPS para usar la cámara.';
        }
        
        setScanError(errorMessage);
        setCameraStatus('error');
        setIsScanning(false);
      }
      
      // Limpiar scanner en caso de error
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          // Ignorar errores de cleanup
        }
        scannerRef.current = null;
      }
    }
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      console.log('🛑 Deteniendo scanner...');
      
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        
        // Verificar si está escaneando antes de detener
        if (scanner.isScanning) {
          await scanner.stop();
          console.log('✅ Scanner detenido correctamente');
        }
        
        // Limpiar la interfaz
        await scanner.clear();
        scannerRef.current = null;
      }
      
      if (isMountedRef.current) {
        setIsScanning(false);
        setCameraStatus('inactive');
        setScanError('');
      }
    } catch (error) {
      console.log('ℹ️ Scanner ya detenido o no iniciado');
      
      if (isMountedRef.current) {
        setIsScanning(false);
        setCameraStatus('inactive');
      }
    }
  }, []);

  const resetScanner = useCallback(() => {
    setScannedData(null);
    setScanError('');
    if (!isScanning) {
      setCameraStatus('inactive');
    }
  }, [isScanning]);

  return {
    isScanning,
    scannedData,
    scanError,
    cameraStatus,
    startScanner,
    stopScanner,
    resetScanner
  };
};