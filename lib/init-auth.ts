/**
 * Inicialización de autenticación con limpieza de problemas
 */

import { clearProblematicCookies, clearAuthStorage, detectCookieDomainIssues } from './cookie-utils'
import { supabaseInterceptor } from './supabase-interceptor'
import { setupWarningSuppression } from './suppress-warnings'

/**
 * Inicializa la autenticación limpiando problemas comunes
 */
export async function initializeAuth() {
        console.log('🔧 Inicializando autenticación...')
        
        // Configurar supresión de warnings primero
        setupWarningSuppression()
        
        try {
        // 1. Detectar problemas de cookies
        const cookieIssues = detectCookieDomainIssues()
        if (cookieIssues.length > 0) {
            console.warn('🚨 Problemas de cookies detectados:', cookieIssues)
        }

        // 2. Limpiar cookies problemáticas
        const cookiesCleared = clearProblematicCookies()
        if (cookiesCleared) {
            console.log('✅ Cookies problemáticas limpiadas')
        }

        // 3. Limpiar storage de autenticación si hay problemas
        const hasIssues = cookieIssues.length > 0
        if (hasIssues) {
            console.log('🧹 Limpiando storage de autenticación debido a problemas detectados')
            clearAuthStorage()
        }

        // 4. Resetear el interceptor de rate limiting
        supabaseInterceptor.reset()
        
        // 5. Configurar interceptor para ser más conservador
        supabaseInterceptor.configure({
            maxRetries: 2,
            baseDelay: 2000, // 2 segundos
            maxDelay: 30000  // 30 segundos máximo
        })

        console.log('✅ Autenticación inicializada correctamente')
        return true

    } catch (error) {
        console.error('❌ Error inicializando autenticación:', error)
        return false
    }
}

/**
 * Función para manejar errores de autenticación de forma global
 */
export function handleGlobalAuthError(error: any) {
    console.error('🚨 Error global de autenticación:', error)
    
    // Si es un error de rate limiting, limpiar todo y reiniciar
    if (error.message?.includes('rate limit') || error.status === 429) {
        console.log('🔄 Reiniciando autenticación debido a rate limiting')
        
        // Limpiar todo
        clearProblematicCookies()
        clearAuthStorage()
        
        // Resetear interceptor
        supabaseInterceptor.reset()
        
        // Mostrar mensaje al usuario
        return {
            shouldRetry: true,
            message: 'Demasiadas solicitudes. La aplicación se reiniciará automáticamente.',
            retryAfter: 30000 // 30 segundos
        }
    }
    
    // Si es un error de cookies, limpiar cookies
    if (error.message?.includes('cookie') || error.message?.includes('dominio')) {
        console.log('🍪 Limpiando cookies debido a problemas de dominio')
        clearProblematicCookies()
        
        return {
            shouldRetry: false,
            message: 'Problema de cookies resuelto. Recarga la página si persiste.',
            retryAfter: 0
        }
    }
    
    return {
        shouldRetry: false,
        message: 'Error de autenticación. Intenta recargar la página.',
        retryAfter: 0
    }
}

/**
 * Verifica si la aplicación necesita reinicialización
 */
export function shouldReinitialize(): boolean {
    const cookieIssues = detectCookieDomainIssues()
    return cookieIssues.length > 0
}
