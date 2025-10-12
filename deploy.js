#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deployment para Cloudflare Pages...');

// Verificar que el directorio out existe
const outDir = path.join(__dirname, 'out');
if (!fs.existsSync(outDir)) {
    console.error('❌ Directorio "out" no encontrado. Ejecutando build...');
    try {
        execSync('npm run build:cloudflare', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error durante el build:', error.message);
        process.exit(1);
    }
}

// Verificar que el directorio out tiene contenido
const outFiles = fs.readdirSync(outDir);
if (outFiles.length === 0) {
    console.error('❌ Directorio "out" está vacío. Ejecutando build...');
    try {
        execSync('npm run build:cloudflare', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error durante el build:', error.message);
        process.exit(1);
    }
}

console.log('✅ Build completado. Iniciando deployment...');

try {
    // Usar wrangler pages deploy con API token configurado
    execSync('npx wrangler pages deploy out --project-name ecoswap', { 
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_ENV: 'production',
            CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'ofFE1auhQiIpHwIAOZ6lsjVE2xFLioB5ooBBLnfM'
        }
    });
    console.log('✅ Deployment completado exitosamente!');
} catch (error) {
    console.error('❌ Error durante el deployment:', error.message);
    process.exit(1);
}
