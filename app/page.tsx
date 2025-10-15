'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    HomeIcon,
    UserIcon,
    ChatBubbleLeftRightIcon,
    HeartIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    InformationCircleIcon,
    BellIcon,
    ShoppingBagIcon,
    ArrowsRightLeftIcon,
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

// Componentes
import AuthModule from '@/components/auth/AuthModule'
import CoreModule from '@/components/core/CoreModule'
import ProductsModule from '@/components/products/ProductsModule'
import ChatModule from '@/components/chat/ChatModule'
import ProfileModule from '@/components/profile/ProfileModule'
import InteractionsModule from '@/components/interactions/InteractionsModule'
import NotificationToast from '@/components/NotificationToast'

// Tipos
import { type User } from '@/lib/types'
import { getCurrentUser, logoutUser, isUserAdmin } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useInactivity } from '@/hooks/useInactivity'
import { useNotifications } from '@/hooks/useNotifications'

export default function HomePage() {
    const searchParams = useSearchParams()
    const [currentScreen, setCurrentScreen] = useState<'auth' | 'main'>('main')
    const [currentModule, setCurrentModule] = useState<string>('products')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [timeoutMessage, setTimeoutMessage] = useState<string>('')
    
    // Hook para notificaciones
    const { unreadCount, loading: notificationsLoading } = useNotifications()

    // Función para verificar sesión después de actividad
    const checkSessionAfterActivity = async () => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) return

            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                console.log('✅ Sesión válida detectada después de actividad')
                const user = await getCurrentUser()
                if (user) {
                    setCurrentUser(user)
                    setIsAuthenticated(true)
                    setCurrentScreen('main')
                    setTimeoutMessage('') // Limpiar mensaje de timeout
                    console.log('✅ Estado restaurado correctamente')
                }
            } else {
                console.log('⚠️ No hay sesión válida después de actividad')
                setIsAuthenticated(false)
                setCurrentUser(null)
                setCurrentScreen('main')
            }
        } catch (error) {
            console.error('Error verificando sesión después de actividad:', error)
        }
    }

    // Función para navegar a un módulo con validación
    const navigateToModule = async (module: string) => {
        try {
            // Si el módulo requiere autenticación, verificar sesión
            const protectedModules = ['interactions', 'chat', 'profile', 'notifications']
            if (protectedModules.includes(module)) {
                const supabase = getSupabaseClient()
                if (!supabase) {
                    console.error('❌ Supabase no está configurado')
                    return
                }

                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    console.log('⚠️ No hay sesión válida, redirigiendo a login')
                    setCurrentScreen('auth')
                    return
                }

                // Verificar que el usuario esté cargado
                if (!currentUser) {
                    console.log('🔄 Cargando datos del usuario...')
                    const user = await getCurrentUser()
                    if (user) {
                        setCurrentUser(user)
                        setIsAuthenticated(true)
                    } else {
                        console.error('❌ No se pudo cargar el usuario')
                        setCurrentScreen('auth')
                        return
                    }
                }
            }

            // Cambiar al módulo solicitado
            setCurrentModule(module)
            console.log(`✅ Navegando a módulo: ${module}`)
        } catch (error) {
            console.error('Error navegando a módulo:', error)
        }
    }

    // Hook para detectar inactividad y cerrar sesión automáticamente
    useInactivity({
        timeout: 30 * 60 * 1000, // 30 minutos de inactividad
        onInactive: async () => {
            console.log('🔄 Usuario inactivo detectado, limpiando estado...')
            // Limpiar estado de la aplicación
            setIsAuthenticated(false)
            setCurrentUser(null)
            setCurrentModule('products') // Resetear a módulo por defecto
            setCurrentScreen('main')
            setTimeoutMessage('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.')
            // El hook ya maneja el logout automáticamente
        },
        onActive: () => {
            console.log('🔄 Usuario activo detectado, verificando sesión...')
            // Verificar sesión cuando el usuario vuelve a estar activo
            checkSessionAfterActivity()
        }
    })

    // Verificar sesión inicial al cargar la página
    useEffect(() => {
        const checkInitialSession = async () => {
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.warn('⚠️ Supabase no está configurado. Ejecutando en modo estático.')
                return
            }

            try {
                // Verificar si hay una sesión activa al cargar la página
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    console.log('🔍 Sesión inicial detectada:', session.user.email)
                    
                    // Crear usuario básico inmediatamente
                    const basicUser = {
                        id: session.user.id,
                        name: session.user.user_metadata?.full_name || 
                              session.user.user_metadata?.name || 
                              session.user.user_metadata?.first_name + ' ' + session.user.user_metadata?.last_name ||
                              session.user.email.split('@')[0],
                        email: session.user.email,
                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                        location: 'Colombia',
                        phone: session.user.user_metadata?.phone || undefined,
                        isAdmin: false,
                        roles: [],
                        adminSince: undefined
                    }
                    
                    setCurrentUser(basicUser)
                    setIsAuthenticated(true)
                    setCurrentScreen('main')
                    console.log('✅ Usuario autenticado desde sesión inicial:', basicUser.name)
                    
                    // Intentar obtener datos completos en segundo plano
                    try {
                        const user = await getCurrentUser()
                        if (user) {
                            setCurrentUser(user)
                            console.log('✅ Datos completos cargados:', user.name)
                        }
                    } catch (error) {
                        console.warn('⚠️ Error cargando datos completos, usando datos básicos:', error)
                    }
                }
            } catch (error) {
                console.error('Error verificando sesión inicial:', error)
            }
        }

        checkInitialSession()
    }, [])

    // Listener para cambios de sesión de Supabase
    useEffect(() => {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.warn('⚠️ Supabase no está configurado. Ejecutando en modo estático.')
            return
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.email)
            
            if (event === 'SIGNED_OUT') {
                setIsAuthenticated(false)
                setCurrentUser(null)
                localStorage.removeItem('ecoswap_user')
            } else if (event === 'SIGNED_IN' && session) {
                try {
                    console.log('🔄 Procesando SIGNED_IN para:', session.user.email)
                    const user = await getCurrentUser()
                    console.log('👤 Usuario obtenido:', user ? `${user.name} (${user.email})` : 'null')
                    
                    if (user) {
                        setCurrentUser(user)
                        setIsAuthenticated(true)
                        setCurrentScreen('main')
                        console.log('✅ Estado actualizado: isAuthenticated=true, currentUser=', user.name)
                        
                        // Verificar si es administrador y redirigir
                        try {
                            const { isAdmin } = await isUserAdmin(user.email)
                            console.log('🔐 Es admin:', isAdmin)
                            if (isAdmin) {
                                console.log('🚀 Redirigiendo admin a dashboard')
                                window.location.replace('/admin/verificaciones')
                                return
                            }
                        } catch (error) {
                            console.warn('⚠️ Error verificando rol de usuario:', error)
                        }
                    } else {
                        console.log('❌ No se pudo obtener usuario, limpiando estado')
                        setIsAuthenticated(false)
                        setCurrentUser(null)
                    }
                } catch (error) {
                    console.error('❌ Error al procesar sesión:', error)
                    setIsAuthenticated(false)
                    setCurrentUser(null)
                }
            } else if (event === 'TOKEN_REFRESHED') {
                // Token refrescado, verificar sesión actual
                try {
                    const user = await getCurrentUser()
                    if (user) {
                        setCurrentUser(user)
                        setIsAuthenticated(true)
                    } else {
                        setIsAuthenticated(false)
                        setCurrentUser(null)
                    }
                } catch (error) {
                    console.error('Error al verificar sesión después del refresh:', error)
                }
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    // Verificación de autenticación real
    useEffect(() => {
        // Verificar si hay timeout
        if (searchParams.get('timeout') === 'true') {
            setTimeoutMessage('Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.')
            // Limpiar el parámetro de la URL
            window.history.replaceState({}, '', '/')
        }

        const checkAuth = async () => {
            try {
                setIsLoading(true)
                console.log('🔍 Iniciando verificación de autenticación...')
                
                // Primero intentar obtener usuario de getCurrentUser
                let user = await getCurrentUser()
                console.log('👤 Usuario de getCurrentUser:', user ? `${user.name} (${user.email})` : 'null')
                
                // Si no hay usuario, intentar obtener del localStorage como respaldo
                if (!user) {
                    const cachedUser = localStorage.getItem('ecoswap_user')
                    console.log('💾 Usuario en localStorage:', cachedUser ? 'presente' : 'ausente')
                    
                    // Buscar todas las claves de Supabase en localStorage
                    let supabaseSession = null
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i)
                        if (key && key.startsWith('sb-') && key.includes('auth-token')) {
                            supabaseSession = localStorage.getItem(key)
                            break
                        }
                    }
                    console.log('🔑 Sesión Supabase en localStorage:', supabaseSession ? 'presente' : 'ausente')
                    
                    if (cachedUser && supabaseSession) {
                        try {
                            const parsedUser = JSON.parse(cachedUser)
                            user = parsedUser
                            console.log('✅ Usuario restaurado desde localStorage:', user.name)
                        } catch (error) {
                            console.error('❌ Error parseando usuario del localStorage:', error)
                        }
                    }
                }
                
                if (user) {
                    console.log('✅ Usuario encontrado, configurando estado...')
                    
                    // Verificar si es administrador usando la función isUserAdmin
                    try {
                        const { isAdmin } = await isUserAdmin(user.email)
                        console.log('🔐 Verificación de admin:', isAdmin)
                        
                        // Si es administrador activo, redirigir al dashboard
                        if (isAdmin) {
                            console.log('🚀 Redirigiendo admin a dashboard')
                            window.location.replace('/admin/verificaciones')
                            return
                        }
                    } catch (error) {
                        console.warn('⚠️ Error verificando rol de usuario:', error)
                    }

                    setCurrentUser(user)
                    setIsAuthenticated(true)
                    setCurrentScreen('main')
                    console.log('✅ Estado configurado: isAuthenticated=true, currentUser=', user.name)
                    
                    // Leer query ?m= para abrir módulo específico
                    const params = new URLSearchParams(window.location.search)
                    const m = params.get('m')
                    setCurrentModule(m || 'products')
                } else {
                    console.log('❌ No se encontró usuario, configurando estado no autenticado')
                    
                    // Si no hay usuario, verificar si debe mostrar auth
                    const params = new URLSearchParams(window.location.search)
                    const auth = params.get('auth')
                    
                    if (auth === 'true') {
                        // Mostrar interfaz de login
                        setCurrentScreen('auth')
                        setIsAuthenticated(false)
                        console.log('🔐 Mostrando pantalla de autenticación')
                    } else {
                        // Mostrar productos por defecto
                        setCurrentScreen('main')
                        const m = params.get('m')
                        setCurrentModule(m || 'products')
                        setIsAuthenticated(false)
                        console.log('🏠 Mostrando pantalla principal sin autenticación')
                    }
                }
            } catch (error) {
                console.error('Error verificando autenticación:', error)
                setIsAuthenticated(false)
                setCurrentScreen('main')
                setCurrentModule('products')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [searchParams])

    const handleLogin = (userData: any) => {
        setCurrentUser(userData)
        setIsAuthenticated(true)
        setCurrentScreen('main')
        localStorage.setItem('ecoswap_user', JSON.stringify(userData))
        
        // Verificar si hay returnUrl para redirigir después del login
        const params = new URLSearchParams(window.location.search)
        const returnUrl = params.get('returnUrl')
        
        if (returnUrl) {
            // Limpiar parámetros de la URL y redirigir
            window.history.replaceState({}, '', '/')
            window.location.href = returnUrl
        }
    }

    const handleLogout = async () => {
        await logoutUser()
        setCurrentUser(null)
        setIsAuthenticated(false)
        setCurrentScreen('main')
        setCurrentModule('products') // Volver a productos después del logout
    }

    const renderModule = () => {
        switch (currentModule) {
            case 'home':
                return <CoreModule currentUser={currentUser} onLogout={handleLogout} />
            case 'products':
                return <ProductsModule currentUser={currentUser} />
            case 'interactions':
                return isAuthenticated ? <InteractionsModule currentUser={currentUser} /> : <AuthModule onLogin={handleLogin} />
            case 'chat':
                return isAuthenticated ? <ChatModule currentUser={currentUser} /> : <AuthModule onLogin={handleLogin} />
            case 'profile':
                return isAuthenticated ? <ProfileModule currentUser={currentUser} /> : <AuthModule onLogin={handleLogin} />
            default:
                return <ProductsModule currentUser={currentUser} />
        }
    }

    // Si no está autenticado y quiere acceder a módulos que requieren login
    if (currentScreen === 'auth') {
        return <AuthModule onLogin={handleLogin} />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mensaje de timeout */}
            {timeoutMessage && (
                <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4">
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

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">🌱</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">EcoSwap Colombia</span>
                        </div>

                        {/* Navegación */}
                        <nav className="hidden md:flex space-x-8">
                            <button
                                onClick={() => navigateToModule('home')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'home'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <HomeIcon className="w-5 h-5" />
                                <span>Inicio</span>
                            </button>

                            <button
                                onClick={() => navigateToModule('products')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'products'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <ShoppingBagIcon className="w-5 h-5" />
                                <span>Productos</span>
                            </button>

                            {isAuthenticated && (
                                <>
                                    <button
                                        onClick={() => navigateToModule('interactions')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'interactions'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <ArrowsRightLeftIcon className="w-5 h-5" />
                                        <span>Interacciones</span>
                                    </button>

                                    <button
                                        onClick={() => navigateToModule('chat')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'chat'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        <span>Chat</span>
                                    </button>

                                    <button
                                        onClick={() => window.location.href = '/notificaciones'}
                                        className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                            unreadCount > 0 
                                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50 animate-pulse' 
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        <BellIcon className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                                        <span>Notificaciones</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => navigateToModule('profile')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'profile'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <UserIcon className="w-5 h-5" />
                                        <span>Perfil</span>
                                    </button>
                                </>
                            )}
                        </nav>

                        {/* Usuario o botón de login */}
                        <div className="flex items-center space-x-4">
                            {/* Botón para validar sesión */}
                            <button
                                onClick={() => {
                                    console.log('🔍 === VALIDACIÓN DE SESIÓN ===')
                                    
                                    // Verificar localStorage
                                    const ecoswapUser = localStorage.getItem('ecoswap_user')
                                    console.log('📦 Usuario en localStorage:', ecoswapUser ? 'Presente' : 'Ausente')
                                    
                                    // Buscar clave de Supabase
                                    let supabaseKey = null
                                    let supabaseData = null
                                    for (let i = 0; i < localStorage.length; i++) {
                                        const key = localStorage.key(i)
                                        if (key && key.startsWith('sb-') && key.includes('auth-token')) {
                                            supabaseKey = key
                                            supabaseData = localStorage.getItem(key)
                                            break
                                        }
                                    }
                                    
                                    console.log('🔑 Clave Supabase encontrada:', supabaseKey ? 'Sí' : 'No')
                                    console.log('📄 Datos Supabase:', supabaseData ? 'Presentes' : 'Ausentes')
                                    
                                    // Verificar sesión actual (solo si Supabase está configurado)
                                    const supabase = getSupabaseClient()
                                    if (supabase) {
                                        supabase.auth.getSession().then(({ data: { session }, error }) => {
                                            console.log('🔐 Sesión válida:', !!session)
                                            console.log('👤 Usuario:', session?.user?.email || 'Ninguno')
                                            console.log('⚠️ Error:', error || 'Ninguno')
                                            
                                            // Diagnóstico
                                            if (!session && ecoswapUser) {
                                                console.log('🚨 PROBLEMA: Hay usuario en localStorage pero no hay sesión de Supabase')
                                            } else if (session && !ecoswapUser) {
                                                console.log('🚨 PROBLEMA: Hay sesión de Supabase pero no hay usuario en localStorage')
                                            } else if (!session && !ecoswapUser) {
                                                console.log('✅ ESTADO: No hay sesión activa')
                                            } else {
                                                console.log('✅ ESTADO: Sesión válida y usuario presente')
                                            }
                                            
                                            console.log('🔍 === FIN DE VALIDACIÓN ===')
                                        })
                                    } else {
                                        console.log('⚠️ Supabase no está configurado. Modo estático activo.')
                                        console.log('🔍 === FIN DE VALIDACIÓN ===')
                                    }
                                }}
                                className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                                title="Validar estado de sesión"
                            >
                                🔍 Validar
                            </button>
                            
                            {(() => {
                                console.log('🎯 Header render - isAuthenticated:', isAuthenticated, 'currentUser:', currentUser ? currentUser.name : 'null')
                                return null
                            })()}
                            
                            {isAuthenticated && currentUser ? (
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                        {currentUser.name}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentScreen('auth')}
                                        className="btn-primary"
                                    >
                                        Iniciar Sesión
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/login'}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        Login Admin
                                    </button>
                                </div>
                            )}

                            {isAuthenticated && (
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 hover:text-red-600 transition-colors"
                                    title="Cerrar Sesión"
                                >
                                    <ArrowRightOnRectangleIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8">
                <motion.div
                    key={currentModule}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderModule()}
                </motion.div>
            </main>

            {/* Navegación Móvil */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 w-screen overflow-hidden bg-white border-t border-gray-200 p-3 pb-[env(safe-area-inset-bottom)] z-50">
                <div className="flex justify-around">
                    <button
                        onClick={() => setCurrentModule('home')}
                        className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'home' ? 'text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <HomeIcon className="w-6 h-6" />
                        <span className="text-xs">Inicio</span>
                    </button>

                    <button
                        onClick={() => setCurrentModule('products')}
                        className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'products' ? 'text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <ShoppingBagIcon className="w-6 h-6" />
                        <span className="text-xs">Productos</span>
                    </button>

                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setCurrentModule('interactions')}
                                className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'interactions' ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                <ArrowsRightLeftIcon className="w-6 h-6" />
                                <span className="text-xs">Interacciones</span>
                            </button>

                            <button
                                onClick={() => setCurrentModule('chat')}
                                className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'chat' ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                <span className="text-xs">Chat</span>
                            </button>

                            <button
                                onClick={() => window.location.href = '/notificaciones'}
                                className={`relative flex flex-col items-center space-y-1 p-2 transition-all duration-200 ${
                                    unreadCount > 0 
                                        ? 'text-red-600 animate-pulse' 
                                        : 'text-gray-500'
                                }`}
                            >
                                <BellIcon className={`w-6 h-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                                <span className="text-xs">Notificaciones</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setCurrentModule('profile')}
                                className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'profile' ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                <UserIcon className="w-6 h-6" />
                                <span className="text-xs">Perfil</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setCurrentScreen('auth')}
                            className="flex flex-col items-center space-y-1 p-2 text-gray-500"
                        >
                            <UserIcon className="w-6 h-6" />
                            <span className="text-xs">Login</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Componente de notificaciones toast para usuarios autenticados */}
            {isAuthenticated && currentUser && (
                <NotificationToast userId={currentUser.id} />
            )}
        </div>
    )
}
