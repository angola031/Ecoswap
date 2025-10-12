const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️ Configuración Completa del Entorno de Desarrollo');
console.log('');

// Crear archivo .env.local si no existe
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envLocalPath)) {
    console.log('📝 Creando archivo .env.local...');
    
    const envContent = `# Variables de entorno para desarrollo local
# Reemplaza estos valores con tus credenciales reales de Supabase

NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key_aqui

# Configuración de desarrollo
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
`;

    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ Archivo .env.local creado');
} else {
    console.log('ℹ️ El archivo .env.local ya existe');
}

// Verificar si node_modules existe
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Instalando dependencias...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencias instaladas');
    } catch (error) {
        console.error('❌ Error instalando dependencias:', error.message);
    }
} else {
    console.log('ℹ️ Dependencias ya instaladas');
}

console.log('');
console.log('📋 Próximos pasos:');
console.log('');
console.log('1. 📝 Edita el archivo .env.local con tus credenciales de Supabase:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('');
console.log('2. 🚀 Ejecuta el servidor de desarrollo:');
console.log('   npm run dev');
console.log('');
console.log('3. 🌐 Abre tu navegador en:');
console.log('   http://localhost:3000');
console.log('');
console.log('💡 Para obtener tus credenciales de Supabase:');
console.log('   1. Ve a https://app.supabase.com/');
console.log('   2. Selecciona tu proyecto');
console.log('   3. Ve a Settings > API');
console.log('   4. Copia la URL y las claves');
console.log('');
console.log('🔧 Scripts disponibles:');
console.log('   npm run dev          - Iniciar servidor de desarrollo');
console.log('   npm run build        - Construir para producción');
console.log('   npm run lint         - Verificar código');
console.log('   npm run type-check   - Verificar tipos TypeScript');
