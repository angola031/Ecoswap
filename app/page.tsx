'use client'

import Link from 'next/link'
import { useState, useEffect, lazy, Suspense, useRef } from 'react'
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
    ArrowRightOnRectangleIcon,
    DocumentTextIcon,
    GiftIcon
} from '@heroicons/react/24/outline'

// Componentes - Lazy loading para componentes pesados
import AuthModule from '@/components/auth/AuthModule'
import CoreModule from '@/components/core/CoreModule'
import ProductsModule from '@/components/products/ProductsModule'
const ChatModule = lazy(() => import('@/components/chat/ChatModule'))
const ProfileModule = lazy(() => import('@/components/profile/ProfileModule'))
const InteractionsModule = lazy(() => import('@/components/interactions/InteractionsModule'))
// Usar la misma interfaz completa de la página de propuestas, pero embebida como módulo
const ProposalsModule = lazy(() => import('@/app/propuestas/page').then(module => ({ default: module.default })))
const DonationsPanel = lazy(() => import('@/components/foundation/DonationsPanel'))
import NotificationToast from '@/components/NotificationToast'
import ThemeToggle from '@/components/ThemeToggle'

// Tipos
import { type User } from '@/lib/types'
import { getCurrentUser, logoutUser, isUserAdmin } from '@/lib/auth'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useInactivity } from '@/hooks/useInactivity'
import { useNotifications } from '@/hooks/useNotifications'
import { useUserStatus } from '@/hooks/useUserStatus'

export default function HomePage() {
    const searchParams = useSearchParams()
    const [currentScreen, setCurrentScreen] = useState<'auth' | 'main'>('main')
    // Inicializar currentModule desde localStorage si está disponible
    const [currentModule, setCurrentModule] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ecoswap_current_module')
            return saved || 'products'
        }
        return 'products'
    })
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    // Inicializar isLoading como true para evitar mostrar login mientras se verifica la sesión
    const [isLoading, setIsLoading] = useState(true)
    const [timeoutMessage, setTimeoutMessage] = useState<string>('')
    const [foundationData, setFoundationData] = useState<any>(null)
    const [foundationDataLoading, setFoundationDataLoading] = useState(false) // Estado de carga de datos de fundación
    const [isNavigating, setIsNavigating] = useState(false) // Bandera para evitar que checkAuth interfiera
    const [hasInitialized, setHasInitialized] = useState(false) // Bandera para saber si ya se inicializó
    const isLoadingFoundationDataRef = useRef(false) // Ref para evitar cargas simultáneas
    
    // Hook para notificaciones
    const { unreadCount, loading: notificationsLoading } = useNotifications()
    
    // Hook para estado de usuario en línea - detecta automáticamente actividad
    useUserStatus()
    
    // Verificar si es fundación
    const isFoundation = foundationData?.es_fundacion === true
    const isVerifiedFoundation = isFoundation && foundationData?.fundacion_verificada === true

    // Función para verificar sesión después de actividad
    const checkSessionAfterActivity = async () => {
        try {
            console.log('🔄 Verificando sesión después de actividad...')
            
            // Usar ensureValidSession para refrescar si es necesario
            const isValid = await ensureValidSession()
            
            if (isValid) {
                console.log('✅ Sesión válida después de actividad')
                setCurrentScreen('main')
                setTimeoutMessage('') // Limpiar mensaje de timeout
                // Nota: no recargamos datos de fundación aquí para evitar sobrecargar la página.
                //       La restauración inicial ya los carga mediante checkAuth().
                console.log('✅ Estado restaurado correctamente (sin recargar datos de fundación)')
            } else {
                console.log('⚠️ No hay sesión válida después de actividad')
                setIsAuthenticated(false)
                setCurrentUser(null)
                setCurrentScreen('main')
            }
        } catch (error) {
            console.error('Error verificando sesión después de actividad:', error)
            setIsAuthenticated(false)
            setCurrentUser(null)
        }
    }

    // Función para refrescar la sesión si es necesario
    const ensureValidSession = async (): Promise<boolean> => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) return false

            let { data: { session }, error } = await supabase.auth.getSession()
            
            if (error || !session) {
                console.log('⚠️ No hay sesión válida')
                return false
            }

            // Verificar si el token está próximo a expirar o ya expiró
            const now = Math.floor(Date.now() / 1000)
            const expiresAt = session.expires_at || 0
            const timeUntilExpiry = expiresAt - now

            // Si el token expira en menos de 5 minutos o ya expiró, refrescarlo
            if (timeUntilExpiry < 300) {
                console.log('🔄 Token expirado o próximo a expirar, refrescando...')
                const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                
                if (refreshError || !refreshedSession) {
                    console.error('❌ Error refrescando sesión:', refreshError)
                    return false
                }

                console.log('✅ Sesión refrescada exitosamente')
                session = refreshedSession
            }

            // Actualizar usuario si no está cargado
            if (!currentUser && session) {
                console.log('🔄 Cargando datos del usuario después de refresh...')
                try {
                    const user = await getCurrentUser()
                    if (user) {
                        setCurrentUser(user)
                        setIsAuthenticated(true)
                        console.log('✅ Usuario cargado exitosamente')
                    }
                } catch (error) {
                    console.error('❌ Error cargando usuario:', error)
                    return false
                }
            }

            return true
        } catch (error) {
            console.error('❌ Error en ensureValidSession:', error)
            return false
        }
    }

    // Función para navegar a un módulo con validación
    const navigateToModule = async (module: string) => {
        console.log(`🔍 [navigateToModule] Intentando navegar a: ${module}`)
        
        // Marcar que estamos navegando para evitar que checkAuth interfiera
        setIsNavigating(true)
        
        // Cambiar el módulo inmediatamente para mejor UX
        setCurrentModule(module)
        localStorage.setItem('ecoswap_current_module', module)
        
        try {
            // Si el módulo requiere autenticación, verificar y refrescar sesión
            const protectedModules = ['interactions', 'chat', 'profile', 'notifications']
            if (protectedModules.includes(module)) {
                console.log(`🔐 [navigateToModule] Módulo protegido: ${module}`)
                
                const supabase = getSupabaseClient()
                if (!supabase) {
                    console.error('❌ Supabase no está configurado')
                    setCurrentScreen('auth')
                    setIsNavigating(false)
                    return
                }

                // Asegurar que la sesión esté válida y refrescada
                const isValid = await ensureValidSession()
                
                if (!isValid) {
                    console.log('⚠️ Sesión no válida después de intentar refrescar, redirigiendo a login')
                    setCurrentScreen('auth')
                    setCurrentModule('products')
                    setIsAuthenticated(false)
                    setCurrentUser(null)
                    setIsNavigating(false)
                    return
                }
            } else {
                // Para módulos no protegidos, también asegurar sesión válida si hay una sesión activa
                // Esto ayuda a mantener los datos actualizados
                if (isAuthenticated) {
                    await ensureValidSession()
                }
            }
        } catch (error) {
            console.error('❌ [navigateToModule] Error verificando navegación:', error)
            // Si hay error pero el módulo no es protegido, permitir la navegación de todos modos
            const protectedModules = ['interactions', 'chat', 'profile', 'notifications']
            if (protectedModules.includes(module)) {
                setCurrentScreen('auth')
                setCurrentModule('products')
                setIsAuthenticated(false)
                setCurrentUser(null)
            }
        } finally {
            // Esperar un poco antes de permitir que checkAuth vuelva a ejecutarse
            setTimeout(() => setIsNavigating(false), 500)
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
            localStorage.setItem('ecoswap_current_module', 'products') // Limpiar módulo protegido
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
                        setTimeoutMessage('') // Limpiar mensaje de timeout
                        // Cargar datos de fundación cuando se detecta SIGNED_IN
                        console.log('🔄 [SIGNED_IN] Cargando datos de fundación...')
                        await loadFoundationData()
                        console.log('✅ [SIGNED_IN] Datos de fundación cargados')
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

    // Verificar y refrescar sesión periódicamente (cada 10 segundos)
    useEffect(() => {
        const supabase = getSupabaseClient()
        if (!supabase) return

        const checkAndRefreshSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                
                if (error) {
                    console.error('❌ Error verificando sesión:', error)
                    return
                }

                if (!session) {
                    // No hay sesión, limpiar estado
                    if (isAuthenticated) {
                        setIsAuthenticated(false)
                        setCurrentUser(null)
                    }
                    return
                }

                // Verificar si el token está próximo a expirar (menos de 10 minutos)
                // Refrescamos más temprano para evitar problemas después de inactividad
                const now = Math.floor(Date.now() / 1000)
                const expiresAt = session.expires_at || 0
                const timeUntilExpiry = expiresAt - now

                // Si el token expira en menos de 10 minutos, refrescarlo preventivamente
                if (timeUntilExpiry < 600 && timeUntilExpiry > 0) {
                    console.log('🔄 Token próximo a expirar, refrescando automáticamente...')
                    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                    
                    if (refreshError) {
                        console.error('❌ Error refrescando sesión:', refreshError)
                        // Si no se puede refrescar, limpiar estado
                        setIsAuthenticated(false)
                        setCurrentUser(null)
                        return
                    }

                    if (refreshedSession) {
                        console.log('✅ Sesión refrescada automáticamente')
                        // Actualizar usuario después del refresh
                        const user = await getCurrentUser()
                        if (user) {
                            setCurrentUser(user)
                            setIsAuthenticated(true)
                        }
                    }
                } else if (timeUntilExpiry <= 0) {
                    // Token ya expiró, intentar refrescar antes de limpiar
                    console.warn('⚠️ Token expirado, intentando refrescar...')
                    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                    
                    if (refreshError || !refreshedSession) {
                        console.error('❌ No se pudo refrescar token expirado, limpiando sesión')
                        setIsAuthenticated(false)
                        setCurrentUser(null)
                    } else {
                        console.log('✅ Token expirado refrescado exitosamente')
                        const user = await getCurrentUser()
                        if (user) {
                            setCurrentUser(user)
                            setIsAuthenticated(true)
                        }
                    }
                } else if (isAuthenticated && !currentUser) {
                    // Hay sesión pero no hay usuario en estado, restaurarlo
                    const user = await getCurrentUser()
                    if (user) {
                        setCurrentUser(user)
                        setIsAuthenticated(true)
                    }
                }
            } catch (error) {
                console.error('❌ Error en checkAndRefreshSession:', error)
            }
        }

        // Verificar inmediatamente
        checkAndRefreshSession()

        // Verificar cada 10 segundos
        const interval = setInterval(checkAndRefreshSession, 10000)

        return () => clearInterval(interval)
    }, [isAuthenticated, currentUser])

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
                // Si ya se inicializó y el usuario está navegando activamente, no interferir
                if (hasInitialized && isNavigating) {
                    console.log('⏸️ Navegación activa, omitiendo checkAuth')
                    return
                }
                
                // Solo mostrar loading en la carga inicial, no en cada cambio de módulo
                const isInitialLoad = !hasInitialized && !currentUser
                if (isInitialLoad) {
                    setIsLoading(true)
                }
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
                    
                    // Cargar datos de fundación antes de continuar (bloquear para asegurar que se carguen)
                    console.log('🔄 [checkAuth] Cargando datos de fundación...')
                    await loadFoundationData()
                    console.log('✅ [checkAuth] Datos de fundación cargados')
                    
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
                    
                    // Solo restaurar módulo si no se ha inicializado antes y no estamos navegando activamente
                    if (!hasInitialized && !isNavigating) {
                        // Restaurar módulo desde localStorage o leer query ?m= o usar por defecto
                        // Como hay sesión activa, podemos restaurar cualquier módulo (protegido o no)
                        const savedModule = localStorage.getItem('ecoswap_current_module')
                        const params = new URLSearchParams(window.location.search)
                        const m = params.get('m')
                        
                        console.log('🔄 [Restauración] Módulo guardado en localStorage:', savedModule)
                        console.log('🔄 [Restauración] Query param m:', m)
                        console.log('🔄 [Restauración] Módulo actual en estado:', currentModule)
                        
                        // Si el módulo actual en estado es diferente de 'products', significa que se inicializó correctamente desde localStorage
                        // En ese caso, mantenerlo y no sobrescribirlo con el query param (a menos que sea explícito)
                        let moduleToSet = currentModule
                        
                        // Si el módulo actual es 'products' (valor por defecto) y hay un módulo guardado, usar el guardado
                        if (currentModule === 'products' && savedModule && savedModule !== 'products') {
                            moduleToSet = savedModule
                            console.log('📦 [Restauración] Usando módulo guardado (no products):', savedModule)
                        }
                        // Si hay query param y es diferente de 'products', usarlo (navegación explícita)
                        else if (m && m !== 'products') {
                            moduleToSet = m
                            console.log('🔗 [Restauración] Usando query param explícito:', m)
                        }
                        // Si el módulo actual ya es diferente de 'products', mantenerlo
                        else if (currentModule !== 'products') {
                            moduleToSet = currentModule
                            console.log('✅ [Restauración] Manteniendo módulo actual:', currentModule)
                        }
                        // Si no hay nada, usar 'products' por defecto
                        else {
                            moduleToSet = 'products'
                            console.log('🏠 [Restauración] Usando módulo por defecto: products')
                        }
                        
                        console.log('✅ [Restauración] Módulo final a establecer:', moduleToSet)
                        
                        // Solo actualizar si es diferente al actual para evitar re-renders innecesarios
                        if (moduleToSet !== currentModule) {
                            setCurrentModule(moduleToSet)
                        }
                        
                        // Guardar en localStorage el módulo final (excepto si es 'products' y no había nada guardado)
                        if (moduleToSet && moduleToSet !== 'products') {
                            localStorage.setItem('ecoswap_current_module', moduleToSet)
                            console.log('💾 [Restauración] Módulo guardado en localStorage:', moduleToSet)
                        } else if (moduleToSet === 'products' && savedModule && savedModule !== 'products') {
                            // Si el módulo guardado no es 'products' pero estamos estableciendo 'products', 
                            // mantener el guardado (no sobrescribir)
                            console.log('⚠️ [Restauración] No sobrescribiendo módulo guardado:', savedModule)
                        }
                    } else {
                        console.log('⏸️ [Restauración] Omitiendo restauración de módulo (ya inicializado o navegando)')
                    }
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
                        const savedModule = localStorage.getItem('ecoswap_current_module')
                        const m = params.get('m')
                        
                        // Si no hay sesión, no restaurar módulos protegidos
                        const protectedModules = ['interactions', 'chat', 'profile', 'notifications']
                        const isSavedModuleProtected = savedModule && protectedModules.includes(savedModule)
                        
                        // Solo usar módulo guardado si no es protegido (ya que no hay sesión)
                        let moduleToSet = m || (!isSavedModuleProtected ? savedModule : null) || 'products'
                        
                        setCurrentModule(moduleToSet)
                        if (m || (moduleToSet && !isSavedModuleProtected)) {
                            localStorage.setItem('ecoswap_current_module', moduleToSet)
                        }
                        setIsAuthenticated(false)
                        console.log('🏠 Mostrando pantalla principal sin autenticación')
                    }
                }
            } catch (error) {
                console.error('Error verificando autenticación:', error)
                setIsAuthenticated(false)
                setCurrentScreen('main')
                const savedModule = localStorage.getItem('ecoswap_current_module')
                
                // Si hay error, no restaurar módulos protegidos (no hay sesión confirmada)
                const protectedModules = ['interactions', 'chat', 'profile', 'notifications']
                const isSavedModuleProtected = savedModule && protectedModules.includes(savedModule)
                
                const moduleToSet = !isSavedModuleProtected ? (savedModule || 'products') : 'products'
                setCurrentModule(moduleToSet)
            } finally {
                setIsLoading(false)
                setHasInitialized(true)
            }
        }

        // Solo ejecutar checkAuth una vez al inicio o si cambia el parámetro de autenticación
        const authParam = searchParams?.get('auth')
        if (!hasInitialized || authParam === 'true') {
            checkAuth()
        }
    }, []) // Solo ejecutar una vez al montar el componente

    // Cargar datos de fundación con timeout
    const loadFoundationData = async (): Promise<void> => {
        try {
            // Evitar recargas innecesarias si ya tenemos datos en memoria
            if (foundationData !== null) {
                console.log('ℹ️ Datos de fundación ya cargados en memoria, omitiendo nueva petición')
                return
            }
            
            // Evitar cargas simultáneas
            if (isLoadingFoundationDataRef.current || foundationDataLoading) {
                console.log('⏳ Datos de fundación ya se están cargando, esperando...')
                // Esperar hasta que termine la carga actual
                while (isLoadingFoundationDataRef.current || foundationDataLoading) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
                return
            }

            isLoadingFoundationDataRef.current = true
            setFoundationDataLoading(true)
            console.log('🔄 [loadFoundationData] Iniciando carga de datos de fundación...')
            const supabase = getSupabaseClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            if (!session?.access_token) {
                console.log('⚠️ No hay sesión para cargar datos de fundación')
                setFoundationDataLoading(false)
                isLoadingFoundationDataRef.current = false
                return
            }

            console.log('🔄 Cargando datos de fundación...')
            
            // Crear una promesa con timeout de 5 segundos
            const timeoutPromise = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
            )
            
            const fetchPromise = fetch('/api/foundation/register', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            
            // Usar Promise.race para que falle si tarda más de 5 segundos
            const response = await Promise.race([fetchPromise, timeoutPromise]) as Response

            if (response.ok) {
                const data = await response.json()
                setFoundationData(data.foundation || null)
                if (data.foundation?.es_fundacion) {
                    console.log('✅ Datos de fundación cargados:', data.foundation.nombre_fundacion)
                    console.log('🏛️ Es fundación:', data.foundation.es_fundacion)
                    console.log('✔️ Verificada:', data.foundation.fundacion_verificada)
                } else {
                    console.log('ℹ️ Usuario no es fundación')
                    // Asegurar que foundationData sea null si no es fundación
                    setFoundationData(null)
                }
            } else {
                console.log('⚠️ No se encontraron datos de fundación para este usuario')
                setFoundationData(null)
            }
        } catch (error: any) {
            if (error.message === 'Timeout') {
                console.warn('⚠️ Timeout cargando datos de fundación - continuando de todos modos')
            } else {
                console.error('❌ Error cargando datos de fundación:', error)
            }
            setFoundationData(null)
            // No bloquear la aplicación si falla la carga de datos de fundación
        } finally {
            setFoundationDataLoading(false)
            isLoadingFoundationDataRef.current = false
            console.log('✅ [loadFoundationData] Carga de datos de fundación completada')
        }
    }

    const handleLogin = async (userData: any) => {
        setCurrentUser(userData)
        setIsAuthenticated(true)
        setCurrentScreen('main')
        localStorage.setItem('ecoswap_user', JSON.stringify(userData))

        // Cargar datos de fundación antes de continuar
        console.log('🔄 [handleLogin] Cargando datos de fundación...')
        await loadFoundationData()
        console.log('✅ [handleLogin] Datos de fundación cargados')

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
        try {
            console.log('🚪 [handleLogout] Iniciando cierre de sesión...')
            
            // Limpiar datos de fundación primero
            setFoundationData(null)
            setIsAuthenticated(false)
            setCurrentUser(null)
            
            // Cerrar sesión en Supabase
            await logoutUser()
            
            console.log('✅ [handleLogout] Sesión cerrada correctamente')
            
            // Limpiar localStorage
            localStorage.removeItem('ecoswap_current_module')
            localStorage.removeItem('ecoswap_foundation_data')
            
            // Recargar la página para limpiar completamente el estado
            // Esto es especialmente importante para fundaciones para que no se muestren donaciones
            window.location.replace('/')
        } catch (error) {
            console.error('❌ [handleLogout] Error al cerrar sesión:', error)
            // Aun así, recargar la página para limpiar el estado
            window.location.replace('/')
        }
    }

    // Componente de carga para lazy loading
    const LoadingFallback = () => (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    )

    const renderModule = () => {
        console.log('🎯 renderModule - currentModule:', currentModule)
        console.log('🏛️ isFoundation:', isFoundation)
        console.log('📦 foundationData:', foundationData)
        
        switch (currentModule) {
            case 'home':
                return <CoreModule currentUser={currentUser} onLogout={handleLogout} />
            case 'products':
                // Si es fundación, mostrar panel de donaciones
                if (isFoundation) {
                    console.log('✅ Mostrando DonationsPanel para fundación')
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <DonationsPanel currentUser={currentUser} />
                        </Suspense>
                    )
                }
                console.log('📦 Mostrando ProductsModule para usuario normal')
                return <ProductsModule currentUser={currentUser} />
            case 'interactions':
                if (isLoading) {
                    return <LoadingFallback />
                }
                return isAuthenticated ? (
                    <Suspense fallback={<LoadingFallback />}>
                        <InteractionsModule currentUser={currentUser} />
                    </Suspense>
                ) : <AuthModule onLogin={handleLogin} />
            case 'proposals':
                if (isLoading) {
                    return <LoadingFallback />
                }
                return isAuthenticated ? (
                    <Suspense fallback={<LoadingFallback />}>
                        <ProposalsModule currentUser={currentUser} />
                    </Suspense>
                ) : <AuthModule onLogin={handleLogin} />
            case 'chat':
                if (isLoading) {
                    return <LoadingFallback />
                }
                return isAuthenticated ? (
                    <Suspense fallback={<LoadingFallback />}>
                        <ChatModule currentUser={currentUser} />
                    </Suspense>
                ) : <AuthModule onLogin={handleLogin} />
            case 'profile':
                if (isLoading) {
                    return <LoadingFallback />
                }
                return isAuthenticated ? (
                    <Suspense fallback={<LoadingFallback />}>
                        <ProfileModule currentUser={currentUser} />
                    </Suspense>
                ) : <AuthModule onLogin={handleLogin} />
            default:
                return <ProductsModule currentUser={currentUser} />
        }
    }

    // Si no está autenticado y quiere acceder a módulos que requieren login
    if (currentScreen === 'auth') {
        return <AuthModule onLogin={handleLogin} />
    }

    // Mostrar loading mientras se verifica la sesión o se cargan datos de fundación
    // Esto evita que la interfaz se renderice antes de tener todos los datos necesarios
    if (isLoading || (isAuthenticated && foundationDataLoading && foundationData === null)) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">
                        {isAuthenticated && foundationDataLoading ? 'Cargando datos de fundación...' : 'Cargando...'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark transition-colors">
            {/* Mensaje de timeout */}
            {timeoutMessage && (
                <div className="bg-orange-100 dark:bg-orange-900 border-l-4 border-orange-500 dark:border-orange-400 text-orange-700 dark:text-orange-200 p-4">
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
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">🌱</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">EcoSwap Colombia</span>
                        </div>

                        {/* Navegación */}
                        <nav className="hidden md:flex space-x-8">
                            <button
                                onClick={() => navigateToModule('home')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'home'
                                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <HomeIcon className="w-5 h-5" />
                                <span>Inicio</span>
                            </button>

                            <button
                                onClick={() => navigateToModule('products')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'products'
                                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {isFoundation ? (
                                    <>
                                        <GiftIcon className="w-5 h-5" />
                                        <span>Donaciones</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBagIcon className="w-5 h-5" />
                                        <span>Productos</span>
                                    </>
                                )}
                            </button>

                            {isAuthenticated && (
                                <>
                                    <button
                                        onClick={() => navigateToModule('interactions')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'interactions'
                                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <ArrowsRightLeftIcon className="w-5 h-5" />
                                        <span>Trueque</span>
                                    </button>

                                    <button
                                        onClick={() => navigateToModule('proposals')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'proposals'
                                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        }`}
                                    >
                                        <DocumentTextIcon className="w-5 h-5" />
                                        <span>Propuestas</span>
                                    </button>

                                    <button
                                        onClick={() => navigateToModule('chat')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'chat'
                                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        <span>Chat</span>
                                    </button>

                                    <button
                                        onClick={() => window.location.href = '/notificaciones'}
                                        className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                            unreadCount > 0 
                                                ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 animate-pulse' 
                                                : 'text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                        }`}
                                    >
                                        <BellIcon className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                                        <span>Avisos</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </>
                            )}
                        </nav>

                        {/* Usuario o botón de login */}
                        <div className="flex items-center space-x-4">
                            {/* Toggle de tema */}
                            <ThemeToggle />
                            
                            {/* Botón para validar sesión (oculto) */}
                            {/* <button
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
                            </button> */}
                            
                            {(() => {
                                console.log('🎯 Header render - isAuthenticated:', isAuthenticated, 'currentUser:', currentUser ? currentUser.name : 'null')
                                return null
                            })()}
                            
                            {isAuthenticated && currentUser ? (
                                <div className="flex items-center space-x-3">
                                    {/* Botón de perfil */}
                                    <button
                                        onClick={() => {
                                            console.log('👤 Navegando al perfil desde el header')
                                            navigateToModule('profile')
                                        }}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'profile'
                                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        title="Ver perfil"
                                    >
                                        <UserIcon className="w-5 h-5" />
                                        <span className="hidden sm:inline">Perfil</span>
                                    </button>
                                    
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
                                        className="bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Login Admin
                                    </button>
                                </div>
                            )}

                            {isAuthenticated && (
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
            <div className="md:hidden fixed bottom-0 left-0 right-0 w-screen overflow-hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 pb-[env(safe-area-inset-bottom)] z-50 transition-colors">
                <div className="flex justify-around">
                    <button
                        onClick={() => navigateToModule('home')}
                        className={`flex flex-col items-center space-y-1 p-2 transition-colors ${currentModule === 'home' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        <HomeIcon className="w-6 h-6" />
                        <span className="text-xs">Inicio</span>
                    </button>

                    <button
                        onClick={() => navigateToModule('products')}
                        className={`flex flex-col items-center space-y-1 p-2 transition-colors ${currentModule === 'products' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                            }`}
                    >
                        {isFoundation ? (
                            <>
                                <GiftIcon className="w-6 h-6" />
                                <span className="text-xs">Donaciones</span>
                            </>
                        ) : (
                            <>
                                <ShoppingBagIcon className="w-6 h-6" />
                                <span className="text-xs">Productos</span>
                            </>
                        )}
                    </button>

                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => navigateToModule('interactions')}
                                className={`flex flex-col items-center space-y-1 p-2 transition-colors ${currentModule === 'interactions' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <ArrowsRightLeftIcon className="w-6 h-6" />
                                <span className="text-xs">Trueque</span>
                            </button>

                            <button
                                onClick={() => navigateToModule('proposals')}
                                className={`flex flex-col items-center space-y-1 p-2 transition-colors ${currentModule === 'proposals' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400'
                                    }`}
                            >
                                <DocumentTextIcon className="w-6 h-6" />
                                <span className="text-xs">Propuestas</span>
                            </button>

                            <button
                                onClick={() => navigateToModule('chat')}
                                className={`flex flex-col items-center space-y-1 p-2 transition-colors ${currentModule === 'chat' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                <span className="text-xs">Chat</span>
                            </button>

                            <button
                                onClick={() => window.location.href = '/notificaciones'}
                                className={`relative flex flex-col items-center space-y-1 p-2 transition-all duration-200 ${
                                    unreadCount > 0 
                                        ? 'text-green-600 dark:text-green-400 animate-pulse' 
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                <BellIcon className={`w-6 h-6 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                                <span className="text-xs">Avisos</span>
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 bg-green-500 dark:bg-green-600 text-white text-[0.65rem] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-lg">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setCurrentScreen('auth')}
                            className="flex flex-col items-center space-y-1 p-2 text-gray-500 dark:text-gray-400 transition-colors"
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
