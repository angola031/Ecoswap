'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase-client'

interface Intercambio {
    intercambio_id: number
    estado: 'pendiente' | 'aceptado' | 'rechazado' | 'completado' | 'cancelado'
    mensaje_propuesta: string
    monto_adicional: number
    condiciones_adicionales: string
    fecha_propuesta: string
    fecha_respuesta?: string
    fecha_completado?: string
    motivo_rechazo?: string
    lugar_encuentro?: string
    fecha_encuentro?: string
    notas_encuentro?: string
    producto_ofrecido?: any
    producto_solicitado?: any
    usuario_propone: any
    usuario_recibe: any
    otro_usuario: any
    producto_otro: any
    producto_propio: any
    es_proponente: boolean
    es_receptor: boolean
    puede_aceptar: boolean
    puede_rechazar: boolean
    puede_cancelar: boolean
    puede_completar: boolean
    chat?: any
}

interface IntercambiosModuleProps {
    onClose: () => void
}

export default function IntercambiosModule({ onClose }: IntercambiosModuleProps) {
    const { user } = useAuth()
    const [intercambios, setIntercambios] = useState<Intercambio[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filtroEstado, setFiltroEstado] = useState<string>('todos')
    const [filtroTipo, setFiltroTipo] = useState<string>('todos')
    const [accionando, setAccionando] = useState<number | null>(null)
    const [motivoRechazo, setMotivoRechazo] = useState('')
    const [mostrarMotivo, setMostrarMotivo] = useState<number | null>(null)
    const [calificando, setCalificando] = useState<number | null>(null)
    const [puntuacion, setPuntuacion] = useState<number>(5)
    const [comentario, setComentario] = useState('')
    const [recomendaria, setRecomendaria] = useState<boolean | null>(true)

    const estados = [
        { value: 'todos', label: 'Todos' },
        { value: 'pendiente', label: 'Pendientes' },
        { value: 'aceptado', label: 'Aceptados' },
        { value: 'rechazado', label: 'Rechazados' },
        { value: 'completado', label: 'Completados' },
        { value: 'cancelado', label: 'Cancelados' }
    ]

    const tipos = [
        { value: 'todos', label: 'Todos' },
        { value: 'proponidos', label: 'Que propuse' },
        { value: 'recibidos', label: 'Que recibí' }
    ]

    const cargarIntercambios = async () => {
        const supabase = getSupabaseClient()
        if (!user) return

        try {
            setLoading(true)
            setError(null)

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No hay sesión activa')

            const params = new URLSearchParams()
            if (filtroEstado !== 'todos') params.append('estado', filtroEstado)
            if (filtroTipo !== 'todos') params.append('tipo', filtroTipo)

            const response = await fetch(`/api/intercambios?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al cargar intercambios')
            }

            const data = await response.json()
            setIntercambios(data.intercambios || [])
        } catch (err: any) {
            console.error('Error cargando intercambios:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const ejecutarAccion = async (intercambioId: number, accion: string, motivo?: string) => {
        const supabase = getSupabaseClient()
        if (!user) return

        try {
            setAccionando(intercambioId)

            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No hay sesión activa')

            const response = await fetch(`/api/intercambios/${intercambioId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ action: accion, motivo })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al ejecutar acción')
            }

            // Recargar intercambios
            await cargarIntercambios()
            setMostrarMotivo(null)
            setMotivoRechazo('')
        } catch (err: any) {
            console.error('Error ejecutando acción:', err)
            setError(err.message)
        } finally {
            setAccionando(null)
        }
    }

    const enviarCalificacion = async (intercambioId: number) => {
        const supabase = getSupabaseClient()
        if (!user) return
        try {
            setAccionando(intercambioId)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No hay sesión activa')
            const response = await fetch(`/api/intercambios/${intercambioId}/rating`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ puntuacion, comentario, recomendaria })
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Error al enviar calificación')
            }
            setCalificando(null)
            setComentario('')
            setPuntuacion(5)
            await cargarIntercambios()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAccionando(null)
        }
    }

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getEstadoColor = (estado: string) => {
        const colors = {
            pendiente: 'bg-yellow-100 text-yellow-800',
            aceptado: 'bg-green-100 text-green-800',
            rechazado: 'bg-red-100 text-red-800',
            completado: 'bg-blue-100 text-blue-800',
            cancelado: 'bg-gray-100 text-gray-800'
        }
        return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    const getEstadoLabel = (estado: string) => {
        const labels = {
            pendiente: 'Pendiente',
            aceptado: 'Aceptado',
            rechazado: 'Rechazado',
            completado: 'Completado',
            cancelado: 'Cancelado'
        }
        return labels[estado as keyof typeof labels] || estado
    }

    useEffect(() => {
        cargarIntercambios()
    }, [filtroEstado, filtroTipo])

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3">Cargando intercambios...</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h2 className="text-2xl font-bold text-gray-900">Mis Intercambios</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Filtros */}
                    <div className="p-6 border-b bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Estado
                                </label>
                                <select
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {estados.map(estado => (
                                        <option key={estado.value} value={estado.value}>
                                            {estado.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo
                                </label>
                                <select
                                    value={filtroTipo}
                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {tipos.map(tipo => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border-l-4 border-red-400">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Lista de intercambios */}
                    <div className="overflow-y-auto max-h-96">
                        {intercambios.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No hay intercambios que coincidan con los filtros seleccionados.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {intercambios.map((intercambio) => (
                                    <div key={intercambio.intercambio_id} className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {/* Header del intercambio */}
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(intercambio.estado)}`}>
                                                        {getEstadoLabel(intercambio.estado)}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {formatearFecha(intercambio.fecha_propuesta)}
                                                    </span>
                                                    {intercambio.es_proponente && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                            Propuse
                                                        </span>
                                                    )}
                                                    {intercambio.es_receptor && (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            Recibí
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Productos involucrados */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    {/* Mi producto */}
                                                    <div className="bg-gray-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-900 mb-2">Mi producto</h4>
                                                        {intercambio.producto_propio ? (
                                                            <div>
                                                                <p className="font-medium">{intercambio.producto_propio.titulo}</p>
                                                                <p className="text-sm text-gray-600">{intercambio.producto_propio.descripcion}</p>
                                                                {intercambio.producto_propio.precio && (
                                                                    <p className="text-sm font-medium text-green-600">
                                                                        ${intercambio.producto_propio.precio.toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500">Sin producto específico</p>
                                                        )}
                                                    </div>

                                                    {/* Producto del otro */}
                                                    <div className="bg-blue-50 p-4 rounded-lg">
                                                        <h4 className="font-medium text-gray-900 mb-2">
                                                            Producto de {intercambio.otro_usuario?.nombre} {intercambio.otro_usuario?.apellido}
                                                        </h4>
                                                        {intercambio.producto_otro ? (
                                                            <div>
                                                                <p className="font-medium">{intercambio.producto_otro.titulo}</p>
                                                                <p className="text-sm text-gray-600">{intercambio.producto_otro.descripcion}</p>
                                                                {intercambio.producto_otro.precio && (
                                                                    <p className="text-sm font-medium text-green-600">
                                                                        ${intercambio.producto_otro.precio.toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500">Sin producto específico</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Mensaje de propuesta */}
                                                {intercambio.mensaje_propuesta && (
                                                    <div className="mb-4">
                                                        <h4 className="font-medium text-gray-900 mb-1">Mensaje de propuesta</h4>
                                                        <p className="text-gray-600 bg-gray-50 p-3 rounded">{intercambio.mensaje_propuesta}</p>
                                                    </div>
                                                )}

                                                {/* Motivo de rechazo */}
                                                {intercambio.motivo_rechazo && (
                                                    <div className="mb-4">
                                                        <h4 className="font-medium text-red-600 mb-1">Motivo de rechazo</h4>
                                                        <p className="text-red-600 bg-red-50 p-3 rounded">{intercambio.motivo_rechazo}</p>
                                                    </div>
                                                )}

                                                {/* Monto adicional */}
                                                {intercambio.monto_adicional > 0 && (
                                                    <div className="mb-4">
                                                        <p className="text-sm text-gray-600">
                                                            Monto adicional: <span className="font-medium text-green-600">${intercambio.monto_adicional.toLocaleString()}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Acciones */}
                                            <div className="ml-4 flex flex-col space-y-2">
                                                {intercambio.puede_aceptar && (
                                                    <button
                                                        onClick={() => ejecutarAccion(intercambio.intercambio_id, 'aceptar')}
                                                        disabled={accionando === intercambio.intercambio_id}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                                                    >
                                                        {accionando === intercambio.intercambio_id ? 'Aceptando...' : 'Aceptar'}
                                                    </button>
                                                )}

                                                {intercambio.puede_rechazar && (
                                                    <div className="flex flex-col space-y-2">
                                                        <button
                                                            onClick={() => setMostrarMotivo(mostrarMotivo === intercambio.intercambio_id ? null : intercambio.intercambio_id)}
                                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                                        >
                                                            Rechazar
                                                        </button>
                                                        {mostrarMotivo === intercambio.intercambio_id && (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Motivo del rechazo (opcional)"
                                                                    value={motivoRechazo}
                                                                    onChange={(e) => setMotivoRechazo(e.target.value)}
                                                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                                />
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() => ejecutarAccion(intercambio.intercambio_id, 'rechazar', motivoRechazo)}
                                                                        disabled={accionando === intercambio.intercambio_id}
                                                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                                                                    >
                                                                        Confirmar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setMostrarMotivo(null)}
                                                                        className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {intercambio.puede_cancelar && (
                                                    <button
                                                        onClick={() => ejecutarAccion(intercambio.intercambio_id, 'cancelar')}
                                                        disabled={accionando === intercambio.intercambio_id}
                                                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 text-sm"
                                                    >
                                                        {accionando === intercambio.intercambio_id ? 'Cancelando...' : 'Cancelar'}
                                                    </button>
                                                )}

                                                {intercambio.puede_completar && (
                                                    <button
                                                        onClick={() => ejecutarAccion(intercambio.intercambio_id, 'completado')}
                                                        disabled={accionando === intercambio.intercambio_id}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                                                    >
                                                        {accionando === intercambio.intercambio_id ? 'Completando...' : 'Marcar Completado'}
                                                    </button>
                                                )}

                                                {/* Calificar si está completado */}
                                                {intercambio.estado === 'completado' && (
                                                    <button
                                                        onClick={() => setCalificando(intercambio.intercambio_id)}
                                                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
                                                    >
                                                        Calificar
                                                    </button>
                                                )}

                                                {/* Chat */}
                                                {intercambio.chat && (
                                                    <button
                                                        onClick={() => {/* TODO: Abrir chat */ }}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                                                    >
                                                        Ver Chat
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {calificando !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Calificar intercambio</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Puntuación</label>
                                <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => setPuntuacion(n)}
                                            className={`w-10 h-10 rounded-full border flex items-center justify-center ${puntuacion >= n ? 'bg-yellow-400 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-300'}`}
                                            aria-label={`Puntuación ${n}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
                                <textarea
                                    value={comentario}
                                    onChange={(e) => setComentario(e.target.value)}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="¿Qué tal fue el intercambio?"
                                />
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    id="recomendaria"
                                    type="checkbox"
                                    checked={!!recomendaria}
                                    onChange={(e) => setRecomendaria(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <label htmlFor="recomendaria" className="text-sm text-gray-700">Recomendaría a este usuario</label>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={() => setCalificando(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => enviarCalificacion(calificando)}
                                    disabled={accionando === calificando}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {accionando === calificando ? 'Enviando...' : 'Enviar calificación'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
