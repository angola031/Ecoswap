// Tipos compartidos para el sistema de chat

export interface ChatUser {
  id: string
  name: string
  avatar: string
  location: string
  isOnline: boolean
  lastSeen: string
}

export interface ChatConversation {
  id: string
  user: ChatUser
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
  product?: {
    id: string
    title: string
    price?: string
    category?: string
    description?: string
    mainImage?: string
    exchangeConditions?: string
  } | null
}

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'text' | 'image' | 'location' | 'file'
  metadata?: {
    imageUrl?: string
    fileName?: string
    fileSize?: string
    coordinates?: { lat: number; lng: number }
  }
  reactions?: Record<string, number>
  myReaction?: string
  replyToId?: string
  sender?: {
    id: string
    name: string
    lastName: string
    avatar?: string
  }
}

export interface Proposal {
  id: number
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'contrapropuesta' | 'cancelada' | 'pendiente_validacion'
  createdAt: string
  respondedAt?: string
  response?: string
  meetingDate?: string
  meetingPlace?: string
  nota_intercambio?: string
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
  product?: {
    id: number
    title: string
    price?: number
    type?: string
    negotiable?: boolean
    exchangeConditions?: string
    exchangeSeeking?: string
    owner: {
      id: number
      name: string
      lastName: string
      avatar?: string
    }
  } | null
  chatId: number
}

export interface ValidationData {
  usuario_id: number
  es_exitoso: boolean
  fecha_validacion: string
}

export interface ValidationFormData {
  rating?: number
  comment?: string
  aspects?: string
  meetingPlace?: string
  meetingDate?: string
  meetingNotes?: string
  rejectionReason?: string
}

export interface ProposalFormData {
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  meetingDate?: string
  meetingPlace?: string
  meetingNotes?: string
}
