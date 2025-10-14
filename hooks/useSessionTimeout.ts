'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

interface UseSessionTimeoutOptions {
    timeoutMinutes?: number
    onTimeout?: () => void
    enabled?: boolean
}

export function useSessionTimeout({
    timeoutMinutes = 30, // Cambiado de 5 a 30 minutos para coincidir con useInactivity
    onTimeout,
    enabled = true
}: UseSessionTimeoutOptions = {}) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastActivityRef = useRef<number>(Date.now())
    const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const supabase = getSupabaseClient()

    const clearSession = useCallback(async () => {
        
        try {
            // PASO 1: Cerrar sesión en Supabase PRIMERO
            await supabase.auth.signOut()

            // PASO 2: Limpiar localStorage
            if (typeof window !== 'undefined') {
                localStorage.clear()
            }

            // PASO 3: Limpiar TODAS las cookies de forma más exhaustiva
            const allCookies = document.cookie.split(";")
            
            allCookies.forEach(cookie => {
                if (cookie.trim()) {
                    const cookieName = cookie.split('=')[0].trim()
                    
                    // Limpiar cookie con múltiples configuraciones más exhaustivas
                    const domain = window.location.hostname
                    const baseDomain = domain.startsWith('www.') ? domain.substring(4) : domain
                    
                    const cookieConfigs = [
                        // Configuración básica
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${baseDomain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${baseDomain};`,
                        // Configuraciones adicionales para cookies seguras
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=strict;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=none;`,
                        // Configuraciones para diferentes paths
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/admin;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/api;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/auth;`
                    ]
                    
                    cookieConfigs.forEach(config => {
                        document.cookie = config
                    })
                }
            })

            // Verificar que las cookies se limpiaron
            const remainingCookies = document.cookie
            if (remainingCookies) {
            } else {
            }

            // Ejecutar callback personalizado si existe
            if (onTimeout) {
                onTimeout()
            }

            // Redirigir según la página actual
            if (window.location.pathname.startsWith('/admin')) {
                window.location.href = '/login?timeout=true'
            } else {
                window.location.href = '/?timeout=true'
            }

        } catch (error) {
            console.error('❌ Error cerrando sesión por timeout:', error)
            // Aún así limpiar y redirigir con limpieza exhaustiva
            try {
                localStorage.clear()
                
                // Limpieza exhaustiva de cookies en caso de emergencia
                const allCookies = document.cookie.split(";")
                
                allCookies.forEach(cookie => {
                    if (cookie.trim()) {
                        const cookieName = cookie.split('=')[0].trim()
                        
                        // Configuraciones básicas de emergencia
                        const emergencyConfigs = [
                            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
                            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`,
                            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`,
                            `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=strict;`
                        ]
                        
                        emergencyConfigs.forEach(config => {
                            document.cookie = config
                        })
                    }
                })
                
            } catch (cleanupErr) {
                console.error('❌ Error en limpieza de emergencia por timeout:', cleanupErr)
            }
            
            // Redirigir según la página actual
            const redirectUrl = window.location.pathname.startsWith('/admin') ? '/login?timeout=true' : '/?timeout=true'
            window.location.href = redirectUrl
        }
    }, [onTimeout, supabase.auth])

    const resetTimeout = useCallback(() => {
        if (!enabled) return

        lastActivityRef.current = Date.now()
        
        // Limpiar timeouts existentes
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        if (warningTimeoutRef.current) {
            clearTimeout(warningTimeoutRef.current)
        }

        // Configurar nuevo timeout
        timeoutRef.current = setTimeout(() => {
            clearSession()
        }, timeoutMinutes * 60 * 1000)

    }, [enabled, timeoutMinutes, clearSession])

    const handleActivity = useCallback(() => {
        const now = Date.now()
        const timeSinceLastActivity = now - lastActivityRef.current

        // Solo reiniciar si han pasado al menos 30 segundos desde la última actividad
        // para evitar reiniciar constantemente
        if (timeSinceLastActivity > 30000) {
            resetTimeout()
        }
    }, [resetTimeout])

    useEffect(() => {
        if (!enabled) return

        // Inicializar timeout
        resetTimeout()

        // Eventos que indican actividad del usuario
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ]

        // Agregar listeners de eventos
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true)
        })

        // Limpiar timeout y listeners al desmontar
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true)
            })
        }
    }, [enabled, handleActivity, resetTimeout])

    // Función para verificar si la sesión está próxima a expirar
    const getTimeUntilTimeout = useCallback(() => {
        const now = Date.now()
        const timeSinceLastActivity = now - lastActivityRef.current
        const timeUntilTimeout = (timeoutMinutes * 60 * 1000) - timeSinceLastActivity
        
        return Math.max(0, timeUntilTimeout)
    }, [timeoutMinutes])

    // Función para obtener minutos restantes
    const getMinutesRemaining = useCallback(() => {
        const milliseconds = getTimeUntilTimeout()
        const minutes = Math.ceil(milliseconds / (60 * 1000))
        return minutes
    }, [getTimeUntilTimeout])

    // Función para verificar si está en período de advertencia
    const isInWarningPeriod = useCallback((warningMinutes: number = 1) => {
        const minutesRemaining = getMinutesRemaining()
        return minutesRemaining <= warningMinutes && minutesRemaining > 0
    }, [getMinutesRemaining])

    return {
        resetTimeout,
        getTimeUntilTimeout,
        getMinutesRemaining,
        isInWarningPeriod,
        isEnabled: enabled
    }
}
