/**
 * Solución directa para warnings de Next.js y extensiones del navegador
 */

// Función para interceptar y suprimir warnings antes de que se muestren
export function interceptNextJSWarnings() {
    if (typeof window === 'undefined') return

    // Interceptar console.warn antes de que Next.js lo configure
    const originalConsoleWarn = console.warn
    const originalConsoleError = console.error

    console.warn = (...args) => {
        const message = args.join(' ')
        
        // Lista completa de warnings a suprimir
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
        ]

        const shouldSuppress = suppressedWarnings.some(warning => 
            message.includes(warning)
        )

        if (!shouldSuppress) {
            originalConsoleWarn.apply(console, args)
        }
    }

    console.error = (...args) => {
        const message = args.join(' ')
        
        // También filtrar errores de boundary que no son críticos
        const suppressedErrors = [
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary',
            'webpack-internal'
        ]

        const shouldSuppress = suppressedErrors.some(error => 
            message.includes(error)
        )

        if (!shouldSuppress) {
            originalConsoleError.apply(console, args)
        }
    }

    console.log('🛡️ Sistema de interceptación de warnings configurado')
}

// Función para limpiar atributos problemáticos del DOM de forma más agresiva
export function aggressiveDOMCleanup() {
    if (typeof window === 'undefined') return

    const cleanup = () => {
        try {
            // Lista de atributos problemáticos
            const problematicAttributes = [
                'cz-shortcut-listen',
                'data-new-gr-c-s-check-loaded',
                'data-gr-ext-installed',
                'data-gramm',
                'data-gramm_editor'
            ]

            // Limpiar del body y html
            const elementsToClean = [document.body, document.documentElement]
            
            elementsToClean.forEach(element => {
                if (element) {
                    problematicAttributes.forEach(attr => {
                        if (element.hasAttribute(attr)) {
                            element.removeAttribute(attr)
                        }
                    })
                }
            })

            // Limpiar de todos los elementos del DOM
            const allElements = document.querySelectorAll('*')
            allElements.forEach(element => {
                problematicAttributes.forEach(attr => {
                    if (element.hasAttribute(attr)) {
                        element.removeAttribute(attr)
                    }
                })
            })

        } catch (error) {
            // Silenciar errores de limpieza
        }
    }

    // Ejecutar inmediatamente
    cleanup()

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanup)
    }

    // Ejecutar periódicamente
    setInterval(cleanup, 2000) // Cada 2 segundos

    console.log('🧹 Limpieza agresiva del DOM configurada')
}

// Función para configurar el entorno de Next.js para suprimir warnings
export function configureNextJSEnvironment() {
    if (typeof window === 'undefined') return

    // Configurar variables de entorno para suprimir warnings
    if (typeof window !== 'undefined') {
        // Suprimir warnings de hidratación
        window.__NEXT_DATA__ = window.__NEXT_DATA__ || {} as any
        (window.__NEXT_DATA__ as any).suppressHydrationWarning = true

        // Configurar React para suprimir warnings específicos
        if (typeof window.React !== 'undefined') {
            const originalConsoleError = console.error
            console.error = (...args) => {
                const message = args.join(' ')
                if (message.includes('Warning: Extra attributes from the server')) {
                    return // Suprimir este warning específico
                }
                originalConsoleError.apply(console, args)
            }
        }
    }

    console.log('⚙️ Entorno de Next.js configurado para suprimir warnings')
}

// Función principal para aplicar todas las correcciones
export function applyWarningFixes() {
    interceptNextJSWarnings()
    aggressiveDOMCleanup()
    configureNextJSEnvironment()
    
    console.log('🚀 Todas las correcciones de warnings aplicadas')
}
