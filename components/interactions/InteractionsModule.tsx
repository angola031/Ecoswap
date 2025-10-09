'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    HeartIcon,
    ChatBubbleLeftRightIcon,
    EyeIcon,
    StarIcon,
    MapPinIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    UserIcon,
    UserGroupIcon,
    GiftIcon,
    TruckIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
    User
} from '@/lib/types'
import { 
    InteractionSummary, 
    UserActivity, 
    SystemEvent
} from '@/lib/types/interactions'

interface InteractionsModuleProps {
    currentUser: User | null
}

export default function InteractionsModule({ currentUser }: InteractionsModuleProps) {
    const router = useRouter()
    const [interactions, setInteractions] = useState<InteractionSummary[]>([])
    const [activities, setActivities] = useState<UserActivity[]>([])
    const [events, setEvents] = useState<SystemEvent[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'interactions' | 'activities' | 'events'>('interactions')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Cargar datos reales desde la API
    useEffect(() => {
        let isMounted = true

        const loadData = async () => {
            if (!currentUser || !isMounted) return
            
            setIsLoading(true)

            try {
                // Obtener sesión de Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                
                if (!session?.access_token) {
                    console.error('❌ ERROR: No hay token de sesión')
                    console.error('Session error:', sessionError)
                    if (isMounted) {
                        setIsLoading(false)
                    }
                    return
                }

                // Cargar interacciones desde la API con filtros
                const params = new URLSearchParams()
                if (filterStatus !== 'all') {
                    params.append('status', filterStatus)
                }


                const response = await fetch(`/api/interactions?${params.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })


                if (response.ok) {
                    const data = await response.json()
                    if (isMounted) {
                        setInteractions(data.interactions || [])
                    }
                } else {
                    const errorText = await response.text()
                    console.error('❌ ERROR: Error cargando interacciones:', response.status)
                    console.error('❌ ERROR: Error response:', errorText)
                }

                // Cargar actividades del usuario
                const activitiesResponse = await fetch('/api/interactions/activities', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (activitiesResponse.ok) {
                    const activitiesData = await activitiesResponse.json()
                    if (isMounted) {
                        setActivities(activitiesData.activities || [])
                    }
                }

                // Cargar eventos del sistema
                const eventsResponse = await fetch('/api/interactions/events', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json()
                    if (isMounted) {
                        setEvents(eventsData.events || [])
                    }
                }

            } catch (error) {
                console.error('Error cargando datos:', error)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadData()

        return () => {
            isMounted = false
        }
    }, [currentUser, filterStatus])

    const getTypeIcon = (type: string) => {
        const icons: Record<string, JSX.Element> = {
            intercambio: <UserGroupIcon className="w-5 h-5" />,
            venta: <GiftIcon className="w-5 h-5" />,
            donacion: <HeartIcon className="w-5 h-5" />,
            exchange: <UserGroupIcon className="w-5 h-5" />, // Mantener compatibilidad
            purchase: <GiftIcon className="w-5 h-5" />,
            donation: <HeartIcon className="w-5 h-5" />,
            collaboration: <UserIcon className="w-5 h-5" />
        }
        return icons[type] || <UserGroupIcon className="w-5 h-5" />
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            intercambio: 'bg-blue-100 text-blue-800',
            venta: 'bg-green-100 text-green-800',
            donacion: 'bg-pink-100 text-pink-800',
            exchange: 'bg-blue-100 text-blue-800', // Mantener compatibilidad
            purchase: 'bg-green-100 text-green-800',
            donation: 'bg-pink-100 text-pink-800',
            collaboration: 'bg-purple-100 text-purple-800'
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            intercambio: 'Intercambio',
            venta: 'Venta',
            donacion: 'Donación',
            exchange: 'Intercambio', // Mantener compatibilidad
            purchase: 'Compra',
            donation: 'Donación',
            collaboration: 'Colaboración'
        }
        return labels[type] || type
    }

    const getStatusIcon = (status: string) => {
        const icons: Record<string, JSX.Element> = {
            pendiente: <ClockIcon className="w-5 h-5" />,
            aceptado: <ExclamationTriangleIcon className="w-5 h-5" />,
            rechazado: <XCircleIcon className="w-5 h-5" />,
            completado: <CheckCircleIcon className="w-5 h-5" />,
            cancelado: <XCircleIcon className="w-5 h-5" />,
            pending: <ClockIcon className="w-5 h-5" />, // Mantener compatibilidad
            in_progress: <ExclamationTriangleIcon className="w-5 h-5" />,
            completed: <CheckCircleIcon className="w-5 h-5" />,
            cancelled: <XCircleIcon className="w-5 h-5" />
        }
        return icons[status] || <ClockIcon className="w-5 h-5" />
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pendiente: 'bg-yellow-100 text-yellow-800',
            aceptado: 'bg-blue-100 text-blue-800',
            rechazado: 'bg-red-100 text-red-800',
            completado: 'bg-green-100 text-green-800',
            cancelado: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800', // Mantener compatibilidad
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pendiente: 'Pendiente',
            aceptado: 'Aceptado',
            rechazado: 'Rechazado',
            completado: 'Completado',
            cancelado: 'Cancelado',
            pending: 'Pendiente', // Mantener compatibilidad
            in_progress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado'
        }
        return labels[status] || status
    }

    const formatPrice = (price?: number) => {
        if (!price || price === 0) return 'Gratis'
        return `COP$ ${price.toLocaleString('es-CO')}`
    }

    const filteredInteractions = filterStatus === 'all'
        ? interactions
        : interactions.filter(interaction => interaction.status === filterStatus)

    // Función para abrir el detalle de la interacción
    const openInteractionDetail = (interaction: InteractionSummary) => {
        router.push(`/interaccion/${interaction.id}`)
    }

    // Función para abrir el chat
    const openChat = (interaction: InteractionSummary) => {
        if (interaction.chatId) {
            router.push(`/chat/${interaction.chatId}`)
        } else {
            console.error('No hay chatId disponible para esta interacción')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Interacciones</h1>
                    <p className="text-gray-600 mt-2">Gestiona tus intercambios, compras y actividades</p>
                </div>
            </div>

            {/* Navegación de pestañas */}
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'interactions', name: 'Interacciones', icon: UserGroupIcon },
                        { id: 'activities', name: 'Actividad', icon: EyeIcon },
                        { id: 'events', name: 'Eventos', icon: CalendarIcon }
                    ].map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'interactions' | 'activities' | 'events')}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Contenido de las pestañas */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'interactions' && (
                    <div className="space-y-6">
                        {/* Filtros de estado */}
                        <div className="flex flex-wrap gap-2">
                            {['all', 'pendiente', 'aceptado', 'rechazado', 'completado', 'cancelado'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        filterStatus === status
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status === 'all' ? 'Todas' : getStatusLabel(status)}
                                </button>
                            ))}
                        </div>

                        {/* Lista de interacciones */}
                        <div className="grid gap-6">
                            {filteredInteractions.map((interaction) => (
                                <motion.div
                                    key={interaction.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* Información principal */}
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(interaction.type)}`}>
                                                        {getTypeIcon(interaction.type)}
                                                        <span className="ml-1">{getTypeLabel(interaction.type)}</span>
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interaction.status)}`}>
                                                        {getStatusIcon(interaction.status)}
                                                        <span className="ml-1">{getStatusLabel(interaction.status)}</span>
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{interaction.title}</h3>
                                                <p className="text-gray-600 mb-4">{interaction.description}</p>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <CalendarIcon className="w-4 h-4 mr-1" />
                                                        {new Date(interaction.createdAt).toLocaleDateString('es-CO')}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                                                        {interaction.messagesCount} mensajes
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Información del producto y usuario */}
                                            <div className="lg:w-80">
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-center space-x-3 mb-3">
                                                        <img
                                                            src={interaction.offeredProduct.image}
                                                            alt={interaction.offeredProduct.title}
                                                            className="w-16 h-16 rounded-lg object-cover"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-gray-900">{interaction.offeredProduct.title}</p>
                                                            <p className="text-sm text-gray-600">{interaction.offeredProduct.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-lg font-semibold text-green-600">
                                                            {formatPrice(interaction.offeredProduct.price)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {interaction.offeredProduct.condition}
                                                        </span>
                                                    </div>
                                                    <div className="border-t border-gray-200 pt-3">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <img
                                                                src={interaction.otherUser.avatar || '/images/default-avatar.png'}
                                                                alt={interaction.otherUser.name}
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                            <div>
                                                                <p className="font-medium text-gray-900">{interaction.otherUser.name} {interaction.otherUser.lastName}</p>
                                                                <p className="text-xs text-gray-500 flex items-center">
                                                                    <MapPinIcon className="w-3 h-3 mr-1" />
                                                                    {interaction.otherUser.location}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                                                            <span className="text-sm font-medium">{interaction.otherUser.rating}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                                            <button 
                                                onClick={() => openChat(interaction)}
                                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                            >
                                                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                                                Ver Chat
                                            </button>
                                            <button
                                                onClick={() => openInteractionDetail(interaction)}
                                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                                            >
                                                <EyeIcon className="w-4 h-4 mr-2" />
                                                Ver Detalles
                                            </button>
                                            {(interaction.status === 'completado' || interaction.status === 'completed') && (
                                                <button
                                                    onClick={() => router.push(`/interaccion/${interaction.id}/calificar?user=${interaction.otherUser.id}`)}
                                                    className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors flex items-center"
                                                >
                                                    <StarIcon className="w-4 h-4 mr-2 text-yellow-500" />
                                                    Calificar
                                                </button>
                                            )}
                                            {(interaction.status === 'pendiente' || interaction.status === 'pending') && (
                                                <button
                                                    onClick={() => router.push(`/interaccion/${interaction.id}/aceptar`)}
                                                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                    Aceptar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Sin interacciones */}
                        {filteredInteractions.length === 0 && (
                            <div className="text-center py-20">
                                <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay interacciones</h3>
                                <p className="text-gray-600">
                                    {filterStatus === 'all'
                                        ? 'Aún no tienes interacciones. ¡Comienza a intercambiar productos!'
                                        : `No hay interacciones con estado "${getStatusLabel(filterStatus)}"`
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'activities' && (
                    <div className="text-center py-20">
                        <EyeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Actividad</h3>
                        <p className="text-gray-600">Próximamente podrás ver tu historial de actividades</p>
                    </div>
                )}

                {activeTab === 'events' && (
                    <div className="text-center py-20">
                        <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Eventos</h3>
                        <p className="text-gray-600">Próximamente podrás ver eventos y actividades de la comunidad</p>
                    </div>
                )}
            </motion.div>
        </div>
    )
}