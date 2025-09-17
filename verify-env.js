// Script para verificar variables de entorno
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Verificando configuración de variables de entorno...\n');

const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL'
];

let allConfigured = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== `tu_${varName.toLowerCase()}_aqui` && !value.includes('tu-proyecto')) {
        console.log(`✅ ${varName}: Configurado`);
    } else {
        console.log(`❌ ${varName}: NO CONFIGURADO o valor por defecto`);
        allConfigured = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
    console.log('🎉 ¡Todas las variables están configuradas correctamente!');
    console.log('💡 Reinicia tu servidor de desarrollo: npm run dev');
} else {
    console.log('⚠️  Necesitas configurar las variables de entorno.');
    console.log('📝 Edita el archivo .env.local con las claves reales de Supabase.');
    console.log('🔗 Obtén las claves en: https://supabase.com/dashboard → Settings → API');
}

console.log('\n📋 Variables necesarias:');
console.log('- NEXT_PUBLIC_SUPABASE_URL: URL de tu proyecto Supabase');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY: Clave pública anónima');
console.log('- SUPABASE_SERVICE_ROLE_KEY: Clave de servicio (mantener secreta)');
console.log('- NEXT_PUBLIC_APP_URL: URL de tu aplicación (http://localhost:3000)');

