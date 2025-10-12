'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface DashboardStats {
    totalUsers: number
    verifiedUsers: number
    totalProducts: number
    publishedProducts: number
    pendingVerification: number
    totalMessages: number
    unreadMessages: number
    totalComplaints: number
    openComplaints: number
    // Estadísticas de verificación de identidad
    pendingIdentityVerification: number
    approvedIdentityVerification: number
    rejectedIdentityVerification: number
    totalIdentityVerification: number
}

interface StatsCardProps {
    title: string
    value: number
    subtitle?: string
    icon: string
    color: string
    trend?: {
        value: number
        isPositive: boolean
    }
}

function StatsCard({ title, value, subtitle, icon, color, trend }: StatsCardProps) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`w-8 h-8 ${color} rounded-md flex items-center justify-center`}>
                            <span className="text-white text-lg">{icon}</span>
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                                {title}
                            </dt>
                            <dd className="flex items-baseline">
                                <div className="text-2xl font-semibold text-gray-900">
                                    {value.toLocaleString()}
                                </div>
                                {trend && (
                                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                                        trend.isPositive ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                                    </div>
                                )}
                            </dd>
                            {subtitle && (
                                <dd className="text-sm text-gray-600 mt-1">
                                    {subtitle}
                                </dd>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function DashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        verifiedUsers: 0,
        totalProducts: 0,
        publishedProducts: 0,
        pendingVerification: 0,
        totalMessages: 0,
        unreadMessages: 0,
        totalComplaints: 0,
        openComplaints: 0,
        pendingIdentityVerification: 0,
        approvedIdentityVerification: 0,
        rejectedIdentityVerification: 0,
        totalIdentityVerification: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const supabase = getSupabaseClient()

                // Obtener estadísticas de usuarios
                const { data: users, error: usersError } = await supabase
                    .from('usuario')
                    .select('user_id, verificado, es_admin, activo')
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

                // Obtener estadísticas de mensajes (simulado - ajustar según tu esquema)
                const { data: messages, error: messagesError } = await supabase
                    .from('mensaje')
                    .select('mensaje_id, leido')
                    .limit(1000) // Limitar para evitar consultas muy grandes

                if (messagesError) {
                    console.error('❌ Error obteniendo mensajes:', messagesError)
                }

                // Obtener estadísticas de verificación de identidad desde tabla VALIDACION_USUARIO
                const { data: identityVerifications, error: identityError } = await supabase
                    .from('validacion_usuario')
                    .select('validacion_id, estado, tipo_validacion')

                if (identityError) {
                    console.error('❌ Error obteniendo verificaciones de identidad:', identityError)
                }

                // Calcular estadísticas
                const totalUsers = users?.length || 0
                const verifiedUsers = users?.filter(u => u.verificado).length || 0
                const totalProducts = products?.length || 0
                const publishedProducts = products?.filter(p => p.estado_publicacion === 'activo').length || 0
                const pendingVerification = products?.filter(p => p.estado_publicacion === 'pausado').length || 0
                const totalMessages = messages?.length || 0
                const unreadMessages = messages?.filter(m => !m.leido).length || 0

                // Calcular estadísticas de verificación de identidad
                const totalIdentityVerification = identityVerifications?.filter(v => 
                    v.estado && v.estado !== 'pendiente'
                ).length || 0
                const pendingIdentityVerification = identityVerifications?.filter(v => 
                    v.estado === 'pendiente' || v.estado === 'en_revision'
                ).length || 0
                const approvedIdentityVerification = identityVerifications?.filter(v => 
                    v.estado === 'aprobada'
                ).length || 0
                const rejectedIdentityVerification = identityVerifications?.filter(v => 
                    v.estado === 'rechazada'
                ).length || 0

                const newStats: DashboardStats = {
                    totalUsers,
                    verifiedUsers,
                    totalProducts,
                    publishedProducts,
                    pendingVerification,
                    totalMessages,
                    unreadMessages,
                    totalComplaints: 0, // Implementar cuando tengas la tabla
                    openComplaints: 0,   // Implementar cuando tengas la tabla
                    pendingIdentityVerification,
                    approvedIdentityVerification,
                    rejectedIdentityVerification,
                    totalIdentityVerification
                }

                setStats(newStats)

            } catch (error) {
                console.error('💥 Error cargando estadísticas:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
        
        // Configurar actualización en tiempo real
        const setupRealtime = async () => {
            const supabase = getSupabaseClient()
            // Suscribirse a cambios en la tabla usuario
            const userSubscription = supabase
                .channel('dashboard-stats-users')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'usuario' },
                    (payload) => {
                        fetchStats()
                    }
                )
                .subscribe()

            // Suscribirse a cambios en la tabla producto
            const productSubscription = supabase
                .channel('dashboard-stats-products')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'producto' },
                    (payload) => {
                        fetchStats()
                    }
                )
                .subscribe()

            // Cleanup function
            return () => {
                userSubscription.unsubscribe()
                productSubscription.unsubscribe()
            }
        }

        setupRealtime()

        // Actualizar cada 60 segundos como backup
        const interval = setInterval(fetchStats, 60000)

        return () => {
            clearInterval(interval)
        }
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gray-300 rounded-md"></div>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                    <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Estadísticas Generales */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas Generales</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
                title="Total Usuarios"
                value={stats.totalUsers}
                subtitle={`${stats.verifiedUsers} verificados`}
                icon="👥"
                color="bg-blue-500"
            />
            <StatsCard
                title="Usuarios Verificados"
                value={stats.verifiedUsers}
                subtitle={`${((stats.verifiedUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}% del total`}
                icon="✅"
                color="bg-green-500"
            />
            <StatsCard
                title="Productos Totales"
                value={stats.totalProducts}
                subtitle={`${stats.publishedProducts} publicados`}
                icon="📦"
                color="bg-purple-500"
            />
            <StatsCard
                title="Pendientes Verificación"
                value={stats.pendingVerification}
                subtitle="Productos en revisión"
                icon="⏳"
                color="bg-yellow-500"
            />
            <StatsCard
                title="Mensajes Totales"
                value={stats.totalMessages}
                subtitle={`${stats.unreadMessages} sin leer`}
                icon="💬"
                color="bg-indigo-500"
            />
            <StatsCard
                title="Mensajes Sin Leer"
                value={stats.unreadMessages}
                subtitle="Requieren atención"
                icon="🔔"
                color="bg-red-500"
            />
            <StatsCard
                title="Quejas Totales"
                value={stats.totalComplaints}
                subtitle={`${stats.openComplaints} abiertas`}
                icon="⚠️"
                color="bg-orange-500"
            />
            <StatsCard
                title="Quejas Abiertas"
                value={stats.openComplaints}
                subtitle="Requieren resolución"
                icon="🚨"
                color="bg-red-600"
            />
                </div>
            </div>

            {/* Estadísticas de Verificación de Identidad */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verificación de Identidad</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Verificaciones"
                        value={stats.totalIdentityVerification}
                        subtitle="Documentos subidos"
                        icon="🆔"
                        color="bg-indigo-500"
                    />
                    <StatsCard
                        title="Pendientes Revisión"
                        value={stats.pendingIdentityVerification}
                        subtitle="Requieren atención"
                        icon="⏳"
                        color="bg-yellow-500"
                    />
                    <StatsCard
                        title="Verificaciones Aprobadas"
                        value={stats.approvedIdentityVerification}
                        subtitle={`${stats.totalIdentityVerification > 0 ? ((stats.approvedIdentityVerification / stats.totalIdentityVerification) * 100).toFixed(1) : 0}% del total`}
                        icon="✅"
                        color="bg-green-500"
                    />
                    <StatsCard
                        title="Verificaciones Rechazadas"
                        value={stats.rejectedIdentityVerification}
                        subtitle={`${stats.totalIdentityVerification > 0 ? ((stats.rejectedIdentityVerification / stats.totalIdentityVerification) * 100).toFixed(1) : 0}% del total`}
                        icon="❌"
                        color="bg-red-500"
                    />
                </div>
            </div>
        </div>
    )
}
