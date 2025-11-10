/**
 * Cliente API con manejo automático de autenticación y refresh de tokens
 */

import { getSupabaseClient } from './supabase-client'

/**
 * Verifica y refresca la sesión si es necesario antes de hacer una petición
 */
async function ensureValidSession(): Promise<boolean> {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.warn('⚠️ Supabase no está configurado')
            return false
        }

        // Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
            console.error('❌ Error obteniendo sesión:', sessionError)
            return false
        }

        if (!session) {
            console.warn('⚠️ No hay sesión activa')
            return false
        }

        // Verificar si el token está próximo a expirar (menos de 5 minutos)
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = session.expires_at || 0
        const timeUntilExpiry = expiresAt - now

        // Si el token expira en menos de 5 minutos, refrescarlo
        if (timeUntilExpiry < 300) {
            console.log('🔄 Token próximo a expirar, refrescando...')
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
            
            if (refreshError) {
                console.error('❌ Error refrescando sesión:', refreshError)
                return false
            }

            if (!refreshedSession) {
                console.warn('⚠️ No se pudo refrescar la sesión')
                return false
            }

            console.log('✅ Sesión refrescada exitosamente')
            return true
        }

        return true
    } catch (error) {
        console.error('❌ Error en ensureValidSession:', error)
        return false
    }
}

/**
 * Wrapper para fetch que maneja automáticamente la autenticación
 */
export async function apiFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    // Verificar y refrescar sesión antes de la petición
    const hasValidSession = await ensureValidSession()
    
    if (!hasValidSession) {
        // Si no hay sesión válida, intentar obtener el token de todas formas
        // para que el servidor pueda manejar el error apropiadamente
        console.warn('⚠️ Continuando con petición sin sesión válida')
    }

    // Obtener el token de la sesión actual
    const supabase = getSupabaseClient()
    let authToken: string | null = null
    
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        authToken = session?.access_token || null
    }

    // Preparar headers
    const headers = new Headers(options.headers)
    
    // Agregar token de autenticación si existe
    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`)
    }
    
    // Asegurar Content-Type si hay body
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
    }

    // Realizar la petición
    try {
        const response = await fetch(url, {
            ...options,
            headers
        })

        // Si la respuesta es 401 (No autorizado), intentar refrescar y reintentar una vez
        if (response.status === 401 && hasValidSession) {
            console.log('🔄 Respuesta 401, intentando refrescar sesión y reintentar...')
            
            const refreshed = await ensureValidSession()
            if (refreshed) {
                // Obtener nuevo token
                const { data: { session: newSession } } = await supabase!.auth.getSession()
                if (newSession?.access_token) {
                    headers.set('Authorization', `Bearer ${newSession.access_token}`)
                    
                    // Reintentar la petición una vez
                    return fetch(url, {
                        ...options,
                        headers
                    })
                }
            }
        }

        return response
    } catch (error) {
        console.error('❌ Error en apiFetch:', error)
        throw error
    }
}

/**
 * Función helper para hacer peticiones GET
 */
export async function apiGet(url: string, options: RequestInit = {}): Promise<Response> {
    return apiFetch(url, {
        ...options,
        method: 'GET'
    })
}

/**
 * Función helper para hacer peticiones POST
 */
export async function apiPost(url: string, body: any, options: RequestInit = {}): Promise<Response> {
    return apiFetch(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
    })
}

/**
 * Función helper para hacer peticiones PUT
 */
export async function apiPut(url: string, body: any, options: RequestInit = {}): Promise<Response> {
    return apiFetch(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body)
    })
}

/**
 * Función helper para hacer peticiones DELETE
 */
export async function apiDelete(url: string, options: RequestInit = {}): Promise<Response> {
    return apiFetch(url, {
        ...options,
        method: 'DELETE'
    })
}

