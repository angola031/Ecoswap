'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Notification {
    notificacion_id: number
    usuario_id: number
    tipo: string
    titulo: string
    mensaje: string
    datos_adicionales: any
    leida: boolean
    fecha_creacion: string
    fecha_lectura?: string
    es_push: boolean
    es_email: boolean
}

export default function ClientNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            setError(null)

            // Obtener el usuario actual
            const { data: { user } } = await supabase.auth.getUser()
            console.log('🔔 [ClientNotifications] Usuario autenticado:', user?.email)
            
            if (!user) {
                console.log('🔔 [ClientNotifications] Usuario no autenticado')
                setError('Usuario no autenticado')
                return
            }

            // Obtener el ID del usuario de la tabla usuario
            console.log('🔔 [ClientNotifications] Buscando usuario en BD con email:', user.email)
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', user.email)
                .single()

            if (userError || !userData) {
                console.error('🔔 [ClientNotifications] Error obteniendo usuario:', userError)
                setError('Error obteniendo datos del usuario')
                return
            }

            console.log('🔔 [ClientNotifications] Usuario encontrado en BD:', userData.user_id)

            // Obtener notificaciones del usuario
            console.log('🔔 [ClientNotifications] Buscando notificaciones para usuario:', userData.user_id)
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
                .eq('usuario_id', userData.user_id)
                .order('fecha_creacion', { ascending: false })
                .limit(20)

            if (error) {
                console.error('🔔 [ClientNotifications] Error obteniendo notificaciones:', error)
                setError('Error cargando notificaciones')
                return
            }

            console.log('🔔 [ClientNotifications] Notificaciones obtenidas:', data?.length || 0)
            console.log('🔔 [ClientNotifications] Datos de notificaciones:', data)

            setNotifications(data || [])
            setUnreadCount(data?.filter(n => !n.leida).length || 0)

        } catch (err) {
            console.error('❌ Error en fetchNotifications:', err)
            setError(`Error cargando notificaciones: ${err}`)
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
                console.error('Error marcando notificación como leída:', error)
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
            setUnreadCount(prev => Math.max(0, prev - 1))

        } catch (err) {
            console.error('Error en markAsRead:', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.leida)
            if (unreadNotifications.length === 0) return

            const { error } = await supabase
                .from('notificacion')
                .update({ 
                    leida: true,
                    fecha_lectura: new Date().toISOString()
                })
                .in('notificacion_id', unreadNotifications.map(n => n.notificacion_id))

            if (error) {
                console.error('Error marcando todas las notificaciones como leídas:', error)
                return
            }

            // Actualizar estado local
            setNotifications(prev => 
                prev.map(n => ({ ...n, leida: true, fecha_lectura: new Date().toISOString() }))
            )
            setUnreadCount(0)

        } catch (err) {
            console.error('Error en markAllAsRead:', err)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getNotificationIcon = (tipo: string) => {
        switch (tipo) {
            case 'verificacion_identidad':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                )
            case 'verificacion_aprobada':
                return (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.leida) {
            markAsRead(notification.notificacion_id)
        }

        // Si es una notificación de verificación rechazada, redirigir a verificación
        if (notification.tipo === 'verificacion_identidad' && 
            notification.datos_adicionales?.status === 'rejected') {
            window.location.href = '/verificacion-identidad'
        }
    }

    useEffect(() => {
        fetchNotifications()

        // Suscripción en tiempo real a nuevas notificaciones
        const setupRealtimeSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userData } = await supabase
                    .from('usuario')
                    .select('user_id')
                    .eq('email', user.email)
                    .single()

                if (userData) {
                    const channel = supabase
                        .channel('client_notifications')
                        .on(
                            'postgres_changes',
                            {
                                event: '*',
                                schema: 'public',
                                table: 'notificacion',
                                filter: `usuario_id=eq.${userData.user_id}`
                            },
                            () => {
                                fetchNotifications()
                            }
                        )
                        .subscribe()

                    return () => {
                        supabase.removeChannel(channel)
                    }
                }
            }
        }

        const cleanup = setupRealtimeSubscription()
        
        return () => {
            cleanup.then(cleanupFn => cleanupFn?.())
        }
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center text-red-600">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium">{error}</p>
                    <button
                        onClick={fetchNotifications}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Notificaciones</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todas leídas'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                            Marcar todas como leídas
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V3a2 2 0 00-2-2H6a2 2 0 00-2 2v2zM14 3v2h6a2 2 0 00-2-2h-4a2 2 0 00-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No hay notificaciones</p>
                        <p className="text-sm">Te notificaremos cuando tengas nuevas actualizaciones</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {notifications.map((notification) => (
                            <div
                                key={notification.notificacion_id}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !notification.leida ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.tipo)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-medium ${
                                                !notification.leida ? 'text-gray-900' : 'text-gray-700'
                                            }`}>
                                                {notification.titulo}
                                            </p>
                                            {!notification.leida && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                            )}
                                        </div>
                                        <p className={`text-sm mt-1 ${
                                            !notification.leida ? 'text-gray-700' : 'text-gray-500'
                                        }`}>
                                            {notification.mensaje}
                                        </p>
                                        
                                        {/* Mostrar motivo de rechazo si está disponible */}
                                        {notification.datos_adicionales?.motivo_rechazo && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                                <p className="text-xs text-red-700 font-medium">Motivo del rechazo:</p>
                                                <p className="text-xs text-red-600 mt-1">
                                                    {notification.datos_adicionales.motivo_rechazo}
                                                </p>
                                            </div>
                                        )}

                                        {/* Botón para volver a enviar si fue rechazado */}
                                        {notification.tipo === 'verificacion_identidad' && 
                                         notification.datos_adicionales?.status === 'rejected' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.location.href = '/verificacion-identidad'
                                                }}
                                                className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Volver a enviar documentos
                                            </button>
                                        )}

                                        <p className="text-xs text-gray-400 mt-2">
                                            {formatDate(notification.fecha_creacion)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

