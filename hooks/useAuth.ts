import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { withRetry, isRateLimited, getRetryAfter } from '../lib/supabase-interceptor'

interface User {
    id: string
    email?: string
    [key: string]: any
}

interface AuthState {
    user: User | null
    loading: boolean
    error: string | null
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        loading: true,
        error: null
    })

    // Función para limpiar el estado de autenticación
    const clearAuth = useCallback(() => {
        setState({
            user: null,
            loading: false,
            error: null
        })
    }, [])

    // Función para manejar errores de autenticación
    const handleAuthError = useCallback((error: any) => {
        console.error('Auth error:', error)
        
        // Si es un error de rate limiting, esperar un poco antes de reintentar
        if (error.message?.includes('rate limit')) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.'
            }))
            
            // Limpiar el error después de 30 segundos
            setTimeout(() => {
                setState(prev => ({ ...prev, error: null }))
            }, 30000)
        } else {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Error de autenticación'
            }))
        }
    }, [])

    // Obtener sesión actual
    const getSession = useCallback(async () => {
        const supabase = getSupabaseClient()
        
        if (!supabase) {
            setState({
                user: null,
                loading: false,
                error: 'Supabase no está configurado'
            })
            return
        }

        try {
            setState(prev => ({ ...prev, loading: true, error: null }))
            
            const { data: { session }, error } = await withRetry(
                () => supabase.auth.getSession(),
                'getSession'
            )
            
            if (error) {
                handleAuthError(error)
                return
            }

            setState({
                user: session?.user || null,
                loading: false,
                error: null
            })
        } catch (error) {
            handleAuthError(error)
        }
    }, [handleAuthError])

    // Escuchar cambios en el estado de autenticación
    useEffect(() => {
        const supabase = getSupabaseClient()
        
        if (!supabase) {
            setState({
                user: null,
                loading: false,
                error: 'Supabase no está configurado'
            })
            return
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event, session?.user?.email)
                
                setState({
                    user: session?.user || null,
                    loading: false,
                    error: null
                })

                // Manejar diferentes eventos
                switch (event) {
                    case 'SIGNED_IN':
                        console.log('Usuario inició sesión:', session?.user?.email)
                        break
                    case 'SIGNED_OUT':
                        console.log('Usuario cerró sesión')
                        clearAuth()
                        break
                    case 'TOKEN_REFRESHED':
                        console.log('Token refrescado')
                        break
                    case 'USER_UPDATED':
                        console.log('Usuario actualizado')
                        break
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [getSession, clearAuth])

    // Función para cerrar sesión
    const signOut = useCallback(async () => {
        const supabase = getSupabaseClient()
        
        if (!supabase) {
            clearAuth()
            return
        }

        try {
            setState(prev => ({ ...prev, loading: true, error: null }))
            
            const { error } = await withRetry(
                () => supabase.auth.signOut(),
                'signOut'
            )
            
            if (error) {
                handleAuthError(error)
                return
            }

            clearAuth()
        } catch (error) {
            handleAuthError(error)
        }
    }, [handleAuthError, clearAuth])

    return {
        user: state.user,
        loading: state.loading,
        error: state.error,
        signOut,
        clearError: () => setState(prev => ({ ...prev, error: null })),
        isRateLimited: isRateLimited(),
        retryAfter: getRetryAfter()
    }
}