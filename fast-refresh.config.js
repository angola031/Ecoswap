// Configuración específica para Fast Refresh
module.exports = {
  // Configuración de Fast Refresh
  fastRefresh: {
    // Habilitar Fast Refresh
    enabled: true,
    // Configuración de componentes que pueden causar problemas
    skipComponents: [
      // Componentes que no deben usar Fast Refresh
    ],
    // Configuración de archivos que deben recargar completamente
    fullReloadFiles: [
      // Archivos que requieren recarga completa
      'next.config.js',
      'tailwind.config.js',
      '.env.local'
    ]
  }
}
