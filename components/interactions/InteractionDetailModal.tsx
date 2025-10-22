'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    XMarkIcon,
    ChatBubbleLeftRightIcon,
    MapPinIcon,
    StarIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    UserIcon,
    UserGroupIcon,
    GiftIcon,
    TruckIcon,
    ShieldCheckIcon,
    PhoneIcon,
    EnvelopeIcon,
    PaperAirplaneIcon,
    ArrowPathIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    HeartIcon,
    EyeIcon
} from '@heroicons/react/24/outline'
import Avatar from '@/components/ui/Avatar'

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
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
    messages: Message[]
    proposals: Proposal[]
    deliveries: Delivery[]
    isUrgent: boolean
}

interface InteractionDetailModalProps {
    interaction: Interaction | null
    isOpen: boolean
    onClose: () => void
    onInteractionUpdated: (updatedInteraction: Interaction) => void
}

export default function InteractionDetailModal({ 
    interaction, 
    isOpen, 
    onClose, 
    onInteractionUpdated 
}: InteractionDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'proposals' | 'delivery'>('overview')
    const [newMessage, setNewMessage] = useState('')
    const [newProposal, setNewProposal] = useState({
        type: 'exchange' as 'exchange' | 'purchase' | 'donation',
        description: '',
        proposedPrice: '',
        proposedProduct: ''
    })
    const [newDelivery, setNewDelivery] = useState({
        type: 'meetup' as 'meetup' | 'shipping' | 'pickup',
        location: '',
        date: '',
        time: '',
        notes: '',
        contactPhone: ''
    })
    const [showNewProposal, setShowNewProposal] = useState(false)
    const [showNewDelivery, setShowNewDelivery] = useState(false)

    if (!isOpen || !interaction) return null

    // Funciones de utilidad
    const formatPrice = (price: number, currency: string) => {
        if (price === 0) return 'Gratis'
        if (currency === 'COP') {
            return `COP$ ${price.toLocaleString('es-CO')}`
        }
        return `${currency} ${price.toLocaleString()}`
    }

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

    // Funciones de acción
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return

        // Verificar si el usuario está verificado
        const { isUserVerified } = await import('@/lib/auth')
        const isVerified = await isUserVerified()
        
        if (!isVerified) {
            // Mostrar mensaje de verificación requerida
            const result = await (window as any).Swal.fire({
                title: 'Verificación Requerida',
                text: 'Por favor, primero verifica tu cuenta para poder enviar mensajes.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ir a Verificación',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: '#6B7280'
            })
            
            if (result.isConfirmed) {
                window.location.href = '/verificacion-identidad'
            }
            return
        }

        const message: Message = {
            id: Date.now().toString(),
            text: newMessage,
            timestamp: new Date().toISOString(),
            sender: {
                id: 'current-user',
                name: 'Tú',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        }

        const updatedInteraction = {
            ...interaction,
            messages: [...interaction.messages, message]
        }

        onInteractionUpdated(updatedInteraction)
        setNewMessage('')
    }

    const handleCancelInteraction = () => {
        if (confirm('¿Estás seguro de que quieres cancelar esta interacción?')) {
            const updatedInteraction = {
                ...interaction,
                status: 'cancelled' as const,
                updatedAt: new Date().toISOString()
            }

            onInteractionUpdated(updatedInteraction)
        }
    }

    const handleAcceptProposal = (proposalId: string) => {
        const updatedProposals = interaction.proposals.map(proposal =>
            proposal.id === proposalId
                ? { ...proposal, status: 'accepted' as const }
                : proposal
        )

        const updatedInteraction = {
            ...interaction,
            proposals: updatedProposals,
            status: 'in_progress' as const,
            updatedAt: new Date().toISOString()
        }

        onInteractionUpdated(updatedInteraction)
    }

    const handleRejectProposal = (proposalId: string) => {
        const updatedProposals = interaction.proposals.map(proposal =>
            proposal.id === proposalId
                ? { ...proposal, status: 'rejected' as const }
                : proposal
        )

        const updatedInteraction = {
            ...interaction,
            proposals: updatedProposals,
            updatedAt: new Date().toISOString()
        }

        onInteractionUpdated(updatedInteraction)
    }

    const handleSubmitProposal = (e: React.FormEvent) => {
        e.preventDefault()

        const proposal: Proposal = {
            id: Date.now().toString(),
            type: newProposal.type,
            status: 'pending',
            description: newProposal.description,
            proposedPrice: newProposal.proposedPrice ? parseFloat(newProposal.proposedPrice) : undefined,
            proposedProduct: newProposal.proposedProduct || undefined,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
        }

        const updatedInteraction = {
            ...interaction,
            proposals: [...interaction.proposals, proposal],
            updatedAt: new Date().toISOString()
        }

        onInteractionUpdated(updatedInteraction)
        setShowNewProposal(false)
        setNewProposal({
            type: 'exchange',
            description: '',
            proposedPrice: '',
            proposedProduct: ''
        })
    }

    const handleSubmitDelivery = (e: React.FormEvent) => {
        e.preventDefault()

        const delivery: Delivery = {
            id: Date.now().toString(),
            type: newDelivery.type,
            status: 'pending',
            location: newDelivery.location,
            date: newDelivery.date,
            time: newDelivery.time,
            notes: newDelivery.notes,
            contactPhone: newDelivery.contactPhone || undefined
        }

        const updatedInteraction = {
            ...interaction,
            deliveries: [...interaction.deliveries, delivery],
            updatedAt: new Date().toISOString()
        }

        onInteractionUpdated(updatedInteraction)
        setShowNewDelivery(false)
        setNewDelivery({
            type: 'meetup',
            location: '',
            date: '',
            time: '',
            notes: '',
            contactPhone: ''
        })
    }

    const handleConfirmDelivery = (deliveryId: string) => {
        const updatedDeliveries = interaction.deliveries.map(delivery =>
            delivery.id === deliveryId
                ? { ...delivery, status: 'confirmed' as const }
                : delivery
        )

        const updatedInteraction = {
            ...interaction,
            deliveries: updatedDeliveries,
            updatedAt: new Date().toISOString()
        }

        onInteractionUpdated(updatedInteraction)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(interaction.type)}`}>
                            {getTypeIcon(interaction.type)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{interaction.title}</h2>
                            <div className="flex items-center space-x-2 mt-1">
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
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Navegación de pestañas */}
                <div className="border-b border-gray-200 px-6">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', name: 'Resumen', icon: EyeIcon },
                            { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon },
                            { id: 'proposals', name: 'Propuestas', icon: HandThumbUpIcon },
                            { id: 'delivery', name: 'Entrega', icon: TruckIcon }
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
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
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Pestaña Resumen */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Información del producto */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Producto</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-start space-x-4">
                                            <img
                                                src={interaction.product.image}
                                                alt={interaction.product.title}
                                                className="w-24 h-24 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 mb-2">{interaction.product.title}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{interaction.product.description}</p>
                                                <div className="text-lg font-bold text-primary-600">
                                                    {formatPrice(interaction.product.price, interaction.product.currency)}
                                                </div>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <span className="text-xs text-gray-500 capitalize">{interaction.product.category}</span>
                                                    <span className="text-xs text-gray-500">•</span>
                                                    <span className="text-xs text-gray-500 capitalize">{interaction.product.condition}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Usuario */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuario</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex items-center space-x-4">
                                            <Avatar
                                                src={interaction.otherUser.avatar}
                                                alt={interaction.otherUser.name}
                                                size="xl"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 mb-1">{interaction.otherUser.name}</h4>
                                                <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                                                    <MapPinIcon className="w-4 h-4" />
                                                    <span>{interaction.otherUser.location}</span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                    <StarIcon className="w-4 h-4 text-yellow-400" />
                                                    <span>{interaction.otherUser.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {interaction.otherUser.phone && (
                                            <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{interaction.otherUser.phone}</span>
                                            </div>
                                        )}
                                        {interaction.otherUser.email && (
                                            <div className="flex items-center space-x-2 mt-2">
                                                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">{interaction.otherUser.email}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Información de la interacción */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Interacción</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Estado:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interaction.status)}`}>
                                                {getStatusLabel(interaction.status)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Creada:</span>
                                            <span className="text-gray-900">{new Date(interaction.createdAt).toLocaleDateString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Actualizada:</span>
                                            <span className="text-gray-900">{new Date(interaction.updatedAt).toLocaleDateString('es-CO')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Mensajes:</span>
                                            <span className="text-gray-900">{interaction.messages.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Propuestas:</span>
                                            <span className="text-gray-900">{interaction.proposals.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Entregas:</span>
                                            <span className="text-gray-900">{interaction.deliveries.length}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones rápidas */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => setActiveTab('chat')}
                                            className="w-full bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                                        >
                                            <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                                            Ir al Chat
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('proposals')}
                                            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                                        >
                                            <HandThumbUpIcon className="w-5 h-5 mr-2" />
                                            Ver Propuestas
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('delivery')}
                                            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                                        >
                                            <TruckIcon className="w-5 h-5 mr-2" />
                                            Coordinar Entrega
                                        </button>
                                        {interaction.status !== 'cancelled' && (
                                            <button
                                                onClick={handleCancelInteraction}
                                                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                                            >
                                                <XCircleIcon className="w-5 h-5 mr-2" />
                                                Cancelar Interacción
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pestaña Chat */}
                    {activeTab === 'chat' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Chat de la Interacción</h3>
                                <div className="text-sm text-gray-500">
                                    {interaction.messages.length} mensajes
                                </div>
                            </div>

                            {/* Mensajes */}
                            <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto space-y-4">
                                {interaction.messages.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No hay mensajes aún. ¡Inicia la conversación!</p>
                                    </div>
                                ) : (
                                    interaction.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender.id === 'current-user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                    message.sender.id === 'current-user'
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-white text-gray-900 border border-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <Avatar
                                                        src={message.sender.avatar}
                                                        alt={message.sender.name}
                                                        size="xs"
                                                    />
                                                    <span className="text-sm font-medium">{message.sender.name}</span>
                                                </div>
                                                <p className="text-sm">{message.text}</p>
                                                <div className="text-xs opacity-75 mt-1">
                                                    {new Date(message.timestamp).toLocaleTimeString('es-CO', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input de mensaje */}
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 input-field"
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pestaña Propuestas */}
                    {activeTab === 'proposals' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Propuestas</h3>
                                <button
                                    onClick={() => setShowNewProposal(true)}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                >
                                    <HandThumbUpIcon className="w-5 h-5 mr-2" />
                                    Nueva Propuesta
                                </button>
                            </div>

                            {/* Lista de propuestas */}
                            <div className="space-y-4">
                                {interaction.proposals.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <HandThumbUpIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No hay propuestas aún.</p>
                                    </div>
                                ) : (
                                    interaction.proposals.map((proposal) => (
                                        <div
                                            key={proposal.id}
                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(proposal.type)}`}>
                                                        {getTypeLabel(proposal.type)}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                        proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        proposal.status === 'counter' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {proposal.status === 'accepted' ? 'Aceptada' :
                                                         proposal.status === 'rejected' ? 'Rechazada' :
                                                         proposal.status === 'counter' ? 'Contrapropuesta' :
                                                         'Pendiente'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(proposal.createdAt).toLocaleDateString('es-CO')}
                                                </span>
                                            </div>

                                            <p className="text-gray-700 mb-3">{proposal.description}</p>

                                            {(proposal.proposedPrice || proposal.proposedProduct) && (
                                                <div className="bg-white rounded-lg p-3 mb-3">
                                                    {proposal.proposedPrice && (
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-sm text-gray-600">Precio propuesto:</span>
                                                            <span className="font-medium text-primary-600">
                                                                {formatPrice(proposal.proposedPrice, interaction.product.currency)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {proposal.proposedProduct && (
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-gray-600">Producto propuesto:</span>
                                                            <span className="font-medium text-gray-900">{proposal.proposedProduct}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {proposal.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleAcceptProposal(proposal.id)}
                                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectProposal(proposal.id)}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                                                    >
                                                        <XCircleIcon className="w-4 h-4 mr-2" />
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}

                                            {proposal.status === 'rejected' && (
                                                <div className="text-sm text-gray-500">
                                                    Esta propuesta fue rechazada. Puedes hacer una nueva propuesta.
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Modal de nueva propuesta */}
                            {showNewProposal && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4"
                                    onClick={() => setShowNewProposal(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Propuesta</h3>
                                        <form onSubmit={handleSubmitProposal} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Propuesta
                                                </label>
                                                <select
                                                    value={newProposal.type}
                                                    onChange={(e) => setNewProposal(prev => ({ ...prev, type: e.target.value as any }))}
                                                    className="input-field w-full"
                                                >
                                                    <option value="exchange">Intercambio</option>
                                                    <option value="purchase">Compra</option>
                                                    <option value="donation">Donación</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Descripción
                                                </label>
                                                <textarea
                                                    value={newProposal.description}
                                                    onChange={(e) => setNewProposal(prev => ({ ...prev, description: e.target.value }))}
                                                    className="input-field w-full resize-none"
                                                    rows={3}
                                                    placeholder="Describe tu propuesta..."
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Precio Propuesto (opcional)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={newProposal.proposedPrice}
                                                    onChange={(e) => setNewProposal(prev => ({ ...prev, proposedPrice: e.target.value }))}
                                                    className="input-field w-full"
                                                    placeholder="0"
                                                    min="0"
                                                    step="1000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Producto Propuesto (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newProposal.proposedProduct}
                                                    onChange={(e) => setNewProposal(prev => ({ ...prev, proposedProduct: e.target.value }))}
                                                    className="input-field w-full"
                                                    placeholder="Nombre del producto"
                                                />
                                            </div>

                                            <div className="flex space-x-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewProposal(false)}
                                                    className="btn-secondary flex-1"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-primary flex-1"
                                                >
                                                    Enviar Propuesta
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Pestaña Entrega */}
                    {activeTab === 'delivery' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Coordinación de Entrega</h3>
                                <button
                                    onClick={() => setShowNewDelivery(true)}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                                >
                                    <TruckIcon className="w-5 h-5 mr-2" />
                                    Coordinar Entrega
                                </button>
                            </div>

                            {/* Lista de entregas */}
                            <div className="space-y-4">
                                {interaction.deliveries.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <TruckIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No hay entregas coordinadas aún.</p>
                                    </div>
                                ) : (
                                    interaction.deliveries.map((delivery) => (
                                        <div
                                            key={delivery.id}
                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        delivery.type === 'meetup' ? 'bg-blue-100 text-blue-800' :
                                                        delivery.type === 'shipping' ? 'bg-green-100 text-green-800' :
                                                        'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {delivery.type === 'meetup' ? '📍 Encuentro' :
                                                         delivery.type === 'shipping' ? '🚚 Envío' :
                                                         '📦 Recogida'}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        delivery.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                        delivery.status === 'completed' ? 'bg-green-600 text-white' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {delivery.status === 'confirmed' ? 'Confirmada' :
                                                         delivery.status === 'in_progress' ? 'En Progreso' :
                                                         delivery.status === 'completed' ? 'Completada' :
                                                         'Pendiente'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">Ubicación:</span>
                                                    <p className="text-gray-900">{delivery.location}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700">Fecha:</span>
                                                    <p className="text-gray-900">{delivery.date} - {delivery.time}</p>
                                                </div>
                                            </div>

                                            {delivery.notes && (
                                                <div className="mb-3">
                                                    <span className="text-sm font-medium text-gray-700">Notas:</span>
                                                    <p className="text-gray-900">{delivery.notes}</p>
                                                </div>
                                            )}

                                            {delivery.contactPhone && (
                                                <div className="mb-3">
                                                    <span className="text-sm font-medium text-gray-700">Teléfono de contacto:</span>
                                                    <p className="text-gray-900">{delivery.contactPhone}</p>
                                                </div>
                                            )}

                                            {delivery.status === 'pending' && (
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleConfirmDelivery(delivery.id)}
                                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                        Confirmar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Modal de nueva entrega */}
                            {showNewDelivery && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4"
                                    onClick={() => setShowNewDelivery(false)}
                                >
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Coordinación de Entrega</h3>
                                        <form onSubmit={handleSubmitDelivery} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tipo de Entrega
                                                </label>
                                                <select
                                                    value={newDelivery.type}
                                                    onChange={(e) => setNewDelivery(prev => ({ ...prev, type: e.target.value as any }))}
                                                    className="input-field w-full"
                                                >
                                                    <option value="meetup">Encuentro en persona</option>
                                                    <option value="shipping">Envío por correo</option>
                                                    <option value="pickup">Recogida en domicilio</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ubicación
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newDelivery.location}
                                                    onChange={(e) => setNewDelivery(prev => ({ ...prev, location: e.target.value }))}
                                                    className="input-field w-full"
                                                    placeholder="Dirección o lugar de encuentro"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Fecha
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={newDelivery.date}
                                                        onChange={(e) => setNewDelivery(prev => ({ ...prev, date: e.target.value }))}
                                                        className="input-field w-full"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Hora
                                                    </label>
                                                    <input
                                                        type="time"
                                                        value={newDelivery.time}
                                                        onChange={(e) => setNewDelivery(prev => ({ ...prev, time: e.target.value }))}
                                                        className="input-field w-full"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Notas Adicionales
                                                </label>
                                                <textarea
                                                    value={newDelivery.notes}
                                                    onChange={(e) => setNewDelivery(prev => ({ ...prev, notes: e.target.value }))}
                                                    className="input-field w-full resize-none"
                                                    rows={3}
                                                    placeholder="Instrucciones especiales, puntos de referencia..."
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Teléfono de Contacto (opcional)
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={newDelivery.contactPhone}
                                                    onChange={(e) => setNewDelivery(prev => ({ ...prev, contactPhone: e.target.value }))}
                                                    className="input-field w-full"
                                                    placeholder="+57 300 123 4567"
                                                />
                                            </div>

                                            <div className="flex space-x-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewDelivery(false)}
                                                    className="btn-secondary flex-1"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-primary flex-1"
                                                >
                                                    Coordinar Entrega
                                                </button>
                                            </div>
                                        </form>
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
