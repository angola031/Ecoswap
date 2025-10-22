'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClientNotifications from '@/components/client/ClientNotifications'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function NotificationsPage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            try {
                const supabase = getSupabaseClient()
                if (!supabase) {
                    console.log('❌ Supabase no está configurado - usando modo estático')
                    // En lugar de redirigir, mostrar mensaje de configuración
                    setError('Sistema de notificaciones no disponible. Configura Supabase para habilitar esta funcionalidad.')
                    setLoading(false)
                    return
                }
                
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session) {
                    console.log('🔐 No hay sesión activa - redirigiendo a login')
                    router.push('/login')
                    return
                }

                console.log('✅ Usuario autenticado:', session.user.email)
                setUser(session.user)
            } catch (error) {
                console.error('❌ Error checking user:', error)
                router.push('/login')
            } finally {
                setLoading(false)
            }
        }

        checkUser()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md mx-auto text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
                        <h2 className="text-lg font-semibold mb-2">⚠️ Configuración Requerida</h2>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-6 md:py-8 gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white bg-opacity-20 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h6v-6h6v-6h6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13h6V7h6V1" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">🔔 Notificaciones</h1>
                                <p className="text-green-100 mt-1 text-sm md:text-lg">
                                    Mantente al día con las últimas actualizaciones de tu cuenta
                                </p>
                            </div>
                        </div>
                        <div className="md:self-auto">
                            <button
                                onClick={() => router.push('/')}
                                className="w-full md:w-auto flex items-center justify-center px-5 md:px-6 py-2.5 md:py-3 text-sm font-medium text-green-600 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 shadow-lg"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8">
                <ClientNotifications />
            </div>
        </div>
    )
}

