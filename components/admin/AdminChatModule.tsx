'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface ChatMessage {
    id: number
    chatId: number
    senderId: number
    senderName: string
    senderAvatar: string
    content: string
    type: string
    fileUrl?: string
    isRead: boolean
    timestamp: string
    isAdmin: boolean
}

interface ChatConversation {
    id: number
    intercambioId: number
    participantes: Array<{
        id: number
        nombre: string
        email: string
        avatar: string
        activo: boolean
        verificado: boolean
    }>
    lastMessage?: {
        contenido: string
        tipo: string
        fecha: string
        esAdmin: boolean
    }
    unreadCount: number
    estado: string
    fechaCreacion: string
}

interface AdminChatModuleProps {
    onClose?: () => void
}

export default function AdminChatModule({ onClose }: AdminChatModuleProps) {
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const loadConversations = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch('/api/admin/chat/conversations', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error cargando conversaciones')

            setConversations(data.conversations || [])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const loadMessages = async (chatId: number) => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch(`/api/admin/chat/${chatId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error cargando mensajes')

            setMessages(data.messages || [])
        } catch (e: any) {
            setError(e.message)
        }
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch('/api/admin/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: selectedConversation.id,
                    contenido: newMessage.trim(),
                    tipo: 'texto'
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error enviando mensaje')

            // Agregar mensaje a la lista local
            const newMsg: ChatMessage = {
                id: data.message.mensaje_id,
                chatId: selectedConversation.id,
                senderId: data.message.usuario_id,
                senderName: 'Administrador',
                senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                content: newMessage.trim(),
                type: 'texto',
                isRead: false,
                timestamp: new Date().toISOString(),
                isAdmin: true
            }

            setMessages(prev => [...prev, newMsg])
            setNewMessage('')

            // Actualizar última conversación
            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversation.id
                    ? { ...conv, lastMessage: { contenido: newMessage.trim(), tipo: 'texto', fecha: new Date().toISOString(), esAdmin: true } }
                    : conv
            ))

        } catch (e: any) {
            setError(e.message)
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const selectConversation = (conversation: ChatConversation) => {
        setSelectedConversation(conversation)
        loadMessages(conversation.id)
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Ahora'
        if (minutes < 60) return `${minutes}m`
        if (hours < 24) return `${hours}h`
        if (days < 7) return `${days}d`
        return date.toLocaleDateString('es-CO')
    }

    useEffect(() => {
        loadConversations()
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (textareaRef.current) {
            const el = textareaRef.current
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
        }
    }, [newMessage])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando conversaciones...</span>
            </div>
        )
    }

    return (
        <div className="h-full flex bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Lista de conversaciones */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Conversaciones</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>No hay conversaciones</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedConversation?.id === conv.id ? 'bg-blue-50 border-blue-200' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                {conv.participantes[0]?.nombre?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {conv.participantes.map(p => p.nombre).join(' & ')}
                                            </p>
                                            {conv.unreadCount > 0 && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.lastMessage?.contenido || 'Sin mensajes'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {conv.lastMessage?.fecha ? formatTime(conv.lastMessage.fecha) : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Área de chat */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Header del chat */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                        {selectedConversation.participantes[0]?.nombre?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                        {selectedConversation.participantes.map(p => p.nombre).join(' & ')}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        {selectedConversation.participantes.map(p => p.email).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mensajes */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex space-x-2 max-w-xs lg:max-w-md ${msg.isAdmin ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-medium text-gray-700">
                                                {msg.senderName.charAt(0)}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg ${msg.isAdmin
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-900'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-xs mt-1 ${msg.isAdmin ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input de mensaje */}
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex space-x-2">
                                <textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={1}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {sending ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>Selecciona una conversación para comenzar</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
        </div>
    )
}



