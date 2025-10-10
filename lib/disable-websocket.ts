/**
 * Deshabilitar completamente las conexiones WebSocket de Supabase
 */

// Interceptar y bloquear todas las conexiones WebSocket
export function disableWebSocketConnections() {
    if (typeof window === 'undefined') return

    // Guardar la implementación original de WebSocket
    const OriginalWebSocket = window.WebSocket
    
    function MockWebSocket(url: string | URL, protocols?: string | string[]) {
        console.log('🚫 WebSocket bloqueado:', url)
        // No hacer nada - simplemente crear un objeto que no falla
    }
    
    // Configurar el prototipo del mock
    MockWebSocket.prototype = Object.create(Object.prototype)
    Object.assign(MockWebSocket.prototype, {
        readyState: 3, // CLOSED
        url: '',
        protocol: '',
        extensions: '',
        bufferedAmount: 0,
        close() { /* No hacer nada */ },
        send() { /* No hacer nada */ },
        addEventListener() { /* No hacer nada */ },
        removeEventListener() { /* No hacer nada */ },
        dispatchEvent() { return false },
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null
    })
    
    // Configurar propiedades estáticas de forma segura
    try {
        (MockWebSocket as any).CONNECTING = 0
        ;(MockWebSocket as any).OPEN = 1
        ;(MockWebSocket as any).CLOSING = 2
        ;(MockWebSocket as any).CLOSED = 3
    } catch (e) {
        // Ignorar errores de propiedades de solo lectura
    }
    
    // Reemplazar WebSocket con nuestro mock
    window.WebSocket = MockWebSocket as any

    // También bloquear EventSource si se usa
    if (window.EventSource) {
        const OriginalEventSource = window.EventSource
        window.EventSource = class MockEventSource {
            constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
                console.log('🚫 EventSource bloqueado:', url)
            }
            
            get url() { return '' }
            get readyState() { return 2 } // CLOSED
            get withCredentials() { return false }
            
            close() { /* No hacer nada */ }
            addEventListener() { /* No hacer nada */ }
            removeEventListener() { /* No hacer nada */ }
            dispatchEvent() { return false }
            
            onopen = null
            onmessage = null
            onerror = null
            
            static CONNECTING = 0
            static OPEN = 1
            static CLOSED = 2
        } as any
    }

    console.log('🚫 Conexiones WebSocket y EventSource deshabilitadas')
}

// Función para limpiar cookies de Cloudflare de forma más agresiva
export function aggressiveCloudflareCookieCleanup() {
    if (typeof window === 'undefined') return

    const cleanup = () => {
        try {
            // Lista completa de cookies de Cloudflare
            const cloudflareCookies = [
                '__cf_bm',
                '_cfuvid',
                'cf_clearance',
                '__cfduid',
                'cf_ob_info',
                'cf_use_ob',
                '__cfwaitingroom'
            ]

            // Obtener todas las cookies actuales
            const currentCookies = document.cookie.split(';')
            
            cloudflareCookies.forEach(cookieName => {
                // Limpiar de todas las cookies actuales
                currentCookies.forEach(cookie => {
                    const trimmedCookie = cookie.trim()
                    if (trimmedCookie.startsWith(cookieName)) {
                        const cookieValue = trimmedCookie.split('=')[0]
                        
                        // Intentar eliminar la cookie para múltiples dominios
                        const domains = [
                            '', // Sin dominio
                            window.location.hostname,
                            `.${window.location.hostname}`,
                            '.supabase.co',
                            '.supabase.io',
                            '.localhost',
                            'localhost',
                            '127.0.0.1',
                            '.127.0.0.1'
                        ]

                        domains.forEach(domain => {
                            const paths = ['/', '/api/', '/auth/', '/realtime/']
                            paths.forEach(path => {
                                // Múltiples intentos con diferentes configuraciones
                                document.cookie = `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''};`
                                document.cookie = `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; secure;`
                                document.cookie = `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; httponly;`
                                document.cookie = `${cookieValue}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}${domain ? `; domain=${domain}` : ''}; secure; httponly;`
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
    cleanup()

    // Ejecutar limpieza cada 5 segundos
    setInterval(cleanup, 5000)

    console.log('🧹 Limpieza agresiva de cookies de Cloudflare configurada')
}

// Función para interceptar fetch requests a Supabase realtime
export function interceptSupabaseRealtime() {
    if (typeof window === 'undefined') return

    const originalFetch = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        
        // Bloquear requests a realtime de Supabase
        if (url.includes('supabase.co/realtime') || url.includes('supabase.io/realtime')) {
            console.log('🚫 Request a Supabase realtime bloqueado:', url)
            return Promise.reject(new Error('Realtime deshabilitado'))
        }
        
        // Permitir otros requests
        return originalFetch(input, init)
    }

    console.log('🚫 Requests a Supabase realtime interceptados')
}

// Función principal para deshabilitar todas las conexiones problemáticas
export function disableProblematicConnections() {
    disableWebSocketConnections()
    aggressiveCloudflareCookieCleanup()
    interceptSupabaseRealtime()
    
    console.log('🚫 Todas las conexiones problemáticas deshabilitadas')
}
