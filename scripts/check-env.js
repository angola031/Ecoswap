#!/usr/bin/env node

/**
 * Script para verificar variables de entorno
 */

console.log('🔍 Verificando variables de entorno...\n');

const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let allConfigured = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
        console.log(`❌ ${varName}: NO DEFINIDA`);
        allConfigured = false;
    } else if (value.includes('tu-') || value.includes('aqui')) {
        console.log(`⚠️  ${varName}: VALOR DE EJEMPLO (${value})`);
        allConfigured = false;
    } else {
        console.log(`✅ ${varName}: CONFIGURADA`);
    }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
    console.log('🎉 Todas las variables están configuradas correctamente');
    console.log('\n📋 Si aún tienes problemas:');
    console.log('1. Verifica que tu proyecto Supabase esté activo');
    console.log('2. Asegúrate de que las tablas necesarias existan');
    console.log('3. Revisa la consola del navegador para errores específicos');
} else {
    console.log('❌ Configuración incompleta');
    console.log('\n📝 Para solucionarlo:');
    console.log('1. Crea un archivo .env.local en la raíz del proyecto');
    console.log('2. Copia las variables desde env.example');
    console.log('3. Configura con tus credenciales reales de Supabase');
    console.log('\n💡 Ejemplo de .env.local:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-real');
}

console.log('\n🔧 Para ejecutar este script: node scripts/check-env.js');