'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { getSupabaseClient } from '@/lib/supabase-client'
import AdminManagementModule from '@/components/admin/AdminManagementModule'
import DashboardNavigation from '@/components/admin/DashboardNavigation'
import UsersSection from '@/components/admin/UsersSection'
import ProductsSection from '@/components/admin/ProductsSection'
import MessagesSection from '@/components/admin/MessagesSection'
import ComplaintsSection from '@/components/admin/ComplaintsSection'
import NotificationsSection from '@/components/admin/NotificationsSection'
import IdentityVerificationSection from '@/components/admin/IdentityVerificationSection'
import VerificationSummary from '@/components/admin/VerificationSummary'
import DashboardOverview from '@/components/admin/DashboardOverview'

export default function VerificacionesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showAdminModule, setShowAdminModule] = useState(false)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [activeSection, setActiveSection] = useState('overview')

    useEffect(() => {
        const getUser = async () => {
            const supabase = getSupabaseClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setUser(user)

                // Verificar si es administrador
                console.log('🔍 Verificando permisos de admin para:', user.email, 'ID:', user.id)
                
                // Primero intentar buscar por auth_user_id
                let { data: userData, error: userError } = await supabase
                    .from('usuario')
                    .select('es_admin, activo, nombre, apellido, auth_user_id')
                    .eq('auth_user_id', user.id)
                    .single()

                // Si no se encuentra por auth_user_id, buscar por email como fallback
                if (userError || !userData) {
                    console.log('🔍 No encontrado por auth_user_id, buscando por email...')
                    const emailResult = await supabase
                        .from('usuario')
                        .select('es_admin, activo, nombre, apellido, auth_user_id')
                        .eq('email', user.email)
                        .single()
                    
                    userData = emailResult.data
                    userError = emailResult.error
                }

                console.log('🔍 Resultado verificación admin:', { userData, userError })


                if (userError) {
                    router.push('/login')
                    return
                }

                if (!userData?.es_admin || !userData?.activo) {
                    router.push('/login')
                    return
                }

            } else {
                router.push('/login')
            }
            setLoading(false)
        }
        getUser()
    }, [router])

    const handleLogout = async () => {
        setLogoutLoading(true)
        try {
            
            // PASO 1: Cerrar sesión en Supabase PRIMERO
            const supabase = getSupabaseClient()
            const { error } = await supabase.auth.signOut()
            
            if (error) {
                console.error('❌ Error en logout:', error)
            } else {
            }
            
            // PASO 2: Limpiar localStorage
            if (typeof window !== 'undefined') {
                localStorage.clear()
            }
            
            // PASO 3: Limpiar TODAS las cookies (no solo las de Supabase)
            
            // Obtener todas las cookies
            const allCookies = document.cookie.split(";")
            
            allCookies.forEach(cookie => {
                if (cookie.trim()) {
                    const cookieName = cookie.split('=')[0].trim()
                    
                    // Limpiar cookie con múltiples configuraciones para asegurar eliminación
                    const domain = window.location.hostname
                    const baseDomain = domain.startsWith('www.') ? domain.substring(4) : domain
                    
                    // Diferentes configuraciones para asegurar limpieza completa
                    const cookieConfigs = [
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${baseDomain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${baseDomain};`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=strict;`,
                        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; samesite=lax;`
                    ]
                    
                    cookieConfigs.forEach(config => {
                        document.cookie = config
                    })
                }
            })
            
            
            // PASO 4: Verificar que las cookies se limpiaron
            const remainingCookies = document.cookie
            if (remainingCookies) {
            } else {
            }
            
            // PASO 5: Forzar redirección inmediata
            window.location.href = '/login?logout=true'
            
        } catch (err) {
            console.error('💥 Error en logout:', err)
            // Aún así limpiar cookies y redirigir
            try {
                localStorage.clear()
                document.cookie.split(";").forEach(cookie => {
                    const cookieName = cookie.split('=')[0].trim()
                    if (cookieName) {
                        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
                    }
                })
            } catch (cleanupErr) {
                console.error('Error en limpieza de emergencia:', cleanupErr)
            }
            window.location.href = '/login?logout=true'
        } finally {
            setLogoutLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        {/* Resumen General del Dashboard */}
                        <DashboardOverview 
                            onViewUsers={() => setActiveSection('users')}
                            onViewVerifications={() => setActiveSection('identity-verification')}
                            onViewNotifications={() => setActiveSection('notifications')}
                            onViewProducts={() => setActiveSection('products')}
                        />
                        
                        {/* Resumen de Verificaciones */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <VerificationSummary onViewDetails={() => setActiveSection('identity-verification')} />
                            </div>
                            <div className="lg:col-span-1">
                                <NotificationsSection userId={user?.id} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                                <div className="space-y-3">
                        <button
                                        onClick={() => setActiveSection('users')}
                                        className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">👥</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Gestionar Usuarios</p>
                                                <p className="text-sm text-gray-600">Ver y administrar usuarios registrados</p>
                                            </div>
                                        </div>
                        </button>
                        <button
                                        onClick={() => setActiveSection('products')}
                                        className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">📦</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Verificar Productos</p>
                                                <p className="text-sm text-gray-600">Revisar productos pendientes</p>
                                            </div>
                                        </div>
                        </button>
                        <button
                                        onClick={() => setActiveSection('identity-verification')}
                                        className="w-full text-left p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">🆔</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Validar Identidad</p>
                                                <p className="text-sm text-gray-600">Revisar documentos de identidad</p>
                                            </div>
                                        </div>
                        </button>
                        <button
                                        onClick={() => setActiveSection('messages')}
                                        className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">💬</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Mensajes de Clientes</p>
                                                <p className="text-sm text-gray-600">Responder consultas y soporte</p>
                                            </div>
                                        </div>
                        </button>
                        <button
                                        onClick={() => setActiveSection('complaints')}
                                        className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">⚠️</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Quejas y Reportes</p>
                                                <p className="text-sm text-gray-600">Gestionar reportes y quejas</p>
                    </div>
                </div>
                                    </button>
                                    <button
                                        onClick={() => setActiveSection('notifications')}
                                        className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">🔔</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Notificaciones</p>
                                                <p className="text-sm text-gray-600">Verificaciones y alertas</p>
                            </div>
                        </div>
                                    </button>
                    </div>
                            </div>
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Administración</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowAdminModule(true)}
                                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">👨‍💼</span>
                                            <div>
                                                <p className="font-medium text-gray-900">Gestionar Administradores</p>
                                                <p className="text-sm text-gray-600">Crear y administrar cuentas de admin</p>
                            </div>
                        </div>
                                    </button>
                            </div>
                            </div>
                        </div>
                    </div>
                )
            case 'users':
                return <UsersSection />
            case 'products':
                return <ProductsSection user={user} />
            case 'identity-verification':
                return <IdentityVerificationSection currentUserId={user?.id} />
            case 'messages':
                return <MessagesSection />
            case 'complaints':
                return <ComplaintsSection />
            case 'notifications':
                return <NotificationsSection userId={user?.id} />
            case 'admins':
                return (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Administradores</h2>
                        <AdminManagementModule onClose={() => setShowAdminModule(false)} />
                    </div>
                )
            default:
                return (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
                        <p className="text-gray-600">Selecciona una opción del menú para comenzar.</p>
                    </div>
                )
        }
    }

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-900">EcoSwap - Dashboard</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Bienvenido, {user?.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                            >
                                {logoutLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                        <span>Cerrando...</span>
                                    </>
                                ) : (
                                    'Cerrar Sesión'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <DashboardNavigation 
                activeSection={activeSection} 
                onSectionChange={setActiveSection} 
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {renderSection()}
                </div>
            </main>

            {/* Admin Management Module Modal */}
            {showAdminModule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Gestión de Administradores</h3>
                                <button
                                onClick={() => setShowAdminModule(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        <div className="p-4">
                            <AdminManagementModule onClose={() => setShowAdminModule(false)} />
                        </div>
                    </div>
                </div>
            )}
            </div>
        </AuthGuard>
    )
}