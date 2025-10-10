// Tipos específicos para el chat
import { Usuario, Producto, Categoria, ImagenProducto, Ubicacion, Intercambio } from './database'

// Información del chat
export interface ChatInfo {
  chatId: number
  seller: {
    id: number
    name: string
    lastName: string
    avatar?: string
    location?: string
    rating: number
    totalExchanges: number
    memberSince: string
  }
  offeredProduct: {
    id: number
    title: string
    price?: number
    type: string
    category?: string
    mainImage?: string
    imageUrl?: string
    condiciones_intercambio?: string
    que_busco_cambio?: string
    precio_negociable?: boolean
  }
  requestedProduct?: {
    id: number
    title: string
    price?: number
    type: string
    category?: string
    mainImage?: string
    imageUrl?: string
    condiciones_intercambio?: string
    que_busco_cambio?: string
    precio_negociable?: boolean
  }
  createdAt: string
}

// Mensaje del chat
export interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'texto' | 'imagen' | 'ubicacion' | 'propuesta' | 'respuesta_propuesta'
  imageUrl?: string
  metadata?: any
  sender: {
    id: string
    name: string
    lastName: string
    avatar?: string
  }
}

// Propuesta de intercambio
export interface ChatProposal {
  id: number
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  meetingDate?: string
  meetingPlace?: string
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'contrapropuesta' | 'cancelada'
  createdAt: string
  respondedAt?: string
  response?: string
  proposer: {
    id: number
    name: string
    lastName: string
    avatar?: string
  }
  receiver: {
    id: number
    name: string
    lastName: string
    avatar?: string
  }
}

// Estado del chat
export interface ChatState {
  messages: ChatMessage[]
  chatInfo?: ChatInfo
  proposals: ChatProposal[]
  isLoading: boolean
  error?: string
  isConnected: boolean
  showSidebar: boolean
  showProposalModal: boolean
}

// Parámetros para crear una propuesta
export interface CreateProposalParams {
  chatId: number
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  meetingDate?: string
  meetingPlace?: string
}

// Parámetros para responder a una propuesta
export interface RespondToProposalParams {
  proposalId: number
  response: 'aceptar' | 'rechazar' | 'contrapropuesta'
  reason?: string
  counterProposal?: CreateProposalParams
}

// Eventos en tiempo real
export interface ChatEvent {
  type: 'new_message' | 'message_read' | 'new_proposal' | 'proposal_response' | 'user_online' | 'user_offline'
  data: any
  timestamp: string
}

// Configuración del chat
export interface ChatConfig {
  autoScroll: boolean
  showTimestamps: boolean
  showReadReceipts: boolean
  notifications: boolean
}
