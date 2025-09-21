'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
    notificacion_id: number
    usuario_id: number
    tipo: string
    titulo: string
    mensaje: string
    datos_adicionales?: any
    leida: boolean
    fecha_creacion: string
    fecha_lectura?: string
    es_push: boolean
    es_email: boolean
}

interface NotificationsSectionProps {
    userId: number
}

export default function NotificationsSection({ userId }: NotificationsSectionProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        fetchNotifications()
        
        // Configurar suscripción en tiempo real
        const channel = supabase
            .channel('admin-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificacion'
                },
                (payload) => {
                    console.log('🔔 Nueva notificación recibida:', payload)
                    fetchNotifications() // Recargar notificaciones
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('notificacion')
                .select(`
                    notificacion_id,
                    usuario_id,
                    tipo,
                    titulo,
                    mensaje,
                    datos_adicionales,
                    leida,
                    fecha_creacion,
                    fecha_lectura,
                    es_push,
                    es_email
                `)
                .order('fecha_creacion', { ascending: false })
                .limit(20)

            if (error) {
                console.error('❌ Error obteniendo notificaciones:', error)
                setError('Error cargando notificaciones')
                return
            }

            setNotifications(data || [])
            
            // Contar no leídas
            const unread = data?.filter(n => !n.leida).length || 0
            setUnreadCount(unread)

        } catch (err) {
            console.error('❌ Error en fetchNotifications:', err)
            setError('Error cargando notificaciones')
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId: number) => {
        try {
            const { error } = await supabase
                .from('notificacion')
                .update({ 
                    leida: true,
                    fecha_lectura: new Date().toISOString()
                })
                .eq('notificacion_id', notificationId)

            if (error) {
                console.error('❌ Error marcando como leída:', error)
                return
            }

            // Actualizar estado local
            setNotifications(prev => 
                prev.map(n => 
                    n.notificacion_id === notificationId 
                        ? { ...n, leida: true, fecha_lectura: new Date().toISOString() }
                        : n
                )
            )

            // Actualizar contador
            setUnreadCount(prev => Math.max(0, prev - 1))

        } catch (err) {
            console.error('❌ Error marcando notificación como leída:', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications
                .filter(n => !n.leida)
                .map(n => n.notificacion_id)

            if (unreadIds.length === 0) return

            const { error } = await supabase
                .from('notificacion')
                .update({ 
                    leida: true,
                    fecha_lectura: new Date().toISOString()
                })
                .in('notificacion_id', unreadIds)

            if (error) {
                console.error('❌ Error marcando todas como leídas:', error)
                return
            }

            // Actualizar estado local
            setNotifications(prev => 
                prev.map(n => ({ 
                    ...n, 
                    leida: true, 
                    fecha_lectura: new Date().toISOString() 
                }))
            )
            setUnreadCount(0)

        } catch (err) {
            console.error('❌ Error marcando todas las notificaciones como leídas:', err)
        }
    }

    const getNotificationIcon = (tipo: string) => {
        switch (tipo) {
            case 'verificacion_identidad':
                return (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )
            case 'reporte':
                return (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                )
            case 'info':
            default:
                return (
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

        if (diffInMinutes < 1) return 'Hace un momento'
        if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
        if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`
        return date.toLocaleDateString('es-CO', { 
            day: 'numeric', 
            month: 'short', 
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Marcar todas como leídas
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 10-15 0v5" />
                    </svg>
                    <p>No hay notificaciones</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                        <div
                            key={notification.notificacion_id}
                            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                notification.leida 
                                    ? 'bg-gray-50 border-gray-200' 
                                    : 'bg-blue-50 border-blue-200'
                            }`}
                            onClick={() => {
                                if (!notification.leida) {
                                    markAsRead(notification.notificacion_id)
                                }
                            }}
                        >
                            <div className="flex items-start space-x-3">
                                {getNotificationIcon(notification.tipo)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-sm font-medium ${
                                            notification.leida ? 'text-gray-700' : 'text-gray-900'
                                        }`}>
                                            {notification.titulo}
                                        </h4>
                                        {!notification.leida && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                    </div>
                                    <p className={`text-sm mt-1 ${
                                        notification.leida ? 'text-gray-600' : 'text-gray-700'
                                    }`}>
                                        {notification.mensaje}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {formatDate(notification.fecha_creacion)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
