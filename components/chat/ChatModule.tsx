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


interface User {
  id: string
  name: string
  email: string
  avatar: string
  location: string
  user_id?: string // Agregado para consistencia
}
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

interface ChatConversation {
  id: string
  user: ChatUser
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
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

// Función para renderizar información de producto
const renderProductInfo = (product: any, label: string) => {
  if (!product) return null
  
  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-3">
        <div className="relative">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-12 h-12 rounded-lg object-cover border border-blue-200"
              onError={(e) => {
                // Si falla la imagen, mostrar icono por defecto
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200 ${product.imageUrl ? 'hidden' : ''}`}>
            <span className="text-blue-600 text-lg">📦</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-blue-800 bg-blue-200 px-2 py-1 rounded-full">
              {label}
            </span>
          </div>
          <p className="text-sm font-medium text-blue-900 truncate">
            {product.title}
          </p>
          <p className="text-xs text-blue-700">
            {formatPrice(
              product.precio,
              product.tipo_transaccion,
              product.condiciones_intercambio,
              product.que_busco_cambio,
              product.precio_negociable
            )}
          </p>
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
  const [requestedProduct, setRequestedProduct] = useState<any>(null)
// Estado para manejar conexión realtime
const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
// Estado para controlar scroll manual
const [isUserScrolling, setIsUserScrolling] = useState(false)

// Función auxiliar para obtener ID consistente del usuario
const getCurrentUserId = () => {
  return String(currentUser?.user_id || currentUser?.id || '')
}
  // Cargar conversaciones reales
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 [ChatModule] Cargando conversaciones - Sesión:', session ? 'Sí' : 'No')
        console.log('🔐 [ChatModule] Usuario:', session?.user?.email)
        
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
        
        if (!res.ok) throw new Error(json?.error || 'Error cargando chats')
        const list: ChatConversation[] = (json.items || []).map((c: any) => ({
          id: String(c.id),
          user: c.user,
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: c.unreadCount || 0,
          messages: []
        }))
        setConversations(list)
        // Solo seleccionar el primer chat si no hay uno seleccionado
        if (list.length > 0 && !selectedConversation) {
          setSelectedConversation(list[0])
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando conversaciones:', error)
        setConversations([])
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [])

  // Cargar mensajes reales al seleccionar conversación
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return
      try {
        const chatId = Number(selectedConversation.id)
        console.log('🔄 [ChatModule] Cargando mensajes para chat:', chatId)
        if (!chatId) return
        
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔐 [ChatModule] Sesión actual:', session ? 'Sí' : 'No')
        console.log('🔐 [ChatModule] Usuario:', session?.user?.email)
        console.log('🔐 [ChatModule] Token:', session?.access_token ? 'Presente' : 'Ausente')
        console.log('🔐 [ChatModule] Usuario actual del componente:', currentUser?.email)
        
        const token = session?.access_token
        if (!token) {
          console.log('❌ [ChatModule] No hay token de sesión - usuario no autenticado')
          console.log('🔄 [ChatModule] Redirigiendo al login...')
          router.push('/login')
          return
        }
        
        console.log('📡 [ChatModule] Haciendo petición a API...')
        const res = await fetch(`/api/chat/${chatId}/messages?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        
        console.log('📨 [ChatModule] Respuesta de API:', { 
          status: res.status, 
          ok: res.ok, 
          json: {
            items: json.items?.length || 0,
            firstMessage: json.items?.[0],
            lastMessage: json.items?.[json.items?.length - 1]
          }
        })
        
        if (!res.ok) throw new Error(json?.error || 'Error cargando mensajes')
        
        const messages: ChatMessage[] = (json.items || [])
          .filter((m: any) => {
            // Filtrar solo mensajes que son claramente de información del producto
            const content = m.contenido || ''
            // Solo filtrar si el mensaje completo parece ser información del producto
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
        
        console.log('💬 [ChatModule] Mensajes transformados:', messages.length, 'mensajes')
        console.log('💬 [ChatModule] Primer mensaje:', messages[0])
        console.log('💬 [ChatModule] Último mensaje:', messages[messages.length - 1])
        console.log('💬 [ChatModule] Usuario actual:', currentUser)
        console.log('💬 [ChatModule] ID del usuario actual:', getCurrentUserId())
        
        setSelectedConversation(prev => prev ? { ...prev, messages } : prev)
        setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, messages } : c))

        // Marcar como leídos
        const readRes = await fetch(`/api/chat/${chatId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        if (readRes.ok) {
          setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, unreadCount: 0 } : c))
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando mensajes:', error)
      }
    }
    loadMessages()
  }, [selectedConversation?.id])

  // Cargar información del producto cuando se selecciona un chat
  useEffect(() => {
    const loadProductInfo = async () => {
      if (!selectedConversation?.id) {
        setOfferedProduct(null)
        setRequestedProduct(null)
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
        
        if (response.ok) {
          const data = await response.json()
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
  }, [selectedConversation?.id, getCurrentUserId()])

  // Scroll automático mejorado - solo cuando se agregan nuevos mensajes
  useEffect(() => {
    // Solo hacer scroll automático si hay mensajes y el usuario no está haciendo scroll manual
    if (!selectedConversation?.messages || selectedConversation.messages.length === 0 || isUserScrolling) {
      return () => {} // Devolver función vacía para evitar el error
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
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [selectedConversation?.messages?.length, isUserScrolling]) // Dependencias actualizadas

  // ✅ ENVÍO DE MENSAJES MEJORADO
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const currentUserId = getCurrentUserId()
    
    // Crear mensaje optimista
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      content: messageContent,
      timestamp: new Date().toLocaleString('es-CO', { 
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
        lastName: currentUser?.apellido || '',
        avatar: currentUser?.avatar || undefined
      }
    }

    // Limpiar input inmediatamente
    setNewMessage('')
    setReplyToMessageId(null)

    // Actualización optimista
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, optimisticMessage],
      lastMessage: optimisticMessage.content,
      lastMessageTime: optimisticMessage.timestamp
    }
    
    setSelectedConversation(updatedConversation)
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id ? updatedConversation : conv
    ))
    
    // Scroll suave solo para mensajes nuevos
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        })
      }
    }, 100)
    
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
      if (window.Swal) {
        window.Swal.fire({
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
    <div className="h-[calc(100vh-200px)] flex bg-white rounded-lg shadow-sm border border-gray-200">
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
          {filteredConversations.map((conversation) => (
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
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${conversation.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
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
          ))}
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
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${selectedConversation.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
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
                        {selectedConversation.user.isOnline ? 'En línea' : selectedConversation.user.lastSeen}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
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
              
              {/* Información de productos */}
              <div className="px-4 pb-3 space-y-2">
                {offeredProduct && renderProductInfo(offeredProduct, 'Producto Ofrecido')}
                {requestedProduct && renderProductInfo(requestedProduct, 'Producto Solicitado')}
              </div>
            </div>

            {/* Mensajes */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 relative"
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
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage(message) ? 'order-2' : 'order-1'
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

                    <div className={`rounded-lg px-4 py-2 relative group ${isOwnMessage(message)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}>
                      {message.replyToId && (
                        <div className={`text-xs mb-1 px-2 py-1 rounded ${isOwnMessage(message) ? 'bg-primary-700/40' : 'bg-gray-200'}`}>
                          <span className="opacity-80">Respuesta a:</span>
                          <span className="ml-1 font-medium">
                            {findMessageById(message.replyToId)?.content?.slice(0, 60) || 'mensaje'}
                          </span>
                        </div>
                      )}
                      {message.type === 'text' && (
                        <p className="text-sm">{message.content}</p>
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
      {/* Panel lateral de perfil */}
      {showProfile && selectedConversation && (
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Perfil</h3>
            <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-4 space-y-3">
            <img src={selectedConversation.user.avatar} alt={selectedConversation.user.name} className="w-20 h-20 rounded-full" />
            <div>
              <p className="font-medium text-gray-900">{selectedConversation.user.name}</p>
              <p className="text-sm text-gray-500 flex items-center space-x-1"><MapPinIcon className="w-4 h-4" /><span>{selectedConversation.user.location}</span></p>
              <p className="text-sm text-gray-500">{selectedConversation.user.isOnline ? 'En línea' : `Visto: ${selectedConversation.user.lastSeen}`}</p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button className="w-full text-left text-sm text-primary-700 hover:underline">Ver perfil completo</button>
              <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Reportar usuario</button>
              <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}