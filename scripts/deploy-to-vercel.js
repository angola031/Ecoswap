#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deployment a Vercel');
console.log('');

try {
    // 1. Verificar que Vercel CLI esté instalado
    console.log('🔍 Verificando Vercel CLI...');
    try {
        execSync('vercel --version', { stdio: 'pipe' });
        console.log('✅ Vercel CLI instalado correctamente');
    } catch (error) {
        console.log('❌ Vercel CLI no está instalado');
        console.log('📦 Instalando Vercel CLI...');
        execSync('npm install -g vercel', { stdio: 'inherit' });
        console.log('✅ Vercel CLI instalado');
    }

    // 2. Verificar variables de entorno
    console.log('');
    console.log('🔍 Verificando variables de entorno...');
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('⚠️ Variables de entorno faltantes:');
        missingVars.forEach(varName => {
            console.log(`   - ${varName}`);
        });
        console.log('');
        console.log('📋 Configura estas variables en:');
        console.log('   1. Dashboard de Vercel: https://vercel.com/dashboard');
        console.log('   2. Ve a tu proyecto > Settings > Environment Variables');
        console.log('   3. O usa: vercel env add <variable_name>');
        console.log('');
    } else {
        console.log('✅ Todas las variables de entorno están configuradas');
    }

    // 3. Build de la aplicación
    console.log('');
    console.log('📦 Construyendo aplicación...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completado');

    // 4. Login a Vercel (si es necesario)
    console.log('');
    console.log('🔐 Verificando autenticación con Vercel...');
    try {
        execSync('vercel whoami', { stdio: 'pipe' });
        console.log('✅ Ya estás autenticado en Vercel');
    } catch (error) {
        console.log('🔑 Necesitas autenticarte con Vercel');
        console.log('📋 Ejecuta: vercel login');
        console.log('');
        execSync('vercel login', { stdio: 'inherit' });
    }

    // 5. Deploy a Vercel
    console.log('');
    console.log('🌐 Desplegando a Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });

    console.log('');
    console.log('🎉 ¡Deployment completado exitosamente!');
    console.log('🌐 Tu aplicación estará disponible en:');
    console.log('   - https://ecoswap.vercel.app');
    console.log('   - O tu dominio personalizado');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Configura las variables de entorno en Vercel');
    console.log('   2. Conecta tu repositorio de GitHub');
    console.log('   3. Habilita el deploy automático');
    console.log('');

} catch (error) {
    console.error('❌ Error durante el deployment:', error.message);
    console.log('');
    console.log('💡 Soluciones:');
    console.log('   1. Verifica que estés autenticado: vercel login');
    console.log('   2. Configura las variables de entorno');
    console.log('   3. Asegúrate de que el build funcione: npm run build');
    process.exit(1);
}
