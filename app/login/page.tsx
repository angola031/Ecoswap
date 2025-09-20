'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    
    const supabase = createClient()

    // Limpiar sesión si se accede con ?logout=true
    useEffect(() => {
        if (searchParams.get('logout') === 'true') {
            console.log('🧹 Limpiando sesión residual después del logout...')
            const cleanup = async () => {
                try {
                    await supabase.auth.signOut()
                    console.log('✅ Sesión residual limpiada')
                    // Limpiar localStorage también
                    localStorage.clear()
                    console.log('✅ localStorage limpiado')
                } catch (error) {
                    console.log('⚠️ Error limpiando sesión residual:', error)
                }
            }
            cleanup()
        }
    }, [searchParams, supabase.auth])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            // Paso 1: Autenticar
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                console.log('❌ Error de autenticación:', error)
                setError(error.message)
                return
            }

            console.log('✅ Usuario autenticado:', data.user?.email)

            // Paso 2: VERIFICAR la sesión antes de consultar
            const { data: { session } } = await supabase.auth.getSession()
            console.log('🔍 Sesión actual:', session)

            if (!session) {
                setError('No se pudo establecer la sesión')
                return
            }

            // Paso 3: Ahora SÍ consultar (con sesión activa)
            const { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('es_admin, activo, nombre, apellido')
                .eq('email', email)
                .single()

            console.log('📊 Resultado de la consulta:', { userData, userError })

            if (userError) {
                console.error('❌ Error en la consulta:', userError)
                setError('Error al verificar permisos: ' + userError.message)
                return
            }

            if (!userData) {
                setError('No se encontraron datos del usuario')
                return
            }

            // Mostrar mensaje de éxito y dejar que el middleware maneje la redirección
            if (userData.es_admin && userData.activo) {
                setSuccess('¡Autenticación exitosa! Redirigiendo al dashboard...')
                console.log('🔑 Admin autenticado, redirigiendo...')
                
                // Recargar la página para que el middleware maneje la redirección
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
            } else if (userData && !userData.es_admin) {
                setSuccess('¡Autenticación exitosa! Redirigiendo...')
                console.log('👤 Usuario normal, redirigiendo...')
                
                // Recargar la página para que el middleware maneje la redirección
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
            } else {
                setError('Tu cuenta no está activa')
                await supabase.auth.signOut()
            }
        } catch (err: any) {
            console.error('💥 Error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
                        Iniciar Sesión - EcoSwap
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Accede a tu cuenta de EcoSwap
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Tu contraseña"
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

                    {success && (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        Éxito
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        {success}
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
                                    Iniciando sesión...
                                </div>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </div>

                    <div className="text-center space-y-2">
                        <button
                            type="button"
                            onClick={() => router.push('/auth/reset-password')}
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                        <div>
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-sm text-gray-600 hover:text-gray-500"
                            >
                                ← Volver a la página principal
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
