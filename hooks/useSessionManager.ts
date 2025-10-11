import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import type { Session } from '@supabase/supabase-js'

interface SessionState {
  session: Session | null
  loading: boolean
  error: string | null
  isValid: boolean
}

export function useSessionManager() {
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
    error: null,
    isValid: false
  })

  // Función para verificar y renovar la sesión
  const refreshSession = useCallback(async () => {
    try {
      console.log('🔍 refreshSession: Iniciando...')
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const supabase = getSupabaseClient()
      
      if (!supabase) {
        console.error('❌ refreshSession: Supabase no está configurado')
        setState({
          session: null,
          loading: false,
          error: 'Supabase no está configurado',
          isValid: false
        })
        return false
      }
      
      console.log('🔍 refreshSession: Obteniendo sesión...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('🔍 refreshSession: Sesión obtenida:', !!session)
      console.log('🔍 refreshSession: Error:', !!error)
      
      if (error) {
        console.error('Error obteniendo sesión:', error)
        setState({
          session: null,
          loading: false,
          error: error.message,
          isValid: false
        })
        return false
      }

      if (!session) {
        setState({
          session: null,
          loading: false,
          error: null,
          isValid: false
        })
        return false
      }

      // Verificar si el token está próximo a expirar (menos de 5 minutos)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      const timeUntilExpiry = expiresAt - now

      if (timeUntilExpiry < 300) { // 5 minutos = 300 segundos
        console.log('Token próximo a expirar, renovando...')
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.error('❌ refreshSession: Supabase no está configurado para renovación')
          setState({
            session: null,
            loading: false,
            error: 'Supabase no está configurado'
          })
          return false
        }
        
        const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Error renovando sesión:', refreshError)
          setState({
            session: null,
            loading: false,
            error: refreshError.message,
            isValid: false
          })
          return false
        }

        if (refreshedSession.session) {
          setState({
            session: refreshedSession.session,
            loading: false,
            error: null,
            isValid: true
          })
          return true
        }
      }

      setState({
        session,
        loading: false,
        error: null,
        isValid: true
      })
      return true

    } catch (error: any) {
      console.error('Error en refreshSession:', error)
      setState({
        session: null,
        loading: false,
        error: error.message || 'Error desconocido',
        isValid: false
      })
      return false
    }
  }, [])

  // Función para obtener el token de acceso
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    console.log('🔍 getAccessToken: Iniciando...')
    const supabase = getSupabaseClient()
    console.log('🔍 getAccessToken: supabase configurado:', !!supabase)
    
    const isValid = await refreshSession()
    console.log('🔍 getAccessToken: Sesión válida:', isValid)
    console.log('🔍 getAccessToken: state.session:', !!state.session)
    console.log('🔍 getAccessToken: access_token:', !!state.session?.access_token)
    
    if (isValid && state.session?.access_token) {
      return state.session.access_token
    }
    return null
  }, [refreshSession, state.session])

  // Función para verificar si la sesión es válida
  const isSessionValid = useCallback((): boolean => {
    if (!state.session) return false
    
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = state.session.expires_at || 0
    
    return expiresAt > now
  }, [state.session])

  // Efecto para inicializar y escuchar cambios de autenticación
  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      if (isMounted) {
        await refreshSession()
      }
    }

    initializeSession()

    // Escuchar cambios en el estado de autenticación solo si supabase está configurado
    const supabase = getSupabaseClient()
    
    if (!supabase) {
      setState({
        session: null,
        loading: false,
        error: 'Supabase no está configurado',
        isValid: false
      })
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return

        console.log('Auth state changed:', event)

        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            setState({
              session,
              loading: false,
              error: null,
              isValid: !!session
            })
            break
          case 'SIGNED_OUT':
            setState({
              session: null,
              loading: false,
              error: null,
              isValid: false
            })
            break
          case 'USER_UPDATED':
            if (session) {
              setState(prev => ({
                ...prev,
                session,
                isValid: !!session
              }))
            }
            break
        }
      }
    )

    // Renovar sesión periódicamente (cada 10 minutos)
    const interval = setInterval(async () => {
      if (isMounted && state.isValid) {
        await refreshSession()
      }
    }, 10 * 60 * 1000) // 10 minutos

    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [refreshSession, state.isValid])

  return {
    session: state.session,
    loading: state.loading,
    error: state.error,
    isValid: state.isValid,
    refreshSession,
    getAccessToken,
    isSessionValid
  }
}
