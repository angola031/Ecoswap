'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAccessDeniedClientPage() {
    const router = useRouter()

    useEffect(() => {
        // Verificar si el usuario es administrador
        const checkAdmin = async () => {
            const supabase = getSupabaseClient()
            if (!supabase) {
                // Si Supabase no está configurado, redirigir a la página principal
                router.push('/')
                return
            }
            
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userData } = await supabase
                    .from('usuario')
                    .select('es_admin, activo')
                    .eq('email', user.email)
                    .single()

                if (userData?.es_admin && userData?.activo) {
                    // Si es administrador, redirigir al dashboard
                    router.push('/admin/verificaciones')
                } else {
                    // Si no es administrador, redirigir a la página principal
                    router.push('/')
                }
            } else {
                // Si no está autenticado, redirigir al login
                router.push('/login')
            }
        }

        checkAdmin()
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <div className="mx-auto h-12 w-12 text-red-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Acceso Restringido
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Como administrador, no puedes acceder a las páginas de clientes.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Serás redirigido automáticamente al dashboard de administradores...
                    </p>
                </div>

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>

                <div className="space-y-2">
                    <button
                        onClick={() => router.push('/admin/verificaciones')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Ir al Dashboard de Administradores
                    </button>

                    <button
                        onClick={() => {
                            const supabase = getSupabaseClient()
                            if (supabase) {
                                supabase.auth.signOut()
                            }
                            router.push('/')
                        }}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    )
}

