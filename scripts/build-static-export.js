const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build estático con next export...');

// Limpiar directorio out anterior
const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  console.log('🧹 Limpiando directorio out anterior...');
  fs.rmSync(outDir, { recursive: true, force: true });
}

try {
  // Ejecutar build estático
  console.log('🔨 Ejecutando build estático...');
  
  // Copiar configuración estática
  fs.copyFileSync('next.config.static.js', 'next.config.js');
  
  try {
    // Primero hacer build normal
    console.log('📦 Ejecutando next build...');
    execSync('npx next build', { stdio: 'inherit' });
    
    // Luego hacer export estático
    console.log('📤 Ejecutando next export...');
    execSync('npx next export', { stdio: 'inherit' });
    
  } finally {
    // Restaurar configuración original
    fs.copyFileSync('next.config.original.js', 'next.config.js');
  }
  
  console.log('✅ Build estático completado exitosamente!');
  console.log('📁 Archivos estáticos generados en: ./out');

} catch (error) {
  console.error('❌ Error durante el build estático:', error.message);
  process.exit(1);
}

console.log('🎉 Proceso completado!');
