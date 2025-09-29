'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { 
  Message, 
  User, 
  Product, 
  ChatInfo 
} from '@/lib/types'
import { useUserStatus } from '@/hooks/useUserStatus'


interface ChatModuleProps {
  currentUser: User | null
}

interface ChatUser {
  id: string
  name: string
  avatar: string
  location: string
  isOnline: boolean
  lastSeen: string
}

interface ChatConversation {
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

interface ChatMessage {
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

interface Proposal {
  id: number
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'contrapropuesta' | 'cancelada'
  createdAt: string
  respondedAt?: string
  response?: string
  meetingDate?: string
  meetingPlace?: string
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


// Función para formatear precio
const formatPrice = (precio: number | null, tipoTransaccion: string | null, condicionesIntercambio: string | null, queBuscoCambio: string | null, precioNegociable: boolean | null) => {
  if (tipoTransaccion === 'cambio') {
    return condicionesIntercambio || queBuscoCambio || 'Intercambio'
  } else if (precio) {
    const formattedPrice = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio)
    return precioNegociable ? `${formattedPrice} (Negociable)` : formattedPrice
  }
  return 'Precio no especificado'
}

// Función para renderizar información de producto compacta
const renderProductInfoCompact = (product: any, label: string) => {
  if (!product) return null
  
  return (
    <div className="p-2 bg-white rounded border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-10 h-10 rounded object-cover border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-10 h-10 bg-gray-100 rounded flex items-center justify-center border border-gray-200 ${product.imageUrl ? 'hidden' : ''}`}>
            <span className="text-gray-600 text-sm">📦</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
              {label}
            </span>
            {product.estado && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                product.estado === 'activo' ? 'bg-green-100 text-green-700' :
                product.estado === 'pausado' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {product.estado}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {product.title}
          </h4>
          <p className="text-xs text-green-600 font-medium">
            {formatPrice(
              product.precio,
              product.tipo_transaccion,
              product.condiciones_intercambio,
              product.que_busco_cambio,
              product.precio_negociable
            )}
          </p>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => window.open(`/producto/${product.producto_id || product.id}`, '_blank')}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
            title="Ver producto"
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  )
}

// Función para renderizar información de producto completa (mantener para otros usos)
const renderProductInfo = (product: any, label: string) => {
  if (!product) return null
  
  return (
    <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-16 h-16 rounded-lg object-cover border border-blue-200"
              onError={(e) => {
                // Si falla la imagen, mostrar icono por defecto
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200 ${product.imageUrl ? 'hidden' : ''}`}>
            <span className="text-blue-600 text-2xl">📦</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-medium text-blue-800 bg-blue-200 px-3 py-1 rounded-full">
              {label}
            </span>
            {product.estado && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                product.estado === 'activo' ? 'bg-green-100 text-green-800' :
                product.estado === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {product.estado}
              </span>
            )}
          </div>
          <h4 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.title}
          </h4>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.descripcion}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-600">
            {formatPrice(
              product.precio,
              product.tipo_transaccion,
              product.condiciones_intercambio,
              product.que_busco_cambio,
              product.precio_negociable
            )}
          </p>
            {product.visualizaciones && (
              <p className="text-xs text-gray-500">
                👁️ {product.visualizaciones} vistas
              </p>
            )}
          </div>
          {product.ciudad_snapshot && (
            <p className="text-xs text-gray-500 mt-1">
              📍 {product.ciudad_snapshot}, {product.departamento_snapshot}
            </p>
          )}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => window.open(`/producto/${product.producto_id || product.id}`, '_blank')}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
            >
              Ver Producto
            </button>
            <button
              onClick={() => {
                // Copiar enlace del producto al portapapeles
                const productUrl = `${window.location.origin}/producto/${product.producto_id || product.id}`
                navigator.clipboard.writeText(productUrl).then(() => {
                  if ((window as any).Swal) {
                    (window as any).Swal.fire({
                      title: 'Enlace copiado',
                      text: 'El enlace del producto se ha copiado al portapapeles',
                      icon: 'success',
                      timer: 2000,
                      showConfirmButton: false
                    })
                  }
                })
              }}
              className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              Copiar Enlace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatModule({ currentUser }: ChatModuleProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [openReactionsFor, setOpenReactionsFor] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [offeredProduct, setOfferedProduct] = useState<any>(null)
  
  // Hook para obtener estado de usuarios en línea
  const { onlineUsers, updateUserStatus } = useUserStatus()
  const [requestedProduct, setRequestedProduct] = useState<any>(null)
  
  // Función para verificar si un usuario está en línea
  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.some(user => user.id === userId && user.isOnline)
  }

  // Actualizar estado del usuario como activo cuando se monta el componente
  useEffect(() => {
    if (currentUser) {
      updateUserStatus(true)
    }
  }, [currentUser, updateUserStatus])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [showProposals, setShowProposals] = useState(false)
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)
// Estado para manejar conexión realtime
const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
// Estado para controlar scroll manual
const [isUserScrolling, setIsUserScrolling] = useState(false)

// Función auxiliar para obtener ID consistente del usuario
const getCurrentUserId = () => {
  return String(currentUser?.id || '')
}
  // Cargar conversaciones reales
  useEffect(() => {
    let isMounted = true
    
    const loadConversations = async () => {
      if (!isMounted) return
      
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 [ChatModule] Cargando conversaciones - Sesión:', session ? 'Sí' : 'No')
        console.log('🔐 [ChatModule] Usuario:', session?.user?.email)
        console.log('💬 [ChatModule] Usuario actual:', currentUser)
        console.log('💬 [ChatModule] Usuario ID:', currentUser?.id)
        
        const token = session?.access_token
        if (!token) {
          console.log('❌ [ChatModule] No hay token para cargar conversaciones')
          console.log('🔄 [ChatModule] Redirigiendo al login...')
          // Redirigir al login si no hay sesión
          router.push('/login')
          return
        }
        
        const res = await fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        console.log('📨 [ChatModule] Respuesta conversaciones:', { status: res.status, ok: res.ok, json })
        console.log('📦 [ChatModule] Productos en conversaciones:', json.items?.map((item: any) => ({ 
          id: item.id, 
          product: item.product,
          offered: item.offered,
          requested: item.requested,
          hasProduct: !!item.product
        })))
        
        if (!res.ok) throw new Error(json?.error || 'Error cargando chats')
        const list: ChatConversation[] = (json.items || []).map((c: any) => {
          console.log('🔄 [ChatModule] Mapeando conversación:', {
            id: c.id,
            product: c.product,
            offered: c.offered,
            hasProduct: !!c.product
          })
          
          return {
          id: String(c.id),
          user: c.user,
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: c.unreadCount || 0,
            messages: [],
            product: c.product || c.offered || null // Usar product o offered como fallback
          }
        })
        
        if (isMounted) {
        setConversations(list)
        console.log('✅ [ChatModule] Conversaciones establecidas:', list.map(c => ({
          id: c.id,
          hasProduct: !!c.product,
          productTitle: c.product?.title
        })))
          // Solo seleccionar el primer chat si no hay uno seleccionado
          if (list.length > 0 && !selectedConversation) {
            setSelectedConversation(list[0])
          }
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando conversaciones:', error)
        if (isMounted) {
        setConversations([])
        }
      } finally {
        if (isMounted) {
        setIsLoading(false)
      }
    }
    }
    
    loadConversations()
    
    return () => {
      isMounted = false
    }
  }, [])

  // ⚡ CARGA INSTANTÁNEA DE MENSAJES OPTIMIZADA
  useEffect(() => {
    let isMounted = true
    
    const loadMessages = async () => {
      if (!selectedConversation || !isMounted) return
      
        const chatId = Number(selectedConversation.id)
        if (!chatId) return
        
      // ⚡ Mostrar mensajes existentes inmediatamente si ya están en caché
      const cachedConversation = conversations.find(c => c.id === String(chatId))
      if (cachedConversation?.messages?.length > 0) {
        console.log('⚡ [ChatModule] Usando mensajes en caché:', cachedConversation.messages.length)
        setSelectedConversation(prev => prev ? { ...prev, messages: cachedConversation.messages } : prev)
        
        // Scroll inmediato a la parte inferior
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' })
          }
        }, 50)
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          router.push('/login')
          return
        }
        
        console.log('🔄 [ChatModule] Cargando mensajes frescos para chat:', chatId)
        
        // ⚡ Petición optimizada con timeout más corto
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout
        
        const res = await fetch(`/api/chat/${chatId}/messages?limit=50`, { 
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error cargando mensajes')
        
        // ⚡ Procesamiento optimizado de mensajes
        const messages: ChatMessage[] = (json.items || [])
          .filter((m: any) => {
            const content = m.contenido || ''
            const isProductInfo = content.includes('Producto Ofrecido') && 
                                 content.includes('$') && 
                                 content.includes('Negociable')
            return !isProductInfo && content.trim().length > 0
          })
          .map((m: any) => ({
          id: String(m.mensaje_id),
          senderId: String(m.usuario_id),
          content: m.contenido || '',
            timestamp: new Date(m.fecha_envio).toLocaleString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            }),
          isRead: m.leido,
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
            metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
            sender: {
              id: String(m.usuario?.user_id || m.usuario_id),
              name: m.usuario?.nombre || 'Usuario',
              lastName: m.usuario?.apellido || '',
              avatar: m.usuario?.foto_perfil || undefined
            }
          }))
        
        if (isMounted) {
          // ⚡ Actualización instantánea del estado
        setSelectedConversation(prev => prev ? { ...prev, messages } : prev)
        setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, messages } : c))

          // ⚡ Scroll suave a la parte inferior después de cargar
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
            }
          }, 100)

          // Marcar como leídos en background
          fetch(`/api/chat/${chatId}/read`, { 
            method: 'POST', 
            headers: { Authorization: `Bearer ${token}` } 
          }).then(readRes => {
            if (readRes.ok && isMounted) {
          setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, unreadCount: 0 } : c))
        }
          }).catch(err => console.log('⚠️ [ChatModule] Error marcando como leído:', err))
      }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('⏱️ [ChatModule] Timeout cargando mensajes')
        } else {
        console.error('❌ [ChatModule] Error cargando mensajes:', error)
        }
    }
    }
    
    loadMessages()
    
    return () => {
      isMounted = false
    }
  }, [selectedConversation?.id])

  // Cargar información del producto cuando se selecciona un chat
  useEffect(() => {
    let isMounted = true
    
    const loadProductInfo = async () => {
      if (!selectedConversation?.id || !isMounted) {
        if (isMounted) {
          setOfferedProduct(null)
          setRequestedProduct(null)
        }
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        console.log('📡 [ChatModule] Obteniendo info del chat:', selectedConversation.id)
        console.log('🔐 [ChatModule] Token para info:', token ? `${token.substring(0, 20)}...` : 'Vacío')
        
        const response = await fetch(`/api/chat/${selectedConversation.id}/info`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        console.log('📨 [ChatModule] Respuesta info:', { status: response.status, ok: response.ok })
        
        if (response.ok && isMounted) {
          const responseData = await response.json()
          console.log('📦 [ChatModule] Respuesta completa de la API:', responseData)
          
          const data = responseData.data || responseData
          setOfferedProduct(data.offeredProduct)
          setRequestedProduct(data.requestedProduct)
          console.log('📦 [ChatModule] Información de productos cargada:', {
            offered: data.offeredProduct,
            requested: data.requestedProduct
          })
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando información de productos:', error)
      }
    }

    loadProductInfo()
    
    return () => {
      isMounted = false
    }
  }, [selectedConversation?.id])

  // Cargar propuestas cuando se selecciona un chat
  useEffect(() => {
    let isMounted = true
    
    const loadProposals = async () => {
      if (!selectedConversation?.id || !isMounted) {
        if (isMounted) {
          setProposals([])
        }
        return
      }

      try {
        setIsLoadingProposals(true)
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return

        console.log('📡 [ChatModule] Cargando propuestas para chat:', selectedConversation.id)
        
        const response = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        console.log('📨 [ChatModule] Respuesta propuestas:', { status: response.status, ok: response.ok })
        
        if (response.ok && isMounted) {
          const data = await response.json()
          setProposals(data.data || [])
          console.log('💼 [ChatModule] Propuestas cargadas:', data.data?.length || 0)
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando propuestas:', error)
      } finally {
        if (isMounted) {
          setIsLoadingProposals(false)
        }
      }
    }

    loadProposals()
    
    return () => {
      isMounted = false
    }
  }, [selectedConversation?.id])

  // ✅ REALTIME MEJORADO: Suscripción más robusta
  useEffect(() => {
    // Limpiar canal anterior
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      setRealtimeChannel(null)
    }

    const chatId = Number(selectedConversation?.id)
    if (!chatId) return

    console.log('🔗 [ChatModule] Configurando realtime para chat:', chatId)

    const channel = supabase
      .channel(`chat_${chatId}`, {
        config: {
          broadcast: { self: true }, // ✅ Permitir recibir nuestros propios mensajes
          presence: { key: getCurrentUserId() }
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensaje',
        filter: `chat_id=eq.${chatId}`
      }, (payload: any) => {
        console.log('📨 [ChatModule] Nuevo mensaje realtime:', payload)
        
        const m = payload.new
        if (!m) return

        // Evitar duplicados
        const messageId = String(m.mensaje_id)
        const messageExists = selectedConversation?.messages.some(msg => msg.id === messageId)
        if (messageExists) {
          console.log('⚠️ [ChatModule] Mensaje ya existe, ignorando:', messageId)
          return
        }

        const incoming: ChatMessage = {
          id: messageId,
          senderId: String(m.usuario_id),
          content: m.contenido || '',
          timestamp: new Date(m.fecha_envio).toLocaleString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          }),
          isRead: m.leido,
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
          metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
          sender: {
            id: String(m.usuario_id),
            name: 'Usuario', // Se puede mejorar obteniendo info del usuario
            lastName: '',
            avatar: undefined
          }
        }

        console.log('✅ [ChatModule] Agregando mensaje realtime:', incoming)

        // Actualizar conversación seleccionada
        setSelectedConversation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            messages: [...prev.messages, incoming],
            lastMessage: incoming.content || incoming.type,
            lastMessageTime: incoming.timestamp
          }
        })

        // Actualizar lista de conversaciones
        setConversations(prev => prev.map(c => c.id === String(chatId) ? {
          ...c,
          lastMessage: incoming.content || incoming.type,
          lastMessageTime: incoming.timestamp,
          // Solo incrementar unread si no es nuestro mensaje
          unreadCount: incoming.senderId !== getCurrentUserId() ? (c.unreadCount || 0) + 1 : c.unreadCount
        } : c))
      })
      .subscribe((status) => {
        console.log('🔌 [ChatModule] Estado realtime:', status)
      })

    setRealtimeChannel(channel)

    return () => {
      console.log('🔌 [ChatModule] Limpiando canal realtime')
      if (channel) {
        supabase.removeChannel(channel)
      }
      setRealtimeChannel(null)
    }
  }, [selectedConversation?.id, currentUser?.id, currentUser?.id])

  // Scroll automático mejorado - solo cuando se agregan nuevos mensajes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    // Solo hacer scroll automático si hay mensajes y el usuario no está haciendo scroll manual
    if (!selectedConversation?.messages || selectedConversation.messages.length === 0 || isUserScrolling) {
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
    
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        })
      }
    }
    
    // Delay para asegurar que el DOM se haya actualizado
    timeoutId = setTimeout(scrollToBottom, 100)
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [selectedConversation?.messages?.length, isUserScrolling]) // Dependencias actualizadas

  // ⚡ ENVÍO DE MENSAJES ULTRA INSTANTÁNEO
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const currentUserId = getCurrentUserId()
    
    // ⚡ Crear mensaje optimista con timestamp instantáneo
    const now = new Date()
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      content: messageContent,
      timestamp: now.toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'text',
      sender: {
        id: currentUserId,
        name: currentUser?.name || 'Usuario',
        lastName: '',
        avatar: currentUser?.avatar || undefined
      }
    }

    // ⚡ Limpiar input INMEDIATAMENTE antes de cualquier otra operación
    setNewMessage('')
    setReplyToMessageId(null)

    // ⚡ Actualización optimista INSTANTÁNEA
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, optimisticMessage],
      lastMessage: optimisticMessage.content,
      lastMessageTime: optimisticMessage.timestamp
    }
    
    // ⚡ Actualizar estado de forma síncrona para máxima velocidad
    setSelectedConversation(updatedConversation)
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id ? updatedConversation : conv
    ))
    
    // ⚡ Scroll INSTANTÁNEO (sin animación para máxima velocidad)
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'end' 
        })
      }
    })
    
    try {
      const chatId = Number(selectedConversation.id)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      
      console.log('📤 [ChatModule] Enviando mensaje:', messageContent)
      
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          contenido: messageContent, 
          tipo: 'texto' 
        })
      })
      
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error al enviar')
      
      console.log('✅ [ChatModule] Mensaje enviado exitosamente:', json.message)
      
      // Reemplazar mensaje temporal con el real
      const realMessage: ChatMessage = {
        id: String(json.message.mensaje_id),
        senderId: String(json.message.usuario_id),
        content: json.message.contenido || '',
        timestamp: new Date(json.message.fecha_envio).toLocaleString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isRead: json.message.leido,
        type: 'text',
        sender: optimisticMessage.sender
      }
      
      // Actualizar mensaje optimista con datos reales
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId ? realMessage : msg
        ),
        lastMessage: realMessage.content,
        lastMessageTime: realMessage.timestamp
      } : prev)
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          lastMessage: realMessage.content,
          lastMessageTime: realMessage.timestamp
        } : conv
      ))
      
    } catch (error) {
      console.error('❌ [ChatModule] Error enviando mensaje:', error)
      
      // Revertir mensaje optimista en caso de error
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== tempId)
      } : prev)
      
      // Mostrar error al usuario
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar el mensaje. Verifica tu conexión e inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        })
      } else {
        alert('Error: No se pudo enviar el mensaje. Verifica tu conexión e inténtalo de nuevo.')
      }
      
      // Restaurar el mensaje en el input
      setNewMessage(messageContent)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Funciones para manejar propuestas
  const handleCreateProposal = async (proposalData: {
    type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
    description: string
    proposedPrice?: number
    conditions?: string
    meetingDate?: string
    meetingPlace?: string
  }) => {
    if (!selectedConversation) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(proposalData)
      })

      if (response.ok) {
        const data = await response.json()
        setProposals(prev => [data.data, ...prev])
        
        // Mostrar mensaje de éxito
        if ((window as any).Swal) {
          (window as any).Swal.fire({
            title: 'Propuesta enviada',
            text: 'Tu propuesta ha sido enviada exitosamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        }
      } else {
        throw new Error('Error creando propuesta')
      }
    } catch (error) {
      console.error('Error creando propuesta:', error)
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar la propuesta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  const handleRespondToProposal = async (proposalId: number, response: 'aceptar' | 'rechazar' | 'contrapropuesta', reason?: string) => {
    if (!selectedConversation) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const responseData = await fetch(`/api/chat/${selectedConversation.id}/proposals/${proposalId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response, reason })
      })

      if (responseData.ok) {
        const data = await responseData.json()
        setProposals(prev => prev.map(prop => 
          prop.id === proposalId ? { ...prop, ...data.data } : prop
        ))
        
        // Mostrar mensaje de éxito
        if ((window as any).Swal) {
          (window as any).Swal.fire({
            title: 'Respuesta enviada',
            text: `Has ${response === 'aceptar' ? 'aceptado' : response === 'rechazar' ? 'rechazado' : 'respondido a'} la propuesta`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        }
      } else {
        throw new Error('Error respondiendo a propuesta')
      }
    } catch (error) {
      console.error('Error respondiendo a propuesta:', error)
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar la respuesta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  const formatTime = (time: string) => {
    return time
  }

  const isOwnMessage = (message: ChatMessage) => {
    const currentUserId = getCurrentUserId()
    return message.senderId === currentUserId
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    if (textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.user.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      c.user.location.toLowerCase().includes(q)
    )
  })

  const findMessageById = (id?: string) => {
    if (!id || !selectedConversation) return undefined
    return selectedConversation.messages.find(m => m.id === id)
  }

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!selectedConversation) return
    const updated = {
      ...selectedConversation,
      messages: selectedConversation.messages.map(m => {
        if (m.id !== messageId) return m
        const count = (m.reactions?.[emoji] || 0) + 1
        return {
          ...m,
          reactions: { ...(m.reactions || {}), [emoji]: count },
          myReaction: emoji
        }
      })
    }
    setSelectedConversation(updated)
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
    setOpenReactionsFor(null)
  }

  const handleReply = (messageId: string) => {
    setReplyToMessageId(messageId)
  }

  const handleAttachImage = () => imageInputRef.current?.click()
  const handleAttachFile = () => fileInputRef.current?.click()

  // Funciones para manejar propuestas
  const handleSendProposal = () => {
    if (!selectedConversation) return
    
    // Abrir modal completo para crear propuesta
    if ((window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Crear Nueva Propuesta',
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de propuesta</label>
              <select id="proposal-type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="precio">💰 Propuesta de precio</option>
                <option value="intercambio">🔄 Propuesta de intercambio</option>
                <option value="encuentro">📅 Propuesta de encuentro</option>
                <option value="condiciones">📋 Propuesta de condiciones</option>
                <option value="otro">📝 Otra propuesta</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Descripción de la propuesta</label>
              <textarea id="proposal-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="4" placeholder="Describe detalladamente tu propuesta..."></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio propuesto (opcional)</label>
              <input type="number" id="proposal-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" min="0" step="1000">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Condiciones adicionales (opcional)</label>
              <textarea id="proposal-conditions" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="2" placeholder="Condiciones especiales, garantías, etc..."></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de encuentro (opcional)</label>
                <input type="date" id="proposal-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lugar de encuentro (opcional)</label>
                <input type="text" id="proposal-place" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Centro comercial, parque, etc...">
              </div>
            </div>
          </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Enviar Propuesta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        preConfirm: () => {
          const type = (document.getElementById('proposal-type') as HTMLSelectElement)?.value
          const description = (document.getElementById('proposal-description') as HTMLTextAreaElement)?.value
          const price = (document.getElementById('proposal-price') as HTMLInputElement)?.value
          const conditions = (document.getElementById('proposal-conditions') as HTMLTextAreaElement)?.value
          const meetingDate = (document.getElementById('proposal-date') as HTMLInputElement)?.value
          const meetingPlace = (document.getElementById('proposal-place') as HTMLInputElement)?.value
          
          if (!type || !description) {
            (window as any).Swal.showValidationMessage('Tipo y descripción son requeridos')
            return false
          }
          
          if (description.length < 10) {
            (window as any).Swal.showValidationMessage('La descripción debe tener al menos 10 caracteres')
            return false
          }
          
          return { 
            type, 
            description, 
            price: price ? parseFloat(price) : undefined,
            conditions: conditions || undefined,
            meetingDate: meetingDate || undefined,
            meetingPlace: meetingPlace || undefined
          }
        }
      }).then((result: any) => {
        if (result.isConfirmed) {
          // Crear la propuesta
          handleCreateProposal(result.value)
    
    // Agregar mensaje informativo al chat
    const proposalMessage = {
      id: `proposal-${Date.now()}`,
      senderId: currentUser?.id,
            content: `💰 Nueva propuesta de ${result.value.type}: ${result.value.description.substring(0, 50)}${result.value.description.length > 50 ? '...' : ''}`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'text' as const,
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Tú',
        lastName: '',
        avatar: currentUser?.avatar
      }
    }
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, proposalMessage]
    } : prev)
    
          // Mostrar la sección de propuestas
          setShowProposals(true)
        }
      })
    }
  }

  const handleNegotiate = () => {
    if (!selectedConversation) return
    
    // Abrir modal completo para crear propuesta
    if ((window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Crear Propuesta de Negociación',
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de propuesta</label>
              <select id="negotiate-type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="precio">💰 Propuesta de precio</option>
                <option value="intercambio">🔄 Propuesta de intercambio</option>
                <option value="encuentro">📅 Propuesta de encuentro</option>
                <option value="condiciones">📋 Propuesta de condiciones</option>
                <option value="otro">📝 Otra propuesta</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Descripción de la propuesta</label>
              <textarea id="negotiate-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="4" placeholder="Describe detalladamente tu propuesta..."></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio propuesto (opcional)</label>
              <input type="number" id="negotiate-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" min="0" step="1000">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Condiciones adicionales (opcional)</label>
              <textarea id="negotiate-conditions" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="2" placeholder="Condiciones especiales, garantías, etc..."></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de encuentro (opcional)</label>
                <input type="date" id="negotiate-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lugar de encuentro (opcional)</label>
                <input type="text" id="negotiate-place" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Centro comercial, parque, etc...">
              </div>
            </div>
          </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Enviar Propuesta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        preConfirm: () => {
          const type = (document.getElementById('negotiate-type') as HTMLSelectElement)?.value
          const description = (document.getElementById('negotiate-description') as HTMLTextAreaElement)?.value
          const price = (document.getElementById('negotiate-price') as HTMLInputElement)?.value
          const conditions = (document.getElementById('negotiate-conditions') as HTMLTextAreaElement)?.value
          const meetingDate = (document.getElementById('negotiate-date') as HTMLInputElement)?.value
          const meetingPlace = (document.getElementById('negotiate-place') as HTMLInputElement)?.value
          
          if (!type || !description) {
            (window as any).Swal.showValidationMessage('Tipo y descripción son requeridos')
            return false
          }
          
          if (description.length < 10) {
            (window as any).Swal.showValidationMessage('La descripción debe tener al menos 10 caracteres')
            return false
          }
          
          return { 
            type, 
            description, 
            price: price ? parseFloat(price) : undefined,
            conditions: conditions || undefined,
            meetingDate: meetingDate || undefined,
            meetingPlace: meetingPlace || undefined
          }
        }
      }).then((result: any) => {
        if (result.isConfirmed) {
          // Crear la propuesta
          handleCreateProposal(result.value)
          
          // Agregar mensaje informativo al chat
    const negotiateMessage = {
      id: `negotiate-${Date.now()}`,
      senderId: currentUser?.id,
            content: `🔄 Nueva propuesta de ${result.value.type}: ${result.value.description.substring(0, 50)}${result.value.description.length > 50 ? '...' : ''}`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'text' as const,
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Tú',
        lastName: '',
        avatar: currentUser?.avatar
      }
    }
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, negotiateMessage]
    } : prev)
    
          // Mostrar la sección de propuestas
          setShowProposals(true)
        }
      })
    }
  }

  const handleAccept = () => {
    if (!selectedConversation) return
    
    // Agregar mensaje de aceptación al chat
    const acceptMessage = {
      id: `accept-${Date.now()}`,
      senderId: currentUser?.id,
      content: '✅ Has aceptado el intercambio',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'text' as const,
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Tú',
        lastName: '',
        avatar: currentUser?.avatar
      }
    }
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, acceptMessage]
    } : prev)
    
    console.log('Intercambio aceptado por el usuario')
  }

  const onImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation) return
    const url = URL.createObjectURL(file)
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser?.id || '1',
      content: '',
      timestamp: new Date().toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'image',
      metadata: { imageUrl: url }
    }
    const updated = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: 'Imagen adjunta',
      lastMessageTime: message.timestamp
    }
    setSelectedConversation(updated)
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation) return
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser?.id || '1',
      content: '',
      timestamp: new Date().toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'file',
      metadata: { fileName: file.name, fileSize: `${Math.round(file.size / 1024)} KB` }
    }
    const updated = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: `Archivo: ${file.name}`,
      lastMessageTime: message.timestamp
    }
    setSelectedConversation(updated)
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Lista de conversaciones */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, mensaje o ubicación"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-sm text-gray-500">Cargando chats...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay conversaciones</p>
                <p className="text-xs text-gray-400">Inicia un chat desde un producto</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={conversation.user.avatar}
                    alt={conversation.user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    isUserOnline(conversation.user.id) ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.user.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {conversation.lastMessageTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MapPinIcon className="w-3 h-3" />
                    <span>{conversation.user.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="border-b border-gray-200">
              <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={selectedConversation.user.avatar}
                    alt={selectedConversation.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    isUserOnline(selectedConversation.user.id) ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">
                    {selectedConversation.user.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <MapPinIcon className="w-3 h-3" />
                    <span>{selectedConversation.user.location}</span>
                    <span>•</span>
                    <span>
                      En línea
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowProposals(!showProposals)} 
                  className={`p-2 rounded-lg transition-colors ${
                    showProposals 
                      ? 'text-primary-600 bg-primary-100' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title="Ver propuestas"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button onClick={() => setShowProfile(true)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <PhoneIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <VideoCameraIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
                </div>
              </div>
              
              {/* Información de productos - Compacta */}
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm">📦</span>
                  <h3 className="text-sm font-medium text-gray-700">Producto en Negociación</h3>
                </div>
                <div className="space-y-2">
                  {offeredProduct && renderProductInfoCompact(offeredProduct, 'Ofrecido')}
                  {requestedProduct && renderProductInfoCompact(requestedProduct, 'Solicitado')}
                  {!offeredProduct && !requestedProduct && (
                    <div className="text-center py-2 text-gray-500">
                      <div className="animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/3 mx-auto"></div>
                      </div>
                      <p className="text-xs mt-1">Cargando producto...</p>
                    </div>
                  )}
              </div>
            </div>

              {/* Sección de propuestas */}
              {showProposals && (
                <div className="px-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center justify-between py-2">
                    <h4 className="font-medium text-gray-900">Propuestas</h4>
                    <button
                      onClick={() => {
                        // Aquí se abriría un modal para crear propuesta
                        if ((window as any).Swal) {
                          (window as any).Swal.fire({
                            title: 'Crear Propuesta',
                            html: `
                              <div class="text-left space-y-3">
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de propuesta</label>
                                  <select id="proposal-type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="precio">Propuesta de precio</option>
                                    <option value="intercambio">Propuesta de intercambio</option>
                                    <option value="encuentro">Propuesta de encuentro</option>
                                    <option value="condiciones">Propuesta de condiciones</option>
                                    <option value="otro">Otra propuesta</option>
                                  </select>
                                </div>
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                  <textarea id="proposal-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="3" placeholder="Describe tu propuesta..."></textarea>
                                </div>
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Precio propuesto (opcional)</label>
                                  <input type="number" id="proposal-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0">
                                </div>
                              </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Enviar Propuesta',
                            cancelButtonText: 'Cancelar',
                            confirmButtonColor: '#3B82F6',
                            cancelButtonColor: '#6B7280',
                            preConfirm: () => {
                              const type = (document.getElementById('proposal-type') as HTMLSelectElement)?.value
                              const description = (document.getElementById('proposal-description') as HTMLTextAreaElement)?.value
                              const price = (document.getElementById('proposal-price') as HTMLInputElement)?.value
                              
                              if (!type || !description) {
                                (window as any).Swal.showValidationMessage('Tipo y descripción son requeridos')
                                return false
                              }
                              
                              return { type, description, price: price ? parseFloat(price) : undefined }
                            }
                          }).then((result: any) => {
                            if (result.isConfirmed) {
                              handleCreateProposal(result.value)
                            }
                          })
                        }
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Nueva propuesta
                    </button>
                  </div>
                  
                  {isLoadingProposals ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : proposals.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No hay propuestas en esta conversación</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {proposals.map((proposal) => (
                        <div key={proposal.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                proposal.type === 'precio' ? 'bg-blue-100 text-blue-800' :
                                proposal.type === 'intercambio' ? 'bg-green-100 text-green-800' :
                                proposal.type === 'encuentro' ? 'bg-purple-100 text-purple-800' :
                                proposal.type === 'condiciones' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {proposal.type}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                proposal.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                proposal.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                                proposal.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {proposal.status}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(proposal.createdAt).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{proposal.description}</p>
                          
                          {proposal.proposedPrice && (
                            <p className="text-sm font-medium text-green-600 mb-2">
                              Precio propuesto: ${proposal.proposedPrice.toLocaleString('es-CO')}
                            </p>
                          )}
                          
                          {proposal.meetingDate && (
                            <p className="text-sm text-gray-600 mb-2">
                              📅 Encuentro: {new Date(proposal.meetingDate).toLocaleDateString('es-CO')}
                              {proposal.meetingPlace && ` en ${proposal.meetingPlace}`}
                            </p>
                          )}
                          
                          {proposal.response && (
                            <div className="mt-2 p-2 bg-white rounded border-l-4 border-primary-500">
                              <p className="text-sm text-gray-700">
                                <strong>Respuesta:</strong> {proposal.response}
                              </p>
                            </div>
                          )}
                          
                          {proposal.status === 'pendiente' && proposal.receiver.id === parseInt(getCurrentUserId()) && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={() => handleRespondToProposal(proposal.id, 'aceptar')}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => {
                                  if ((window as any).Swal) {
                                    (window as any).Swal.fire({
                                      title: 'Rechazar Propuesta',
                                      input: 'textarea',
                                      inputLabel: 'Motivo del rechazo (opcional)',
                                      inputPlaceholder: 'Explica por qué rechazas esta propuesta...',
                                      showCancelButton: true,
                                      confirmButtonText: 'Rechazar',
                                      cancelButtonText: 'Cancelar',
                                      confirmButtonColor: '#EF4444',
                                      cancelButtonColor: '#6B7280'
                                    }).then((result: any) => {
                                      if (result.isConfirmed) {
                                        handleRespondToProposal(proposal.id, 'rechazar', result.value)
                                      }
                                    })
                                  }
                                }}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mensajes - Área expandida para mejor visibilidad */}
            <div 
              className="flex-1 overflow-y-auto p-8 space-y-8 relative min-h-0"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement
                const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10
                setIsUserScrolling(!isAtBottom)
              }}
            >
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay mensajes en esta conversación</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Debug: {selectedConversation.messages.length} mensajes cargados
                    </p>
                  </div>
                </div>
              ) : (
                selectedConversation.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md lg:max-w-xl xl:max-w-2xl ${isOwnMessage(message) ? 'order-2' : 'order-1'
                    }`}>
                    {!isOwnMessage(message) && (
                      <img
                        src={message.sender?.avatar || selectedConversation.user.avatar}
                        alt={message.sender?.name || selectedConversation.user.name}
                        className="w-8 h-8 rounded-full mb-2"
                        onError={(e) => {
                          // Si falla la imagen, mostrar iniciales
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-8 h-8 rounded-full mb-2 bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600';
                          fallback.textContent = (message.sender?.name || selectedConversation.user.name).charAt(0).toUpperCase();
                          target.parentNode?.insertBefore(fallback, target.nextSibling);
                        }}
                      />
                    )}

                    <div className={`rounded-xl px-5 py-3 relative group shadow-sm ${isOwnMessage(message)
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                      {message.replyToId && (
                        <div className={`text-xs mb-2 px-3 py-1.5 rounded-lg ${isOwnMessage(message) ? 'bg-primary-700/40' : 'bg-gray-100'}`}>
                          <span className="opacity-80">Respuesta a:</span>
                          <span className="ml-1 font-medium">
                            {findMessageById(message.replyToId)?.content?.slice(0, 60) || 'mensaje'}
                          </span>
                        </div>
                      )}
                      {message.type === 'text' && (
                        <p className="text-base leading-relaxed">{message.content}</p>
                      )}

                      {message.type === 'image' && message.metadata?.imageUrl && (
                        <img
                          src={message.metadata.imageUrl}
                          alt="Imagen"
                          className="rounded-lg max-w-full"
                        />
                      )}

                      {message.type === 'location' && message.metadata?.coordinates && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span className="text-sm">Ubicación compartida</span>
                        </div>
                      )}

                      {message.type === 'file' && message.metadata?.fileName && (
                        <div className="flex items-center space-x-2">
                          <PaperClipIcon className="w-4 h-4" />
                          <span className="text-sm">{message.metadata.fileName}</span>
                        </div>
                      )}
                      {/* Acciones de mensaje */}
                      <div className={`absolute -top-3 ${isOwnMessage(message) ? 'right-2' : 'left-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-1 py-0.5 flex space-x-1">
                          <button onClick={() => setOpenReactionsFor(message.id)} className="text-xs px-2 py-1 hover:bg-gray-100 rounded">🙂</button>
                          <button onClick={() => handleReply(message.id)} className="text-xs px-2 py-1 hover:bg-gray-100 rounded">Responder</button>
                        </div>
                      </div>

                      {/* Picker de reacciones */}
                      {openReactionsFor === message.id && (
                        <div className={`absolute ${isOwnMessage(message) ? 'right-0' : 'left-0'} -top-12 bg-white border border-gray-200 shadow-lg rounded-lg p-1 flex space-x-1 z-10`}>
                          {['👍', '❤️', '🎉', '😂', '😮', '😢'].map(e => (
                            <button key={e} className="px-1 hover:scale-110 transition" onClick={() => handleAddReaction(message.id, e)}>{e}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center space-x-1 mt-1 ${isOwnMessage(message) ? 'justify-end' : 'justify-start'
                      }`}>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>

                      {isOwnMessage(message) && (
                        <div className="flex items-center">
                          {message.isRead ? (
                            <CheckIcon className="w-3 h-3 text-blue-500" />
                          ) : (
                            <CheckIcon className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      )}
                      {/* Reacciones mostradas */}
                      {message.reactions && (
                        <div className="ml-2 flex space-x-1">
                          {Object.entries(message.reactions).map(([emoji, count]) => (
                            <span key={emoji} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isOwnMessage(message) ? 'border-white/40' : 'border-gray-300'}`}>
                              {emoji} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md order-1">
                    <img
                      src={selectedConversation.user.avatar}
                      alt={selectedConversation.user.name}
                      className="w-8 h-8 rounded-full mb-2"
                    />
                    <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              
              {/* Botón para scroll al final cuando el usuario está scrolleando manualmente */}
              {isUserScrolling && (
                <div className="absolute bottom-20 right-4">
                  <button
                    onClick={() => {
                      if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'end' 
                        })
                      }
                      setIsUserScrolling(false)
                    }}
                    className="bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                    title="Ir al final"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* SECCIÓN DE PROPUESTA - Muy compacta */}
            <div className="bg-gray-50 border-t border-gray-200 px-3 py-2">
              <div className="text-center mb-2">
                <h3 className="text-xs font-medium text-gray-700">💰 Propuestas</h3>
              </div>
              
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={handleSendProposal}
                  className="flex items-center space-x-1 px-2 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                >
                  <span className="text-xs">💰</span>
                  <span>Enviar</span>
                </button>
                
                <button
                  onClick={handleNegotiate}
                  className="flex items-center space-x-1 px-2 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                >
                  <span className="text-xs">🔄</span>
                  <span>Negociar</span>
                </button>
                
                <button
                  onClick={handleAccept}
                  className="flex items-center space-x-1 px-2 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-xs"
                >
                  <span className="text-xs">✅</span>
                  <span>Aceptar</span>
                </button>
              </div>
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button onClick={handleAttachFile} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <button onClick={handleAttachImage} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <MapPinIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={1}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona una conversación</h3>
              <p className="text-gray-600">Elige un chat para comenzar a conversar</p>
            </div>
          </div>
        )}
      </div>
      {/* Panel lateral de perfil y producto */}
      {showProfile && selectedConversation && (
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Perfil y Producto</h3>
            <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          {/* Información del usuario */}
          <div className="p-4 space-y-3">
            <img src={selectedConversation.user.avatar} alt={selectedConversation.user.name} className="w-20 h-20 rounded-full" />
            <div>
              <p className="font-medium text-gray-900">{selectedConversation.user.name}</p>
              <p className="text-sm text-gray-500 flex items-center space-x-1"><MapPinIcon className="w-4 h-4" /><span>{selectedConversation.user.location}</span></p>
              <p className={`text-sm flex items-center space-x-1 ${
                isUserOnline(selectedConversation.user.id) ? 'text-green-600' : 'text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isUserOnline(selectedConversation.user.id) ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span>{isUserOnline(selectedConversation.user.id) ? 'En línea' : 'Desconectado'}</span>
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button className="w-full text-left text-sm text-primary-700 hover:underline">Ver perfil completo</button>
              <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Reportar usuario</button>
              <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Bloquear</button>
            </div>
          </div>

          {/* Información del producto */}
          {(() => {
            console.log('🔍 [ChatModule] Verificando producto para chat:', selectedConversation.id)
            console.log('🔍 [ChatModule] Producto:', selectedConversation.product)
            console.log('🔍 [ChatModule] Tiene producto:', !!selectedConversation.product)
            return selectedConversation.product
          })() && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Producto en Negociación</h4>
              
              {/* Imagen del producto */}
              {selectedConversation.product.mainImage && (
                <div className="relative">
                  <img 
                    src={selectedConversation.product.mainImage} 
                    alt={selectedConversation.product.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* Detalles del producto */}
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900 text-sm">{selectedConversation.product.title}</h5>
                
                {selectedConversation.product.price && (
                  <p className="text-sm font-semibold text-green-600">
                    {selectedConversation.product.price}
                  </p>
                )}
                
                {selectedConversation.product.category && (
                  <p className="text-xs text-gray-500">
                    Categoría: {selectedConversation.product.category}
                  </p>
                )}
                
                {selectedConversation.product.description && (
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {selectedConversation.product.description}
                  </p>
                )}
                
                {selectedConversation.product.exchangeConditions && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs font-medium text-blue-800">Condiciones de Intercambio:</p>
                    <p className="text-xs text-blue-700">{selectedConversation.product.exchangeConditions}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <button className="w-full text-left text-sm text-primary-700 hover:underline">Ver producto completo</button>
                <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Reportar producto</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}