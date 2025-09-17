'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Cargar conversaciones mockup
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockConversations: ChatConversation[] = [
        {
          id: '1',
          user: {
            id: '2',
            name: 'Ana María López',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
            location: 'Medellín, Antioquia',
            isOnline: true,
            lastSeen: 'Ahora'
          },
          lastMessage: 'Perfecto, nos vemos mañana a las 3pm en el centro comercial',
          lastMessageTime: '14:30',
          unreadCount: 2,
          messages: [
            {
              id: '1',
              senderId: '2',
              content: 'Hola Carlos, me interesa tu iPhone 12 Pro',
              timestamp: '14:25',
              isRead: true,
              type: 'text'
            },
            {
              id: '2',
              senderId: '1',
              content: '¡Hola Ana! Claro, está en excelente estado',
              timestamp: '14:26',
              isRead: true,
              type: 'text'
            },
            {
              id: '3',
              senderId: '2',
              content: '¿Podríamos vernos mañana para revisarlo?',
              timestamp: '14:28',
              isRead: true,
              type: 'text'
            },
            {
              id: '4',
              senderId: '1',
              content: 'Perfecto, nos vemos mañana a las 3pm en el centro comercial',
              timestamp: '14:30',
              isRead: false,
              type: 'text'
            }
          ]
        },
        {
          id: '2',
          user: {
            id: '3',
            name: 'Roberto Silva',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
            location: 'Bogotá D.C.',
            isOnline: false,
            lastSeen: 'Hace 2 horas'
          },
          lastMessage: 'Te envío las fotos del libro que te interesa',
          lastMessageTime: '12:15',
          unreadCount: 0,
          messages: [
            {
              id: '1',
              senderId: '3',
              content: 'Hola Carlos, vi que te interesan los libros de literatura colombiana',
              timestamp: '12:10',
              isRead: true,
              type: 'text'
            },
            {
              id: '2',
              senderId: '1',
              content: '¡Hola Roberto! Sí, me encanta la literatura colombiana',
              timestamp: '12:12',
              isRead: true,
              type: 'text'
            },
            {
              id: '3',
              senderId: '3',
              content: 'Te envío las fotos del libro que te interesa',
              timestamp: '12:15',
              isRead: true,
              type: 'text'
            }
          ]
        },
        {
          id: '3',
          user: {
            id: '4',
            name: 'María Fernanda',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
            location: 'Cali, Valle del Cauca',
            isOnline: true,
            lastSeen: 'Ahora'
          },
          lastMessage: 'La guitarra está perfecta, muchas gracias por el intercambio',
          lastMessageTime: '10:45',
          unreadCount: 0,
          messages: [
            {
              id: '1',
              senderId: '4',
              content: 'Hola Carlos, ¿la guitarra sigue disponible?',
              timestamp: '10:30',
              isRead: true,
              type: 'text'
            },
            {
              id: '2',
              senderId: '1',
              content: '¡Hola María! Sí, está disponible',
              timestamp: '10:35',
              isRead: true,
              type: 'text'
            },
            {
              id: '3',
              senderId: '4',
              content: 'La guitarra está perfecta, muchas gracias por el intercambio',
              timestamp: '10:45',
              isRead: true,
              type: 'text'
            }
          ]
        }
      ]

      setConversations(mockConversations)
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0])
      }
      setIsLoading(false)
    }

    loadConversations()
  }, [])

  // Scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser?.id || '1',
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      isRead: false,
      type: 'text'
    }

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: newMessage,
      lastMessageTime: message.timestamp
    }

    setSelectedConversation(updatedConversation)
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation.id ? updatedConversation : conv
      )
    )

    setNewMessage('')
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
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
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
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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

                    <div className={`rounded-lg px-4 py-2 ${isOwnMessage(message)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}>
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
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <MapPinIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>

                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  )
}
