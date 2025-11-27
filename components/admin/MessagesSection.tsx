'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

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
                const supabase = getSupabaseClient()
                
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

                const transformedMessages = (data || []).map(message => ({
                    ...message,
                    usuario: Array.isArray(message.usuario) ? message.usuario[0] : message.usuario
                }))
                setMessages(transformedMessages)

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
            const supabase = getSupabaseClient()
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
        const supabase = getSupabaseClient()
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
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
            {/* Filtros y búsqueda */}
            <div className="bg-white dark:bg-gray-900/60 shadow rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
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
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    filter === key
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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
                            className="input-field text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de mensajes */}
                <div className="bg-white dark:bg-gray-900/60 shadow rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Mensajes ({filteredMessages.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-96 overflow-y-auto">
                        {filteredMessages.map((message) => (
                            <div 
                                key={message.mensaje_id} 
                                className={`px-6 py-4 cursor-pointer transition-colors ${
                                    !message.leido ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-white dark:bg-transparent'
                                } ${selectedMessage?.mensaje_id === message.mensaje_id ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                                onClick={() => {
                                    setSelectedMessage(message)
                                    if (!message.leido) {
                                        markAsRead(message.mensaje_id)
                                    }
                                }}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 dark:text-gray-200 font-medium">
                                                {message.usuario?.nombre.charAt(0)}{message.usuario?.apellido.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {message.usuario?.nombre} {message.usuario?.apellido}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                {!message.leido && (
                                                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-300 rounded-full"></div>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(message.fecha_envio).toLocaleDateString('es-CO')}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                            {message.contenido}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                message.tipo === 'consulta'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                                                    : message.tipo === 'soporte'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200'
                                            }`}>
                                                {message.tipo}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                <div className="bg-white dark:bg-gray-900/60 shadow rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Detalle del Mensaje
                        </h3>
                        {selectedMessage && (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => markAsUnread(selectedMessage.mensaje_id)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Marcar como No Leído
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-6">
                        {selectedMessage ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">De:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {selectedMessage.usuario?.nombre} {selectedMessage.usuario?.apellido}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedMessage.usuario?.email}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Fecha:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(selectedMessage.fecha_envio).toLocaleString('es-CO')}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Tipo:</h4>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                        selectedMessage.tipo === 'consulta'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                                            : selectedMessage.tipo === 'soporte'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200'
                                    }`}>
                                        {selectedMessage.tipo}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Mensaje:</h4>
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                            {selectedMessage.contenido}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">Selecciona un mensaje para ver los detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
