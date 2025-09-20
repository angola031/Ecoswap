// Script para ejecutar en la consola del navegador para verificar cookies
// Copia y pega este código en la consola del navegador (F12 > Console)

console.log('🔍 VERIFICACIÓN DE COOKIES EN EL NAVEGADOR');
console.log('==========================================');

// Función para verificar cookies
function verificarCookies() {
    console.log('\n📋 Estado actual de las cookies:');
    console.log('document.cookie:', document.cookie);
    
    if (document.cookie) {
        const cookies = document.cookie.split(';');
        console.log(`Total de cookies: ${cookies.length}`);
        
        cookies.forEach((cookie, index) => {
            if (cookie.trim()) {
                const [name, value] = cookie.split('=');
                console.log(`${index + 1}. ${name.trim()}: ${value?.substring(0, 50)}...`);
            }
        });
    } else {
        console.log('✅ No hay cookies presentes');
    }
}

// Función para verificar localStorage
function verificarLocalStorage() {
    console.log('\n📋 Estado actual del localStorage:');
    const keys = Object.keys(localStorage);
    
    if (keys.length > 0) {
        console.log(`Total de elementos: ${keys.length}`);
        keys.forEach(key => {
            console.log(`${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
        });
    } else {
        console.log('✅ localStorage está vacío');
    }
}

// Función para simular limpieza de cookies
function simularLimpiezaCookies() {
    console.log('\n🧹 Simulando limpieza de cookies...');
    
    const allCookies = document.cookie.split(";");
    console.log(`Cookies encontradas: ${allCookies.length}`);
    
    allCookies.forEach(cookie => {
        if (cookie.trim()) {
            const cookieName = cookie.split('=')[0].trim();
            console.log(`Limpiando: ${cookieName}`);
            
            // Múltiples configuraciones para asegurar limpieza
            const domain = window.location.hostname;
            const baseDomain = domain.startsWith('www.') ? domain.substring(4) : domain;
            
            const configs = [
                `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
                `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`,
                `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain};`,
                `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${baseDomain};`,
                `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${baseDomain};`
            ];
            
            configs.forEach(config => {
                document.cookie = config;
            });
        }
    });
    
    console.log('✅ Limpieza simulada completada');
    verificarCookies();
}

// Función para simular limpieza de localStorage
function simularLimpiezaLocalStorage() {
    console.log('\n🧹 Simulando limpieza de localStorage...');
    localStorage.clear();
    console.log('✅ localStorage limpiado');
    verificarLocalStorage();
}

// Función para verificar sesión de Supabase
async function verificarSesionSupabase() {
    console.log('\n📋 Verificando sesión de Supabase...');
    
    try {
        // Si Supabase está disponible globalmente
        if (typeof window !== 'undefined' && window.supabase) {
            const { data: { session } } = await window.supabase.auth.getSession();
            console.log('Sesión de Supabase:', session ? 'ACTIVA' : 'INACTIVA');
            if (session) {
                console.log('Usuario:', session.user?.email);
                console.log('Expira en:', new Date(session.expires_at * 1000));
            }
        } else {
            console.log('⚠️ Supabase no está disponible globalmente');
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}

// Ejecutar verificaciones
console.log('\n🔍 Ejecutando verificaciones...');
verificarCookies();
verificarLocalStorage();
verificarSesionSupabase();

// Mostrar funciones disponibles
console.log('\n🛠️ Funciones disponibles:');
console.log('- verificarCookies() - Verificar estado actual de cookies');
console.log('- verificarLocalStorage() - Verificar estado actual de localStorage');
console.log('- verificarSesionSupabase() - Verificar sesión de Supabase');
console.log('- simularLimpiezaCookies() - Simular limpieza de cookies');
console.log('- simularLimpiezaLocalStorage() - Simular limpieza de localStorage');

console.log('\n📝 Instrucciones de uso:');
console.log('1. Ejecuta verificarCookies() antes del logout');
console.log('2. Haz logout desde la aplicación');
console.log('3. Ejecuta verificarCookies() después del logout');
console.log('4. Compara los resultados para verificar la limpieza');

// Exportar funciones para uso manual
window.verificarCookies = verificarCookies;
window.verificarLocalStorage = verificarLocalStorage;
window.verificarSesionSupabase = verificarSesionSupabase;
window.simularLimpiezaCookies = simularLimpiezaCookies;
window.simularLimpiezaLocalStorage = simularLimpiezaLocalStorage;
