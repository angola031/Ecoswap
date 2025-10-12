#!/usr/bin/env node

// Script para deployment en Cloudflare Pages
// Este script se ejecutará cuando Cloudflare Pages ejecute "npx wrangler deploy"

const { execSync } = require('child_process');

console.log('🚀 Iniciando deployment para Cloudflare Pages...');

try {
    // Verificar si estamos en un entorno de Cloudflare Pages
    if (process.env.CF_PAGES) {
        console.log('✅ Detectado entorno de Cloudflare Pages');
        
        // Usar wrangler pages deploy en lugar de wrangler deploy
        execSync('npx wrangler pages deploy out --project-name ecoswap', { 
            stdio: 'inherit'
        });
    } else {
        console.log('⚠️ No se detectó entorno de Cloudflare Pages, usando deploy normal');
        
        // Deployment normal para desarrollo local
        execSync('npx wrangler pages deploy out --project-name ecoswap', { 
            stdio: 'inherit'
        });
    }
    
    console.log('✅ Deployment completado exitosamente!');
} catch (error) {
    console.error('❌ Error durante el deployment:', error.message);
    process.exit(1);
}
