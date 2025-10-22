import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface ProposalNotification {
  id: string
  type: 'new_proposal' | 'proposal_accepted' | 'proposal_rejected' | 'proposal_response'
  title: string
  message: string
  proposalId: number
  chatId: string
  timestamp: string
  isRead: boolean
}

export const useProposalNotifications = () => {
  const [notifications, setNotifications] = useState<ProposalNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response = await fetch('/api/notifications/proposals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error)
    }
  }, [])

  const addNotification = useCallback((notification: Omit<ProposalNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: ProposalNotification = {
      ...notification,
      id: `temp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    const supabase = getSupabaseClient()
    
    const channel = supabase.channel('proposal-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones'
      }, (payload) => {
        console.log('Nueva notificación recibida:', payload)
        // Procesar nueva notificación
        if (payload.new) {
          addNotification({
            type: payload.new.tipo as any,
            title: payload.new.titulo,
            message: payload.new.mensaje,
            proposalId: payload.new.propuesta_id,
            chatId: payload.new.chat_id
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [addNotification])

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  }
}
