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

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
}

interface InteractionsModuleProps {
    currentUser: User | null
}

interface Interaction {
    id: string
    type: 'exchange' | 'purchase' | 'donation' | 'collaboration'
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    title: string
    description: string
    product: {
        id: string
        title: string
        image: string
        price: number
        currency: string
        description: string
        condition: string
        category: string
    }
    otherUser: {
        id: string
        name: string
        avatar: string
        location: string
        rating: number
        phone?: string
        email?: string
    }
    createdAt: string
    updatedAt: string
    messages: Array<{
        id: string
        text: string
        timestamp: string
        sender: {
            id: string
            name: string
            avatar: string
        }
        type: 'text' | 'system' | 'proposal' | 'delivery'
    }>
    proposals: Array<{
        id: string
        type: 'exchange' | 'purchase' | 'donation'
        status: 'pending' | 'accepted' | 'rejected' | 'counter'
        description: string
        proposedPrice?: number
        proposedProduct?: string
        createdAt: string
        expiresAt: string
    }>
    deliveries: Array<{
        id: string
        type: 'meetup' | 'shipping' | 'pickup'
        status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
        location: string
        date: string
        time: string
        notes: string
        contactPhone?: string
    }>
    isUrgent: boolean
}

interface Activity {
    id: string
    type: 'view' | 'like' | 'share' | 'comment' | 'follow'
    title: string
    description: string
    timestamp: string
    user: {
        id: string
        name: string
        avatar: string
        location: string
    }
    product?: {
        id: string
        title: string
        image: string
    }
}

interface Event {
    id: string
    title: string
    description: string
    date: string
    time: string
    location: string
    attendees: number
    maxAttendees: number
    image: string
    category: string
    isOnline: boolean
}

export default function InteractionsModule({ currentUser }: InteractionsModuleProps) {
    const router = useRouter()
    const [interactions, setInteractions] = useState<Interaction[]>([])
    const [activities, setActivities] = useState<Activity[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'interactions' | 'activities' | 'events'>('interactions')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    // Cargar datos mockup
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockInteractions: Interaction[] = [
                {
                    id: '1',
                    type: 'exchange',
                    status: 'in_progress',
                    title: 'Intercambio iPhone 12 Pro por Bicicleta',
                    description: 'Intercambio en progreso con Ana María. Acordamos encontrarnos mañana en el centro comercial.',
                    product: {
                        id: '1',
                        title: 'iPhone 12 Pro - Excelente Estado',
                        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
                        price: 2500000,
                        currency: 'COP',
                        description: 'iPhone 12 Pro de 128GB en excelente estado. Incluye cargador original y funda de silicona.',
                        condition: 'excellent',
                        category: 'electronics'
                    },
                    otherUser: {
                        id: '2',
                        name: 'Ana María López',
                        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
                        location: 'Medellín, Antioquia',
                        rating: 4.9,
                        phone: '+57 300 123 4567',
                        email: 'ana.maria@email.com'
                    },
                    createdAt: '2024-01-20',
                    updatedAt: '2024-01-21',
                    messages: [
                        {
                            id: '1',
                            text: 'Hola! Me interesa tu iPhone, ¿está disponible?',
                            timestamp: '2024-01-20T10:00:00Z',
                            sender: {
                                id: '2',
                                name: 'Ana María López',
                                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'
                            },
                            type: 'text'
                        },
                        {
                            id: '2',
                            text: 'Sí, está disponible. ¿Te interesa hacer un intercambio?',
                            timestamp: '2024-01-20T10:30:00Z',
                            sender: {
                                id: 'current-user',
                                name: 'Tú',
                                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
                            },
                            type: 'text'
                        }
                    ],
                    proposals: [
                        {
                            id: '1',
                            type: 'exchange',
                            status: 'accepted',
                            description: 'Intercambio por bicicleta de montaña Trek en buen estado',
                            createdAt: '2024-01-20T11:00:00Z',
                            expiresAt: '2024-01-27T11:00:00Z'
                        }
                    ],
                    deliveries: [
                        {
                            id: '1',
                            type: 'meetup',
                            status: 'confirmed',
                            location: 'Centro Comercial Pereira Plaza',
                            date: '2024-01-25',
                            time: '15:00',
                            notes: 'Encuentro en la entrada principal del centro comercial',
                            contactPhone: '+57 300 123 4567'
                        }
                    ],
                    isUrgent: false
                },
                {
                    id: '2',
                    type: 'purchase',
                    status: 'completed',
                    title: 'Compra de Libros de Literatura',
                    description: 'Compra completada exitosamente. Roberto fue muy puntual y los libros están en excelente estado.',
                    product: {
                        id: '2',
                        title: 'Libros de Literatura Colombiana',
                        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
                        price: 150000,
                        currency: 'COP',
                        description: 'Colección de libros de literatura colombiana clásica. Incluye obras de García Márquez, Álvaro Mutis y otros.',
                        condition: 'good',
                        category: 'books'
                    },
                    otherUser: {
                        id: '3',
                        name: 'Roberto Silva',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
                        location: 'Bogotá D.C.',
                        rating: 4.7,
                        phone: '+57 310 987 6543',
                        email: 'roberto.silva@email.com'
                    },
                    createdAt: '2024-01-15',
                    updatedAt: '2024-01-18',
                    messages: [
                        {
                            id: '1',
                            text: 'Hola! ¿Los libros siguen disponibles?',
                            timestamp: '2024-01-15T14:00:00Z',
                            sender: {
                                id: '3',
                                name: 'Roberto Silva',
                                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
                            },
                            type: 'text'
                        }
                    ],
                    proposals: [],
                    deliveries: [
                        {
                            id: '1',
                            type: 'meetup',
                            status: 'completed',
                            location: 'Biblioteca Pública de Pereira',
                            date: '2024-01-18',
                            time: '16:00',
                            notes: 'Entrega completada exitosamente',
                            contactPhone: '+57 310 987 6543'
                        }
                    ],
                    isUrgent: false
                },
                {
                    id: '3',
                    type: 'exchange',
                    status: 'pending',
                    title: 'Intercambio Guitarra por Amplificador',
                    description: 'Esperando confirmación de María Fernanda para el intercambio de la guitarra acústica.',
                    product: {
                        id: '3',
                        title: 'Guitarra Acústica Yamaha',
                        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                        price: 450000,
                        currency: 'COP',
                        description: 'Guitarra acústica Yamaha en excelente estado. Perfecta para principiantes y músicos intermedios.',
                        condition: 'excellent',
                        category: 'music'
                    },
                    otherUser: {
                        id: '4',
                        name: 'María Fernanda',
                        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
                        location: 'Cali, Valle del Cauca',
                        rating: 4.6,
                        phone: '+57 315 456 7890',
                        email: 'maria.fernanda@email.com'
                    },
                    createdAt: '2024-01-22',
                    updatedAt: '2024-01-22',
                    messages: [
                        {
                            id: '1',
                            text: 'Hola! Me gustaría intercambiar mi amplificador por tu guitarra',
                            timestamp: '2024-01-22T09:00:00Z',
                            sender: {
                                id: '4',
                                name: 'María Fernanda',
                                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face'
                            },
                            type: 'text'
                        }
                    ],
                    proposals: [
                        {
                            id: '1',
                            type: 'exchange',
                            status: 'pending',
                            description: 'Intercambio por amplificador Marshall MG50GFX',
                            createdAt: '2024-01-22T09:30:00Z',
                            expiresAt: '2024-01-29T09:30:00Z'
                        }
                    ],
                    deliveries: [],
                    isUrgent: true
                },
                {
                    id: '4',
                    type: 'donation',
                    status: 'completed',
                    title: 'Donación de Ropa a Fundación',
                    description: 'Donación completada. La ropa fue entregada a la fundación "Ayuda Colombia" en Pereira.',
                    product: {
                        id: '4',
                        title: 'Ropa en Buen Estado',
                        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
                        price: 0,
                        currency: 'COP',
                        description: 'Ropa en buen estado para donación. Incluye camisetas, pantalones y zapatos.',
                        condition: 'good',
                        category: 'clothing'
                    },
                    otherUser: {
                        id: '5',
                        name: 'Fundación Ayuda Colombia',
                        avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=50&h=50&fit=crop',
                        location: 'Pereira, Risaralda',
                        rating: 5.0,
                        phone: '+57 6 324 5678',
                        email: 'contacto@ayudacolombia.org'
                    },
                    createdAt: '2024-01-10',
                    updatedAt: '2024-01-12',
                    messages: [
                        {
                            id: '1',
                            text: 'Gracias por tu donación. La ropa será muy útil para las familias necesitadas.',
                            timestamp: '2024-01-12T10:00:00Z',
                            sender: {
                                id: '5',
                                name: 'Fundación Ayuda Colombia',
                                avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=50&h=50&fit=crop'
                            },
                            type: 'text'
                        }
                    ],
                    proposals: [],
                    deliveries: [
                        {
                            id: '1',
                            type: 'pickup',
                            status: 'completed',
                            location: 'Fundación Ayuda Colombia, Pereira',
                            date: '2024-01-12',
                            time: '14:00',
                            notes: 'Recogida completada en las instalaciones de la fundación',
                            contactPhone: '+57 6 324 5678'
                        }
                    ],
                    isUrgent: false
                }
            ]

            const mockActivities: Activity[] = [
                {
                    id: '1',
                    type: 'view',
                    title: 'Tu producto fue visto',
                    description: 'Ana María vio tu iPhone 12 Pro',
                    timestamp: 'Hace 2 horas',
                    user: {
                        id: '2',
                        name: 'Ana María López',
                        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
                        location: 'Medellín, Antioquia'
                    },
                    product: {
                        id: '1',
                        title: 'iPhone 12 Pro - Excelente Estado',
                        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=150&fit=crop'
                    }
                },
                {
                    id: '2',
                    type: 'like',
                    title: 'Nuevo me gusta',
                    description: 'Roberto le dio me gusta a tu guitarra',
                    timestamp: 'Hace 4 horas',
                    user: {
                        id: '3',
                        name: 'Roberto Silva',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
                        location: 'Bogotá D.C.'
                    },
                    product: {
                        id: '3',
                        title: 'Guitarra Acústica Yamaha',
                        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop'
                    }
                },
                {
                    id: '3',
                    type: 'comment',
                    title: 'Nuevo comentario',
                    description: 'María Fernanda comentó en tu producto',
                    timestamp: 'Hace 6 horas',
                    user: {
                        id: '4',
                        name: 'María Fernanda',
                        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
                        location: 'Cali, Valle del Cauca'
                    },
                    product: {
                        id: '3',
                        title: 'Guitarra Acústica Yamaha',
                        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop'
                    }
                },
                {
                    id: '4',
                    type: 'follow',
                    title: 'Nuevo seguidor',
                    description: 'Carlos Andrés comenzó a seguirte',
                    timestamp: 'Hace 1 día',
                    user: {
                        id: '6',
                        name: 'Carlos Andrés',
                        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
                        location: 'Barranquilla, Atlántico'
                    }
                }
            ]

            const mockEvents: Event[] = [
                {
                    id: '1',
                    title: 'Mercado Sostenible Pereira',
                    description: 'Mercado de intercambio de productos sostenibles en el parque Olaya Herrera. Trae lo que ya no uses y encuentra lo que necesites.',
                    date: '2024-02-15',
                    time: '10:00 AM - 4:00 PM',
                    location: 'Parque Olaya Herrera, Pereira',
                    attendees: 45,
                    maxAttendees: 100,
                    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
                    category: 'Mercado',
                    isOnline: false
                },
                {
                    id: '2',
                    title: 'Taller de Reparación de Bicicletas',
                    description: 'Aprende a reparar y mantener tu bicicleta. Intercambiamos herramientas y conocimientos.',
                    date: '2024-02-20',
                    time: '2:00 PM - 6:00 PM',
                    location: 'Centro Cultural de Pereira',
                    attendees: 18,
                    maxAttendees: 25,
                    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop',
                    category: 'Taller',
                    isOnline: false
                },
                {
                    id: '3',
                    title: 'Charla Virtual: Economía Circular',
                    description: 'Charla online sobre economía circular y cómo implementarla en tu vida diaria.',
                    date: '2024-02-25',
                    time: '7:00 PM - 8:30 PM',
                    location: 'Zoom (Enlace se enviará por email)',
                    attendees: 67,
                    maxAttendees: 100,
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                    category: 'Charla',
                    isOnline: true
                }
            ]

            setInteractions(mockInteractions)
            setActivities(mockActivities)
            setEvents(mockEvents)
            setIsLoading(false)
        }

        loadData()
    }, [])

    const getTypeIcon = (type: string) => {
        const icons: Record<string, JSX.Element> = {
            exchange: <UserGroupIcon className="w-5 h-5" />,
            purchase: <GiftIcon className="w-5 h-5" />,
            donation: <HeartIcon className="w-5 h-5" />,
            collaboration: <UserIcon className="w-5 h-5" />
        }
        return icons[type] || <UserIcon className="w-5 h-5" />
    }

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            exchange: 'bg-blue-100 text-blue-800',
            purchase: 'bg-green-100 text-green-800',
            donation: 'bg-pink-100 text-pink-800',
            collaboration: 'bg-purple-100 text-purple-800'
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            exchange: 'Intercambio',
            purchase: 'Compra',
            donation: 'Donación',
            collaboration: 'Colaboración'
        }
        return labels[type] || type
    }

    const getStatusIcon = (status: string) => {
        const icons: Record<string, JSX.Element> = {
            pending: <ClockIcon className="w-5 h-5" />,
            in_progress: <ExclamationTriangleIcon className="w-5 h-5" />,
            completed: <CheckCircleIcon className="w-5 h-5" />,
            cancelled: <XCircleIcon className="w-5 h-5" />
        }
        return icons[status] || <ClockIcon className="w-5 h-5" />
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            in_progress: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: 'Pendiente',
            in_progress: 'En Progreso',
            completed: 'Completado',
            cancelled: 'Cancelado'
        }
        return labels[status] || status
    }

    const getActivityIcon = (type: string) => {
        const icons: Record<string, JSX.Element> = {
            view: <EyeIcon className="w-5 h-5" />,
            like: <HeartIcon className="w-5 h-5" />,
            share: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
            comment: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
            follow: <UserIcon className="w-5 h-5" />
        }
        return icons[type] || <UserIcon className="w-5 h-5" />
    }

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            view: 'bg-blue-100 text-blue-800',
            like: 'bg-pink-100 text-pink-800',
            share: 'bg-green-100 text-green-800',
            comment: 'bg-yellow-100 text-yellow-800',
            follow: 'bg-purple-100 text-purple-800'
        }
        return colors[type] || 'bg-gray-100 text-gray-800'
    }

    const getActivityLabel = (type: string) => {
        const labels: Record<string, string> = {
            view: 'Vista',
            like: 'Me gusta',
            share: 'Compartido',
            comment: 'Comentario',
            follow: 'Seguidor'
        }
        return labels[type] || type
    }

    const formatPrice = (price: number, currency: string) => {
        if (price === 0) return 'Gratis'
        if (currency === 'COP') {
            return `COP$ ${price.toLocaleString('es-CO')}`
        }
        return `${currency} ${price.toLocaleString()}`
    }

    const filteredInteractions = filterStatus === 'all'
        ? interactions
        : interactions.filter(interaction => interaction.status === filterStatus)

    // Función para abrir el detalle de la interacción
    const openInteractionDetail = (interaction: Interaction) => {
        router.push(`/interaccion/${interaction.id}`)
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
                {/* Pestaña Interacciones */}
                {activeTab === 'interactions' && (
                    <div className="space-y-6">
                        {/* Filtros */}
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'Todas' },
                                { value: 'pending', label: 'Pendientes' },
                                { value: 'in_progress', label: 'En Progreso' },
                                { value: 'completed', label: 'Completadas' },
                                { value: 'cancelled', label: 'Canceladas' }
                            ].map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => setFilterStatus(filter.value)}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filterStatus === filter.value
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Lista de interacciones */}
                        <div className="space-y-4">
                            {filteredInteractions.map((interaction) => (
                                <motion.div
                                    key={interaction.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${interaction.isUrgent ? 'border-l-4 border-l-orange-500' : ''}`}
                                >
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        {/* Imagen del producto */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={interaction.product.image}
                                                alt={interaction.product.title}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                        </div>

                                        {/* Información de la interacción */}
                                        <div className="flex-1">
                                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(interaction.type)}`}>
                                                            {getTypeIcon(interaction.type)}
                                                            <span className="ml-1">{getTypeLabel(interaction.type)}</span>
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interaction.status)}`}>
                                                            {getStatusIcon(interaction.status)}
                                                            <span className="ml-1">{getStatusLabel(interaction.status)}</span>
                                                        </span>
                                                        {interaction.isUrgent && (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                                ⚠️ Urgente
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        {interaction.title}
                                                    </h3>
                                                    <p className="text-gray-600 mb-3">{interaction.description}</p>

                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <div className="flex items-center space-x-1">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            <span>Creada: {interaction.createdAt}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                            <span>{interaction.messages.length} mensajes</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Usuario y precio */}
                                                <div className="flex flex-col items-end space-y-3">
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-primary-600">
                                                            {formatPrice(interaction.product.price, interaction.product.currency)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{interaction.product.title}</div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <img
                                                            src={interaction.otherUser.avatar}
                                                            alt={interaction.otherUser.name}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        <div className="text-right">
                                                            <div className="font-medium text-gray-900">{interaction.otherUser.name}</div>
                                                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                                <MapPinIcon className="w-3 h-3" />
                                                                <span>{interaction.otherUser.location}</span>
                                                            </div>
                                                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                                <StarIcon className="w-3 h-3 text-yellow-400" />
                                                                <span>{interaction.otherUser.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                                                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center">
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
                                                {interaction.status === 'completed' && (
                                                    <button
                                                        onClick={() => router.push(`/interaccion/${interaction.id}/calificar?user=${interaction.otherUser.id}`)}
                                                        className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors flex items-center"
                                                    >
                                                        <StarIcon className="w-4 h-4 mr-2 text-yellow-500" />
                                                        Calificar
                                                    </button>
                                                )}
                                                {interaction.status === 'pending' && (
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

                {/* Pestaña Actividad */}
                {activeTab === 'activities' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>

                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 mb-1">{activity.title}</h4>
                                                    <p className="text-gray-600 mb-2">{activity.description}</p>

                                                    {activity.product && (
                                                        <div className="flex items-center space-x-3">
                                                            <img
                                                                src={activity.product.image}
                                                                alt={activity.product.title}
                                                                className="w-16 h-12 object-cover rounded-lg"
                                                            />
                                                            <span className="text-sm text-gray-700">{activity.product.title}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="text-sm text-gray-500">{activity.timestamp}</span>
                                            </div>

                                            <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-200">
                                                <img
                                                    src={activity.user.avatar}
                                                    alt={activity.user.name}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{activity.user.name}</div>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <MapPinIcon className="w-3 h-3" />
                                                        <span>{activity.user.location}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pestaña Eventos */}
                {activeTab === 'events' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Eventos Sostenibles</h3>
                            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                Crear Evento
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {events.map((event) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                    />

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                {event.isOnline ? '🌐 Online' : '📍 Presencial'}
                                            </span>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                                {event.category}
                                            </span>
                                        </div>

                                        <h4 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h4>
                                        <p className="text-gray-600 text-sm line-clamp-3">{event.description}</p>

                                        <div className="space-y-2 text-sm text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                <CalendarIcon className="w-4 h-4" />
                                                <span>{event.date} - {event.time}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPinIcon className="w-4 h-4" />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <UserIcon className="w-4 h-4" />
                                                <span>{event.attendees}/{event.maxAttendees} asistentes</span>
                                            </div>
                                        </div>

                                        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors w-full flex items-center justify-center">
                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                            Asistir
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

        </div>
    )
}
