'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import ClientNotifications from '@/components/client/ClientNotifications'

export default function NotificationsPage() {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session) {
                    router.push('/login')
                    return
                }

                setUser(session.user)
            } catch (error) {
                console.error('Error checking user:', error)
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
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-8">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white bg-opacity-20 rounded-full p-3">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19h6v-6h6v-6h6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13h6V7h6V1" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">🔔 Notificaciones</h1>
                                <p className="text-blue-100 mt-1 text-lg">
                                    Mantente al día con las últimas actualizaciones de tu cuenta
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 shadow-lg"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Inicio
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ClientNotifications />
            </div>
        </div>
    )
}

