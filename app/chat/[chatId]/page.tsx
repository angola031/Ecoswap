'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  CheckIcon,
  CheckCircleIcon,
  PhotoIcon
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

        // Obtener información del chat
        const chatResponse = await fetch(`/api/chat/${chatId}/info`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        
        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          setChatInfo(chatData)
        }

        // Obtener mensajes
        const messagesResponse = await fetch(`/api/chat/${chatId}/messages?limit=100`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.items || [])
          
          // Marcar mensajes como leídos
          await fetch(`/api/chat/${chatId}/mark-read`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({})
          })
        }

        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: usuario } = await supabase
            .from('usuario')
            .select('user_id, nombre, apellido, foto_perfil')
            .eq('auth_user_id', user.id)
            .single()
          
          if (usuario) {
            setCurrentUser(usuario)
          }
        }

      } catch (error) {
        console.error('Error cargando chat:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChat()
  }, [chatId, router])

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Manejar selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (!chatInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat no encontrado</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center space-x-3 flex-1">
            <img
              src={chatInfo.seller.avatar || '/default-avatar.png'}
              alt={`${chatInfo.seller.name} ${chatInfo.seller.lastName}`}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h1 className="font-semibold text-gray-900">
                {chatInfo.seller.name} {chatInfo.seller.lastName}
              </h1>
              <p className="text-sm text-gray-500">{chatInfo.product.title}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${isMyMessage(message) ? 'order-2' : 'order-1'}`}>
              {!isMyMessage(message) && (
                <div className="flex items-center space-x-2 mb-1">
                  <img
                    src={message.sender.avatar || '/default-avatar.png'}
                    alt={`${message.sender.name} ${message.sender.lastName}`}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs text-gray-500">
                    {message.sender.name} {message.sender.lastName}
                  </span>
                </div>
              )}
              
              <div
                className={`px-4 py-2 rounded-lg ${
                  isMyMessage(message)
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                {message.type === 'imagen' && message.imageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={message.imageUrl}
                      alt="Imagen del mensaje"
                      className="max-w-full h-auto rounded-lg cursor-pointer"
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    />
                    <p className="text-sm">{message.content}</p>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
              
              <div className={`flex items-center space-x-1 mt-1 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
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
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-3">
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingImage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
            ) : (
              <PhotoIcon className="w-5 h-5" />
            )}
          </button>
          
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
