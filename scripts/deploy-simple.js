#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deployment Simple para Ecoswap');
console.log('');

try {
    // 1. Build
    console.log('📦 Construyendo aplicación...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 2. Limpiar cache
    const cacheDir = path.join(__dirname, '..', 'out', 'cache');
    if (fs.existsSync(cacheDir)) {
        console.log('🧹 Limpiando cache...');
        fs.rmSync(cacheDir, { recursive: true, force: true });
    }
    
    // 3. Commit si hay cambios
    try {
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Auto-deploy update"', { stdio: 'inherit' });
        console.log('✅ Cambios commiteados');
    } catch (e) {
        console.log('ℹ️ No hay cambios para commitear');
    }
    
    // 4. Deploy
    console.log('🌐 Desplegando a Cloudflare Pages...');
    execSync('npx wrangler pages deploy out --project-name ecoswap', { stdio: 'inherit' });
    
    console.log('');
    console.log('🎉 ¡Deployment completado exitosamente!');
    console.log('🌐 URL: https://ecoswap.pages.dev');
    
} catch (error) {
    console.error('❌ Error durante el deployment:', error.message);
    process.exit(1);
}
