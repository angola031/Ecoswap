/**
 * Solución específica para cookies de Cloudflare problemáticas
 */

// Función para eliminar cookies de Cloudflare de forma definitiva
export function eliminateCloudflareCookies() {
    if (typeof window === 'undefined') return

    const cloudflareCookies = [
        '__cf_bm',
        '_cfuvid', 
        'cf_clearance',
        '__cfduid',
        'cf_ob_info',
        'cf_use_ob',
        '__cfwaitingroom'
    ]

    // Función de limpieza agresiva
    const aggressiveCleanup = () => {
        try {
            // Obtener todas las cookies actuales
            const currentCookies = document.cookie.split(';')
            
            cloudflareCookies.forEach(cookieName => {
                // Buscar y eliminar todas las variaciones de la cookie
                currentCookies.forEach(cookie => {
                    const trimmedCookie = cookie.trim()
                    if (trimmedCookie.startsWith(cookieName)) {
                        const cookieValue = trimmedCookie.split('=')[0]
                        
                        // Lista exhaustiva de dominios a probar
                        const domains = [
                            '', // Sin dominio (dominio actual)
                            window.location.hostname,
                            `.${window.location.hostname}`,
                            '.supabase.co',
                            '.supabase.io', 
                            '.localhost',
                            'localhost',
                            '127.0.0.1',
                            '.127.0.0.1',
                            '.local',
                            '.dev'
                        ]
                        
                        // Lista exhaustiva de paths a probar
                        const paths = [
                            '/',
                            '/api/',
                            '/auth/',
                            '/realtime/',
                            '/_next/',
                            '/static/'
                        ]
                        
                        // Eliminar cookie con todas las combinaciones posibles
                        domains.forEach(domain => {
                            paths.forEach(path => {
                                // Diferentes configuraciones de eliminación
                                const configs = [
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''};`,
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; secure;`,
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; httponly;`,
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; secure; httponly;`,
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; samesite=strict;`,
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; samesite=lax;`,
                                    `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; samesite=none;`
                                ]
                                
                                configs.forEach(config => {
                                    try {
                                        document.cookie = config
                                    } catch (e) {
                                        // Ignorar errores de configuración de cookies
                                    }
                                })
                            })
                        })
                    }
                })
            })
            
        } catch (error) {
            // Silenciar errores de limpieza
        }
    }

    // Ejecutar limpieza inmediatamente
    aggressiveCleanup()
    
    // Ejecutar limpieza cada 2 segundos para ser más agresivo
    setInterval(aggressiveCleanup, 2000)
    
    // También limpiar cuando cambie el foco de la ventana
    window.addEventListener('focus', aggressiveCleanup)
    
    // Limpiar cuando se cargue la página
    window.addEventListener('load', aggressiveCleanup)
    
    console.log('🍪 Sistema agresivo de eliminación de cookies de Cloudflare activado')
}

// Función para interceptar la creación de cookies de Cloudflare
export function interceptCloudflareCookieCreation() {
    if (typeof window === 'undefined') return

    // Interceptar document.cookie para prevenir la creación de cookies problemáticas
    const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
    
    if (originalCookieDescriptor) {
        Object.defineProperty(document, 'cookie', {
            get: originalCookieDescriptor.get,
            set: function(value) {
                // Verificar si la cookie es de Cloudflare
                const isCloudflareCookie = [
                    '__cf_bm',
                    '_cfuvid',
                    'cf_clearance', 
                    '__cfduid',
                    'cf_ob_info',
                    'cf_use_ob',
                    '__cfwaitingroom'
                ].some(cookieName => value.includes(cookieName))
                
                if (isCloudflareCookie) {
                    console.log('🚫 Intento de crear cookie de Cloudflare bloqueado:', value.split('=')[0])
                    return // No crear la cookie
                }
                
                // Permitir otras cookies
                originalCookieDescriptor.set?.call(this, value)
            },
            configurable: true
        })
    }
    
    console.log('🚫 Interceptación de creación de cookies de Cloudflare activada')
}

// Función para limpiar cookies del localStorage y sessionStorage
export function clearCloudflareFromStorage() {
    if (typeof window === 'undefined') return

    const cleanupStorage = () => {
        try {
            // Limpiar localStorage
            const localStorageKeys = Object.keys(localStorage)
            localStorageKeys.forEach(key => {
                if (key.includes('cf_') || key.includes('__cf_') || key.includes('cloudflare')) {
                    localStorage.removeItem(key)
                }
            })
            
            // Limpiar sessionStorage
            const sessionStorageKeys = Object.keys(sessionStorage)
            sessionStorageKeys.forEach(key => {
                if (key.includes('cf_') || key.includes('__cf_') || key.includes('cloudflare')) {
                    sessionStorage.removeItem(key)
                }
            })
            
        } catch (error) {
            // Silenciar errores
        }
    }
    
    cleanupStorage()
    setInterval(cleanupStorage, 5000) // Cada 5 segundos
    
    console.log('🧹 Limpieza de storage de Cloudflare configurada')
}

// Función principal para activar todas las protecciones
export function activateCloudflareProtection() {
    eliminateCloudflareCookies()
    interceptCloudflareCookieCreation()
    clearCloudflareFromStorage()
    
    console.log('🛡️ Protección completa contra cookies de Cloudflare activada')
}
