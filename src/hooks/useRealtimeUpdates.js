import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para actualizaciones en tiempo real
 * Simula WebSocket con polling inteligente
 */
export const useRealtimeUpdates = (coleccion, onUpdate, enabled = true) => {
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const isVisibleRef = useRef(true);

  // Detectar visibilidad de la página
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchUpdates = useCallback(async () => {
    if (!enabled || !coleccion || !isVisibleRef.current) return;

    try {
      // Llamar a la API para obtener actualizaciones
      // Puedes usar tu apiClient aquí
      const response = await fetch(`/api/updates/${coleccion}?since=${lastUpdateRef.current}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.updates && data.updates.length > 0) {
          lastUpdateRef.current = Date.now();
          onUpdate(data.updates);
          
          // Mostrar notificación
          if (window.showNotification) {
            window.showNotification(
              `${data.updates.length} nueva${data.updates.length > 1 ? 's' : ''} actualización${data.updates.length > 1 ? 'es' : ''}`,
              'info',
              3000
            );
          }
        }
      }
    } catch (error) {
      console.error('Error fetching realtime updates:', error);
    }
  }, [coleccion, enabled, onUpdate]);

  useEffect(() => {
    if (!enabled || !coleccion) return;

    // Polling cada 10 segundos
    intervalRef.current = setInterval(fetchUpdates, 10000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, coleccion, fetchUpdates]);

  return {
    forceUpdate: fetchUpdates,
    lastUpdate: lastUpdateRef.current
  };
};

/**
 * Hook para conexión WebSocket real (opcional)
 */
export const useWebSocket = (url, onMessage, enabled = true) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        
        if (window.showNotification) {
          window.showNotification('Conectado en tiempo real', 'success', 2000);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        
        // Intentar reconectar con backoff exponencial
        if (enabled && reconnectAttemptsRef.current < 5) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
            connect();
          }, timeout);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [url, enabled, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return {
    send,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};

export default useRealtimeUpdates;