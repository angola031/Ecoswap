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
        
        window.WebSocket = function(url, protocols) {
            console.log('🚫 WebSocket bloqueado:', url);
            // Retornar un objeto mock que no hace nada
            return {
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
                onerror: null,
                CONNECTING: 0,
                OPEN: 1,
                CLOSING: 2,
                CLOSED: 3
            };
        };
        
        // Copiar propiedades estáticas
        Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
        Object.assign(window.WebSocket, {
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3
        });
    }
    
    // Ejecutar deshabilitación de WebSocket
    disableWebSocket();
    
    console.log('🛡️ Sistema de supresión de warnings inicializado');
})();
