'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import Swal from 'sweetalert2'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { FoundationDocumentStatus } from '@/types/foundation'

interface Foundation {
  user_id: number
  nombre: string
  apellido: string
  email: string
  es_fundacion: boolean
  nombre_fundacion: string
  nit_fundacion: string
  tipo_fundacion: string
  descripcion_fundacion: string
  pagina_web_fundacion?: string
  documento_fundacion: string
  documentos_fundacion?: Record<string, any> | null
  fundacion_verificada: boolean
  fecha_verificacion_fundacion?: string
}

const DOCUMENT_DEFINITIONS = [
  { key: 'acta_constitucion', label: 'Acta de Constitución', required: true },
  { key: 'estatutos', label: 'Estatutos', required: true },
  { key: 'pre_rut', label: 'PRE-RUT', required: true },
  { key: 'cartas_aceptacion', label: 'Cartas de Aceptación', required: false },
  { key: 'formulario_rues', label: 'Formulario RUES', required: false }
]

const statusConfig: Record<'sin_subir' | FoundationDocumentStatus, { label: string; classes: string }> = {
  sin_subir: { label: 'Sin subir', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  pendiente: { label: 'En revisión', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' },
  aprobado: { label: 'Aprobado', classes: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' },
  rechazado: { label: 'Rechazado', classes: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' }
}

interface NormalizedDocumentEntry {
  key: string
  label: string
  url: string | null
  estado: FoundationDocumentStatus | 'sin_subir'
  comentario_admin?: string | null
  required: boolean
}

export default function FoundationsSection() {
  const [foundations, setFoundations] = useState<Foundation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [documentModalFoundation, setDocumentModalFoundation] = useState<Foundation | null>(null)
  const [activeDocumentKey, setActiveDocumentKey] = useState<string | null>(null)
  const [documentActionLoading, setDocumentActionLoading] = useState(false)

  useEffect(() => {
    loadFoundations()
  }, [filter])

  const loadFoundations = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const url = new URL('/api/foundation/verify', window.location.origin)
      if (filter !== 'all') {
        url.searchParams.set('filter', filter)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFoundations(data.foundations || data.fundaciones || [])
      }
    } catch (error) {
      console.error('Error cargando fundaciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (foundation: Foundation) => {
    const result = await Swal.fire({
      title: '✅ Verificar Fundación',
      html: `
        <div class="text-left space-y-3">
          <p class="font-medium">${foundation.nombre_fundacion}</p>
          <p class="text-sm text-gray-600">NIT: ${foundation.nit_fundacion}</p>
          <p class="text-sm text-gray-600">Tipo: ${foundation.tipo_fundacion}</p>
          <p class="text-sm text-gray-600 mt-2">¿Deseas verificar esta fundación?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Verificando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const response = await fetch('/api/foundation/verify', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: foundation.user_id,
            accion: 'verificar'
          })
        })

        if (response.ok) {
          await Swal.fire({
            title: '✅ Verificada',
            text: 'La fundación ha sido verificada exitosamente',
            icon: 'success',
            confirmButtonColor: '#10b981'
          })
          loadFoundations()
        } else {
          throw new Error('Error al verificar')
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo verificar la fundación',
          icon: 'error'
        })
      }
    }
  }

  const handleReject = async (foundation: Foundation) => {
    const result = await Swal.fire({
      title: '❌ Rechazar Fundación',
      html: `
        <div class="text-left space-y-3">
          <p class="font-medium">${foundation.nombre_fundacion}</p>
          <p class="text-sm text-gray-600 mb-4">¿Por qué se rechaza esta fundación?</p>
          <textarea id="reject-reason" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="4" placeholder="Motivo del rechazo..."></textarea>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement)?.value
        if (!reason || reason.trim().length < 10) {
          Swal.showValidationMessage('Por favor, proporciona un motivo (mín. 10 caracteres)')
          return false
        }
        return { reason: reason.trim() }
      }
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Rechazando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const response = await fetch('/api/foundation/verify', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: foundation.user_id,
            accion: 'rechazar',
            motivo: result.value.reason
          })
        })

        if (response.ok) {
          await Swal.fire({
            title: '✅ Rechazada',
            text: 'La fundación ha sido rechazada',
            icon: 'success'
          })
          loadFoundations()
        } else {
          throw new Error('Error al rechazar')
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo rechazar la fundación',
          icon: 'error'
        })
      }
    }
  }

  const viewDocument = (url: string) => {
    window.open(url, '_blank')
  }

  const openDocumentsModal = (foundation: Foundation) => {
    setDocumentModalFoundation(foundation)
    setActiveDocumentKey(() => {
      const docs = getNormalizedDocuments(foundation)
      const firstWithUrl = docs.find(doc => !!doc.url)
      return firstWithUrl?.key || docs[0]?.key || null
    })
  }

  const closeDocumentsModal = () => {
    setDocumentModalFoundation(null)
    setActiveDocumentKey(null)
    setDocumentActionLoading(false)
  }

  const getNormalizedDocuments = (foundation: Foundation): NormalizedDocumentEntry[] => {
    const docsFromJson = foundation.documentos_fundacion || {}
    const normalized = DOCUMENT_DEFINITIONS.map(def => {
      const rawValue = docsFromJson?.[def.key]
      let url: string | null = null
      let estado: FoundationDocumentStatus | 'sin_subir' = 'sin_subir'
      let comentario_admin: string | null = null

      if (typeof rawValue === 'string') {
        url = rawValue
        estado = 'pendiente'
      } else if (rawValue && typeof rawValue === 'object') {
        url = rawValue.url || null
        estado = rawValue.estado || (rawValue.url ? 'pendiente' : 'sin_subir')
        comentario_admin = rawValue.comentario_admin || null
      }

      return {
        key: def.key,
        label: def.label,
        required: def.required,
        url,
        estado: url ? estado : 'sin_subir',
        comentario_admin
      }
    })

    if (foundation.documento_fundacion) {
      normalized.push({
        key: 'documento_completo',
        label: 'Documento Completo',
        required: true,
        url: foundation.documento_fundacion,
        estado: 'pendiente',
        comentario_admin: null
      })
    }

    return normalized
  }

  const documentsForModal = useMemo(() => {
    if (!documentModalFoundation) return []
    return getNormalizedDocuments(documentModalFoundation)
  }, [documentModalFoundation])

  const activeDocument = useMemo(() => {
    if (!activeDocumentKey) return null
    return documentsForModal.find(doc => doc.key === activeDocumentKey) || null
  }, [documentsForModal, activeDocumentKey])

  const updateFoundationDocumentsState = (foundationId: number, documentos: Record<string, any>) => {
    setFoundations(prev =>
      prev.map(f =>
        f.user_id === foundationId ? { ...f, documentos_fundacion: documentos } : f
      )
    )
    setDocumentModalFoundation(prev =>
      prev && prev.user_id === foundationId
        ? { ...prev, documentos_fundacion: documentos }
        : prev
    )
  }

  const handleDocumentAction = async (docKey: string, action: 'aprobar' | 'rechazar') => {
    if (!documentModalFoundation || !documentModalFoundation.user_id) return
    const foundationId = documentModalFoundation.user_id

    let comentario: string | undefined

    if (action === 'rechazar') {
      const { value: text, isConfirmed } = await Swal.fire({
        title: 'Motivo del rechazo',
        input: 'textarea',
        inputLabel: 'Explica por qué el documento se rechaza',
        inputPlaceholder: 'Debe incluir al menos 10 caracteres',
        inputAttributes: {
          'aria-label': 'Motivo del rechazo'
        },
        inputValidator: value => {
          if (!value || value.trim().length < 10) {
            return 'Debes ingresar al menos 10 caracteres'
          }
          return null
        },
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        confirmButtonColor: '#dc2626',
        cancelButtonText: 'Cancelar'
      })

      if (!isConfirmed) {
        return
      }

      comentario = text?.trim()
    }

    setDocumentActionLoading(true)

    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sesión no válida')

      const response = await fetch('/api/foundation/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: foundationId,
          document_key: docKey,
          document_action: action,
          comentario
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'No se pudo actualizar el documento')
      }

      const data = await response.json()
      updateFoundationDocumentsState(foundationId, data.documentos_fundacion || {})

      await Swal.fire({
        icon: 'success',
        title: action === 'aprobar' ? 'Documento aprobado' : 'Documento rechazado',
        timer: 1500,
        showConfirmButton: false
      })
    } catch (error: any) {
      console.error('Error actualizando documento:', error)
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'No se pudo actualizar el documento'
      })
    } finally {
      setDocumentActionLoading(false)
    }
  }

  const filteredFoundations = foundations.filter(f =>
    f.nombre_fundacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.nit_fundacion.includes(searchTerm) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-2">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, NIT o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <ClockIcon className="w-5 h-5 inline mr-1" />
              Pendientes
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                filter === 'verified'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <CheckCircleIcon className="w-5 h-5 inline mr-1" />
              Verificadas
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              Todas
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredFoundations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron fundaciones
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFoundations.map((foundation) => (
            <div
              key={foundation.user_id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {foundation.nombre_fundacion}
                      </h3>
                      {foundation.fundacion_verificada && (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      NIT: {foundation.nit_fundacion}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Responsable</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {foundation.nombre} {foundation.apellido}
                      </p>
                      <p className="text-xs text-gray-500">{foundation.email}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {foundation.tipo_fundacion}
                      </p>
                    </div>
                  </div>

                  {foundation.descripcion_fundacion && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Descripción</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {foundation.descripcion_fundacion}
                      </p>
                    </div>
                  )}

                  {foundation.pagina_web_fundacion && (
                    <div>
                      <a
                        href={foundation.pagina_web_fundacion}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center space-x-1"
                      >
                        <span>{foundation.pagina_web_fundacion}</span>
                      </a>
                    </div>
                  )}

                  {foundation.fecha_verificacion_fundacion && (
                    <div className="text-xs text-gray-500">
                      Verificada el: {new Date(foundation.fecha_verificacion_fundacion).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 min-w-[220px]">
                  <button
                    onClick={() => openDocumentsModal(foundation)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>Ver Documentos</span>
                  </button>

                  {!foundation.fundacion_verificada && (
                    <>
                      <button
                        onClick={() => handleVerify(foundation)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Verificar</span>
                      </button>

                      <button
                        onClick={() => handleReject(foundation)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                      >
                        <XCircleIcon className="w-5 h-5" />
                        <span>Rechazar</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      {documentModalFoundation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Revisión de Documentos
                </p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {documentModalFoundation.nombre_fundacion}
                </h3>
              </div>
              <button
                onClick={closeDocumentsModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-3 overflow-y-auto max-h-[70vh]">
                {documentsForModal.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay documentos registrados.</p>
                )}
                {documentsForModal.map(doc => (
                  <button
                    key={doc.key}
                    onClick={() => setActiveDocumentKey(doc.key)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      activeDocumentKey === doc.key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.label}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[doc.estado].classes}`}>
                        {statusConfig[doc.estado].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {doc.required ? 'Obligatorio' : 'Opcional'}
                    </p>
                  </button>
                ))}
              </div>

              <div className="flex-1 p-4">
                {activeDocument && activeDocument.url ? (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {activeDocument.label}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Estado: {statusConfig[activeDocument.estado].label}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={documentActionLoading}
                          onClick={() => handleDocumentAction(activeDocument.key, 'aprobar')}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {documentActionLoading ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          disabled={documentActionLoading}
                          onClick={() => handleDocumentAction(activeDocument.key, 'rechazar')}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                        >
                          {documentActionLoading ? 'Procesando...' : 'Rechazar'}
                        </button>
                        <button
                          onClick={() => window.open(activeDocument.url!, '_blank')}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Abrir en pestaña
                        </button>
                        <a
                          href={activeDocument.url!}
                          download
                          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          Descargar
                        </a>
                      </div>
                    </div>

                    {activeDocument.comentario_admin && (
                      <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <p className="text-xs uppercase font-semibold text-red-600 dark:text-red-300">
                          Comentario del administrador
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                          {activeDocument.comentario_admin}
                        </p>
                      </div>
                    )}

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 max-h-[60vh]">
                      {activeDocument.url!.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={activeDocument.url!} className="w-full h-[60vh]" title={activeDocument.label} />
                      ) : (
                        <img
                          src={activeDocument.url!}
                          className="w-full h-[60vh] object-contain bg-gray-50 dark:bg-gray-800"
                          alt={activeDocument.label}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-500 dark:text-gray-400">
                    <DocumentTextIcon className="w-12 h-12 mb-3" />
                    <p className="text-sm">
                      {activeDocumentKey
                        ? 'Este documento aún no ha sido cargado.'
                        : 'Selecciona un documento para visualizarlo.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


