'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Message {
    mensaje_id: number
    contenido: string
    fecha_envio: string
    leido: boolean
    usuario_id: number
    usuario?: {
        nombre: string
        apellido: string
        email: string
    }
    tipo: string
}

export default function MessagesSection() {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                
                const { data, error } = await supabase
                    .from('mensaje')
                    .select(`
                        mensaje_id,
                        contenido,
                        fecha_envio,
                        leido,
                        usuario_id,
                        tipo,
                        usuario:usuario_id (
                            nombre,
                            apellido,
                            email
                        )
                    `)
                    .order('fecha_envio', { ascending: false })

                if (error) {
                    console.error('❌ Error obteniendo mensajes:', error)
                    return
                }

                setMessages(data || [])

            } catch (error) {
                console.error('💥 Error cargando mensajes:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchMessages()
    }, [])

    const filteredMessages = messages.filter(message => {
        const matchesSearch = message.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            message.usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            message.usuario?.email.toLowerCase().includes(searchTerm.toLowerCase())

        switch (filter) {
            case 'unread':
                return matchesSearch && !message.leido
            case 'read':
                return matchesSearch && message.leido
            default:
                return matchesSearch
        }
    })

    const markAsRead = async (messageId: number) => {
        try {
            const { error } = await supabase
                .from('mensaje')
                .update({ leido: true })
                .eq('mensaje_id', messageId)

            if (error) {
                console.error('❌ Error marcando mensaje como leído:', error)
                return
            }

            // Actualizar estado local
            setMessages(messages.map(message => 
                message.mensaje_id === messageId 
                    ? { ...message, leido: true }
                    : message
            ))

        } catch (error) {
            console.error('💥 Error:', error)
        }
    }

    const markAsUnread = async (messageId: number) => {
        try {
            const { error } = await supabase
                .from('mensaje')
                .update({ leido: false })
                .eq('mensaje_id', messageId)

            if (error) {
                console.error('❌ Error marcando mensaje como no leído:', error)
                return
            }

            // Actualizar estado local
            setMessages(messages.map(message => 
                message.mensaje_id === messageId 
                    ? { ...message, leido: false }
                    : message
            ))

        } catch (error) {
            console.error('💥 Error:', error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filtros y búsqueda */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Todos', count: messages.length },
                            { key: 'unread', label: 'Sin Leer', count: messages.filter(m => !m.leido).length },
                            { key: 'read', label: 'Leídos', count: messages.filter(m => m.leido).length }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key as any)}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    filter === key
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar mensajes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de mensajes */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Mensajes ({filteredMessages.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                        {filteredMessages.map((message) => (
                            <div 
                                key={message.mensaje_id} 
                                className={`px-6 py-4 cursor-pointer hover:bg-gray-50 ${
                                    !message.leido ? 'bg-blue-50' : ''
                                } ${selectedMessage?.mensaje_id === message.mensaje_id ? 'bg-blue-100' : ''}`}
                                onClick={() => {
                                    setSelectedMessage(message)
                                    if (!message.leido) {
                                        markAsRead(message.mensaje_id)
                                    }
                                }}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 font-medium">
                                                {message.usuario?.nombre.charAt(0)}{message.usuario?.apellido.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {message.usuario?.nombre} {message.usuario?.apellido}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                {!message.leido && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {new Date(message.fecha_envio).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            {message.contenido}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                message.tipo === 'consulta'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : message.tipo === 'soporte'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {message.tipo}
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                {message.usuario?.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detalle del mensaje seleccionado */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">
                            Detalle del Mensaje
                        </h3>
                    </div>
                    <div className="p-6">
                        {selectedMessage ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">De:</h4>
                                    <p className="text-sm text-gray-600">
                                        {selectedMessage.usuario?.nombre} {selectedMessage.usuario?.apellido}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedMessage.usuario?.email}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Fecha:</h4>
                                    <p className="text-sm text-gray-600">
                                        {new Date(selectedMessage.fecha_envio).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Tipo:</h4>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        selectedMessage.tipo === 'consulta'
                                            ? 'bg-blue-100 text-blue-800'
                                            : selectedMessage.tipo === 'soporte'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-orange-100 text-orange-800'
                                    }`}>
                                        {selectedMessage.tipo}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Mensaje:</h4>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {selectedMessage.contenido}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {selectedMessage.leido ? (
                                        <button
                                            onClick={() => markAsUnread(selectedMessage.mensaje_id)}
                                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200"
                                        >
                                            Marcar como No Leído
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => markAsRead(selectedMessage.mensaje_id)}
                                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200"
                                        >
                                            Marcar como Leído
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">Selecciona un mensaje para ver los detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
