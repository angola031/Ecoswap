#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build estático...');

// Limpiar directorio out anterior
const outDir = path.join(process.cwd(), 'out');
if (fs.existsSync(outDir)) {
  console.log('🧹 Limpiando directorio out anterior...');
  fs.rmSync(outDir, { recursive: true, force: true });
}

// Crear directorio temporal para API
const apiBackupDir = path.join(process.cwd(), 'api-backup');
if (!fs.existsSync(apiBackupDir)) {
  fs.mkdirSync(apiBackupDir);
}

// Mover solo rutas API problemáticas fuera del directorio app
const appApiDir = path.join(process.cwd(), 'app', 'api');
const dynamicPages = [
  'chat',
  'editar-producto', 
  'interaccion',
  'producto'
];

const dynamicRoutes = [
  'auth/callback'
];

// Mover solo rutas API específicas que causan problemas
const problematicApiRoutes = [
  'supabase/health',
  'admin/chat',
  'admin/roles',
  'admin/users',
  'admin/stats',
  'admin/verificaciones',
  'chat',
  'interactions',
  'intercambios',
  'products',
  'notifications',
  'ratings',
  'upload',
  'users'
];

if (fs.existsSync(appApiDir)) {
  console.log('📦 Moviendo rutas API problemáticas...');
  
  // Crear directorio de respaldo para API
  const backupApiDir = path.join(apiBackupDir, 'api');
  if (!fs.existsSync(backupApiDir)) {
    fs.mkdirSync(backupApiDir, { recursive: true });
  }
  
  // Mover solo las rutas problemáticas
  problematicApiRoutes.forEach(route => {
    const sourcePath = path.join(appApiDir, route);
    const destPath = path.join(backupApiDir, route);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`  - Moviendo ${route}...`);
      // Crear directorio padre si no existe
      const destParent = path.dirname(destPath);
      if (!fs.existsSync(destParent)) {
        fs.mkdirSync(destParent, { recursive: true });
      }
      fs.renameSync(sourcePath, destPath);
    }
  });
}

// Mover páginas dinámicas
console.log('📦 Moviendo páginas dinámicas...');
dynamicPages.forEach(page => {
  const pageDir = path.join(process.cwd(), 'app', page);
  if (fs.existsSync(pageDir)) {
    fs.renameSync(pageDir, path.join(apiBackupDir, page));
  }
});

// Mover rutas dinámicas
console.log('📦 Moviendo rutas dinámicas...');
dynamicRoutes.forEach(route => {
  const routeDir = path.join(process.cwd(), 'app', route);
  if (fs.existsSync(routeDir)) {
    fs.renameSync(routeDir, path.join(apiBackupDir, route.replace('/', '_')));
  }
});

try {
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
    // Restaurar rutas API problemáticas
    const backupApiDir = path.join(apiBackupDir, 'api');
    if (fs.existsSync(backupApiDir)) {
      console.log('🔄 Restaurando rutas API...');
      
      problematicApiRoutes.forEach(route => {
        const sourcePath = path.join(backupApiDir, route);
        const destPath = path.join(appApiDir, route);
        
        if (fs.existsSync(sourcePath)) {
          console.log(`  - Restaurando ${route}...`);
          // Crear directorio padre si no existe
          const destParent = path.dirname(destPath);
          if (!fs.existsSync(destParent)) {
            fs.mkdirSync(destParent, { recursive: true });
          }
          fs.renameSync(sourcePath, destPath);
        }
      });
    }
  
  // Restaurar páginas dinámicas
  console.log('🔄 Restaurando páginas dinámicas...');
  dynamicPages.forEach(page => {
    const backupPageDir = path.join(apiBackupDir, page);
    if (fs.existsSync(backupPageDir)) {
      fs.renameSync(backupPageDir, path.join(process.cwd(), 'app', page));
    }
  });
  
  // Restaurar rutas dinámicas
  console.log('🔄 Restaurando rutas dinámicas...');
  dynamicRoutes.forEach(route => {
    const backupRouteDir = path.join(apiBackupDir, route.replace('/', '_'));
    if (fs.existsSync(backupRouteDir)) {
      fs.renameSync(backupRouteDir, path.join(process.cwd(), 'app', route));
    }
  });
}

console.log('🎉 Proceso completado!');
