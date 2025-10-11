'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

interface NotificationToastProps {
    userId: number
}

interface Notification {
    notificacion_id: number
    titulo: string
    mensaje: string
    tipo: string
    datos_adicionales?: any
    leida: boolean
    fecha_creacion: string
}

export default function NotificationToast({ userId }: NotificationToastProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showToast, setShowToast] = useState(false)
    const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
    const [playSound, setPlaySound] = useState(false)

    useEffect(() => {
        if (!userId) return

        // Función para reproducir sonido de notificación
        const playNotificationSound = () => {
            try {
                // Crear un sonido simple usando Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime)
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
                
                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.5)
            } catch (error) {
            }
        }

        // Función para mostrar toast
        const showNotificationToast = (notification: Notification) => {
            setCurrentNotification(notification)
            setShowToast(true)
            playNotificationSound()
            
            // Auto-ocultar después de 8 segundos
            setTimeout(() => {
                setShowToast(false)
                setCurrentNotification(null)
            }, 8000)
        }

        // Suscripción en tiempo real a nuevas notificaciones
        const supabase = getSupabaseClient()
        if (!supabase) return
        
        const channel = supabase
            .channel('notification_toast')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificacion',
                    filter: `usuario_id=eq.${userId}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification
                    showNotificationToast(newNotification)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    const handleCloseToast = () => {
        setShowToast(false)
        setCurrentNotification(null)
    }

    const handleViewNotification = () => {
        if (currentNotification) {
            // Marcar como leída
            supabase
                .from('notificacion')
                .update({ leida: true })
                .eq('notificacion_id', currentNotification.notificacion_id)
                .then(() => {
                    // Redirigir a la página de notificaciones
                    window.location.href = '/notificaciones'
                })
        }
    }

    if (!showToast || !currentNotification) {
        return null
    }

    // Determinar el color y icono según el tipo de notificación
    const getNotificationStyle = (tipo: string) => {
        switch (tipo) {
            case 'verificacion_aprobada':
                return {
                    bgColor: 'bg-green-500',
                    icon: '✅',
                    title: '¡Verificación Aprobada!'
                }
            case 'verificacion_identidad':
                return {
                    bgColor: 'bg-red-500',
                    icon: '❌',
                    title: 'Verificación Rechazada'
                }
            case 'sistema':
                return {
                    bgColor: 'bg-blue-500',
                    icon: 'ℹ️',
                    title: 'Información del Sistema'
                }
            default:
                return {
                    bgColor: 'bg-gray-500',
                    icon: '📢',
                    title: 'Nueva Notificación'
                }
        }
    }

    const style = getNotificationStyle(currentNotification.tipo)

    return (
        <>
            {/* Toast de notificación */}
            <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
                <div className={`${style.bgColor} text-white rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                            <div className="text-2xl">
                                {style.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">
                                    {style.title}
                                </h4>
                                <p className="text-sm opacity-90 mt-1">
                                    {currentNotification.mensaje}
                                </p>
                                <div className="flex items-center mt-2 space-x-2">
                                    <button
                                        onClick={handleViewNotification}
                                        className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
                                    >
                                        Ver detalles
                                    </button>
                                    <button
                                        onClick={handleCloseToast}
                                        className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Indicador de nueva notificación en el header */}
            <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-sm font-medium z-40 animate-pulse">
                🔔 ¡Tienes una nueva notificación!
            </div>
        </>
    )
}
