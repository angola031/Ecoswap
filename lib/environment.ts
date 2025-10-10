/**
 * Detección de entorno y configuración para Cloudflare
 */

export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
export const isCloudflare = typeof window !== 'undefined' && (
    window.location.hostname.includes('cloudflare') ||
    window.location.hostname.includes('pages.dev') ||
    window.location.hostname.includes('workers.dev') ||
    // Detectar si estamos en Cloudflare por headers o características
    (typeof window !== 'undefined' && window.navigator.userAgent.includes('Cloudflare'))
)

export const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('local')
)

// Configuración específica para Cloudflare
export const cloudflareConfig = {
    // En Cloudflare, las cookies de Cloudflare son válidas
    allowCloudflareCookies: isCloudflare || isProduction,
    
    // En producción, habilitar realtime
    enableRealtime: isProduction && !isLocalhost,
    
    // En desarrollo local, deshabilitar realtime
    disableRealtime: isLocalhost || isDevelopment,
    
    // Configuración de cookies
    cookieDomain: isProduction ? '.ecoswap.co' : 'localhost',
    
    // Configuración de WebSocket
    websocketUrl: isProduction ? 'wss://ecoswap.co' : 'wss://localhost:3000'
}

// Función para obtener configuración específica del entorno
export function getEnvironmentConfig() {
    return {
        isDevelopment,
        isProduction,
        isCloudflare,
        isLocalhost,
        config: cloudflareConfig
    }
}

// Función para verificar si debemos aplicar configuraciones de desarrollo
export function shouldApplyDevConfig() {
    return isDevelopment || isLocalhost
}

// Función para verificar si estamos en un entorno de Cloudflare
export function isCloudflareEnvironment() {
    return isCloudflare || (isProduction && !isLocalhost)
}
