/**
 * Utilidades para suprimir warnings no críticos del navegador
 */

import { clearProblematicCookies } from './cookie-utils'

// Suprimir warnings específicos de Next.js sobre atributos del servidor
export function suppressServerAttributeWarnings() {
    if (typeof window === 'undefined') return

    // Interceptar console.warn para filtrar warnings específicos
    const originalWarn = console.warn
    console.warn = (...args) => {
        const message = args.join(' ')
        
        // Filtrar warnings específicos que no son críticos
        const suppressedWarnings = [
            'Extra attributes from the server:',
            'cz-shortcut-listen',
            'data-new-gr-c-s-check-loaded',
            'data-gr-ext-installed',
            'La cookie',
            'ha sido rechazada por un dominio no válido',
            '__cf_bm',
            '_cfuvid',
            'cf_clearance',
            '__cfduid'
        ]

        const shouldSuppress = suppressedWarnings.some(warning => 
            message.includes(warning)
        )

        if (!shouldSuppress) {
            originalWarn.apply(console, args)
        }
    }
}

// Función para limpiar atributos problemáticos del DOM
export function cleanProblematicAttributes() {
    if (typeof window === 'undefined') return

    try {
        // Lista de atributos que pueden causar warnings
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

        console.log('🧹 Atributos problemáticos limpiados del DOM')
    } catch (error) {
        console.warn('Error limpiando atributos:', error)
    }
}

// Función para configurar el manejo de errores de Next.js
export function configureNextErrorHandling() {
    if (typeof window === 'undefined') return

    // Interceptar errores no críticos de Next.js
    const originalError = console.error
    console.error = (...args) => {
        const message = args.join(' ')
        
        // Filtrar errores de boundary que no son críticos
        const nonCriticalErrors = [
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary'
        ]

        const isNonCritical = nonCriticalErrors.some(error => 
            message.includes(error)
        )

        if (isNonCritical) {
            // Solo mostrar en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.info('ℹ️ Error de boundary no crítico:', ...args)
            }
        } else {
            originalError.apply(console, args)
        }
    }
}

// Función principal para configurar todo
export function setupWarningSuppression() {
    suppressServerAttributeWarnings()
    configureNextErrorHandling()
    
    // Limpiar atributos después de que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanProblematicAttributes)
    } else {
        cleanProblematicAttributes()
    }

    // Limpiar periódicamente (cada 5 segundos) por si se agregan nuevos atributos
    setInterval(cleanProblematicAttributes, 5000)
    
    // Limpiar cookies inmediatamente y luego periódicamente
    clearProblematicCookies()
    setInterval(clearProblematicCookies, 10000) // Cada 10 segundos

    console.log('🛡️ Sistema de supresión de warnings configurado')
}
