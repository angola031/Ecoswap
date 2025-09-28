'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
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
  product: {
    id: string
    title: string
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Cargar información del chat y mensajes
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) return
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          router.push('/')
          return
        }

        // Obtener usuario actual primero
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: usuario } = await supabase
            .from('usuario')
            .select('user_id, nombre, apellido, foto_perfil')
            .eq('auth_user_id', user.id)
            .single()
          setCurrentUser(usuario)
        }

        // Intentar obtener información del chat
        try {
          const chatResponse = await fetch(`/api/chat/${chatId}/info`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          
          if (chatResponse.ok) {
            const chatData = await chatResponse.json()
            setChatInfo(chatData)
          } else {
            // Si no se puede cargar la info del chat, crear una interfaz básica
            console.log('No se pudo cargar info del chat, creando interfaz básica')
            setChatInfo({
              chatId: chatId,
              seller: {
                id: 'unknown',
                name: 'Vendedor',
                lastName: '',
                avatar: null
              },
              product: {
                id: 'unknown',
                title: 'Producto',
                imageUrl: null
              }
            })
          }
        } catch (error) {
          console.log('Error cargando info del chat:', error)
          // Crear interfaz básica si hay error
          setChatInfo({
            chatId: chatId,
            seller: {
              id: 'unknown',
              name: 'Vendedor',
              lastName: '',
              avatar: null
            },
            product: {
              id: 'unknown',
              title: 'Producto',
              imageUrl: null
            }
          })
        }

        // Intentar obtener mensajes
        try {
          const messagesResponse = await fetch(`/api/chat/${chatId}/messages?limit=100`, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            setMessages(messagesData.items || [])
            
            // Marcar mensajes como leídos
            if (messagesData.items?.length > 0) {
              await fetch(`/api/chat/${chatId}/mark-read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${session.access_token}` }
              })
            }
          }
        } catch (error) {
          console.log('Error cargando mensajes:', error)
          // Continuar sin mensajes si hay error
        }

      } catch (error) {
        console.error('Error general cargando chat:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChat()
  }, [chatId, router])

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !chatId) return

    setIsSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/chat/${chatId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'texto'
        })
      })

      if (response.ok) {
        const result = await response.json()
        setMessages(prev => [...prev, result.data])
        setNewMessage('')
        
        // Auto-scroll al final
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        const error = await response.json()
        console.error('Error enviando mensaje:', error)
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
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
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
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
    const date = new Date(timestamp)
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
    
    if (user?.avatar && !imageError) {
      return (
        <img
          src={user.avatar}
          alt={`${user.name || 'Usuario'} ${user.lastName || ''}`}
          className={`${size} rounded-full object-cover border border-gray-200`}
          onError={() => setImageError(true)}
        />
      )
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center border border-gray-200`}>
        <span className="text-xs font-medium text-white">
          {(user?.name || 'U').charAt(0).toUpperCase()}
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
              {chatInfo.seller.avatar ? (
                <div className="relative">
                  <img
                    src={chatInfo.seller.avatar}
                    alt={`${chatInfo.seller.name} ${chatInfo.seller.lastName}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                    <UserIcon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              )}
              
              <div>
                <h1 className="font-bold text-lg text-gray-900">
                  {chatInfo.seller.name} {chatInfo.seller.lastName}
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600 font-medium">● En línea</span>
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
            {chatInfo.product.imageUrl ? (
              <img
                src={chatInfo.product.imageUrl}
                alt={chatInfo.product.title}
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingBagIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📦 Producto
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  💬 Conversación activa
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">{chatInfo.product.title}</h3>
              <p className="text-sm text-gray-600">
                Intercambio en proceso con <span className="font-semibold text-blue-600">{chatInfo.seller.name}</span>
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => router.push(`/producto/${chatInfo.product.id}`)}
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
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gradient-to-b from-transparent to-gray-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
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
              <span className="font-semibold text-gray-800"> "{chatInfo.product.title}"</span>
            </p>
            
            {/* Información del producto en la pantalla de bienvenida */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 max-w-md shadow-sm">
              <div className="flex items-center space-x-3">
                {chatInfo.product.imageUrl ? (
                  <img
                    src={chatInfo.product.imageUrl}
                    alt={chatInfo.product.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Producto en conversación</h4>
                  <p className="text-sm text-gray-600 truncate">{chatInfo.product.title}</p>
                </div>
                <button 
                  onClick={() => router.push(`/producto/${chatInfo.product.id}`)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Ver producto completo"
                >
                  <EyeIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
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
  )
}