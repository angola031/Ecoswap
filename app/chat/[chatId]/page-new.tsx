'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { motion } from 'framer-motion'
import './chat-styles.css'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckIcon,
  CheckCircleIcon,
  PhotoIcon,
  UserIcon,
  PhoneIcon,
  EllipsisVerticalIcon,
  VideoCameraIcon,
  ShoppingBagIcon,
  EyeIcon,
  DocumentTextIcon,
  HandRaisedIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  CheckCircleIcon as CheckCircleOutlineIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'texto' | 'imagen' | 'ubicacion' | 'propuesta' | 'respuesta_propuesta'
  imageUrl?: string
  sender: {
    id: string
    name: string
    lastName: string
    avatar?: string
  }
  metadata?: any
}

interface ChatInfo {
  chatId: string
  seller: {
    id: string
    name: string
    lastName: string
    avatar?: string
    location?: string
    rating?: number
    totalExchanges?: number
    memberSince?: string
  }
  offeredProduct?: {
    id: string
    title: string
    price?: number
    type: string
    category?: string
    mainImage?: string
    imageUrl?: string
  }
  requestedProduct?: {
    id: string
    title: string
    price?: number
    type: string
    category?: string
    mainImage?: string
    imageUrl?: string
  }
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const chatId = params.chatId as string

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isUserOnline, setIsUserOnline] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [proposals, setProposals] = useState<any[]>([])
  const [activeProposal, setActiveProposal] = useState<any>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para formatear tiempo
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Función para scroll suave al final
  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return
    
    const container = messagesContainerRef.current
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100
    
    if (isNearBottom || force) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }

  // Cargar información del chat y mensajes
  useEffect(() => {
    let isMounted = true
    let channel: any = null

    const loadChat = async () => {
      if (!chatId || !isMounted) return

      try {
        setIsLoading(true)

        // Obtener sesión
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          console.log('❌ [Chat] No hay sesión - redirigiendo al login')
          router.push('/login')
          return
        }

        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: usuario } = await supabase
          .from('usuario')
          .select('user_id, nombre, apellido, foto_perfil')
          .eq('auth_user_id', user.id)
          .single()

        if (usuario && isMounted) {
          setCurrentUser(usuario)
        }

        // Cargar información del chat
        const chatResponse = await fetch(`/api/chat/${chatId}/info`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (chatResponse.ok && isMounted) {
          const chatData = await chatResponse.json()
          setChatInfo(chatData.data)
        }

        // Cargar mensajes
        const messagesResponse = await fetch(`/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (messagesResponse.ok && isMounted) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.data || [])
        }

        // Configurar canal realtime
        if (isMounted) {
          channel = supabase
            .channel(`chat-${chatId}`, {
              config: {
                broadcast: { self: true },
                presence: { key: usuario?.user_id?.toString() }
              }
            })
            .on('presence', { event: 'sync' }, () => {
              if (!isMounted) return
              const state = channel.presenceState()
              const users = Object.values(state).flat() as any[]
              setIsUserOnline(users.length > 1)
            })
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'mensaje',
              filter: `chat_id=eq.${chatId}`
            }, async (payload) => {
              if (!isMounted) return

              // Ignorar mensajes del usuario actual (ya está en optimista)
              if (payload.new.usuario_id?.toString() === currentUser?.user_id?.toString()) {
                console.log('🔄 Ignorando mensaje del usuario actual (ya está en optimista)')
                return
              }

              const newMessageData = payload.new
              const transformedMessage = {
                id: newMessageData.mensaje_id?.toString() || '',
                senderId: newMessageData.usuario_id?.toString() || '',
                content: newMessageData.contenido || '',
                timestamp: formatTime(newMessageData.fecha_envio || ''),
                isRead: newMessageData.leido || false,
                type: newMessageData.tipo || 'texto',
                imageUrl: newMessageData.archivo_url || undefined,
                sender: {
                  id: newMessageData.usuario?.user_id?.toString() || '',
                  name: newMessageData.usuario?.nombre || 'Usuario',
                  lastName: newMessageData.usuario?.apellido || '',
                  avatar: newMessageData.usuario?.foto_perfil || undefined
                },
                metadata: newMessageData.metadata
              }

              if (isMounted) {
                setMessages(prev => {
                  const exists = prev.some(msg => msg.id === transformedMessage.id)
                  if (exists) return prev
                  return [...prev, transformedMessage]
                })
              }
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED' && isMounted) {
                await channel.track({
                  user_id: usuario?.user_id?.toString(),
                  online_at: new Date().toISOString()
                })
              }
            })
        }

      } catch (error) {
        console.error('Error cargando chat:', error)
        if (isMounted) {
          router.push('/')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadChat()

    return () => {
      isMounted = false
      if (channel) {
        if (currentUser?.user_id) {
          channel.untrack()
        }
        supabase.removeChannel(channel)
      }
    }
  }, [chatId, router])

  // Auto-scroll inteligente cuando hay nuevos mensajes
  useEffect(() => {
    let isMounted = true

    const handleScroll = () => {
      if (!isMounted || !messagesContainerRef.current) return
      
      const container = messagesContainerRef.current
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50
      
      setShowScrollButton(!isAtBottom)
      setIsUserScrolling(!isAtBottom)
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          setIsUserScrolling(false)
        }
      }, 1000)
    }

    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      setTimeout(() => scrollToBottom(true), 200)
    }

    return () => {
      isMounted = false
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [messages.length])

  // Scroll automático cuando se agregan nuevos mensajes
  useEffect(() => {
    if (!isUserScrolling && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages.length, isUserScrolling])

  // Scroll inicial cuando se carga el chat
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      setTimeout(() => scrollToBottom(true), 300)
    }
  }, [isLoading, messages.length])

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !chatId) return

    const messageContent = newMessage.trim()
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      senderId: String(currentUser?.user_id || ''),
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      type: 'texto' as const,
      sender: {
        id: String(currentUser?.user_id || ''),
        name: currentUser?.nombre || 'Usuario',
        lastName: currentUser?.apellido || '',
        avatar: currentUser?.foto_perfil || undefined
      }
    }

    setNewMessage('')
    setMessages(prev => [...prev, optimisticMessage])
    setIsSending(true)

    setTimeout(() => scrollToBottom(true), 50)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/chat/${chatId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: messageContent,
          type: 'texto'
        })
      })

      if (response.ok) {
        const result = await response.json()
        const realMessage = {
          id: result.data.mensaje_id.toString(),
          senderId: result.data.usuario_id.toString(),
          content: result.data.contenido,
          timestamp: formatTime(result.data.fecha_envio),
          isRead: result.data.leido,
          type: result.data.tipo,
          imageUrl: result.data.archivo_url,
          sender: {
            id: result.data.usuario.user_id.toString(),
            name: result.data.usuario.nombre,
            lastName: result.data.usuario.apellido,
            avatar: result.data.usuario.foto_perfil
          }
        }

        setMessages(prev => {
          const exists = prev.some(msg => msg.id === realMessage.id)
          if (exists) {
            return prev.filter(msg => msg.id !== optimisticMessage.id)
          } else {
            return prev.map(msg => msg.id === optimisticMessage.id ? realMessage : msg)
          }
        })
      } else {
        throw new Error('Error enviando mensaje')
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  // Manejar propuesta
  const handleProposalAction = async (action: 'aceptar' | 'rechazar' | 'contrapropuesta') => {
    if (!activeProposal) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/chat/${chatId}/proposals/${activeProposal.propuesta_id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          respuesta: action === 'aceptar' ? 'aceptada' : action === 'rechazar' ? 'rechazada' : 'contrapropuesta',
          comentario: action === 'contrapropuesta' ? 'Propuesta alternativa enviada' : undefined
        })
      })

      if (response.ok) {
        await (window as any).Swal.fire({
          title: 'Respuesta Enviada',
          text: `Has ${action} la propuesta exitosamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        setActiveProposal(null)
      }
    } catch (error) {
      console.error('Error respondiendo propuesta:', error)
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando chat...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="h-screen bg-gray-100 flex flex-col">
        {/* Header del chat */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={chatInfo?.seller?.avatar || '/default-avatar.png'}
                    alt={chatInfo?.seller?.name || 'Usuario'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  {isUserOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {chatInfo?.seller?.name} {chatInfo?.seller?.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isUserOnline ? 'En línea' : 'Desconectado'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <PhoneIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                <VideoCameraIcon className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Información del producto */}
          {chatInfo?.offeredProduct && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-4">
                {chatInfo.offeredProduct.mainImage && (
                  <img
                    src={chatInfo.offeredProduct.mainImage}
                    alt={chatInfo.offeredProduct.title}
                    className="w-16 h-16 rounded-lg object-cover border border-blue-200"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{chatInfo.offeredProduct.title}</h3>
                  <p className="text-sm text-gray-600">
                    {chatInfo.offeredProduct.type === 'venta' 
                      ? `$${chatInfo.offeredProduct.price?.toLocaleString()}` 
                      : chatInfo.offeredProduct.type === 'donacion' 
                      ? 'Gratis' 
                      : 'Intercambio'}
                  </p>
                  {chatInfo.offeredProduct.category && (
                    <p className="text-xs text-blue-600">{chatInfo.offeredProduct.category}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal con sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar opcional */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Detalles del Intercambio</h3>
            </div>
            
            <div className="flex-1 p-4 space-y-4">
              {/* Información del vendedor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Vendedor</h4>
                <div className="flex items-center space-x-3">
                  <img
                    src={chatInfo?.seller?.avatar || '/default-avatar.png'}
                    alt={chatInfo?.seller?.name || 'Usuario'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {chatInfo?.seller?.name} {chatInfo?.seller?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{chatInfo?.seller?.location}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Calificación:</span>
                    <span className="font-medium">{chatInfo?.seller?.rating || 0}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Intercambios:</span>
                    <span className="font-medium">{chatInfo?.seller?.totalExchanges || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Miembro desde:</span>
                    <span className="font-medium">{chatInfo?.seller?.memberSince || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Estado del intercambio */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Estado</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">En negociación</span>
                </div>
              </div>
            </div>
          </div>

          {/* Área principal del chat */}
          <div className="flex-1 flex flex-col">
            {/* Chat Box - Mensajes */}
            <div className="flex-1 flex flex-col">
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-4 space-y-4 chat-messages-container"
                style={{ scrollBehavior: 'smooth' }}
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 empty-chat-container">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-6 mb-6 shadow-lg">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      ¡Conversación iniciada! 🎉
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md">
                      Comienza a chatear con <span className="font-semibold text-blue-600">{chatInfo?.seller?.name}</span> sobre 
                      <span className="font-semibold text-gray-800"> "{chatInfo?.offeredProduct?.title}"</span>
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.senderId === currentUser?.user_id?.toString() ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.senderId === currentUser?.user_id?.toString() ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <img
                          src={message.sender?.avatar || '/default-avatar.png'}
                          alt={message.sender?.name || 'Usuario'}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div className={`px-4 py-2 rounded-2xl ${message.senderId === currentUser?.user_id?.toString() 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.senderId === currentUser?.user_id?.toString() ? 'text-blue-100' : 'text-gray-500'}`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
                
                {/* Botón de scroll flotante */}
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollToBottom(true)}
                    className="fixed bottom-24 right-6 z-50 text-white rounded-full p-3 shadow-lg transition-all duration-200 group scroll-to-bottom-btn"
                    title="Ir al final"
                  >
                    <svg 
                      className="w-5 h-5 transition-transform group-hover:scale-110" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                      />
                    </svg>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Sección de propuestas */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CurrencyDollarIcon className="w-5 h-5" />
                  <span>Enviar Propuesta</span>
                </button>
                
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>Negociar</span>
                </button>
                
                {activeProposal && (
                  <button
                    onClick={() => handleProposalAction('aceptar')}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <CheckCircleOutlineIcon className="w-5 h-5" />
                    <span>Aceptar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input de mensaje */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex items-end space-x-3">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  ) : (
                    <PhotoIcon className="w-6 h-6" />
                  )}
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px',
                      height: 'auto'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                    }}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <PaperAirplaneIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
              
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  setIsUploadingImage(true)
                  try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session?.access_token) return

                    const formData = new FormData()
                    formData.append('image', file)

                    const uploadResponse = await fetch(`/api/upload/image`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: formData
                    })

                    if (uploadResponse.ok) {
                      const uploadData = await uploadResponse.json()
                      
                      const messageResponse = await fetch(`/api/chat/${chatId}/send`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                          content: `📷 Imagen enviada`,
                          type: 'imagen',
                          imageUrl: uploadData.url
                        })
                      })

                      if (messageResponse.ok) {
                        const result = await messageResponse.json()
                        setMessages(prev => [...prev, {
                          id: result.data.mensaje_id.toString(),
                          senderId: result.data.usuario_id.toString(),
                          content: result.data.contenido,
                          timestamp: formatTime(result.data.fecha_envio),
                          isRead: result.data.leido,
                          type: result.data.tipo,
                          imageUrl: result.data.archivo_url,
                          sender: {
                            id: result.data.usuario.user_id.toString(),
                            name: result.data.usuario.nombre,
                            lastName: result.data.usuario.apellido,
                            avatar: result.data.usuario.foto_perfil
                          }
                        }])
                        
                        setTimeout(() => scrollToBottom(true), 100)
                      }
                    } else {
                      const error = await uploadResponse.json()
                      console.error('Error subiendo imagen:', error)
                    }
                  } catch (error) {
                    console.error('Error procesando imagen:', error)
                  } finally {
                    setIsUploadingImage(false)
                    if (imageInputRef.current) {
                      imageInputRef.current.value = ''
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Modal de Propuesta */}
        {showProposalModal && (
          <ProposalModal
            chatId={chatId}
            currentUser={currentUser}
            onClose={() => setShowProposalModal(false)}
            onProposalSent={() => {
              setShowProposalModal(false)
              setTimeout(() => scrollToBottom(true), 500)
            }}
          />
        )}
      </div>
    </AuthGuard>
  )
}

// Componente Modal de Propuesta
function ProposalModal({ chatId, currentUser, onClose, onProposalSent }: {
  chatId: string
  currentUser: any
  onClose: () => void
  onProposalSent: () => void
}) {
  const [tipoPropuesta, setTipoPropuesta] = useState('precio')
  const [descripcion, setDescripcion] = useState('')
  const [precioPropuesto, setPrecioPropuesto] = useState('')
  const [condiciones, setCondiciones] = useState('')
  const [fechaEncuentro, setFechaEncuentro] = useState('')
  const [lugarEncuentro, setLugarEncuentro] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descripcion.trim()) return

    setIsSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/chat/${chatId}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tipo_propuesta: tipoPropuesta,
          descripcion: descripcion.trim(),
          precio_propuesto: precioPropuesto ? parseFloat(precioPropuesto) : null,
          condiciones: condiciones.trim() || null,
          fecha_encuentro: fechaEncuentro || null,
          lugar_encuentro: lugarEncuentro.trim() || null
        })
      })

      if (response.ok) {
        await (window as any).Swal.fire({
          title: 'Propuesta Enviada',
          text: 'Tu propuesta ha sido enviada exitosamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        })
        onProposalSent()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Error enviando propuesta')
      }
    } catch (error) {
      console.error('Error enviando propuesta:', error)
      await (window as any).Swal.fire({
        title: 'Error',
        text: 'No se pudo enviar la propuesta. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Hacer Propuesta</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Propuesta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Propuesta
              </label>
              <select
                value={tipoPropuesta}
                onChange={(e) => setTipoPropuesta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="precio">Precio</option>
                <option value="intercambio">Intercambio</option>
                <option value="encuentro">Encuentro</option>
                <option value="condiciones">Condiciones</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe tu propuesta en detalle..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            {/* Precio (si aplica) */}
            {tipoPropuesta === 'precio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Propuesto (COP)
                </label>
                <input
                  type="number"
                  value={precioPropuesto}
                  onChange={(e) => setPrecioPropuesto(e.target.value)}
                  placeholder="Ej: 500000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Condiciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condiciones Adicionales
              </label>
              <textarea
                value={condiciones}
                onChange={(e) => setCondiciones(e.target.value)}
                placeholder="Especifica condiciones especiales, garantías, etc..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Fecha de Encuentro (si aplica) */}
            {(tipoPropuesta === 'encuentro' || tipoPropuesta === 'intercambio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Propuesta para Encuentro
                </label>
                <input
                  type="datetime-local"
                  value={fechaEncuentro}
                  onChange={(e) => setFechaEncuentro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Lugar de Encuentro (si aplica) */}
            {(tipoPropuesta === 'encuentro' || tipoPropuesta === 'intercambio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lugar Propuesto
                </label>
                <input
                  type="text"
                  value={lugarEncuentro}
                  onChange={(e) => setLugarEncuentro(e.target.value)}
                  placeholder="Ej: Centro Comercial San Fernando, Pereira"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!descripcion.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Propuesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
