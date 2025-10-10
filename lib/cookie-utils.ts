/**
 * Utilidades para manejar cookies problemáticas
 */

// Función para limpiar cookies específicas que causan problemas
export function clearProblematicCookies() {
    if (typeof window === 'undefined') return

    try {
        // Lista de cookies problemáticas conocidas
        const problematicCookies = [
            '__cf_bm',
            '_cfuvid',
            'cf_clearance',
            '__cfduid'
        ]

        problematicCookies.forEach(cookieName => {
            // Intentar eliminar la cookie para todos los dominios posibles
            const domains = [
                window.location.hostname,
            '.supabase.co',
            '.supabase.io',
            window.location.hostname.split('.').slice(-2).join('.') // Dominio padre
            ]

            domains.forEach(domain => {
                // Eliminar cookie para el dominio específico
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            })
        })

        console.log('🧹 Cookies problemáticas limpiadas')
        return true
    } catch (error) {
        console.warn('Error limpiando cookies:', error)
        return false
    }
}

// Función para verificar si hay cookies problemáticas
export function hasProblematicCookies(): boolean {
    if (typeof window === 'undefined') return false

    try {
        const cookies = document.cookie.split(';')
        const problematicPatterns = [
            '__cf_bm',
            '_cfuvid',
            'cf_clearance',
            '__cfduid'
        ]

        return cookies.some(cookie => {
            const cookieName = cookie.trim().split('=')[0]
            return problematicPatterns.some(pattern => cookieName.includes(pattern))
        })
    } catch (error) {
        console.warn('Error verificando cookies:', error)
        return false
    }
}

// Función para limpiar localStorage de autenticación
export function clearAuthStorage() {
    if (typeof window === 'undefined') return

    try {
        // Limpiar todas las claves relacionadas con Supabase
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
                keysToRemove.push(key)
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key)
        })

        console.log('🧹 Storage de autenticación limpiado')
        return true
    } catch (error) {
        console.warn('Error limpiando storage:', error)
        return false
    }
}

// Función para reiniciar completamente la sesión
export function resetAuthSession() {
    try {
        // Limpiar cookies problemáticas
        clearProblematicCookies()
        
        // Limpiar storage de autenticación
        clearAuthStorage()
        
        // Limpiar sessionStorage también
        if (typeof window !== 'undefined') {
            sessionStorage.clear()
        }

        console.log('🔄 Sesión de autenticación reiniciada completamente')
        return true
    } catch (error) {
        console.warn('Error reiniciando sesión:', error)
        return false
    }
}

// Función para detectar problemas de dominio con cookies
export function detectCookieDomainIssues(): string[] {
    if (typeof window === 'undefined') return []

    const issues: string[] = []
    
    try {
        const cookies = document.cookie.split(';')
        const currentDomain = window.location.hostname
        
        cookies.forEach(cookie => {
            const cookieName = cookie.trim().split('=')[0]
            if (cookieName.includes('__cf_bm') || cookieName.includes('_cfuvid')) {
                issues.push(`Cookie ${cookieName} puede tener problemas de dominio`)
            }
        })

        // Verificar si estamos en un dominio local pero las cookies son de producción
        if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
            const hasProductionCookies = cookies.some(cookie => 
                cookie.includes('supabase.co') || cookie.includes('supabase.io')
            )
            if (hasProductionCookies) {
                issues.push('Cookies de producción detectadas en entorno local')
            }
        }
    } catch (error) {
        console.warn('Error detectando problemas de cookies:', error)
    }

    return issues
}
