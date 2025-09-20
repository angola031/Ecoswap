'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AdminManagementModule from '@/components/admin/AdminManagementModule'
import DashboardStats from '@/components/admin/DashboardStats'
import DashboardNavigation from '@/components/admin/DashboardNavigation'
import UsersSection from '@/components/admin/UsersSection'
import ProductsSection from '@/components/admin/ProductsSection'
import MessagesSection from '@/components/admin/MessagesSection'
import ComplaintsSection from '@/components/admin/ComplaintsSection'

export default function VerificacionesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showAdminModule, setShowAdminModule] = useState(false)
    const [logoutLoading, setLogoutLoading] = useState(false)
    const [activeSection, setActiveSection] = useState('overview')

    useEffect(() => {
        const getUser = async () => {
            console.log('🔍 Dashboard: Verificando usuario...')
            const { data: { user } } = await supabase.auth.getUser()
            console.log('👤 Dashboard: Usuario de auth:', user?.email)

            if (user) {
                setUser(user)

                // Verificar si es administrador
                const { data: userData, error: userError } = await supabase
                    .from('usuario')
                    .select('es_admin, activo, nombre, apellido')
                    .eq('email', user.email)
                    .single()

                console.log('📊 Dashboard: Datos del usuario:', userData)
                console.log('❌ Dashboard: Error al obtener datos:', userError)

                if (userError) {
                    console.log('⚠️ Dashboard: Error obteniendo datos del usuario, redirigiendo al login')
                    router.push('/login')
                    return
                }

                if (!userData?.es_admin || !userData?.activo) {
                    console.log('⚠️ Dashboard: Usuario no es administrador o no está activo, redirigiendo al login')
                    router.push('/login')
                    return
                }

                console.log('✅ Dashboard: Usuario administrador verificado, mostrando dashboard')
            } else {
                console.log('⚠️ Dashboard: No hay usuario autenticado, redirigiendo al login')
                router.push('/login')
            }
            setLoading(false)
        }
        getUser()
    }, [router])

    const handleLogout = async () => {
        setLogoutLoading(true)
        try {
            console.log('🚪 Iniciando logout...')
            
            // PASO 1: Cerrar sesión en Supabase PRIMERO
            console.log('🔐 Cerrando sesión en Supabase...')
            const { error } = await supabase.auth.signOut()
            
            if (error) {
                console.error('❌ Error en logout:', error)
            } else {
                console.log('✅ Logout exitoso en Supabase')
            }
            
            // PASO 2: Limpiar localStorage
            if (typeof window !== 'undefined') {
                console.log('🧹 Limpiando localStorage...')
                localStorage.clear()
                console.log('✅ localStorage limpiado')
            }
            
            // PASO 3: Limpiar TODAS las cookies (no solo las de Supabase)
            console.log('🍪 Limpiando TODAS las cookies...')
            
            // Obtener todas las cookies
            const allCookies = document.cookie.split(";")
            console.log(`📋 Total de cookies encontradas: ${allCookies.length}`)
            
            allCookies.forEach(cookie => {
                if (cookie.trim()) {
                    const cookieName = cookie.split('=')[0].trim()
                    console.log(`🧹 Limpiando cookie: ${cookieName}`)
                    
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
            
            console.log('✅ Todas las cookies limpiadas')
            
            // PASO 4: Verificar que las cookies se limpiaron
            const remainingCookies = document.cookie
            if (remainingCookies) {
                console.log('⚠️ Cookies restantes después de limpieza:', remainingCookies)
            } else {
                console.log('✅ Confirmado: No hay cookies restantes')
            }
            
            // PASO 5: Forzar redirección inmediata
            console.log('🚀 Redirigiendo inmediatamente a /login...')
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
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Resumen del Dashboard</h2>
                            <p className="text-gray-600">Vista general de las estadísticas y métricas del sistema</p>
                        </div>
                        <DashboardStats />
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
                return <ProductsSection />
            case 'messages':
                return <MessagesSection />
            case 'complaints':
                return <ComplaintsSection />
            case 'admins':
                return (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Gestión de Administradores</h2>
                        <AdminManagementModule onClose={() => setShowAdminModule(false)} />
                    </div>
                )
            default:
                return <DashboardStats />
        }
    }

    return (
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
    )
}