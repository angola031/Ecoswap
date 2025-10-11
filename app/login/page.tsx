'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [timeoutMessage, setTimeoutMessage] = useState<string>('')
    
    const supabase = getSupabaseClient()

    // Limpiar sesión si se accede con ?logout=true o ?timeout=true
    useEffect(() => {
        if (searchParams.get('timeout') === 'true') {
            setTimeoutMessage('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.')
            // Limpiar el parámetro de la URL
            window.history.replaceState({}, '', '/login')
        }
        
        if (searchParams.get('logout') === 'true' || searchParams.get('timeout') === 'true') {
            const cleanup = async () => {
                try {
                    if (supabase) {
                        await supabase.auth.signOut()
                    }
                    // Limpiar localStorage también
                    localStorage.clear()
                } catch (error) {
                }
            }
            cleanup()
        }
    }, [searchParams, supabase])

    // Verificar si ya hay una sesión activa al cargar la página
    useEffect(() => {
        if (!supabase) return

        const checkExistingSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    console.log('🔍 Sesión existente detectada, verificando usuario...')
                    
                    // Verificar el usuario en la base de datos
                    console.log('🔍 Verificando sesión existente para:', session.user.email, 'ID:', session.user.id)
                    
                    // Primero intentar buscar por auth_user_id
                    let { data: userData } = await supabase
                        .from('usuario')
                        .select('es_admin, activo, auth_user_id')
                        .eq('auth_user_id', session.user.id)
                        .single()

                    // Si no se encuentra por auth_user_id, buscar por email como fallback
                    if (!userData) {
                        console.log('🔍 No encontrado por auth_user_id en sesión existente, buscando por email...')
                        const emailResult = await supabase
                            .from('usuario')
                            .select('es_admin, activo, auth_user_id')
                            .eq('email', session.user.email)
                            .single()
                        
                        userData = emailResult.data
                    }
                    
                    console.log('🔍 Usuario encontrado en sesión existente:', userData)

                    if (userData?.activo) {
                        if (userData.es_admin) {
                            console.log('🔍 Redirigiendo a admin dashboard desde sesión existente')
                            setTimeout(() => {
                                window.location.href = '/admin/verificaciones'
                            }, 2000)
                        } else {
                            console.log('🔍 Redirigiendo a página principal desde sesión existente')
                            setTimeout(() => {
                                window.location.href = '/'
                            }, 1000)
                        }
                    }
                }
            } catch (error) {
                console.error('Error verificando sesión existente:', error)
            }
        }

        checkExistingSession()

        // Escuchar cambios en el estado de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔍 Cambio de estado de auth:', event, !!session)
            
            if (event === 'SIGNED_IN' && session) {
                console.log('🔍 Usuario inició sesión, verificando permisos...')
                
                // Verificar permisos y redirigir
                const checkAndRedirect = async () => {
                    try {
                        let { data: userData } = await supabase
                            .from('usuario')
                            .select('es_admin, activo')
                            .eq('auth_user_id', session.user.id)
                            .single()

                        if (!userData) {
                            const emailResult = await supabase
                                .from('usuario')
                                .select('es_admin, activo')
                                .eq('email', session.user.email)
                                .single()
                            userData = emailResult.data
                        }

                        if (userData?.activo) {
                            if (userData.es_admin) {
                                console.log('🔍 Redirigiendo a admin dashboard desde auth state change')
                                // Esperar un poco para que se establezca la sesión
                                setTimeout(() => {
                                    window.location.href = '/admin/verificaciones'
                                }, 2500)
                            } else {
                                console.log('🔍 Redirigiendo a página principal desde auth state change')
                                setTimeout(() => {
                                    window.location.href = '/'
                                }, 1500)
                            }
                        }
                    } catch (error) {
                        console.error('Error verificando permisos en auth state change:', error)
                    }
                }

                checkAndRedirect()
            }
        })

        return () => subscription.unsubscribe()
    }, [supabase, router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        if (!supabase) {
            setError('Supabase no está configurado. Modo estático activo.')
            setLoading(false)
            return
        }

        try {
            // Paso 1: Autenticar
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
                return
            }


            // Paso 2: VERIFICAR la sesión antes de consultar
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setError('No se pudo establecer la sesión')
                return
            }

            // Paso 3: Ahora SÍ consultar (con sesión activa)
            console.log('🔍 Verificando usuario en base de datos para:', email)
            console.log('🔍 ID del usuario autenticado:', session.user.id)
            
            // Primero intentar buscar por auth_user_id (método preferido)
            let { data: userData, error: userError } = await supabase
                .from('usuario')
                .select('es_admin, activo, nombre, apellido, auth_user_id')
                .eq('auth_user_id', session.user.id)
                .single()

            // Si no se encuentra por auth_user_id, buscar por email como fallback
            if (userError || !userData) {
                console.log('🔍 No encontrado por auth_user_id, buscando por email...')
                const emailResult = await supabase
                    .from('usuario')
                    .select('es_admin, activo, nombre, apellido, auth_user_id')
                    .eq('email', email)
                    .single()
                
                userData = emailResult.data
                userError = emailResult.error
            }

            console.log('🔍 Resultado de consulta usuario:', { userData, userError })

            if (userError) {
                console.error('❌ Error en la consulta:', userError)
                setError('Error al verificar permisos: ' + userError.message)
                return
            }

            if (!userData) {
                console.error('❌ No se encontraron datos del usuario para:', email)
                setError('No se encontraron datos del usuario')
                return
            }

            console.log('✅ Usuario encontrado:', userData)

            // Redirigir directamente según el tipo de usuario
            if (userData.es_admin && userData.activo) {
                console.log('🔍 Usuario admin detectado, redirigiendo a admin dashboard')
                setSuccess('¡Autenticación exitosa! Redirigiendo al dashboard...')
                
                // Esperar a que se establezca completamente la sesión antes de redirigir
                setTimeout(async () => {
                    console.log('🔍 Esperando establecimiento de sesión...')
                    
                    // Verificar que la sesión esté realmente establecida
                    const { data: { session } } = await supabase.auth.getSession()
                    console.log('🔍 Sesión verificada:', !!session)
                    
                    if (session) {
                        console.log('🔍 Sesión establecida, redirigiendo a admin dashboard')
                        window.location.href = '/admin/verificaciones'
                    } else {
                        console.log('🔍 Sesión no establecida, reintentando en 3 segundos...')
                        setTimeout(() => {
                            window.location.href = '/admin/verificaciones'
                        }, 3000)
                    }
                }, 3000)
                return // No ejecutar setLoading(false) si vamos a redirigir
            } else if (userData && !userData.es_admin && userData.activo) {
                console.log('🔍 Usuario normal detectado, redirigiendo a página principal')
                setSuccess('¡Autenticación exitosa! Redirigiendo...')
                
                // Redirigir a la página principal
                setTimeout(() => {
                    console.log('🔍 Ejecutando redirección a página principal')
                    console.log('🔍 Usando window.location.href directamente')
                    
                    // Usar window.location.href directamente
                    window.location.href = '/'
                }, 1000)
                return // No ejecutar setLoading(false) si vamos a redirigir
            } else {
                console.log('❌ Usuario inactivo o sin permisos:', userData)
                setError('Tu cuenta no está activa o no tienes permisos')
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
                {/* Mensaje de timeout */}
                {timeoutMessage && (
                    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">
                                    {timeoutMessage}
                                </p>
                            </div>
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        onClick={() => setTimeoutMessage('')}
                                        className="inline-flex bg-orange-100 rounded-md p-1.5 text-orange-500 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-orange-100 focus:ring-orange-600"
                                    >
                                        <span className="sr-only">Cerrar</span>
                                        <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
