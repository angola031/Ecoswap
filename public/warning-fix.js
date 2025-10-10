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
        
        // También filtrar errores de boundary
        const suppressedErrors = [
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary',
            'webpack-internal'
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
    
    console.log('🛡️ Sistema de supresión de warnings inicializado');
})();
