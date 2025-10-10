const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build estático final...');

// Limpiar directorio out anterior
const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  console.log('🧹 Limpiando directorio out anterior...');
  fs.rmSync(outDir, { recursive: true, force: true });
}

// Crear directorio temporal para API
const apiBackupDir = path.join(process.cwd(), 'api-backup-temp');
const appApiDir = path.join(process.cwd(), 'app', 'api');

let apiMoved = false;

try {
  // Mover directorio API completo
  if (fs.existsSync(appApiDir)) {
    console.log('📦 Moviendo directorio API completo...');
    fs.renameSync(appApiDir, apiBackupDir);
    apiMoved = true;
  }

  // Ejecutar build estático
  console.log('🔨 Ejecutando build estático...');
  
  // Copiar configuración estática
  fs.copyFileSync('next.config.static.js', 'next.config.js');
  
  try {
    execSync('npx next build', { stdio: 'inherit' });
  } finally {
    // Restaurar configuración original
    fs.copyFileSync('next.config.original.js', 'next.config.js');
  }
  
  console.log('✅ Build estático completado exitosamente!');
  console.log('📁 Archivos estáticos generados en: ./out');

} catch (error) {
  console.error('❌ Error durante el build estático:', error.message);
  process.exit(1);
} finally {
  // Restaurar directorio API
  if (apiMoved && fs.existsSync(apiBackupDir)) {
    console.log('🔄 Restaurando directorio API...');
    fs.renameSync(apiBackupDir, appApiDir);
  }
}

console.log('🎉 Proceso completado!');
