module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Deshabilitar source-map-loader para evitar warnings de source maps faltantes
      webpackConfig.module.rules = webpackConfig.module.rules.filter((rule) => {
        if (rule.enforce === 'pre' && rule.loader && typeof rule.loader === 'string' && rule.loader.includes('source-map-loader')) {
          return false; // Excluir source-map-loader
        }
        return true;
      });
      return webpackConfig;
    },
  },
};

