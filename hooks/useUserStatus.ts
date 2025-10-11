import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

interface UserStatus {
  id: string
  name: string
  email: string
  avatar: string
  isOnline: boolean
  lastSeen: string
  isAdmin: boolean
}

interface UseUserStatusReturn {
  onlineUsers: UserStatus[]
  isLoading: boolean
  error: string | null
  refreshStatus: () => Promise<void>
  updateUserStatus: (isActive: boolean) => Promise<void>
}

export function useUserStatus(): UseUserStatusReturn {
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para obtener usuarios en línea
  const fetchOnlineUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      const response = await fetch('/api/users/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error obteniendo estado de usuarios')
      }

      const data = await response.json()
      setOnlineUsers(data.users || [])
    } catch (err) {
      console.error('Error obteniendo usuarios en línea:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Función para actualizar el estado del usuario actual
  const updateUserStatus = useCallback(async (isActive: boolean) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      const response = await fetch('/api/users/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        throw new Error('Error actualizando estado del usuario')
      }

      // Actualizar la lista local de usuarios
      await fetchOnlineUsers()
    } catch (err) {
      console.error('Error actualizando estado del usuario:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }, [fetchOnlineUsers])

  // Función para refrescar el estado
  const refreshStatus = useCallback(async () => {
    await fetchOnlineUsers()
  }, [fetchOnlineUsers])

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchOnlineUsers()
  }, [fetchOnlineUsers])

  // Configurar actualizaciones periódicas cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOnlineUsers()
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [fetchOnlineUsers])

// Configurar listener para cambios de autenticación
useEffect(() => {
  const supabase = getSupabaseClient()
  if (!supabase) return
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Usuario inició sesión, actualizar estado
        updateUserStatus(true)
      } else if (event === 'SIGNED_OUT') {
        // Usuario cerró sesión, limpiar lista
        setOnlineUsers([])
      }
    })

    return () => subscription.unsubscribe()
  }, [updateUserStatus])

  return {
    onlineUsers,
    isLoading,
    error,
    refreshStatus,
    updateUserStatus
  }
}
