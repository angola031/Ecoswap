'use client'

import { useEffect, useState } from 'react'
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
  fundacion_verificada: boolean
  fecha_verificacion_fundacion?: string
}

export default function FoundationsSection() {
  const [foundations, setFoundations] = useState<Foundation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending')
  const [searchTerm, setSearchTerm] = useState('')

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
        setFoundations(data.foundations || [])
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

  const filteredFoundations = foundations.filter(f =>
    f.nombre_fundacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.nit_fundacion.includes(searchTerm) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
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
                <div className="flex flex-col space-y-2 min-w-[200px]">
                  <button
                    onClick={() => viewDocument(foundation.documento_fundacion)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                    <span>Ver Documento</span>
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
  )
}


