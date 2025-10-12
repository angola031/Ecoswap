import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

interface NotificationCount {
    unreadCount: number
    loading: boolean
    error: string | null
}

export function useNotifications() {
    const [notificationCount, setNotificationCount] = useState<NotificationCount>({
        unreadCount: 0,
        loading: true,
        error: null
    })

    const fetchUnreadCount = async () => {
        const supabase = getSupabaseClient()
        if (!supabase) {
            setNotificationCount({ unreadCount: 0, loading: false, error: null })
            return
        }

        try {
            setNotificationCount(prev => ({ ...prev, loading: true, error: null }))

            // Obtener el usuario actual
            const { data: { user } } = await getSupabaseClient().auth.getUser()
            
            if (!user) {
                setNotificationCount({ unreadCount: 0, loading: false, error: null })
                return
            }

            // Obtener el ID del usuario de la tabla usuario
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', user.email)
                .single()

            if (userError || !userData) {
                setNotificationCount({ unreadCount: 0, loading: false, error: null })
                return
            }


            // Contar notificaciones no leídas
            const { count, error } = await supabase
                .from('notificacion')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', userData.user_id)
                .eq('leida', false)

            if (error) {
                console.error('🔔 [useNotifications] Error contando notificaciones:', error)
                setNotificationCount({ unreadCount: 0, loading: false, error: 'Error contando notificaciones' })
                return
            }


            setNotificationCount({ 
                unreadCount: count || 0, 
                loading: false, 
                error: null 
            })

        } catch (err) {
            console.error('🔔 Error en fetchUnreadCount:', err)
            setNotificationCount({ 
                unreadCount: 0, 
                loading: false, 
                error: 'Error obteniendo notificaciones' 
            })
        }
    }

    useEffect(() => {
        const supabase = getSupabaseClient()
        if (!supabase) {
            setNotificationCount({ unreadCount: 0, loading: false, error: null })
            return
        }

        fetchUnreadCount()

        // Suscripción en tiempo real a cambios en notificaciones (incremental)
        const setupRealtimeSubscription = async () => {
            const { data: { user } } = await getSupabaseClient().auth.getUser()
            if (!user) return

            const { data: userData } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', user.email)
                .single()

            if (!userData) return

            const channel = supabase
                .channel('notification_count')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notificacion',
                        filter: `usuario_id=eq.${userData.user_id}`
                    },
                    (payload: any) => {
                        const newRow = payload?.new
                        if (newRow && newRow.leida === false) {
                            setNotificationCount(prev => ({
                                unreadCount: prev.unreadCount + 1,
                                loading: false,
                                error: null
                            }))
                        }
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'notificacion',
                        filter: `usuario_id=eq.${userData.user_id}`
                    },
                    (payload: any) => {
                        const oldRow = payload?.old
                        const newRow = payload?.new
                        if (!oldRow || !newRow) {
                            fetchUnreadCount()
                            return
                        }
                        // De no leída -> leída
                        if (oldRow.leida === false && newRow.leida === true) {
                            setNotificationCount(prev => ({
                                unreadCount: Math.max(0, prev.unreadCount - 1),
                                loading: false,
                                error: null
                            }))
                        }
                        // De leída -> no leída (caso raro)
                        if (oldRow.leida === true && newRow.leida === false) {
                            setNotificationCount(prev => ({
                                unreadCount: prev.unreadCount + 1,
                                loading: false,
                                error: null
                            }))
                        }
                    }
                )
                .subscribe()

            // Polling de respaldo por si Realtime se desconecta
            const intervalId = setInterval(() => {
                fetchUnreadCount()
            }, 30000)

            return () => {
                clearInterval(intervalId)
                getSupabaseClient().removeChannel(channel)
            }
        }

        const cleanup = setupRealtimeSubscription()
        
        return () => {
            cleanup.then(cleanupFn => cleanupFn?.())
        }
    }, [])

    return {
        ...notificationCount,
        refresh: fetchUnreadCount
    }
}

