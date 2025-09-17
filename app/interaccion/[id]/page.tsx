'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    ArrowLeftIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarIcon,
    MapPinIcon,
    StarIcon,
    ChatBubbleLeftRightIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    HeartIcon,
    EyeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    UserIcon,
    GiftIcon,
    CurrencyDollarIcon,
    TagIcon
} from '@heroicons/react/24/outline'
import { useRouter, useParams } from 'next/navigation'

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
    rating: number
    phone?: string
}

interface Product {
    id: string
    title: string
    image: string
    price: number
    currency: string
    description: string
    condition: string
    category: string
}

interface Message {
    id: string
    text: string
    timestamp: string
    sender: {
        id: string
        name: string
        avatar: string
    }
    type: 'text' | 'system' | 'proposal' | 'delivery'
}

interface Proposal {
    id: string
    type: 'exchange' | 'purchase' | 'donation'
    status: 'pending' | 'accepted' | 'rejected' | 'counter'
    description: string
    proposedPrice?: number
    proposedProduct?: string
    createdAt: string
    expiresAt: string
}

interface Delivery {
    id: string
    type: 'meetup' | 'shipping' | 'pickup'
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
    location: string
    date: string
    time: string
    notes: string
    contactPhone?: string
}

interface Interaction {
    id: string
    type: 'exchange' | 'purchase' | 'donation' | 'collaboration'
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    title: string
    description: string
    product: Product
    otherUser: User
    createdAt: string
    updatedAt: string
    messages: Message[]
    proposals: Proposal[]
    deliveries: Delivery[]
    isUrgent: boolean
}

// Mock data para la interacción
const mockInteraction: Interaction = {
    id: '1',
    type: 'exchange',
    status: 'in_progress',
    title: 'Intercambio Guitarra por Amplificador',
    description: 'Intercambio de guitarra acústica por amplificador de guitarra. Ambos productos están en excelente estado.',
    product: {
        id: '1',
        title: 'Guitarra Acústica Yamaha',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        price: 450000,
        currency: 'COP',
        description: 'Guitarra acústica Yamaha en excelente estado. Perfecta para principiantes y músicos intermedios.',
        condition: 'excellent',
        category: 'music'
    },
    otherUser: {
        id: '2',
        name: 'Carlos Mendoza',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
        location: 'Medellín, Antioquia',
        rating: 4.8,
        phone: '+57 300 123 4567',
        email: 'carlos.mendoza@email.com'
    },
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    messages: [
        {
            id: '1',
            text: 'Hola! Me interesa tu guitarra. ¿Te parece bien el intercambio por mi amplificador?',
            timestamp: '2024-01-20T10:00:00Z',
            sender: {
                id: '2',
                name: 'Carlos Mendoza',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        },
        {
            id: '2',
            text: '¡Hola Carlos! Sí, me parece una excelente idea. ¿Podrías enviarme fotos del amplificador?',
            timestamp: '2024-01-20T11:30:00Z',
            sender: {
                id: '1',
                name: 'Tú',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        },
        {
            id: '3',
            text: '¡Por supuesto! Te envío las fotos ahora mismo.',
            timestamp: '2024-01-20T12:00:00Z',
            sender: {
                id: '2',
                name: 'Carlos Mendoza',
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
            description: 'Intercambio por amplificador de guitarra en buen estado',
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
}

export default function InteraccionDetailPage() {
    const router = useRouter()
    const params = useParams()
    const interactionId = params.id as string

    const [interaction, setInteraction] = useState<Interaction | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'proposals' | 'delivery'>('overview')
    const [newMessage, setNewMessage] = useState('')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showNewProposalModal, setShowNewProposalModal] = useState(false)

    useEffect(() => {
        const loadInteraction = async () => {
            setIsLoading(true)
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
            setInteraction(mockInteraction) // In a real app, fetch by interactionId
            setIsLoading(false)
        }

        if (interactionId) {
            loadInteraction()
        }
    }, [interactionId])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'exchange':
                return <GiftIcon className="w-5 h-5" />
            case 'purchase':
                return <CurrencyDollarIcon className="w-5 h-5" />
            case 'donation':
                return <HeartIcon className="w-5 h-5" />
            case 'collaboration':
                return <UserIcon className="w-5 h-5" />
            default:
                return <TagIcon className="w-5 h-5" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'exchange':
                return 'Intercambio'
            case 'purchase':
                return 'Compra'
            case 'donation':
                return 'Donación'
            case 'collaboration':
                return 'Colaboración'
            default:
                return type
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendiente'
            case 'in_progress':
                return 'En Progreso'
            case 'completed':
                return 'Completada'
            case 'cancelled':
                return 'Cancelada'
            default:
                return status
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'in_progress':
                return 'bg-blue-100 text-blue-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getProposalStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'accepted':
                return 'bg-green-100 text-green-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            case 'counter':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getDeliveryStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'confirmed':
                return 'bg-blue-100 text-blue-800'
            case 'in_progress':
                return 'bg-purple-100 text-purple-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const handleSendMessage = () => {
        if (!newMessage.trim() || !interaction) return

        const message: Message = {
            id: Date.now().toString(),
            text: newMessage,
            timestamp: new Date().toISOString(),
            sender: {
                id: '1',
                name: 'Tú',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        }

        setInteraction(prev => prev ? {
            ...prev,
            messages: [...prev.messages, message]
        } : null)
        setNewMessage('')
    }

    const handleCancelInteraction = () => {
        if (!interaction) return

        setInteraction(prev => prev ? {
            ...prev,
            status: 'cancelled'
        } : null)
        setShowCancelModal(false)
    }

    const handleNewProposal = () => {
        // Implementar lógica para nueva propuesta
        setShowNewProposalModal(false)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!interaction) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Interacción no encontrada</h2>
                    <p className="text-gray-600 mb-4">La interacción que buscas no existe o ha sido eliminada.</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">{interaction.title}</h1>
                                <p className="text-sm text-gray-500">ID: {interaction.id}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interaction.status)}`}>
                                {getStatusLabel(interaction.status)}
                            </span>
                            {interaction.isUrgent && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    Urgente
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información general */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg bg-primary-100 text-primary-600`}>
                                        {getTypeIcon(interaction.type)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {getTypeLabel(interaction.type)}
                                        </h2>
                                        <p className="text-gray-600">{interaction.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Producto */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-medium text-gray-900 mb-3">Producto</h3>
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={interaction.product.image}
                                        alt={interaction.product.title}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{interaction.product.title}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{interaction.product.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <TagIcon className="w-4 h-4" />
                                                <span>{interaction.product.category}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <StarIcon className="w-4 h-4" />
                                                <span>{interaction.product.condition}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <CurrencyDollarIcon className="w-4 h-4" />
                                                <span>{interaction.product.price.toLocaleString()} {interaction.product.currency}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navegación de pestañas */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6">
                                    {[
                                        { id: 'overview', name: 'Resumen', icon: EyeIcon },
                                        { id: 'messages', name: 'Mensajes', icon: ChatBubbleLeftRightIcon },
                                        { id: 'proposals', name: 'Propuestas', icon: HandThumbUpIcon },
                                        { id: 'delivery', name: 'Entrega', icon: TruckIcon }
                                    ].map((tab) => {
                                        const Icon = tab.icon
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
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

                            <div className="p-6">
                                {/* Pestaña Resumen */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="font-medium text-gray-900">Información de la Interacción</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Tipo:</span>
                                                        <span className="font-medium">{getTypeLabel(interaction.type)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Estado:</span>
                                                        <span className={`font-medium ${getStatusColor(interaction.status)} px-2 py-1 rounded-full text-xs`}>
                                                            {getStatusLabel(interaction.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Creada:</span>
                                                        <span className="font-medium">{new Date(interaction.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Actualizada:</span>
                                                        <span className="font-medium">{new Date(interaction.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-medium text-gray-900">Estadísticas</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Mensajes:</span>
                                                        <span className="font-medium">{interaction.messages.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Propuestas:</span>
                                                        <span className="font-medium">{interaction.proposals.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Entregas:</span>
                                                        <span className="font-medium">{interaction.deliveries.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones rápidas */}
                                        <div className="border-t border-gray-200 pt-6">
                                            <h3 className="font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                                            <div className="flex flex-wrap gap-3">
                                                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                                    <span>Enviar Mensaje</span>
                                                </button>
                                                <button className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2">
                                                    <HandThumbUpIcon className="w-4 h-4" />
                                                    <span>Aceptar</span>
                                                </button>
                                                <button className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2">
                                                    <HandThumbDownIcon className="w-4 h-4" />
                                                    <span>Rechazar</span>
                                                </button>
                                                <button
                                                    onClick={() => setShowCancelModal(true)}
                                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                    <span>Cancelar</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pestaña Mensajes */}
                                {activeTab === 'messages' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-900">Mensajes</h3>
                                            <span className="text-sm text-gray-500">{interaction.messages.length} mensajes</span>
                                        </div>

                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {interaction.messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${message.sender.id === '1' ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`max-w-xs lg:max-w-md ${message.sender.id === '1' ? 'order-2' : 'order-1'}`}>
                                                        <div className={`rounded-lg px-4 py-2 ${message.sender.id === '1'
                                                                ? 'bg-primary-600 text-white'
                                                                : 'bg-gray-100 text-gray-900'
                                                            }`}>
                                                            <p className="text-sm">{message.text}</p>
                                                        </div>
                                                        <div className={`text-xs text-gray-500 mt-1 ${message.sender.id === '1' ? 'text-right' : 'text-left'}`}>
                                                            {new Date(message.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    {message.sender.id !== '1' && (
                                                        <div className="order-2 ml-3">
                                                            <img
                                                                src={message.sender.avatar}
                                                                alt={message.sender.name}
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t border-gray-200 pt-4">
                                            <div className="flex space-x-3">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Escribe un mensaje..."
                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                />
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={!newMessage.trim()}
                                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Enviar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pestaña Propuestas */}
                                {activeTab === 'proposals' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-900">Propuestas</h3>
                                            <button
                                                onClick={() => setShowNewProposalModal(true)}
                                                className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                                            >
                                                Nueva Propuesta
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {interaction.proposals.map((proposal) => (
                                                <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProposalStatusColor(proposal.status)}`}>
                                                            {proposal.status === 'pending' ? 'Pendiente' :
                                                                proposal.status === 'accepted' ? 'Aceptada' :
                                                                    proposal.status === 'rejected' ? 'Rechazada' :
                                                                        proposal.status === 'counter' ? 'Contraoferta' : proposal.status}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(proposal.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <p className="text-gray-900 mb-3">{proposal.description}</p>

                                                    {proposal.proposedPrice && (
                                                        <div className="text-sm text-gray-600 mb-3">
                                                            Precio propuesto: {proposal.proposedPrice.toLocaleString()} {interaction.product.currency}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                        <ClockIcon className="w-4 h-4" />
                                                        <span>Expira: {new Date(proposal.expiresAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Pestaña Entrega */}
                                {activeTab === 'delivery' && (
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-gray-900">Información de Entrega</h3>

                                        <div className="space-y-4">
                                            {interaction.deliveries.map((delivery) => (
                                                <div key={delivery.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(delivery.status)}`}>
                                                            {delivery.status === 'pending' ? 'Pendiente' :
                                                                delivery.status === 'confirmed' ? 'Confirmada' :
                                                                    delivery.status === 'in_progress' ? 'En Progreso' :
                                                                        delivery.status === 'completed' ? 'Completada' : delivery.status}
                                                        </span>
                                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            <span>{delivery.date} - {delivery.time}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center space-x-2">
                                                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-900">{delivery.location}</span>
                                                        </div>

                                                        {delivery.contactPhone && (
                                                            <div className="flex items-center space-x-2">
                                                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-900">{delivery.contactPhone}</span>
                                                            </div>
                                                        )}

                                                        {delivery.notes && (
                                                            <div className="text-sm text-gray-600">
                                                                <strong>Notas:</strong> {delivery.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Barra lateral */}
                    <div className="space-y-6">
                        {/* Información del usuario */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="font-medium text-gray-900 mb-4">Usuario</h3>
                            <div className="flex items-center space-x-3 mb-4">
                                <img
                                    src={interaction.otherUser.avatar}
                                    alt={interaction.otherUser.name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <h4 className="font-medium text-gray-900">{interaction.otherUser.name}</h4>
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        <StarIcon className="w-4 h-4 text-yellow-400" />
                                        <span>{interaction.otherUser.rating}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center space-x-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900">{interaction.otherUser.location}</span>
                                </div>

                                {interaction.otherUser.phone && (
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{interaction.otherUser.phone}</span>
                                    </div>
                                )}

                                {interaction.otherUser.email && (
                                    <div className="flex items-center space-x-2">
                                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{interaction.otherUser.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <button className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    <span>Contactar</span>
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="font-medium text-gray-900 mb-4">Timeline</h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Interacción creada</p>
                                        <p className="text-xs text-gray-500">{new Date(interaction.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {interaction.proposals.length > 0 && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Propuesta enviada</p>
                                            <p className="text-xs text-gray-500">{new Date(interaction.proposals[0].createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                {interaction.deliveries.length > 0 && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Entrega coordinada</p>
                                            <p className="text-xs text-gray-500">{new Date(interaction.deliveries[0].date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Última actualización</p>
                                        <p className="text-xs text-gray-500">{new Date(interaction.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de cancelación */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cancelar Interacción</h3>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que quieres cancelar esta interacción? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCancelInteraction}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Sí, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de nueva propuesta */}
            {showNewProposalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Propuesta</h3>
                        <p className="text-gray-600 mb-6">
                            Crea una nueva propuesta para esta interacción.
                        </p>
                        <div className="space-y-4">
                            <textarea
                                placeholder="Describe tu propuesta..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={4}
                            />
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowNewProposalModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNewProposal}
                                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

