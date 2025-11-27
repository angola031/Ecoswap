'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface DashboardOverviewProps {
    onViewUsers: () => void
    onViewVerifications: () => void
    onViewNotifications: () => void
    onViewProducts?: () => void
}

interface OverviewStats {
    totalClients: number
    activeClients: number
    verifiedClients: number
    pendingVerifications: number
    totalProducts: number
    activeProducts: number
    recentRegistrations: number
}

export default function DashboardOverview({ 
    onViewUsers, 
    onViewVerifications, 
    onViewNotifications,
    onViewProducts
}: DashboardOverviewProps) {
    const [stats, setStats] = useState<OverviewStats>({
        totalClients: 0,
        activeClients: 0,
        verifiedClients: 0,
        pendingVerifications: 0,
        totalProducts: 0,
        activeProducts: 0,
        recentRegistrations: 0
    })
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchOverviewStats()
        
        // Configurar actualización en tiempo real
        const setupRealtime = async () => {
            const supabase = getSupabaseClient()
            if (!supabase) return
            
            // Suscribirse a cambios en la tabla usuario
            const userSubscription = supabase
                .channel('dashboard-overview-users')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'usuario' },
                    (payload) => {
                        fetchOverviewStats()
                    }
                )
                .subscribe()

            // Suscribirse a cambios en la tabla producto
            const productSubscription = supabase
                .channel('dashboard-overview-products')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'producto' },
                    (payload) => {
                        fetchOverviewStats()
                    }
                )
                .subscribe()

            // Suscribirse a cambios en la tabla validacion_usuario
            const validationSubscription = supabase
                .channel('dashboard-overview-validations')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'validacion_usuario' },
                    (payload) => {
                        fetchOverviewStats()
                    }
                )
                .subscribe()

            // Cleanup function
            return () => {
                userSubscription.unsubscribe()
                productSubscription.unsubscribe()
                validationSubscription.unsubscribe()
            }
        }

        setupRealtime()

        // Actualizar cada 30 segundos como backup
        const interval = setInterval(fetchOverviewStats, 30000)

        return () => {
            clearInterval(interval)
        }
    }, [])

    const fetchOverviewStats = async (isManualRefresh = false) => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.error('❌ Supabase no está configurado')
                return
            }
            
            if (isManualRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            // Obtener estadísticas de usuarios (clientes)
            const { data: users, error: usersError } = await supabase
                .from('usuario')
                .select('user_id, activo, verificado, fecha_registro')
                .eq('es_admin', false)

            if (usersError) {
                console.error('❌ Error obteniendo usuarios:', usersError)
            }

            // Obtener estadísticas de productos
            const { data: products, error: productsError } = await supabase
                .from('producto')
                .select('producto_id, estado_publicacion')

            if (productsError) {
                console.error('❌ Error obteniendo productos:', productsError)
            }

            // Obtener verificaciones pendientes desde tabla VALIDACION_USUARIO
            const { data: pendingValidations, error: validationsError } = await supabase
                .from('validacion_usuario')
                .select('validacion_id, estado')
                .in('estado', ['pendiente', 'en_revision'])

            if (validationsError) {
                console.error('❌ Error obteniendo validaciones:', validationsError)
            }

            // Calcular estadísticas
            const totalClients = users?.length || 0
            const activeClients = users?.filter(u => u.activo).length || 0
            const verifiedClients = users?.filter(u => u.verificado).length || 0
            const pendingVerifications = pendingValidations?.length || 0
            
            const totalProducts = products?.length || 0
            const activeProducts = products?.filter(p => p.estado_publicacion === 'activo').length || 0

            // Usuarios registrados en los últimos 7 días
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            const recentRegistrations = users?.filter(u => {
                if (!u.fecha_registro) return false
                return new Date(u.fecha_registro) > weekAgo
            }).length || 0

            setStats({
                totalClients,
                activeClients,
                verifiedClients,
                pendingVerifications,
                totalProducts,
                activeProducts,
                recentRegistrations
            })

            setLastUpdated(new Date())

        } catch (err) {
            console.error('❌ Error en fetchOverviewStats:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const StatCard = ({ 
        title, 
        value, 
        subtitle, 
        icon, 
        color, 
        onClick 
    }: {
        title: string
        value: number
        subtitle: string
        icon: string
        color: string
        onClick?: () => void
    }) => (
        <div 
            className={`${color} rounded-lg p-4 text-white cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-transparent`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm opacity-90">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs opacity-75">{subtitle}</p>
                </div>
                <div className="text-3xl opacity-80">{icon}</div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen del Sistema</h2>
                    <p className="text-gray-600">Estadísticas generales de usuarios y productos</p>
                    {lastUpdated && (
                        <p className="text-xs text-gray-500 mt-1">
                            Última actualización: {lastUpdated.toLocaleTimeString('es-CO')}
                        </p>
                    )}
                </div>
                <button
                    onClick={() => fetchOverviewStats(true)}
                    disabled={refreshing}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {refreshing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Actualizando...</span>
                        </>
                    ) : (
                        <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Actualizar</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Estadísticas de Clientes */}
                <StatCard
                    title="Total Clientes"
                    value={stats.totalClients}
                    subtitle="Usuarios registrados"
                    icon="👥"
                    color="bg-blue-500 dark:bg-blue-500/80"
                    onClick={onViewUsers}
                />

                <StatCard
                    title="Clientes Activos"
                    value={stats.activeClients}
                    subtitle={`${stats.totalClients > 0 ? ((stats.activeClients / stats.totalClients) * 100).toFixed(1) : 0}% del total`}
                    icon="✅"
                    color="bg-green-500 dark:bg-green-500/80"
                    onClick={onViewUsers}
                />

                <StatCard
                    title="Clientes Verificados"
                    value={stats.verifiedClients}
                    subtitle={`${stats.totalClients > 0 ? ((stats.verifiedClients / stats.totalClients) * 100).toFixed(1) : 0}% del total`}
                    icon="🆔"
                    color="bg-purple-500 dark:bg-purple-500/80"
                    onClick={onViewVerifications}
                />

                {/* Estadísticas de Verificaciones */}
                <StatCard
                    title="Verificaciones Pendientes"
                    value={stats.pendingVerifications}
                    subtitle="Requieren atención"
                    icon="⏳"
                    color="bg-yellow-500 dark:bg-yellow-500/80"
                    onClick={onViewVerifications}
                />

                {/* Estadísticas de Productos */}
                <StatCard
                    title="Total Productos"
                    value={stats.totalProducts}
                    subtitle="Productos en el sistema"
                    icon="📦"
                    color="bg-indigo-500 dark:bg-indigo-500/80"
                    onClick={onViewProducts}
                />

                <StatCard
                    title="Productos Activos"
                    value={stats.activeProducts}
                    subtitle={`${stats.totalProducts > 0 ? ((stats.activeProducts / stats.totalProducts) * 100).toFixed(1) : 0}% del total`}
                    icon="🟢"
                    color="bg-emerald-500 dark:bg-emerald-500/80"
                    onClick={onViewProducts}
                />

                {/* Estadísticas de Crecimiento */}
                <StatCard
                    title="Nuevos Registros"
                    value={stats.recentRegistrations}
                    subtitle="Últimos 7 días"
                    icon="📈"
                    color="bg-orange-500 dark:bg-orange-500/80"
                    onClick={onViewUsers}
                />
            </div>

            {/* Acciones Rápidas y Administración */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors lg:col-span-3 backdrop-blur">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={onViewUsers}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors bg-white dark:bg-gray-800/70 text-left"
                        >
                            <div className="w-11 h-11 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-blue-600 dark:text-blue-200 text-xl">👥</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white">Gestionar Usuarios</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Ver y administrar clientes</p>
                            </div>
                        </button>

                        <button
                            onClick={onViewProducts}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors bg-white dark:bg-gray-800/70 text-left"
                        >
                            <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-indigo-600 dark:text-indigo-200 text-xl">📦</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white">Verificar Productos</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Revisar productos pendientes</p>
                            </div>
                        </button>

                        <button
                            onClick={onViewVerifications}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors bg-white dark:bg-gray-800/70 text-left"
                        >
                            <div className="w-11 h-11 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-yellow-600 dark:text-yellow-200 text-xl">🆔</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white">Validar Identidad</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Revisar verificaciones</p>
                            </div>
                        </button>

                        <button
                            onClick={onViewNotifications}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors bg-white dark:bg-gray-800/70 text-left"
                        >
                            <div className="w-11 h-11 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-green-600 dark:text-green-200 text-xl">🔔</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white">Notificaciones</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Ver alertas del sistema</p>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900/60 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors lg:col-span-2 backdrop-blur">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Administración</h3>
                    <div className="space-y-3">
                        <button
                            onClick={onViewUsers}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors bg-white dark:bg-gray-800/70 w-full text-left"
                        >
                            <div className="w-11 h-11 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-purple-600 dark:text-purple-200 text-xl">👨‍💼</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white">Gestionar Administradores</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Crear y administrar cuentas de admin</p>
                            </div>
                        </button>

                        <button
                            onClick={onViewVerifications}
                            className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors bg-white dark:bg-gray-800/70 w-full text-left"
                        >
                            <div className="w-11 h-11 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mr-3">
                                <span className="text-orange-600 dark:text-orange-200 text-xl">⚙️</span>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 dark:text-white">Configuraciones</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Preferencias del sistema y roles</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
