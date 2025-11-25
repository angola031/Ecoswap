'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Swal from 'sweetalert2'

interface Event {
  evento_id: number
  titulo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin?: string
  ubicacion?: string
  ubicacion_detalle?: string
  tipo_evento: string
  imagen_evento?: string
  capacidad_maxima?: number
  requiere_registro: boolean
  estado: string
  registros_count?: number
}

interface EventsManagerProps {
  currentUser: any
  isFoundation: boolean
  isVerified: boolean
}

export default function EventsManager({ currentUser, isFoundation, isVerified }: EventsManagerProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (isFoundation && isVerified) {
      loadEvents()
    }
  }, [isFoundation, isVerified])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) return

      const response = await fetch(`/api/events?fundacion_id=${currentUser.id}&estado=activo`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error cargando eventos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    const result = await Swal.fire({
      title: '📅 Crear Nuevo Evento',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Título del Evento *</label>
            <input id="titulo" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: Jornada de Donación" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea id="descripcion" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="4" placeholder="Describe tu evento..."></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
              <input id="fecha_inicio" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
              <input id="fecha_fin" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento *</label>
            <select id="tipo_evento" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Selecciona un tipo</option>
              <option value="Recaudación de fondos">Recaudación de fondos</option>
              <option value="Actividad educativa">Actividad educativa</option>
              <option value="Jornada de donación">Jornada de donación</option>
              <option value="Evento comunitario">Evento comunitario</option>
              <option value="Taller">Taller</option>
              <option value="Campaña de concientización">Campaña de concientización</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
            <input id="ubicacion" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ciudad, Dirección" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Detalles de Ubicación</label>
            <textarea id="ubicacion_detalle" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="2" placeholder="Instrucciones adicionales..."></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
            <input id="imagen_evento" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="https://..." />
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Capacidad Máxima</label>
              <input id="capacidad_maxima" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Opcional" />
            </div>
            <div class="flex items-center pt-6">
              <input id="requiere_registro" type="checkbox" class="w-4 h-4 text-purple-600 border-gray-300 rounded" />
              <label for="requiere_registro" class="ml-2 text-sm text-gray-700">Requiere registro</label>
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear Evento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7C3AED',
      width: 700,
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement)?.value
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement)?.value
        const fecha_inicio = (document.getElementById('fecha_inicio') as HTMLInputElement)?.value
        const fecha_fin = (document.getElementById('fecha_fin') as HTMLInputElement)?.value
        const tipo_evento = (document.getElementById('tipo_evento') as HTMLSelectElement)?.value
        const ubicacion = (document.getElementById('ubicacion') as HTMLInputElement)?.value
        const ubicacion_detalle = (document.getElementById('ubicacion_detalle') as HTMLTextAreaElement)?.value
        const imagen_evento = (document.getElementById('imagen_evento') as HTMLInputElement)?.value
        const capacidad_maxima = (document.getElementById('capacidad_maxima') as HTMLInputElement)?.value
        const requiere_registro = (document.getElementById('requiere_registro') as HTMLInputElement)?.checked

        if (!titulo || !descripcion || !fecha_inicio || !tipo_evento) {
          Swal.showValidationMessage('Por favor completa los campos requeridos')
          return false
        }

        return {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fecha_inicio,
          fecha_fin: fecha_fin || null,
          tipo_evento,
          ubicacion: ubicacion?.trim() || null,
          ubicacion_detalle: ubicacion_detalle?.trim() || null,
          imagen_evento: imagen_evento?.trim() || null,
          capacidad_maxima: capacidad_maxima ? parseInt(capacidad_maxima) : null,
          requiere_registro
        }
      }
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Creando evento...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(result.value)
        })

        if (response.ok) {
          await Swal.fire({
            title: '✅ Evento Creado',
            text: 'Tu evento ha sido publicado exitosamente',
            icon: 'success',
            confirmButtonColor: '#7C3AED'
          })
          loadEvents()
        } else {
          throw new Error('Error al crear evento')
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el evento',
          icon: 'error'
        })
      }
    }
  }

  const handleDeleteEvent = async (evento_id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar evento?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444'
    })

    if (result.isConfirmed) {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const response = await fetch(`/api/events?evento_id=${evento_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          Swal.fire({
            title: 'Eliminado',
            text: 'El evento ha sido eliminado',
            icon: 'success',
            timer: 2000
          })
          loadEvents()
        } else {
          throw new Error('Error al eliminar')
        }
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el evento',
          icon: 'error'
        })
      }
    }
  }

  if (!isFoundation) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Esta función es solo para fundaciones
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Advertencia si no está verificada */}
      {!isVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⏳ Verificación Pendiente
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Tu fundación debe estar verificada por un administrador antes de poder crear eventos públicos. 
                Ve a la pestaña "Verificación" para ver el estado.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mis Eventos</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isVerified 
              ? 'Gestiona los eventos de tu fundación'
              : 'Podrás crear eventos una vez que tu fundación esté verificada'}
          </p>
        </div>
        {isVerified && (
          <button
            onClick={handleCreateEvent}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Crear Evento</span>
          </button>
        )}
      </div>

      {/* Lista de Eventos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {isVerified 
              ? 'No has creado ningún evento aún'
              : 'Aún no puedes crear eventos'}
          </p>
          {isVerified ? (
            <button
              onClick={handleCreateEvent}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium"
            >
              Crear tu primer evento →
            </button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Espera la verificación de tu fundación para comenzar a crear eventos
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
            <div
              key={event.evento_id}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Imagen */}
              {event.imagen_evento && (
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={event.imagen_evento}
                    alt={event.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Contenido */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.titulo}
                  </h4>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs rounded-full">
                    {event.tipo_evento}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {event.descripcion}
                </p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {new Date(event.fecha_inicio).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {event.ubicacion && (
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span>{event.ubicacion}</span>
                    </div>
                  )}

                  {event.requiere_registro && (
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4" />
                      <span>
                        {event.registros_count || 0} registrado(s)
                        {event.capacidad_maxima && ` / ${event.capacidad_maxima}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleDeleteEvent(event.evento_id)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span className="text-sm">Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

