'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ChatInfo, ChatMessage, ChatProposal } from '@/lib/types/chat'
import ProposalModal from '@/components/chat/ProposalModal'
import AuthGuard from '@/components/auth/AuthGuard'

function ChatPageContent() {
  const params = useParams()
  const router = useRouter()
  const chatId = params?.chatId as string
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [proposals, setProposals] = useState<ChatProposal[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  
  // Función auxiliar para obtener el ID del usuario actual
  const getCurrentUserId = () => {
    return currentUserId
  }

  // Función helper para evitar mensajes duplicados
  const addMessageIfNotExists = (messages: ChatMessage[], newMessage: ChatMessage): ChatMessage[] => {
    const exists = messages.some(msg => msg.id === newMessage.id)
    if (exists) {
      console.log('⚠️ [ChatPage] Mensaje duplicado detectado, ignorando:', newMessage.id)
      return messages
    }
    return [...messages, newMessage].sort((a, b) => Number(a.id) - Number(b.id))
  }

  // Cargar información del usuario actual
  useEffect(() => {
    let isMounted = true
    
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (isMounted && user) {
          // Obtener el user_id de la tabla usuario
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            const response = await fetch('/api/users/me', {
              headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (response.ok) {
              const userData = await response.json()
              setCurrentUserId(String(userData.user_id))
              setCurrentUserInfo(userData)
              console.log('👤 [ChatPage] Usuario actual establecido:', userData.user_id, userData)
              console.log('🖼️ [ChatPage] Foto del usuario:', userData.foto_perfil)
            } else {
              // Fallback al auth user ID si no se puede obtener el user_id
              setCurrentUserId(user.id)
              setCurrentUserInfo({ user_id: user.id, nombre: 'Usuario', apellido: '', foto_perfil: null })
              console.log('👤 [ChatPage] Usando auth user ID como fallback:', user.id)
            }
          } else {
            setCurrentUserId(user.id)
            setCurrentUserInfo({ user_id: user.id, nombre: 'Usuario', apellido: '', foto_perfil: null })
            console.log('👤 [ChatPage] Usando auth user ID:', user.id)
          }
        }
      } catch (error) {
        console.error('Error obteniendo usuario actual:', error)
        if (isMounted) {
          setError('Error de autenticación')
        }
      }
    }
    
    getCurrentUser()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Cargar información del chat
  useEffect(() => {
    let isMounted = true
    
    const loadChatInfo = async () => {
      if (!chatId || !currentUserId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Obtener token de sesión
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No hay sesión activa')
        }
        
        const response = await fetch(`/api/chat/${chatId}/info`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Error cargando información del chat')
        }
        
        if (isMounted) {
          console.log('📦 [ChatPage] Información del chat cargada:', data.data)
          setChatInfo(data.data)
        }
      } catch (error) {
        console.error('Error cargando información del chat:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Error desconocido')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadChatInfo()
    
    return () => {
      isMounted = false
    }
  }, [chatId, currentUserId])

  // Cargar mensajes del chat con sistema híbrido (realtime + polling)
  useEffect(() => {
    let isMounted = true
    
    const loadMessages = async () => {
      if (!chatId || !currentUserId || !isMounted) return
      
      try {
        console.log('📨 [ChatPage] Cargando mensajes para chat:', chatId)
        
        // Obtener token de sesión
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          console.log('❌ [ChatPage] No hay token para cargar mensajes')
          return
        }
        
        const response = await fetch(`/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        console.log('📨 [ChatPage] Respuesta de mensajes:', { status: response.status, ok: response.ok })
        
        if (response.ok && isMounted) {
          const data = await response.json()
          const messagesData = data.items || data.data || []
          
          console.log('📨 [ChatPage] Mensajes cargados:', messagesData.length)
          
          // Transformar mensajes al formato esperado
          const transformedMessages = messagesData.map((msg: any) => ({
            id: String(msg.mensaje_id),
            senderId: String(msg.usuario_id),
            content: msg.contenido || '',
            timestamp: new Date(msg.fecha_envio).toLocaleString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit'
            }),
            isRead: msg.leido,
            type: msg.tipo === 'imagen' ? 'image' : msg.tipo === 'ubicacion' ? 'location' : 'texto',
            metadata: msg.archivo_url ? { imageUrl: msg.archivo_url } : undefined,
            sender: {
              id: String(msg.usuario?.user_id || msg.usuario_id),
              name: msg.usuario?.nombre || 'Usuario',
              lastName: msg.usuario?.apellido || '',
              avatar: msg.usuario?.foto_perfil || undefined
            }
          }))
          
          // Ordenar mensajes por ID (del más antiguo al más reciente)
          const sortedMessages = transformedMessages.sort((a, b) => Number(a.id) - Number(b.id))
          
          console.log('📨 [ChatPage] Mensajes ordenados:', sortedMessages.length, 'primer mensaje ID:', sortedMessages[0]?.id, 'último mensaje ID:', sortedMessages[sortedMessages.length - 1]?.id)
          
          setMessages(sortedMessages)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          console.error('❌ [ChatPage] Error cargando mensajes:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          if (isMounted) {
            setError(errorData.error || 'Error cargando mensajes')
          }
        }
      } catch (error) {
        console.error('❌ [ChatPage] Error cargando mensajes:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Error cargando mensajes')
        }
      }
    }
    
    loadMessages()
    
    return () => {
      isMounted = false
    }
  }, [chatId, currentUserId])

  // Cargar propuestas del chat
  useEffect(() => {
    let isMounted = true
    
    const loadProposals = async () => {
      if (!chatId || !currentUserId) return
      
      try {
        // Obtener token de sesión
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No hay sesión activa')
        }
        
        const response = await fetch(`/api/chat/${chatId}/proposals`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Error cargando propuestas')
        }
        
        if (isMounted) {
          setProposals(data.data || [])
        }
      } catch (error) {
        console.error('Error cargando propuestas:', error)
        // No establecemos error aquí porque las propuestas son opcionales
      }
    }
    
    loadProposals()
    
    return () => {
      isMounted = false
    }
  }, [chatId, currentUserId])

  // Sistema de realtime para mensajes instantáneos
  useEffect(() => {
    // Limpiar canal anterior
    if (realtimeChannel) {
      console.log('🔌 [ChatPage] Removiendo canal realtime anterior')
      supabase.removeChannel(realtimeChannel)
      setRealtimeChannel(null)
    }

    const chatIdNum = Number(chatId)
    if (!chatIdNum || !currentUserId) {
      console.log('⚠️ [ChatPage] No hay chatId o currentUserId para realtime')
      return
    }

    console.log('🔗 [ChatPage] Configurando realtime para chat:', chatIdNum)

    // Crear canal más simple y directo
    const channel = supabase
      .channel(`chat_${chatIdNum}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensaje',
        filter: `chat_id=eq.${chatIdNum}`
      }, (payload: any) => {
        console.log('📨 [ChatPage] Nuevo mensaje realtime recibido:', payload)
        
        const m = payload.new
        if (!m) return

        const messageId = String(m.mensaje_id)
        const currentUserIdStr = getCurrentUserId()
        
        // No procesar nuestros propios mensajes
        if (String(m.usuario_id) === currentUserIdStr) {
          console.log('⚠️ [ChatPage] Ignorando mensaje propio en realtime:', messageId)
          return
        }

        // Verificar si el mensaje ya existe
        const messageExists = messages.some(msg => msg.id === messageId)
        if (messageExists) {
          console.log('⚠️ [ChatPage] Mensaje ya existe, ignorando:', messageId)
          return
        }

        // Verificar si el mensaje es muy reciente (menos de 5 segundos) para evitar duplicados con polling
        const messageTime = new Date(m.fecha_envio).getTime()
        const now = Date.now()
        if (now - messageTime < 5000) {
          console.log('⚠️ [ChatPage] Mensaje muy reciente, posible duplicado con polling, ignorando:', messageId)
          return
        }

        // Crear mensaje con información básica (sin hacer fetch adicional)
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
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'texto',
          metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
          sender: {
            id: String(m.usuario_id),
            name: 'Usuario',
            lastName: '',
            avatar: undefined
          }
        }

        console.log('✅ [ChatPage] Agregando mensaje realtime:', incoming)

        // Actualizar mensajes usando función helper para evitar duplicados
        setMessages(prev => addMessageIfNotExists(prev, incoming))

        // Scroll automático al final
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end' 
            })
          }
        }, 100)
      })
      .subscribe((status) => {
        console.log('🔌 [ChatPage] Estado realtime:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ [ChatPage] Realtime conectado exitosamente para chat:', chatIdNum)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [ChatPage] Error en canal realtime para chat:', chatIdNum)
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [ChatPage] Timeout en canal realtime para chat:', chatIdNum)
        } else if (status === 'CLOSED') {
          console.log('🔌 [ChatPage] Canal realtime cerrado para chat:', chatIdNum)
        }
      })

    setRealtimeChannel(channel)

    return () => {
      console.log('🔌 [ChatPage] Limpiando canal realtime para chat:', chatIdNum)
      if (channel) {
        supabase.removeChannel(channel)
      }
      setRealtimeChannel(null)
    }
  }, [chatId, currentUserId])

  // Sistema de polling como respaldo para mensajes
  useEffect(() => {
    if (!chatId || !currentUserId) return

    const chatIdNum = Number(chatId)
    let lastMessageId = messages.length > 0 
      ? Number(messages[messages.length - 1].id)
      : 0

    const pollForNewMessages = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch(`/api/chat/${chatIdNum}/messages?since=${lastMessageId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })

        if (response.ok) {
          const data = await response.json()
          const newMessages = data.items || []
          
          if (newMessages.length > 0) {
            console.log('📨 [ChatPage] Polling: Nuevos mensajes encontrados:', newMessages.length)
            
            const transformedMessages = newMessages
              .filter((m: any) => {
                const messageId = Number(m.mensaje_id)
                const currentUserIdStr = getCurrentUserId()
                
                // No procesar nuestros propios mensajes
                if (String(m.usuario_id) === currentUserIdStr) {
                  return false
                }
                
                // Solo mensajes más nuevos que el último
                if (messageId <= lastMessageId) {
                  return false
                }
                
                // Verificar si el mensaje ya existe en el estado actual
                const messageExists = messages.some(msg => msg.id === String(messageId))
                if (messageExists) {
                  return false
                }
                
                return true
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
                type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'texto',
                metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
                sender: {
                  id: String(m.usuario?.user_id || m.usuario_id),
                  name: m.usuario?.nombre || 'Usuario',
                  lastName: m.usuario?.apellido || '',
                  avatar: m.usuario?.foto_perfil || undefined
                }
              }))

            if (transformedMessages.length > 0) {
              console.log('✅ [ChatPage] Polling: Agregando mensajes:', transformedMessages.length)
              
              setMessages(prev => {
                let updatedMessages = prev
                // Agregar cada mensaje individualmente para evitar duplicados
                transformedMessages.forEach(msg => {
                  updatedMessages = addMessageIfNotExists(updatedMessages, msg)
                })
                return updatedMessages
              })

              // Actualizar último mensaje ID
              lastMessageId = Math.max(...transformedMessages.map(m => Number(m.id)))
            }
          }
        }
      } catch (error) {
        console.log('⚠️ [ChatPage] Error en polling:', error)
      }
    }

    // Polling cada 3 segundos como respaldo
    const pollInterval = setInterval(pollForNewMessages, 3000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [chatId, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserId) {
      console.log('❌ [ChatPage] No se puede enviar mensaje:', {
        hasMessage: !!newMessage.trim(),
        hasChatId: !!chatId,
        hasCurrentUserId: !!currentUserId
      })
      return
    }
    
    const messageContent = newMessage.trim()
    setNewMessage('')
    
    console.log('📤 [ChatPage] Enviando mensaje:', {
      chatId,
      currentUserId,
      messageContent
    })
    
    // Optimistic UI - agregar mensaje inmediatamente
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      type: 'texto',
      sender: {
        id: currentUserId,
        name: currentUserInfo?.nombre || 'Tú',
        lastName: currentUserInfo?.apellido || '',
        avatar: currentUserInfo?.foto_perfil || undefined
      }
    }
    
    console.log('🖼️ [ChatPage] Avatar en mensaje temporal:', {
      currentUserInfo: currentUserInfo,
      foto_perfil: currentUserInfo?.foto_perfil,
      avatar: tempMessage.sender.avatar
    })
    
    setMessages(prev => {
      const combined = [...prev, tempMessage]
      // Ordenar todos los mensajes por ID para mantener el orden correcto
      return combined.sort((a, b) => Number(a.id) - Number(b.id))
    })
    
    // Scroll inmediato al final
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'end' 
        })
      }
    }, 0)
    
    try {
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Usar AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contenido: messageContent,
          tipo: 'texto'
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('📨 [ChatPage] Respuesta de envío:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ [ChatPage] Error en respuesta:', errorData)
        throw new Error(errorData.error || 'Error enviando mensaje')
      }
      
      const data = await response.json()
      console.log('✅ [ChatPage] Mensaje enviado exitosamente:', data)
      
      // Reemplazar mensaje temporal con el real
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === tempMessage.id 
            ? {
                id: String(data.message.mensaje_id),
                senderId: String(data.message.usuario_id),
                content: data.message.contenido,
                timestamp: new Date(data.message.fecha_envio).toLocaleString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                }),
                isRead: data.message.leido,
                type: data.message.tipo === 'imagen' ? 'image' : data.message.tipo === 'ubicacion' ? 'location' : 'texto',
                metadata: data.message.archivo_url ? { imageUrl: data.message.archivo_url } : undefined,
                sender: {
                  id: currentUserId,
                  name: currentUserInfo?.nombre || 'Tú',
                  lastName: currentUserInfo?.apellido || '',
                  avatar: currentUserInfo?.foto_perfil || undefined
                }
              }
            : msg
        )
        // Ordenar todos los mensajes por ID para mantener el orden correcto
        return updated.sort((a, b) => Number(a.id) - Number(b.id))
      })
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      
      // Solo remover mensaje temporal si no es un AbortError
      if (error instanceof Error && error.name !== 'AbortError') {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        setNewMessage(messageContent) // Restaurar mensaje
      }
    }
  }

  const handleSubmitProposal = async (proposalData: any) => {
    if (!chatId || !currentUserId) return

    setIsSubmittingProposal(true)
    
    try {
      const response = await fetch(`/api/chat/${chatId}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(proposalData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error enviando propuesta')
      }

      // Actualizar lista de propuestas
      setProposals(prev => [data.data, ...prev])
      
      // Mostrar mensaje de éxito
      const successMessage: ChatMessage = {
        id: `proposal-${Date.now()}`,
        senderId: 'system',
        content: `Has enviado una propuesta de ${proposalData.type}`,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        isRead: true,
        type: 'propuesta',
        sender: {
          id: currentUserId,
          name: 'Sistema',
          lastName: '',
          avatar: undefined
        }
      }
      
      setMessages(prev => [...prev, successMessage])
      
    } catch (error) {
      console.error('Error enviando propuesta:', error)
      throw error
    } finally {
      setIsSubmittingProposal(false)
    }
  }

  const handleNegotiate = () => {
    // Abrir modal de propuesta para negociación
    setShowProposalModal(true)
    
    // Agregar mensaje informativo al chat
    const negotiateMessage: ChatMessage = {
      id: `negotiate-${Date.now()}`,
      senderId: currentUserId,
      content: '🔄 Iniciando negociación...',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'texto',
      sender: {
        id: currentUserId,
        name: 'Tú',
        lastName: '',
        avatar: undefined
      }
    }
    
    setMessages(prev => [...prev, negotiateMessage])
  }

  const handleAccept = () => {
    // Agregar mensaje de aceptación al chat
    const acceptMessage: ChatMessage = {
      id: `accept-${Date.now()}`,
      senderId: currentUserId,
      content: '✅ Has aceptado el intercambio',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'texto',
      sender: {
        id: currentUserId,
        name: 'Tú',
        lastName: '',
        avatar: undefined
      }
    }
    
    setMessages(prev => [...prev, acceptMessage])
    
    // Aquí puedes implementar lógica adicional para actualizar el estado del intercambio
    console.log('Intercambio aceptado por el usuario')
  }

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay información del chat
  if (!chatInfo) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar la información del chat</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* HEADER - Producto + Vendedor */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  console.log('🔙 [ChatPage] Botón volver presionado')
                  console.log('📦 [ChatPage] chatInfo:', chatInfo)
                  console.log('📦 [ChatPage] offeredProduct:', chatInfo?.offeredProduct)
                  
                  // Intentar obtener el ID del producto de diferentes maneras
                  let productId = null
                  
                  if (chatInfo?.offeredProduct?.producto_id) {
                    productId = chatInfo.offeredProduct.producto_id
                    console.log('✅ [ChatPage] Product ID desde producto_id:', productId)
                  } else if (chatInfo?.offeredProduct?.id) {
                    productId = chatInfo.offeredProduct.id
                    console.log('✅ [ChatPage] Product ID desde id:', productId)
                  } else if (chatInfo?.intercambio?.producto_ofrecido_id) {
                    productId = chatInfo.intercambio.producto_ofrecido_id
                    console.log('✅ [ChatPage] Product ID desde intercambio:', productId)
                  }
                  
                  console.log('🆔 [ChatPage] Product ID final:', productId)
                  
                  if (productId) {
                    console.log('✅ [ChatPage] Redirigiendo a producto:', productId)
                    router.push(`/producto/${productId}`)
                  } else {
                    console.log('⚠️ [ChatPage] No se encontró product ID, redirigiendo a productos')
                    // En lugar de router.back(), redirigir a la página principal con módulo de productos
                    router.push('/?m=products')
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver al producto"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={chatInfo.seller.avatar || '/default-avatar.png'}
                    alt={`${chatInfo.seller.name} ${chatInfo.seller.lastName}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {chatInfo.seller.name} {chatInfo.seller.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">En línea</p>
                  {chatInfo.seller.location && (
                    <p className="text-xs text-gray-400">{chatInfo.seller.location}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title={showSidebar ? "Ocultar sidebar" : "Mostrar sidebar"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL - Sidebar + Chat */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (Opcional) */}
        {showSidebar && (
          <motion.div 
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Detalles del Intercambio</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Información del vendedor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Vendedor</h4>
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={chatInfo.seller.avatar || '/default-avatar.png'}
                    alt={`${chatInfo.seller.name} ${chatInfo.seller.lastName}`}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {chatInfo.seller.name} {chatInfo.seller.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{chatInfo.seller.location || 'Ubicación no disponible'}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-yellow-600">★</span>
                      <span className="text-xs text-gray-600">{chatInfo.seller.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Calificación:</span>
                    <span className="font-medium">{chatInfo.seller.rating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Intercambios:</span>
                    <span className="font-medium">{chatInfo.seller.totalExchanges}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Miembro desde:</span>
                    <span className="font-medium">{chatInfo.seller.memberSince}</span>
                  </div>
                </div>
              </div>

              {/* Información del producto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Producto</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Título:</span>
                    <span className="font-medium text-right">{chatInfo.offeredProduct.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium">{chatInfo.offeredProduct.type}</span>
                  </div>
                  {chatInfo.offeredProduct.price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-medium">${chatInfo.offeredProduct.price.toLocaleString()} COP</span>
                    </div>
                  )}
                  {chatInfo.offeredProduct.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="font-medium">{chatInfo.offeredProduct.category}</span>
                    </div>
                  )}
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
          </motion.div>
        )}

        {/* CHAT (Centrado y Limitado) */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 flex justify-center overflow-hidden">
            <div className="w-full max-w-4xl flex flex-col">
              {/* Chat Box - Mensajes */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>No hay mensajes aún</p>
                      <p className="text-sm">¡Inicia la conversación!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === currentUserId
                    console.log('💬 [ChatPage] Renderizando mensaje:', {
                      messageId: message.id,
                      senderId: message.senderId,
                      currentUserId: currentUserId,
                      isOwnMessage: isOwnMessage
                    })
                    
                    return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <img
                          src={message.sender.avatar || '/default-avatar.png'}
                          alt={`${message.sender.name} ${message.sender.lastName}`}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                          onError={(e) => {
                            console.log('❌ [ChatPage] Error cargando imagen:', {
                              src: e.currentTarget.src,
                              messageId: message.id,
                              senderId: message.senderId,
                              avatar: message.sender.avatar
                            })
                            e.currentTarget.src = '/default-avatar.png'
                          }}
                          onLoad={() => {
                            console.log('✅ [ChatPage] Imagen cargada exitosamente:', {
                              src: message.sender.avatar,
                              messageId: message.id
                            })
                          }}
                        />
                        <div className={`px-4 py-2 rounded-2xl ${isOwnMessage 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
                              {message.timestamp}
                            </p>
                            {isOwnMessage && (
                              <div className={`w-2 h-2 rounded-full ${message.isRead ? 'bg-green-300' : 'bg-gray-400'}`}></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* SECCIÓN DE PROPUESTA */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 px-6 py-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">💰 Sesión de Propuesta</h3>
                  <p className="text-sm text-gray-600">Gestiona las propuestas del intercambio</p>
                </div>
                
                <div className="flex items-center justify-center flex-wrap gap-4">
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span className="text-xl">💰</span>
                    <span className="font-semibold">Enviar Propuesta</span>
                  </button>
                  
                  <button
                    onClick={() => handleNegotiate()}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span className="text-xl">🔄</span>
                    <span className="font-semibold">Negociar</span>
                  </button>
                  
                  <button
                    onClick={() => handleAccept()}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <span className="text-xl">✅</span>
                    <span className="font-semibold">Aceptar</span>
                  </button>
                </div>
              </div>

              {/* Input de mensaje */}
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-end space-x-3">
                  <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <div className="flex-1">
                    <textarea
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
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Propuesta */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Hacer Propuesta</h2>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Propuesta</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Precio</option>
                    <option>Intercambio</option>
                    <option>Encuentro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <textarea
                    placeholder="Describe tu propuesta..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setShowProposalModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setShowProposalModal(false)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Enviar Propuesta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Propuesta */}
      <ProposalModal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        onSubmit={handleSubmitProposal}
        isLoading={isSubmittingProposal}
      />
    </div>
  )
}

export default function ChatPageRedesign() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  )
}