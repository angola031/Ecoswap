'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  CheckBadgeIcon
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
  registros_count?: number
  fundacion: any[]
}

interface EventsListProps {
  currentUser: any
  showUpcoming?: boolean
}

export default function EventsList({ currentUser, showUpcoming = true }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | string>('all')

  useEffect(() => {
    loadEvents()
  }, [showUpcoming])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      
      let url = '/api/events?estado=activo'
      if (showUpcoming) {
        url += '&upcoming=true'
      }

      const response = await fetch(url)

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

  const handleRegister = async (event: Event) => {
    if (!currentUser) {
      Swal.fire({
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para registrarte en eventos',
        icon: 'info'
      })
      return
    }

    if (!event.requiere_registro) {
      Swal.fire({
        title: 'No requiere registro',
        text: 'Este evento no requiere registro previo. ¡Asiste directamente!',
        icon: 'info'
      })
      return
    }

    const result = await Swal.fire({
      title: '📝 Registrarse al Evento',
      html: `
        <div class="text-left space-y-4">
          <div class="bg-purple-50 p-3 rounded-lg">
            <h4 class="font-medium text-purple-900 mb-1">${event.titulo}</h4>
            <p class="text-sm text-purple-700">
              ${new Date(event.fecha_inicio).toLocaleDateString('es-CO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">¿Alguna nota o comentario? (opcional)</label>
            <textarea id="registro-notas" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Ej: Asistiré con mi familia..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Registro',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7C3AED',
      preConfirm: () => {
        const notas = (document.getElementById('registro-notas') as HTMLTextAreaElement)?.value
        return { notas: notas?.trim() || null }
      }
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Registrando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()

        const response = await fetch('/api/events/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            evento_id: event.evento_id,
            notas: result.value.notas
          })
        })

        if (response.ok) {
          await Swal.fire({
            title: '✅ ¡Registrado!',
            text: 'Te has registrado exitosamente al evento',
            icon: 'success',
            confirmButtonColor: '#7C3AED'
          })
          loadEvents()
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Error al registrarse')
        }
      } catch (error: any) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'No se pudo completar el registro',
          icon: 'error'
        })
      }
    }
  }

  const handleViewDetails = (event: Event) => {
    Swal.fire({
      title: event.titulo,
      html: `
        <div class="text-left space-y-4">
          ${event.imagen_evento ? `
            <img src="${event.imagen_evento}" alt="${event.titulo}" class="w-full rounded-lg mb-4" />
          ` : ''}
          
          <div>
            <p class="text-sm text-gray-600 mb-2">${event.descripcion}</p>
          </div>
          
          <div class="space-y-2">
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-900">Fecha y Hora</p>
                <p class="text-sm text-gray-600">
                  ${new Date(event.fecha_inicio).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            ${event.ubicacion ? `
              <div class="flex items-start space-x-2">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-900">Ubicación</p>
                  <p class="text-sm text-gray-600">${event.ubicacion}</p>
                  ${event.ubicacion_detalle ? `<p class="text-xs text-gray-500 mt-1">${event.ubicacion_detalle}</p>` : ''}
                </div>
              </div>
            ` : ''}
            
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p class="text-sm font-medium text-gray-900">Organizado por</p>
                <p class="text-sm text-gray-600">${event.fundacion?.[0]?.nombre_fundacion || 'Fundación'}</p>
              </div>
            </div>
            
            ${event.capacidad_maxima ? `
              <div class="flex items-start space-x-2">
                <svg class="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-gray-900">Capacidad</p>
                  <p class="text-sm text-gray-600">${event.registros_count || 0} / ${event.capacidad_maxima} personas</p>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="bg-purple-50 p-3 rounded-lg">
            <p class="text-xs text-purple-800">
              <strong>Tipo:</strong> ${event.tipo_evento}
            </p>
          </div>
        </div>
      `,
      showCancelButton: event.requiere_registro,
      confirmButtonText: 'Cerrar',
      cancelButtonText: event.requiere_registro ? 'Registrarme' : undefined,
      confirmButtonColor: '#7C3AED',
      cancelButtonColor: '#10b981',
      width: 600
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        handleRegister(event)
      }
    })
  }

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.tipo_evento === filter)

  const tiposEvento = ['Recaudación de fondos', 'Actividad educativa', 'Jornada de donación', 'Evento comunitario', 'Taller', 'Campaña de concientización', 'Otro']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📅 Eventos de Fundaciones
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Descubre y participa en eventos organizados por fundaciones verificadas
        </p>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Todos
        </button>
        {tiposEvento.map(tipo => (
          <button
            key={tipo}
            onClick={() => setFilter(tipo)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tipo
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Lista de Eventos */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No hay eventos disponibles en este momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.evento_id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(event)}
            >
              {/* Imagen */}
              {event.imagen_evento ? (
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={event.imagen_evento}
                    alt={event.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg mb-4 flex items-center justify-center">
                  <CalendarIcon className="w-16 h-16 text-purple-400" />
                </div>
              )}

              {/* Contenido */}
              <div className="space-y-3">
                <div>
                  <span className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs rounded-full mb-2">
                    {event.tipo_evento}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {event.titulo}
                  </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {event.descripcion}
                </p>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      {new Date(event.fecha_inicio).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {event.ubicacion && (
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="w-4 h-4" />
                      <span className="line-clamp-1">{event.ubicacion}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <CheckBadgeIcon className="w-4 h-4 text-purple-600" />
                    <span className="line-clamp-1">
                      {event.fundacion?.[0]?.nombre_fundacion || 'Fundación'}
                    </span>
                  </div>

                  {event.requiere_registro && event.capacidad_maxima && (
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4" />
                      <span>
                        {event.registros_count || 0} / {event.capacidad_maxima}
                      </span>
                    </div>
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

