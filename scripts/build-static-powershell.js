const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build estático con PowerShell...');

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
  // Mover directorio API usando PowerShell
  if (fs.existsSync(appApiDir)) {
    console.log('📦 Moviendo directorio API usando PowerShell...');
    try {
      execSync(`powershell -Command "Move-Item -Path '${appApiDir}' -Destination '${apiBackupDir}' -Force"`, { stdio: 'inherit' });
      apiMoved = true;
    } catch (error) {
      console.log('⚠️ No se pudo mover con PowerShell, intentando con fs...');
      fs.renameSync(appApiDir, apiBackupDir);
      apiMoved = true;
    }
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
    try {
      execSync(`powershell -Command "Move-Item -Path '${apiBackupDir}' -Destination '${appApiDir}' -Force"`, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ No se pudo restaurar con PowerShell, intentando con fs...');
      fs.renameSync(apiBackupDir, appApiDir);
    }
  }
}

console.log('🎉 Proceso completado!');
