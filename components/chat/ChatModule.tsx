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
}

interface ChatConversation {
  id: string
  user: ChatUser
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
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

  // Cargar conversaciones reales
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const res = await fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
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
        if (list.length > 0) setSelectedConversation(list[0])
      } catch {
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
        if (!chatId) return
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) return
        const res = await fetch(`/api/chat/${chatId}/messages?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error cargando mensajes')
        const messages: ChatMessage[] = (json.items || []).map((m: any) => ({
          id: String(m.mensaje_id),
          senderId: String(m.usuario_id),
          content: m.contenido || '',
          timestamp: new Date(m.fecha_envio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          isRead: m.leido,
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
          metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
        }))
        setSelectedConversation(prev => prev ? { ...prev, messages } : prev)
        setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, messages } : c))

        // Marcar como leídos
        const readRes = await fetch(`/api/chat/${chatId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
        if (readRes.ok) {
          setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, unreadCount: 0 } : c))
        }
      } catch {
        // noop
      }
    }
    loadMessages()
  }, [selectedConversation?.id])

  // Realtime: suscripción a nuevos mensajes del chat seleccionado
  useEffect(() => {
    const chatId = Number(selectedConversation?.id)
    if (!chatId) return
    const channel = supabase
      .channel(`realtime:chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'MENSAJE',
        filter: `chat_id=eq.${chatId}`
      }, (payload: any) => {
        const m = payload.new
        if (!m) return
        const incoming: ChatMessage = {
          id: String(m.mensaje_id),
          senderId: String(m.usuario_id),
          content: m.contenido || '',
          timestamp: new Date(m.fecha_envio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
          isRead: m.leido,
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
          metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
        }
        setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, incoming], lastMessage: incoming.content || incoming.type, lastMessageTime: incoming.timestamp } : prev)
        setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, lastMessage: incoming.content || incoming.type, lastMessageTime: incoming.timestamp } : c))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConversation?.id])

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    // Verificar si el usuario está verificado
    const { isUserVerified } = await import('@/lib/auth')
    const isVerified = await isUserVerified()
    
    if (!isVerified) {
      // Mostrar mensaje de verificación requerida
      const result = await (window as any).Swal.fire({
        title: 'Verificación Requerida',
        text: 'Por favor, primero verifica tu cuenta para poder enviar mensajes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ir a Verificación',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280'
      })
      
      if (result.isConfirmed) {
        router.push('/verificacion-identidad')
      }
      return
    }
    
    try {
      const chatId = Number(selectedConversation.id)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenido: newMessage, tipo: 'texto' })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error al enviar')
      const m = json.message
      const message: ChatMessage = {
        id: String(m.mensaje_id),
        senderId: String(m.usuario_id),
        content: m.contenido || '',
        timestamp: new Date(m.fecha_envio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        isRead: m.leido,
        type: 'text'
      }
      const updatedConversation = {
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
        lastMessage: message.content,
        lastMessageTime: message.timestamp
      }
      setSelectedConversation(updatedConversation)
      setConversations(prev => prev.map(conv => conv.id === selectedConversation.id ? updatedConversation : conv))
      setNewMessage('')
      setReplyToMessageId(null)
    } catch {
      // noop
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
    return message.senderId === currentUser?.id
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
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
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
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
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

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message) => (
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
                        src={selectedConversation.user.avatar}
                        alt={selectedConversation.user.name}
                        className="w-8 h-8 rounded-full mb-2"
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
              ))}
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
