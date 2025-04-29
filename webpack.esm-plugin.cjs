class ESMDynamicImportPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('ESMDynamicImportPlugin', (compilation) => {
      compilation.hooks.optimizeChunkModules.tap(
        'ESMDynamicImportPlugin',
        (chunks, modules) => {
          for (const module of modules) {
            if (module.resource && module.resource.includes('electron-store')) {
              module.buildInfo = module.buildInfo || {};
              module.buildInfo.exportsType = 'namespace';
            }
          }
        }
      );
    });
  }
}

module.exports = ESMDynamicImportPlugin;
