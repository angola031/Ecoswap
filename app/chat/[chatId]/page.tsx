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
  EyeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'texto' | 'imagen' | 'ubicacion'
  imageUrl?: string
  sender: {
    id: string
    name: string
    lastName: string
    avatar?: string
  }
}

interface ChatInfo {
  chatId: string
  seller: {
    id: string
    name: string
    lastName: string
    avatar?: string
  }
  offeredProduct: {
    id: string
    title: string
    precio?: number
    tipo_transaccion?: string
    condiciones_intercambio?: string
    que_busco_cambio?: string
    precio_negociable?: boolean
    imageUrl?: string
  }
  requestedProduct?: {
    id: string
    title: string
    precio?: number
    tipo_transaccion?: string
    condiciones_intercambio?: string
    que_busco_cambio?: string
    precio_negociable?: boolean
    imageUrl?: string
  } | null
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cargar información del chat y mensajes
  useEffect(() => {
    let isMounted = true
    let channel: any = null

    const loadChat = async () => {
      if (!chatId || !isMounted) return
      
      // Verificar autenticación primero
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
        console.log('❌ [Chat] No hay sesión - redirigiendo al login')
        router.push('/login')
          return
        }
      
      try {

        // Obtener usuario actual primero
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          const { data: usuario } = await supabase
            .from('usuario')
            .select('user_id, nombre, apellido, foto_perfil')
            .eq('auth_user_id', user.id)
            .single()
          if (isMounted) {
          setCurrentUser(usuario)
          }
        }

        // Intentar obtener información del chat
        try {
          const chatResponse = await fetch(`/api/chat/${chatId}/info`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          
          if (chatResponse.ok) {
            const chatData = await chatResponse.json()
            if (isMounted) {
            setChatInfo(chatData)
            }
          } else {
            // Si no se puede cargar la info del chat, crear una interfaz básica
            console.log('No se pudo cargar info del chat, creando interfaz básica')
            if (isMounted) {
            setChatInfo({
              chatId: chatId,
              seller: {
                id: 'unknown',
                name: 'Vendedor',
                lastName: '',
                avatar: null
              },
                offeredProduct: {
                id: 'unknown',
                title: 'Producto',
                imageUrl: null
              }
            })
            }
          }
        } catch (error) {
          console.log('Error cargando info del chat:', error)
          // Crear interfaz básica si hay error
          if (isMounted) {
          setChatInfo({
            chatId: chatId,
            seller: {
              id: 'unknown',
              name: 'Vendedor',
              lastName: '',
              avatar: null
            },
              offeredProduct: {
              id: 'unknown',
              title: 'Producto',
              imageUrl: null
            }
          })
          }
        }

        // Intentar obtener mensajes
        try {
          const messagesResponse = await fetch(`/api/chat/${chatId}/messages?limit=100`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            
            // Transformar mensajes de la API al formato esperado
            const transformedMessages = (messagesData.items || []).map((msg: any) => ({
              id: msg.mensaje_id?.toString() || '',
              senderId: msg.usuario_id?.toString() || '',
              content: msg.contenido || '',
              timestamp: msg.fecha_envio || '',
              isRead: msg.leido || false,
              type: msg.tipo || 'texto',
              imageUrl: msg.archivo_url || undefined,
              sender: {
                id: msg.usuario?.user_id?.toString() || '',
                name: msg.usuario?.nombre || 'Usuario',
                lastName: msg.usuario?.apellido || '',
                avatar: msg.usuario?.foto_perfil || undefined
              }
            }))
            
            if (isMounted) {
              setMessages(transformedMessages)
            }
            
            // Marcar mensajes como leídos
            if (messagesData.items?.length > 0) {
              await fetch(`/api/chat/${chatId}/mark-read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` }
              })
            }
          }

          // Configurar tiempo real para nuevos mensajes y presencia
          if (isMounted) {
            channel = supabase
            .channel(`chat-${chatId}`, {
              config: {
                broadcast: { self: false },
                presence: { key: `user-${currentUser?.user_id}` }
              }
            })
            // Detectar presencia del otro usuario
            .on('presence', { event: 'sync' }, () => {
              if (!isMounted) return
              const presenceState = channel.presenceState()
              const otherUserId = chatInfo?.seller?.id
              if (otherUserId && presenceState[`user-${otherUserId}`]) {
                setIsUserOnline(true)
              } else {
                setIsUserOnline(false)
              }
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
              if (!isMounted) return
              const otherUserId = chatInfo?.seller?.id
              if (otherUserId && key === `user-${otherUserId}`) {
                setIsUserOnline(true)
              }
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
              if (!isMounted) return
              const otherUserId = chatInfo?.seller?.id
              if (otherUserId && key === `user-${otherUserId}`) {
                setIsUserOnline(false)
              }
            })
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'mensaje',
              filter: `chat_id=eq.${chatId}`
            }, async (payload) => {
              console.log('🔔 Nuevo mensaje recibido:', payload)
              
              // Ignorar mensajes del usuario actual para evitar duplicados con mensajes optimistas
              const currentUserIdStr = String(currentUser?.user_id || '')
              if (payload.new.usuario_id?.toString() === currentUserIdStr) {
                console.log('🔄 Ignorando mensaje del usuario actual (ya está en optimista)')
                return
              }
              
              // Obtener información completa del mensaje con usuario
              const { data: newMessageData } = await supabase
                .from('mensaje')
                .select(`
                  mensaje_id,
                  contenido,
                  tipo,
                  archivo_url,
                  fecha_envio,
                  leido,
                  usuario_id,
                  usuario (
                    user_id,
                    nombre,
                    apellido,
                    foto_perfil
                  )
                `)
                .eq('mensaje_id', payload.new.mensaje_id)
                .single()

              if (newMessageData) {
                // Transformar mensaje al formato esperado
                const transformedMessage = {
                  id: newMessageData.mensaje_id?.toString() || '',
                  senderId: newMessageData.usuario_id?.toString() || '',
                  content: newMessageData.contenido || '',
                  timestamp: newMessageData.fecha_envio || '',
                  isRead: newMessageData.leido || false,
                  type: newMessageData.tipo || 'texto',
                  imageUrl: newMessageData.archivo_url || undefined,
                  sender: {
                    id: newMessageData.usuario?.user_id?.toString() || '',
                    name: newMessageData.usuario?.nombre || 'Usuario',
                    lastName: newMessageData.usuario?.apellido || '',
                    avatar: newMessageData.usuario?.foto_perfil || undefined
                  }
                }

                if (isMounted) {
                  setMessages(prev => {
                    // Evitar duplicados
                    const exists = prev.some(msg => msg.id === transformedMessage.id)
                    if (exists) return prev
                    return [...prev, transformedMessage]
                  })
                }

                // Mostrar notificación si el mensaje es de otro usuario
                const isFromOtherUser = transformedMessage.senderId !== currentUser?.user_id?.toString()
                if (isFromOtherUser) {
                  // Mostrar notificación de mensaje recibido
                  await (window as any).Swal.fire({
                    title: 'Nuevo Mensaje',
                    text: `${transformedMessage.sender.name}: ${transformedMessage.content.slice(0, 50)}${transformedMessage.content.length > 50 ? '...' : ''}`,
                    icon: 'info',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                  })
                }

                // Auto-scroll al final
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                // Suscribir al usuario actual para presencia
                if (currentUser?.user_id) {
                  await channel.track({
                    user_id: currentUser.user_id,
                    name: `${currentUser.nombre} ${currentUser.apellido}`,
                    online_at: new Date().toISOString()
                  })
                }
              }
            })

          }

        } catch (error) {
          console.log('Error cargando mensajes:', error)
          // Continuar sin mensajes si hay error
        }

      } catch (error) {
        console.error('Error general cargando chat:', error)
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

  // Función para scroll suave al final
  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return
    
    const container = messagesContainerRef.current
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100
    
    // Solo hacer scroll automático si el usuario está cerca del final o es forzado
    if (isNearBottom || force) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }

  // Auto-scroll inteligente cuando hay nuevos mensajes
  useEffect(() => {
    let isMounted = true

    const handleScroll = () => {
      if (!isMounted || !messagesContainerRef.current) return
      
      const container = messagesContainerRef.current
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50
      
      setShowScrollButton(!isAtBottom)
      setIsUserScrolling(!isAtBottom)
      
      // Resetear el flag de scroll manual después de un tiempo
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          setIsUserScrolling(false)
        }
      }, 1000)
    }

    // Agregar listener de scroll
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      
      // Scroll inicial al final
      setTimeout(() => scrollToBottom(true), 100)
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
    if (!isUserScrolling) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages.length, isUserScrolling])

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !chatId) return

    // Guardar el contenido del mensaje antes de limpiarlo
    const messageContent = newMessage.trim()

    // Crear mensaje optimista inmediatamente
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // ID temporal
      senderId: String(currentUser?.user_id || ''),
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      type: 'texto',
      sender: {
        id: String(currentUser?.user_id || ''),
        name: currentUser?.nombre || 'Usuario',
        lastName: currentUser?.apellido || '',
        avatar: currentUser?.foto_perfil || undefined
      }
    }

    // Limpiar input y mostrar mensaje optimista INMEDIATAMENTE
    setNewMessage('')
    setMessages(prev => [...prev, optimisticMessage])
    setIsSending(true)

    // Auto-scroll inmediato y suave
    setTimeout(() => scrollToBottom(true), 50)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.log('❌ [Chat] No hay sesión - redirigiendo al login')
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
        
        // Transformar el mensaje al formato esperado
        const realMessage = {
          id: result.data.id?.toString() || '',
          senderId: result.data.sender?.id?.toString() || '',
          content: result.data.content || '',
          timestamp: result.data.timestamp || '',
          isRead: result.data.isRead || false,
          type: result.data.type || 'texto',
          imageUrl: result.data.imageUrl || undefined,
          sender: {
            id: result.data.sender?.id?.toString() || '',
            name: result.data.sender?.name || 'Usuario',
            lastName: result.data.sender?.lastName || '',
            avatar: result.data.sender?.avatar || undefined
          }
        }
        
        // Reemplazar mensaje temporal con el real (evitar duplicados)
        setMessages(prev => {
          // Verificar si el mensaje real ya existe (por realtime)
          const exists = prev.some(msg => msg.id === realMessage.id)
          if (exists) {
            // Si ya existe, solo remover el mensaje optimista
            return prev.filter(msg => msg.id !== optimisticMessage.id)
          } else {
            // Si no existe, reemplazar el optimista con el real
            return prev.map(msg => msg.id === optimisticMessage.id ? realMessage : msg)
          }
        })
        
      } else {
        const error = await response.json()
        console.error('Error enviando mensaje:', error)
        
        // Revertir mensaje optimista si falla
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
        
        // Mostrar error si no se pudo enviar
        await (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        })
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      
      // Revertir mensaje optimista si hay excepción
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id))
      
      // Mostrar error si hay excepción
      await (window as any).Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al enviar el mensaje. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3B82F6'
      })
    } finally {
      setIsSending(false)
    }
  }

  // Manejar tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Seleccionar imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  // Subir imagen
  const handleImageUpload = async (file: File) => {
    if (!chatId || isUploadingImage) return

    setIsUploadingImage(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const formData = new FormData()
      formData.append('image', file)
      formData.append('chatId', chatId)

      const uploadResponse = await fetch('/api/chat/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json()
        
        // Enviar mensaje con imagen
        const messageResponse = await fetch(`/api/chat/${chatId}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            content: '📷 Imagen',
            type: 'imagen',
            imageUrl: uploadResult.data.publicUrl
          })
        })

        if (messageResponse.ok) {
          const result = await messageResponse.json()
          setMessages(prev => [...prev, result.data])
          
          // Auto-scroll al final
          setTimeout(() => scrollToBottom(true), 100)
        }
      } else {
        const error = await uploadResponse.json()
        console.error('Error subiendo imagen:', error)
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error)
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Formatear tiempo
  const formatTime = (timestamp: string) => {
    if (!timestamp) return 'Sin fecha'
    
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) {
      return 'Fecha inválida'
    }
    
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Verificar si es mi mensaje
  const isMyMessage = (message: ChatMessage) => {
    return message.senderId === currentUser?.user_id?.toString()
  }

  // Componente de avatar con fallback
  const UserAvatar = ({ user, size = 'w-6 h-6' }: { user: any, size?: string }) => {
    const [imageError, setImageError] = useState(false)
    
    // Usar foto_perfil del esquema de base de datos
    const avatarUrl = user?.foto_perfil || user?.avatar
    
    if (avatarUrl && !imageError) {
      return (
        <img
          src={avatarUrl}
          alt={`${user?.nombre || user?.name || 'Usuario'} ${user?.apellido || user?.lastName || ''}`}
          className={`${size} rounded-full object-cover border border-gray-200`}
          onError={() => setImageError(true)}
        />
      )
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center border border-gray-200`}>
        <span className="text-xs font-medium text-white">
          {(user?.nombre || user?.name || 'U').charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    )
  }

  // Si no hay chatInfo, mostrar interfaz básica
  if (!chatInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat no encontrado</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header mejorado */}
      <div className="bg-white shadow-lg border-b border-gray-200 px-4 py-4">
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
                <UserAvatar user={chatInfo.seller} size="w-12 h-12" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${isUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
              
              <div>
                <h1 className="font-bold text-lg text-gray-900">
                  {chatInfo.seller.name} {chatInfo.seller.lastName}
                </h1>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isUserOnline ? 'text-green-600' : 'text-gray-400'}`}>
                    ● {isUserOnline ? 'En línea' : 'Desconectado'}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">Vendedor</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-3 hover:bg-gray-100 rounded-full transition-colors group">
              <PhoneIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            </button>
            <button className="p-3 hover:bg-gray-100 rounded-full transition-colors group">
              <VideoCameraIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            </button>
            <button className="p-3 hover:bg-gray-100 rounded-full transition-colors group">
              <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
            </button>
          </div>
        </div>
        
        {/* Información del producto mejorada */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-4">
            {chatInfo.offeredProduct.imageUrl ? (
              <img
                src={chatInfo.offeredProduct.imageUrl}
                alt={chatInfo.offeredProduct.title}
                className="w-16 h-16 rounded-xl object-cover shadow-md"
                onError={(e) => {
                  // Si la imagen falla, mostrar icono por defecto
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center shadow-md ${chatInfo.offeredProduct.imageUrl ? 'hidden' : ''}`}>
              <ShoppingBagIcon className="w-8 h-8 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📦 Producto
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  💬 Conversación activa
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">{chatInfo.offeredProduct.title}</h3>
              <p className="text-sm text-gray-600">
                Intercambio en proceso con <span className="font-semibold text-blue-600">{chatInfo.seller.name}</span>
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => router.push(`/producto/${chatInfo.offeredProduct.id}`)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                title="Ver producto"
              >
                <EyeIcon className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
              </button>
              <button 
                className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                title="Marcar como favorito"
              >
                <svg className="w-5 h-5 text-green-600 group-hover:text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50/30 chat-messages-container"
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
              Comienza a chatear con <span className="font-semibold text-blue-600">{chatInfo.seller.name}</span> sobre 
              <span className="font-semibold text-gray-800"> "{chatInfo.offeredProduct.title}"</span>
            </p>
            
            {/* Información del producto en la pantalla de bienvenida */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-md shadow-sm">
              <div className="flex items-center space-x-3">
                {chatInfo.offeredProduct.imageUrl ? (
                  <img
                    src={chatInfo.offeredProduct.imageUrl}
                    alt={chatInfo.offeredProduct.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Producto en conversación</h4>
                  <p className="text-sm text-gray-600 truncate">{chatInfo.offeredProduct.title}</p>
                </div>
                <button 
                  onClick={() => router.push(`/producto/${chatInfo.offeredProduct.id}`)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Ver producto completo"
                >
                  <EyeIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Información del producto solicitado si existe */}
            {chatInfo.requestedProduct && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-md shadow-sm">
                <div className="flex items-center space-x-3">
                  {chatInfo.requestedProduct.imageUrl ? (
                    <img
                      src={chatInfo.requestedProduct.imageUrl}
                      alt={chatInfo.requestedProduct.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                      <ShoppingBagIcon className="w-6 h-6 text-orange-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-orange-800 bg-orange-200 px-2 py-1 rounded-full">
                        Producto Solicitado
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">Intercambio por:</h4>
                    <p className="text-sm text-gray-600 truncate">{chatInfo.requestedProduct.title}</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/producto/${chatInfo.requestedProduct.id}`)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Ver producto completo"
                  >
                    <EyeIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 max-w-lg shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Consejos para una buena conversación:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Sé claro sobre lo que buscas</li>
                    <li>• Comparte imágenes si es necesario</li>
                    <li>• Pregunta sobre el estado del producto</li>
                    <li>• Acuerda lugar y forma de intercambio</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-xs lg:max-w-md ${isMyMessage(message) ? 'order-2' : 'order-1'}`}>
              {!isMyMessage(message) && (
                <div className="flex items-center space-x-2 mb-2">
                  <UserAvatar user={message.sender} size="w-6 h-6" />
                  <span className="text-xs font-medium text-gray-700">
                    {message.sender?.name || 'Usuario'}
                  </span>
                </div>
              )}
              
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm ${
                  isMyMessage(message)
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}
              >
                {message.type === 'imagen' && message.imageUrl ? (
                  <div className="space-y-3">
                    <img
                      src={message.imageUrl}
                      alt="Imagen del mensaje"
                      className="max-w-full h-auto rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    />
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>
              
              <div className={`flex items-center space-x-2 mt-2 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
                {isMyMessage(message) && (
                  <div className="flex items-center">
                    {message.isRead ? (
                      <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <CheckIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                )}
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

      {/* Input de mensaje mejorado */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
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
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-xs text-gray-400">
                {newMessage.length}/500
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="w-6 h-6" />
            )}
          </button>
        </div>
        
        {/* Indicador de estado de conexión */}
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Conectado</span>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}