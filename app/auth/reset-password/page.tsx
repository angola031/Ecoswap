'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isReactivation, setIsReactivation] = useState(false)
    const [userInfo, setUserInfo] = useState<any>(null)

    useEffect(() => {
        // Verificar si es una reactivación
        const reactivation = searchParams.get('reactivation')
        if (reactivation === 'true') {
            setIsReactivation(true)
        }

        // Obtener información del usuario actual
        const getUserInfo = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserInfo(user)
            } else {
                
                // Buscar tokens en query parameters (de la reactivación)
                const accessToken = searchParams.get('access_token')
                const refreshToken = searchParams.get('refresh_token')
                
                // Si no están en query params, buscar en hash (de enlaces directos de Supabase)
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const hashAccessToken = hashParams.get('access_token')
                const hashRefreshToken = hashParams.get('refresh_token')
                
                const finalAccessToken = accessToken || hashAccessToken
                const finalRefreshToken = refreshToken || hashRefreshToken

                console.log('🔑 Tokens encontrados:', { 
                    accessToken: !!finalAccessToken, 
                    refreshToken: !!finalRefreshToken,
                    source: accessToken ? 'query' : 'hash'
                })

                if (finalAccessToken && finalRefreshToken) {
                    // Establecer la sesión con los tokens
                    const { data, error } = await supabase.auth.setSession({
                        access_token: finalAccessToken,
                        refresh_token: finalRefreshToken
                    })

                    if (error) {
                        console.error('❌ Error estableciendo sesión:', error.message)
                        setError('Error estableciendo sesión: ' + error.message)
                        return
                    }

                    if (data.user) {
                        setUserInfo(data.user)
                    }
                } else {
                    // Si no hay tokens y no hay sesión, redirigir al login de admin
                    router.push('/login')
                }
            }
        }
        getUserInfo()
    }, [searchParams, router])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) {
                setError(error.message)
            } else {
                setSuccess(true)
                // Redirigir después de 3 segundos al dashboard correcto
                setTimeout(() => {
                    if (isReactivation) {
                        router.push('/admin/verificaciones')
                    } else {
                        router.push('/admin/verificaciones')
                    }
                }, 3000)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 text-green-500">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            ¡Contraseña Actualizada!
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {isReactivation
                                ? 'Tu contraseña ha sido establecida exitosamente. Tu acceso de administrador ha sido reactivado.'
                                : 'Tu contraseña ha sido actualizada exitosamente.'
                            }
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            Serás redirigido al dashboard en unos segundos...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 text-blue-600">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isReactivation ? 'Establecer Nueva Contraseña' : 'Restablecer Contraseña'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {isReactivation
                            ? 'Tu acceso de administrador ha sido reactivado. Establece una nueva contraseña para continuar.'
                            : 'Ingresa tu nueva contraseña para continuar.'
                        }
                    </p>
                    {userInfo && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Usuario:</strong> {userInfo.email}
                            </p>
                            {isReactivation && (
                                <p className="text-sm text-blue-600 mt-1">
                                    Tu cuenta de administrador ha sido reactivada exitosamente.
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Nueva Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Ingresa tu nueva contraseña"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Confirma tu nueva contraseña"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Error
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {error}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Estableciendo contraseña...
                                </div>
                            ) : (
                                isReactivation ? 'Establecer Contraseña y Reactivar' : 'Restablecer Contraseña'
                            )}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            Volver al inicio de sesión
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
