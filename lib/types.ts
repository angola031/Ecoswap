// Re-exportar todos los tipos de la base de datos
export * from './types/database'

// Tipos específicos para la aplicación
export interface User {
  id: string
  name: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  location?: string
  isVerified: boolean
  isAdmin: boolean
  ecoPoints: number
  totalExchanges: number
  averageRating: number
  roles: string[]
  adminSince?: string
}

export interface Product {
  id: string
  title: string
  description: string
  price?: number
  negotiablePrice: boolean
  condition: 'usado' | 'para_repuestos'
  transactionType: 'intercambio' | 'venta' | 'donacion'
  category: string
  location: string
  images: string[]
  mainImage: string
  status: 'activo' | 'pausado' | 'intercambiado' | 'eliminado'
  views: number
  saves: number
  publishedAt: string
  updatedAt: string
  validated: boolean
  validationStatus: 'pending' | 'approved' | 'rejected'
  tags: string[]
  specifications: Record<string, string>
  exchangeConditions?: string
  lookingForExchange?: string
  user: User
}

export interface Exchange {
  id: string
  offeredProduct: Product
  requestedProduct?: Product
  proposer: User
  receiver: User
  message?: string
  additionalAmount: number
  additionalConditions?: string
  status: 'pendiente' | 'aceptado' | 'rechazado' | 'completado' | 'cancelado'
  proposedAt: string
  respondedAt?: string
  completedAt?: string
  rejectionReason?: string
  meetingPlace?: string
  meetingDate?: string
  meetingNotes?: string
  ratings: Rating[]
}

export interface Rating {
  id: string
  exchangeId: string
  raterId: string
  ratedId: string
  score: number
  comment?: string
  highlightedAspects?: string
  wouldRecommend?: boolean
  ratedAt: string
  isPublic: boolean
}

export interface Chat {
  id: string
  exchange: Exchange
  messages: Message[]
  createdAt: string
  lastMessage?: string
  lastMessageTime?: string
  isActive: boolean
  unreadCount: number
}

export interface Message {
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

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  additionalData?: any
  isRead: boolean
  createdAt: string
  readAt?: string
  isPush: boolean
  isEmail: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  isActive: boolean
}

export interface Location {
  id: string
  userId: string
  country: string
  department: string
  city: string
  neighborhood?: string
  latitude?: number
  longitude?: number
  isPrimary: boolean
  createdAt: string
}

export interface Favorite {
  id: string
  userId: string
  productId: string
  addedAt: string
  privateNotes?: string
}

export interface Report {
  id: string
  reporterId: string
  reportedUserId?: string
  productId?: string
  exchangeId?: string
  type: 'producto_spam' | 'usuario_sospechoso' | 'intercambio_fraudulento' | 'contenido_inapropiado'
  description: string
  status: 'pendiente' | 'en_revision' | 'resuelto' | 'desestimado'
  reportedAt: string
  resolvedAt?: string
  adminNotes?: string
  resolvedByAdminId?: string
  relatedTicketId?: string
}

export interface SupportTicket {
  id: string
  userId: string
  assignedAdminId?: string
  subject: string
  category: 'problema_tecnico' | 'reporte_usuario' | 'problema_intercambio' | 'verificacion_cuenta' | 'devolucion' | 'sugerencia' | 'otro'
  priority: 'baja' | 'media' | 'alta' | 'critica'
  status: 'abierto' | 'en_progreso' | 'esperando_usuario' | 'resuelto' | 'cerrado'
  description: string
  solution?: string
  relatedProductId?: string
  relatedExchangeId?: string
  createdAt: string
  assignedAt?: string
  firstResponseAt?: string
  resolvedAt?: string
  closedAt?: string
  resolutionTimeHours?: number
  userSatisfaction?: number
  tags?: any
  attachments?: any
}

export interface UserValidation {
  id: string
  userId: string
  validatingAdminId?: string
  validationType: 'identidad' | 'telefono' | 'direccion' | 'documento' | 'referencias'
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'expirada'
  attachedDocuments?: any
  adminNotes?: string
  rejectionReason?: string
  requestedAt: string
  reviewedAt?: string
  approvedAt?: string
  expiresAt?: string
}

export interface Badge {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  criteria?: string
  isActive: boolean
}

export interface UserBadge {
  userId: string
  badgeId: string
  earnedAt: string
  achievementDescription?: string
}

export interface UserRole {
  userId: string
  roleId: string
  assignedBy?: string
  assignedAt: string
  isActive: boolean
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions?: any
  isActive: boolean
  createdAt: string
}

export interface Tag {
  id: string
  name: string
}

export interface ProductTag {
  productId: string
  tagId: string
}

export interface ProductSpecification {
  id: string
  productId: string
  key: string
  value: string
}

export interface PriceHistory {
  id: string
  productId: string
  previousPrice?: number
  newPrice?: number
  changedAt: string
  changeReason?: string
}

export interface ProductStats {
  productId: string
  date: string
  dailyViews: number
  dailyContacts: number
  dailySaves: number
  dailyProposals: number
}

export interface ProductView {
  id: string
  userId: string
  productId: string
  viewedAt: string
}

export interface UserFollow {
  followerId: string
  followedId: string
  startedAt: string
  notificationsActive: boolean
}

export interface AdminActivity {
  id: string
  adminId?: string
  action: string
  module: string
  details?: any
  ipAddress?: string
  userAgent?: string
  actionDate: string
}

export interface AdminConfig {
  id: string
  key: string
  value: any
  description?: string
  module?: string
  modifiedBy?: string
  modifiedAt: string
}

export interface SupportCategory {
  id: string
  name: string
  description?: string
  targetResponseTimeHours: number
  isActive: boolean
  displayOrder: number
}

export interface SupportMessage {
  id: string
  ticketId: string
  senderId: string
  senderType: 'usuario' | 'admin' | 'sistema'
  content: string
  isInternal: boolean
  attachments?: any
  sentAt: string
  isRead: boolean
  readAt?: string
}

export interface UserConfig {
  userId: string
  notifyNewProposals: boolean
  notifyMessages: boolean
  notifyUpdates: boolean
  notifyNewsletter: boolean
  publicProfile: boolean
  showExactLocation: boolean
  showPhone: boolean
  receiveUnknownMessages: boolean
  maxDistanceKm: number
  interestCategories?: any
  updatedAt: string
}

// Tipos para componentes de UI
export interface ChatConversation {
  id: string
  user: User
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: Message[]
}

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
    estado?: string
    estado_publicacion?: string
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
    estado?: string
    estado_publicacion?: string
  }
  exchangeInfo?: {
    usuarioProponeId: number
    usuarioRecibeId: number
    status?: string | null
    acceptedAt?: string | null
    completedAt?: string | null
  }
  createdAt: string
}

// Tipos para formularios
export interface ProductFormData {
  title: string
  description: string
  price?: number
  negotiablePrice: boolean
  condition: 'usado' | 'para_repuestos'
  transactionType: 'intercambio' | 'venta' | 'donacion'
  categoryId: string
  locationId: string
  exchangeConditions?: string
  lookingForExchange?: string
  tags: string[]
  specifications: Record<string, string>
  images: File[]
}

export interface UserProfileFormData {
  name: string
  lastName: string
  phone?: string
  bio?: string
  avatar?: File
  location: {
    country: string
    department: string
    city: string
    neighborhood?: string
  }
}

export interface ExchangeFormData {
  offeredProductId: string
  requestedProductId?: string
  message?: string
  additionalAmount?: number
  additionalConditions?: string
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Tipos para filtros
export interface ProductFilters {
  categoryId?: string
  transactionType?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  location?: string
  search?: string
  userId?: string
}

export interface UserFilters {
  verified?: boolean
  active?: boolean
  isAdmin?: boolean
  location?: string
  search?: string
}

export interface ExchangeFilters {
  status?: string
  proposerId?: string
  receiverId?: string
  fromDate?: string
  toDate?: string
}

// Tipos para estadísticas
export interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalExchanges: number
  totalRevenue: number
  newUsersThisMonth: number
  newProductsThisMonth: number
  completedExchangesThisMonth: number
  averageRating: number
}

export interface UserStats {
  totalProducts: number
  activeProducts: number
  totalExchanges: number
  completedExchanges: number
  averageRating: number
  ecoPoints: number
  totalFavorites: number
  totalViews: number
}

// Tipos para autenticación
export interface AuthUser {
  id: string
  email: string
  name?: string
  avatar?: string
  phone?: string
  verified?: boolean
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterFormData {
  name: string
  lastName: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

// Tipos para notificaciones
export interface NotificationToast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Tipos para configuración
export interface AppConfig {
  supabase: {
    url: string
    anonKey: string
  }
  app: {
    name: string
    version: string
    environment: 'development' | 'production' | 'staging'
  }
  features: {
    chat: boolean
    notifications: boolean
    realtime: boolean
    analytics: boolean
  }
}

// Tipos para errores
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Tipos para estados de carga
export interface LoadingState {
  isLoading: boolean
  error?: string
  data?: any
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  hasMore: boolean
  isLoading: boolean
}
