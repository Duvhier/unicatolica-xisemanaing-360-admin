import { useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanError, setScanError] = useState('');
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const scannerRef = useRef(null);

  const startScanner = useCallback(async () => {
    try {
      setScanError('');
      setCameraStatus('starting');

      // Crear instancia del scanner
      scannerRef.current = new Html5Qrcode("qr-reader");
      
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length) {
        const cameraId = cameras[0].id;
        
        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            // QR escaneado exitosamente
            setScannedData(decodedText);
            setCameraStatus('scanned');
            // Detener scanner después de escanear
            try {
              if (scannerRef.current) {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                setIsScanning(false);
              }
            } catch (error) {
              console.error('Error stopping scanner after scan:', error);
            }
          },
          (errorMessage) => {
            // Error durante el escaneo, pero no detenemos el scanner
            console.log('Scan error:', errorMessage);
          }
        );
        
        setIsScanning(true);
        setCameraStatus('active');
      } else {
        throw new Error('No se encontraron cámaras disponibles');
      }
    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanError(error.message);
      setCameraStatus('error');
    }
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current && isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
        setCameraStatus('inactive');
      }
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setScanError('Error al detener el scanner');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const resetScanner = useCallback(() => {
    setScannedData(null);
    setScanError('');
    setCameraStatus('inactive');
  }, []);

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

