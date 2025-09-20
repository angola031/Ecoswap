'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Reporte {
  reporte_id: number
  reporta_usuario_id: number
  reportado_usuario_id: number
  producto_id?: number
  intercambio_id?: number
  tipo: string
  descripcion: string
  estado: string
  fecha_reporte: string
  fecha_resolucion?: string
  notas_admin?: string
  admin_resuelve_id?: number
  ticket_relacionado_id?: number
  usuario_reportado: {
    user_id: number
    nombre: string
    apellido: string
    email: string
    activo: boolean
    verificado: boolean
  }
  usuario_reportador: {
    user_id: number
    nombre: string
    apellido: string
    email: string
  }
  admin_resolutor?: {
    user_id: number
    nombre: string
    apellido: string
  }
  producto?: {
    producto_id: number
    titulo: string
    precio: number
  }
  intercambio?: {
    intercambio_id: number
    estado: string
  }
  reportes_pendientes_usuario: number
}

interface ReportStats {
    estadisticas: {
        totalReportes: number
        reportesPendientes: number
        reportesResueltos: number
        reportesDesestimados: number
        usuariosSuspendidos: number
        usuariosBaneados: number
    }
    usuariosProblematicos: Array<{
        usuario: any
        totalReportes: number
    }>
    tiposReporte: Record<string, number>
    reportesRecientes: Array<any>
}

interface ReportsModuleProps {
    onClose?: () => void
}

export default function ReportsModule({ onClose }: ReportsModuleProps) {
    const [reportes, setReportes] = useState<Reporte[]>([])
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'pendiente' | 'resuelto' | 'desestimado'>('pendiente')
    const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [accion, setAccion] = useState('')
    const [motivo, setMotivo] = useState('')
    const [duracionBloqueo, setDuracionBloqueo] = useState(7)
    const [processing, setProcessing] = useState(false)

    const loadReportes = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch(`/api/admin/reports?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error cargando reportes')

            setReportes(data.reports || [])
        } catch (e: any) {
            setError(e.message)
        }
    }

    const loadStats = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch('/api/admin/reports/stats', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error cargando estadísticas')

            setStats(data)
        } catch (e: any) {
            console.error('Error cargando estadísticas:', e)
        }
    }

    const procesarReporte = async () => {
        if (!selectedReporte || !accion || processing) return

        setProcessing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    reporteId: selectedReporte.reporte_id,
                    accion,
                    motivo,
                    duracionBloqueo: accion === 'bloquear' ? duracionBloqueo : undefined
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error procesando reporte')

            setShowModal(false)
            setSelectedReporte(null)
            setAccion('')
            setMotivo('')
            await loadReportes()
            await loadStats()

        } catch (e: any) {
            setError(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const abrirModal = (reporte: Reporte) => {
        setSelectedReporte(reporte)
        setShowModal(true)
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleString('es-CO')
    }

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800'
            case 'resuelto': return 'bg-green-100 text-green-800'
            case 'rechazado': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

  const getTipoReporteColor = (tipo: string) => {
    switch (tipo) {
      case 'producto_spam': return 'bg-red-100 text-red-800'
      case 'usuario_sospechoso': return 'bg-orange-100 text-orange-800'
      case 'intercambio_fraudulento': return 'bg-purple-100 text-purple-800'
      case 'contenido_inapropiado': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

    useEffect(() => {
        loadReportes()
        loadStats()
    }, [filter])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando reportes...</span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Gestión de Reportes y Quejas</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            {stats && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.estadisticas.reportesPendientes}</div>
                            <div className="text-sm text-gray-600">Pendientes</div>
                        </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.estadisticas.reportesResueltos}</div>
              <div className="text-sm text-gray-600">Resueltos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.estadisticas.reportesDesestimados}</div>
              <div className="text-sm text-gray-600">Desestimados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.estadisticas.usuariosSuspendidos}</div>
              <div className="text-sm text-gray-600">Suspendidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.estadisticas.usuariosBaneados}</div>
              <div className="text-sm text-gray-600">Baneados</div>
            </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="resuelto">Resueltos</option>
              <option value="desestimado">Desestimados</option>
            </select>
                    <button
                        onClick={() => { loadReportes(); loadStats(); }}
                        className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Lista de reportes */}
            <div className="flex-1 overflow-y-auto p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {reportes.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500">No hay reportes {filter !== 'all' ? `en estado ${filter}` : ''}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reportes.map((reporte) => (
                            <div key={reporte.reporte_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${getTipoReporteColor(reporte.tipo)}`}>
                        {reporte.tipo.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(reporte.estado)}`}>
                        {reporte.estado}
                      </span>
                      {reporte.reportes_pendientes_usuario > 1 && (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                          {reporte.reportes_pendientes_usuario} reportes pendientes
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900">
                      Reporte contra {reporte.usuario_reportado.nombre} {reporte.usuario_reportado.apellido}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Reportado por {reporte.usuario_reportador.nombre} {reporte.usuario_reportador.apellido}
                    </p>
                    {reporte.producto && (
                      <p className="text-sm text-gray-600 mb-1">
                        Producto: {reporte.producto.titulo}
                      </p>
                    )}
                    {reporte.intercambio && (
                      <p className="text-sm text-gray-600 mb-1">
                        Intercambio: #{reporte.intercambio.intercambio_id}
                      </p>
                    )}
                                        <p className="text-sm text-gray-700 mb-2">{reporte.descripcion}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>Fecha: {formatTime(reporte.fecha_reporte)}</span>
                                            <span>Email: {reporte.usuario_reportado.email}</span>
                                            <span className={reporte.usuario_reportado.activo ? 'text-green-600' : 'text-red-600'}>
                                                {reporte.usuario_reportado.activo ? 'Activo' : 'Suspendido'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {reporte.estado === 'pendiente' && (
                                            <button
                                                onClick={() => abrirModal(reporte)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                            >
                                                Procesar
                                            </button>
                                        )}
                    {reporte.estado !== 'pendiente' && (
                      <div className="text-xs text-gray-500">
                        {reporte.notas_admin && `Notas: ${reporte.notas_admin}`}
                        {reporte.admin_resolutor && (
                          <div>Resuelto por: {reporte.admin_resolutor.nombre}</div>
                        )}
                      </div>
                    )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de procesamiento */}
            {showModal && selectedReporte && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Procesar Reporte</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Acción a tomar
                                </label>
                                <select
                                    value={accion}
                                    onChange={(e) => setAccion(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                >
                                    <option value="">Seleccionar acción</option>
                                    <option value="advertir">Advertir al usuario</option>
                                    <option value="bloquear">Bloquear temporalmente</option>
                                    <option value="suspender">Suspender cuenta</option>
                                    <option value="banear">Banear permanentemente</option>
                                    <option value="rechazar">Rechazar reporte</option>
                                </select>
                            </div>

                            {accion === 'bloquear' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Duración del bloqueo (días)
                                    </label>
                                    <input
                                        type="number"
                                        value={duracionBloqueo}
                                        onChange={(e) => setDuracionBloqueo(Number(e.target.value))}
                                        min="1"
                                        max="365"
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo de la acción
                                </label>
                                <textarea
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Explica el motivo de la acción tomada..."
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={procesarReporte}
                                disabled={!accion || processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Procesando...' : 'Procesar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

