// Script para suprimir warnings antes de que Next.js se inicialice
(function() {
    'use strict';
    
    // Interceptar console.warn inmediatamente
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.warn = function(...args) {
        const message = args.join(' ');
        
        // Lista de warnings a suprimir
        const suppressedWarnings = [
            'Extra attributes from the server:',
            'cz-shortcut-listen',
            'data-new-gr-c-s-check-loaded',
            'data-gr-ext-installed',
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary',
            'ReactDevOverlay',
            'HotReload',
            'Router',
            'ErrorBoundaryHandler',
            'ErrorBoundary',
            'AppRouter',
            'ServerRoot',
            'RSCComponent',
            'Root',
            'webpack-internal'
        ];
        
        const shouldSuppress = suppressedWarnings.some(warning => 
            message.includes(warning)
        );
        
        if (!shouldSuppress) {
            originalWarn.apply(console, args);
        }
    };
    
    console.error = function(...args) {
        const message = args.join(' ');
        
        // También filtrar errores de boundary y WebSocket
        const suppressedErrors = [
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary',
            'webpack-internal',
            'wss://',
            'websocket',
            'Firefox no puede establecer una conexión',
            'La conexión a wss://',
            'fue interrumpida mientras la página se cargaba',
            'La cookie',
            'ha sido rechazada por un dominio no válido',
            '__cf_bm',
            '_cfuvid',
            'cf_clearance',
            '__cfduid'
        ];
        
        const shouldSuppress = suppressedErrors.some(error => 
            message.includes(error)
        );
        
        if (!shouldSuppress) {
            originalError.apply(console, args);
        }
    };
    
    // Función para limpiar atributos problemáticos
    function cleanProblematicAttributes() {
        try {
            const problematicAttributes = [
                'cz-shortcut-listen',
                'data-new-gr-c-s-check-loaded',
                'data-gr-ext-installed',
                'data-gramm',
                'data-gramm_editor'
            ];
            
            // Limpiar del body y html
            const elementsToClean = [document.body, document.documentElement];
            
            elementsToClean.forEach(element => {
                if (element) {
                    problematicAttributes.forEach(attr => {
                        if (element.hasAttribute(attr)) {
                            element.removeAttribute(attr);
                        }
                    });
                }
            });
            
            // Limpiar de todos los elementos del DOM
            const allElements = document.querySelectorAll('*');
            allElements.forEach(element => {
                problematicAttributes.forEach(attr => {
                    if (element.hasAttribute(attr)) {
                        element.removeAttribute(attr);
                    }
                });
            });
            
        } catch (error) {
            // Silenciar errores de limpieza
        }
    }
    
    // Ejecutar limpieza cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanProblematicAttributes);
    } else {
        cleanProblematicAttributes();
    }
    
    // Ejecutar limpieza periódicamente
    setInterval(cleanProblematicAttributes, 2000);
    
    // Deshabilitar WebSocket completamente
    function disableWebSocket() {
        const OriginalWebSocket = window.WebSocket;
        
        // Crear una clase mock que extienda la funcionalidad básica
        function MockWebSocket(url, protocols) {
            console.log('🚫 WebSocket bloqueado:', url);
            // No hacer nada - simplemente crear un objeto que no falla
        }
        
        // Crear un objeto mock con todas las propiedades necesarias
        const mockInstance = {
            readyState: 3, // CLOSED
            url: '',
            protocol: '',
            extensions: '',
            bufferedAmount: 0,
            close: function() {},
            send: function() {},
            addEventListener: function() {},
            removeEventListener: function() {},
            dispatchEvent: function() { return false; },
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null
        };
        
        // Configurar el prototipo del mock
        MockWebSocket.prototype = Object.create(Object.prototype);
        Object.assign(MockWebSocket.prototype, mockInstance);
        
        // Configurar propiedades estáticas sin intentar modificar las de solo lectura
        try {
            MockWebSocket.CONNECTING = 0;
            MockWebSocket.OPEN = 1;
            MockWebSocket.CLOSING = 2;
            MockWebSocket.CLOSED = 3;
        } catch (e) {
            // Ignorar errores de propiedades de solo lectura
        }
        
        // Reemplazar WebSocket con nuestro mock
        window.WebSocket = MockWebSocket;
    }
    
    // Ejecutar deshabilitación de WebSocket
    disableWebSocket();
    
    // Función específica para eliminar cookies de Cloudflare
    function eliminateCloudflareCookies() {
        const cloudflareCookies = [
            '__cf_bm',
            '_cfuvid', 
            'cf_clearance',
            '__cfduid',
            'cf_ob_info',
            'cf_use_ob',
            '__cfwaitingroom'
        ];
        
        function aggressiveCleanup() {
            try {
                const currentCookies = document.cookie.split(';');
                
                cloudflareCookies.forEach(cookieName => {
                    currentCookies.forEach(cookie => {
                        const trimmedCookie = cookie.trim();
                        if (trimmedCookie.startsWith(cookieName)) {
                            const cookieValue = trimmedCookie.split('=')[0];
                            
                            const domains = [
                                '',
                                window.location.hostname,
                                '.' + window.location.hostname,
                                '.supabase.co',
                                '.supabase.io', 
                                '.localhost',
                                'localhost',
                                '127.0.0.1',
                                '.127.0.0.1'
                            ];
                            
                            const paths = ['/', '/api/', '/auth/', '/realtime/', '/_next/', '/static/'];
                            
                            domains.forEach(domain => {
                                paths.forEach(path => {
                                    const configs = [
                                        cookieValue + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path + (domain ? '; domain=' + domain : '') + ';',
                                        cookieValue + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path + (domain ? '; domain=' + domain : '') + '; secure;',
                                        cookieValue + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path + (domain ? '; domain=' + domain : '') + '; httponly;'
                                    ];
                                    
                                    configs.forEach(config => {
                                        try {
                                            document.cookie = config;
                                        } catch (e) {}
                                    });
                                });
                            });
                        }
                    });
                });
            } catch (error) {}
        }
        
        // Ejecutar limpieza inmediatamente
        aggressiveCleanup();
        
        // Ejecutar cada 1 segundo para ser muy agresivo
        setInterval(aggressiveCleanup, 1000);
        
        // Limpiar en eventos de ventana
        window.addEventListener('focus', aggressiveCleanup);
        window.addEventListener('load', aggressiveCleanup);
        
        console.log('🍪 Eliminación agresiva de cookies de Cloudflare activada');
    }
    
    // Ejecutar eliminación de cookies de Cloudflare
    eliminateCloudflareCookies();
    
    console.log('🛡️ Sistema de supresión de warnings inicializado');
})();
