// Tipos específicos para la página de interacciones
import { 
    Usuario, 
    Intercambio, 
    Producto, 
    Chat,
    Mensaje,
    Calificacion
} from './database'

// Interacción simplificada para la lista principal
export interface InteractionSummary {
    id: string
    type: 'intercambio' | 'venta' | 'donacion'
    status: 'pendiente' | 'aceptado' | 'rechazado' | 'completado' | 'cancelado'
    title: string
    description: string
    offeredProduct: {
        id: string
        title: string
        image: string
        price?: number
        condition: string
        category: string
    }
    requestedProduct?: {
        id: string
        title: string
        image: string
        price?: number
        condition: string
        category: string
    }
    otherUser: {
        id: string
        name: string
        lastName: string
        avatar?: string
        location: string
        rating: number
        phone?: string
    }
    createdAt: string
    updatedAt: string
    messagesCount: number
    chatId?: string
    additionalAmount?: number
    meetingPlace?: string
    meetingDate?: string
    rejectionReason?: string
}

// Interacción completa para la página de detalle
export interface InteractionDetail extends InteractionSummary {
    proposer: Usuario
    receiver: Usuario
    messages: Mensaje[]
    proposals: Proposal[]
    deliveries: Delivery[]
    ratings: Calificacion[]
    userValidations?: {
        usuario_id: number
        es_exitoso: boolean
        fecha_validacion: string
    }[]
    chat: Chat
    isUrgent: boolean
    notes?: string
    attachments?: string[]
}

// Propuesta dentro de una interacción
export interface Proposal {
    id: string
    type: 'intercambio' | 'venta' | 'donacion'
    status: 'pendiente' | 'aceptada' | 'rechazada' | 'contrapropuesta'
    description: string
    proposedPrice?: number
    proposedProduct?: Producto
    additionalConditions?: string
    proposedBy: Usuario
    proposedAt: string
    respondedAt?: string
    response?: string
    expiresAt?: string
}

// Entrega/encuentro programado
export interface Delivery {
    id: string
    type: 'meetup' | 'shipping' | 'pickup'
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    location: string
    date?: string
    time?: string
    notes?: string
    contactPhone?: string
    trackingNumber?: string
    completedAt?: string
}

// Actividad del usuario
export interface UserActivity {
    id: string
    type: 'view' | 'save' | 'message' | 'exchange' | 'rating'
    description: string
    product?: Producto
    user?: Usuario
    interaction?: InteractionSummary
    timestamp: string
    metadata?: any
}

// Evento del sistema
export interface SystemEvent {
    id: string
    type: 'notification' | 'reminder' | 'deadline' | 'achievement'
    title: string
    description: string
    date: string
    isRead: boolean
    priority: 'low' | 'medium' | 'high' | 'urgent'
    actionUrl?: string
    metadata?: any
}

// Filtros para interacciones
export interface InteractionFilters {
    type?: 'intercambio' | 'venta' | 'donacion'
    status?: 'pendiente' | 'aceptado' | 'rechazado' | 'completado' | 'cancelado'
    dateFrom?: string
    dateTo?: string
    userId?: string
    productId?: string
    search?: string
}

// Estadísticas de interacciones
export interface InteractionStats {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
    totalValue: number
    averageRating: number
    successRate: number
}

// Respuesta de API para interacciones
export interface InteractionsResponse {
    interactions: InteractionSummary[]
    total: number
    page: number
    limit: number
    hasMore: boolean
    stats: InteractionStats
}

// Estado del componente de interacciones
export interface InteractionsState {
    interactions: InteractionSummary[]
    activities: UserActivity[]
    events: SystemEvent[]
    isLoading: boolean
    error?: string
    activeTab: 'interactions' | 'activities' | 'events'
    filterStatus: string
    stats: InteractionStats
}

// Acciones disponibles en una interacción
export interface InteractionActions {
    canAccept: boolean
    canReject: boolean
    canCancel: boolean
    canComplete: boolean
    canRate: boolean
    canMessage: boolean
    canViewDetails: boolean
    canEdit: boolean
    canDelete: boolean
}

// Formulario para crear nueva propuesta
export interface NewProposalForm {
    type: 'intercambio' | 'venta' | 'donacion'
    description: string
    proposedPrice?: number
    proposedProductId?: string
    additionalConditions?: string
    expiresAt?: string
}

// Formulario para programar entrega
export interface DeliveryForm {
    type: 'meetup' | 'shipping' | 'pickup'
    location: string
    date?: string
    time?: string
    notes?: string
    contactPhone?: string
}

// Formulario para calificar
export interface RatingForm {
    score: number
    comment?: string
    highlightedAspects?: string
    wouldRecommend?: boolean
    isPublic: boolean
}

// Notificaciones relacionadas con interacciones
export interface InteractionNotification {
    id: string
    type: 'new_proposal' | 'proposal_accepted' | 'proposal_rejected' | 'exchange_completed' | 'rating_received' | 'delivery_scheduled'
    title: string
    message: string
    interactionId: string
    userId: string
    isRead: boolean
    createdAt: string
    actionUrl?: string
}
