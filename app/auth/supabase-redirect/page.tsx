'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function SupabaseRedirectPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const handleRedirect = async () => {
            try {
                // Obtener parámetros de la URL
                const accessToken = searchParams.get('access_token')
                const refreshToken = searchParams.get('refresh_token')
                const type = searchParams.get('type')

                // Si es un reset de contraseña, redirigir a la página de reset con tokens
                if (type === 'recovery') {
                    
                    // Construir URL con tokens para la página de reset
                    const resetUrl = new URL('/auth/reset-password', window.location.origin)
                    resetUrl.searchParams.set('reactivation', 'true')
                    if (accessToken) resetUrl.searchParams.set('access_token', accessToken)
                    if (refreshToken) resetUrl.searchParams.set('refresh_token', refreshToken)
                    
                    router.replace(resetUrl.toString())
                    return
                }

                // Si hay tokens, establecer la sesión
                if (accessToken && refreshToken) {
                    const supabase = getSupabaseClient()
                    if (!supabase) {
                        console.log('❌ Supabase no está configurado')
                        setError('Error de configuración')
                        return
                    }
                    
                    const { data, error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    })

                    if (sessionError) {
                        setError('Error estableciendo sesión: ' + sessionError.message)
                        setLoading(false)
                        return
                    }

                    if (data.user) {
                        // Verificar si es administrador
                        const { data: userData } = await supabase
                            .from('usuario')
                            .select('es_admin, activo')
                            .eq('email', data.user.email)
                            .single()

                        if (userData?.es_admin && userData?.activo) {
                            // Si es administrador, ir al dashboard
                            router.replace('/admin/verificaciones')
                        } else {
                            // Si no es administrador, ir a la página principal
                            router.replace('/')
                        }
                        return
                    }
                }

                // Si no hay tokens ni usuario, redirigir al login de admin
                router.replace('/login')
                return

            } catch (err: any) {
                setError('Error procesando redirección: ' + err.message)
                setLoading(false)
            }
        }

        handleRedirect()
    }, [router, searchParams])

if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Procesando redirección...</p>
            </div>
        </div>
    )
}

if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <div className="mx-auto h-12 w-12 text-red-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Error de Redirección
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {error}
                    </p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Ir al Login
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Ir al Inicio
                    </button>
                </div>
            </div>
        </div>
    )
}

return null
}
