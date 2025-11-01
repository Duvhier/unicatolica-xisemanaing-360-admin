const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const backendUrl = 'https://unicatolica-xisemanaing-360-backend.vercel.app';
  
  console.log('[Proxy] Configurando proxy para:', backendUrl);
  
  // Proxy para rutas /api
  // Mismo problema: app.use('/api', ...) remueve /api del path
  // Necesitamos pathRewrite para mantenerlo
  const apiProxy = createProxyMiddleware({
    target: backendUrl,
    changeOrigin: true,
    secure: true,
    logLevel: 'debug',
    // Agregar /api de vuelta al path
    // Entrada: /actividades/todas -> Salida: /api/actividades/todas
    pathRewrite: function (path, req) {
      const newPath = `/api${path}`;
      console.log(`[Proxy] API PathRewrite: ${path} -> ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] API ${req.method} ${req.url}`);
      console.log(`[Proxy] API Path enviado al backend: ${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] API Respuesta ${proxyRes.statusCode} para ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy API Error]', err.message);
    }
  });
  
  app.use('/api', apiProxy);

  // Proxy para rutas /organizador
  // PROBLEMA: app.use('/organizador', ...) automáticamente REMUEVE /organizador del path
  // Cuando llega /organizador/login, el proxy recibe solo /login
  // SOLUCIÓN: Usar pathRewrite para AGREGAR /organizador de vuelta
  const organizadorProxy = createProxyMiddleware({
    target: backendUrl,
    changeOrigin: true,
    secure: true,
    logLevel: 'debug',
    // CRÍTICO: pathRewrite agrega /organizador de vuelta al path
    // Cuando usas app.use('/organizador', ...), el path llega sin /organizador
    // Entrada: /login -> Salida: /organizador/login
    // Entrada: /inscripciones -> Salida: /organizador/inscripciones
    pathRewrite: function (path, req) {
      // El path viene sin /organizador, agregarlo de vuelta
      const newPath = `/organizador${path}`;
      console.log(`[Proxy] PathRewrite: ${path} -> ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.url}`);
      console.log(`[Proxy] Path enviado al backend: ${proxyReq.path}`);
      console.log(`[Proxy] URL completa: ${backendUrl}${proxyReq.path}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Respuesta ${proxyRes.statusCode} para ${req.url}`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy Error]', err.message);
      console.error('[Proxy Error] Petición fallida:', req.method, req.url);
    }
  });
  
  app.use('/organizador', organizadorProxy);
  
  console.log('[Proxy] Proxy configurado correctamente para /organizador');
};

