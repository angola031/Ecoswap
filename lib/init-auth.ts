/**
 * Inicialización de autenticación con limpieza de problemas
 */

import { clearProblematicCookies, clearAuthStorage, detectCookieDomainIssues } from './cookie-utils'
import { setupWarningSuppression } from './suppress-warnings'
import { applyWarningFixes } from './nextjs-warning-fix'
import { disableProblematicConnections } from './disable-websocket'
import { activateCloudflareProtection } from './cloudflare-cookie-fix'
import { isCloudflareEnvironment, shouldApplyDevConfig } from './environment'

/**
 * Inicializa la autenticación limpiando problemas comunes
 */
export async function initializeAuth() {
    const isCloudflare = isCloudflareEnvironment()
    const isDev = shouldApplyDevConfig()
    
    if (isDev) {
        console.log('🔧 Inicializando autenticación (desarrollo)...')
    } else {
        console.log('🌐 Inicializando autenticación (producción)...')
    }
    
    // Configurar supresión de warnings solo en desarrollo
    if (isDev) {
        setupWarningSuppression()
        applyWarningFixes()
        disableProblematicConnections()
        activateCloudflareProtection()
    }
    
    try {
        // En desarrollo, limpiar problemas
        if (isDev) {
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
        }

        // 4. Configurar interceptor de Supabase (solo en desarrollo)
        if (isDev) {
            // El interceptor se configura automáticamente
            console.log('🔧 Interceptor de Supabase configurado para desarrollo')
        }

        if (isDev) {
            console.log('✅ Autenticación inicializada correctamente (desarrollo)')
        } else {
            console.log('✅ Autenticación inicializada correctamente (producción)')
        }
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
        
        // El interceptor se maneja automáticamente
        
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
