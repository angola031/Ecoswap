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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  

  // Cargar información del usuario actual
  useEffect(() => {
    let isMounted = true
    
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (isMounted && user) {
          setCurrentUserId(user.id)
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

  // Cargar mensajes del chat
  useEffect(() => {
    let isMounted = true
    
    const loadMessages = async () => {
      if (!chatId || !currentUserId) return
      
      try {
        // Obtener token de sesión
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No hay sesión activa')
        }
        
        const response = await fetch(`/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Error cargando mensajes')
        }
        
        if (isMounted) {
          setMessages(data.data || [])
        }
      } catch (error) {
        console.error('Error cargando mensajes:', error)
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserId) return
    
    const messageContent = newMessage.trim()
    setNewMessage('')
    
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
        name: 'Tú',
        lastName: '',
        avatar: undefined
      }
    }
    
    setMessages(prev => [...prev, tempMessage])
    
    try {
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
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
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error enviando mensaje')
      }
      
      // Reemplazar mensaje temporal con el real
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id 
            ? {
                ...data.data,
                timestamp: new Date(data.data.fecha_envio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              }
            : msg
        )
      )
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      // Remover mensaje temporal en caso de error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      setNewMessage(messageContent) // Restaurar mensaje
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
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
          
          {/* Información del producto */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <img
                src={chatInfo.offeredProduct.mainImage || '/default-product.png'}
                alt={chatInfo.offeredProduct.title}
                className="w-16 h-16 rounded-lg object-cover border border-blue-200"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{chatInfo.offeredProduct.title}</h3>
                {chatInfo.offeredProduct.price && (
                  <p className="text-sm text-gray-600">
                    ${chatInfo.offeredProduct.price.toLocaleString()} COP
                  </p>
                )}
                <p className="text-xs text-blue-600">
                  {chatInfo.offeredProduct.category || chatInfo.offeredProduct.type}
                </p>
                {chatInfo.offeredProduct.precio_negociable && (
                  <p className="text-xs text-green-600 font-medium">Precio negociable</p>
                )}
              </div>
            </div>
            
            {/* Producto solicitado si existe */}
            {chatInfo.requestedProduct && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Intercambio por:</p>
                <div className="flex items-center space-x-3">
                  <img
                    src={chatInfo.requestedProduct.mainImage || '/default-product.png'}
                    alt={chatInfo.requestedProduct.title}
                    className="w-12 h-12 rounded-lg object-cover border border-blue-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{chatInfo.requestedProduct.title}</p>
                    <p className="text-xs text-blue-600">
                      {chatInfo.requestedProduct.category || chatInfo.requestedProduct.type}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.senderId === currentUserId ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <img
                          src={message.sender.avatar || '/default-avatar.png'}
                          alt={`${message.sender.name} ${message.sender.lastName}`}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div className={`px-4 py-2 rounded-2xl ${message.senderId === currentUserId 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className={`text-xs ${message.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'}`}>
                              {message.timestamp}
                            </p>
                            {message.senderId === currentUserId && (
                              <div className={`w-2 h-2 rounded-full ${message.isRead ? 'bg-blue-300' : 'bg-gray-400'}`}></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* SECCIÓN DE PROPUESTA */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 px-6 py-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Sección de Propuesta</h3>
                  <p className="text-sm text-gray-600">Gestiona las propuestas del intercambio</p>
                </div>
                
                <div className="flex items-center justify-center flex-wrap gap-3">
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">💰 Enviar Propuesta</span>
                  </button>
                  
                  <button
                    onClick={() => setShowProposalModal(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="font-semibold">🔄 Negociar</span>
                  </button>
                  
                  <button
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">✅ Aceptar</span>
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