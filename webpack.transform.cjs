const path = require('path');

module.exports = function transformConfig(config) {
  // Fix devServer settings
  if (config.devServer) {
    config.devServer.static = {
      directory: path.join(__dirname, 'src'),
      publicPath: '/',
    };

    // Remove contentBase (deprecated)
    delete config.devServer.contentBase;

    // Make sure the port is correct
    if (config.devServer) {
      config.devServer.port = 9000; // Match your webpack port
    }

    // Fix MIME types
    config.devServer.headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    };

    // Let webpack determine the correct content type
    delete config.devServer.mimeTypes;
    delete config.devServer.headers['Content-Type'];
  }

  // Make sure electron target is correctly set
  config.target = 'electron-renderer';

  // Handle ARM64 path issues by normalizing the output path
  if (config.output && config.output.path) {
    // Remove any architecture-specific path components
    const normalizedPath = config.output.path.replace(/\/arm64$/, '');
    config.output.path = normalizedPath;

    // Ensure the directory structure exists
    const fs = require('fs');
    try {
      if (!fs.existsSync(normalizedPath)) {
        fs.mkdirSync(normalizedPath, { recursive: true });
      }
    } catch (err) {
      console.warn('Could not create output directory:', err);
    }
  }

  return config;
};
