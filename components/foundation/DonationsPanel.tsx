'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { 
  GiftIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ChartBarIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

interface DonationsPanelProps {
  currentUser: any
}

export default function DonationsPanel({ currentUser }: DonationsPanelProps) {
  const [activeTab, setActiveTab] = useState<'available' | 'requested' | 'received' | 'impact'>('available')
  const [isLoading, setIsLoading] = useState(false)
  const [availableDonations, setAvailableDonations] = useState<any[]>([])
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [receivedDonations, setReceivedDonations] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalRequested: 0,
    totalPending: 0,
    estimatedValue: 0
  })

  useEffect(() => {
    if (activeTab === 'available') {
      loadAvailableDonations()
    } else if (activeTab === 'requested') {
      loadMyRequests()
    } else if (activeTab === 'received') {
      loadReceivedDonations()
    } else if (activeTab === 'impact') {
      loadStats()
    }
  }, [activeTab])

  const loadAvailableDonations = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('No hay sesión activa')
        setIsLoading(false)
        return
      }

      // Obtener el user_id del usuario actual desde la base de datos
      const { data: userData, error: userError } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', session.user.email)
        .single()

      if (userError || !userData) {
        console.error('Error obteniendo user_id:', userError)
        setIsLoading(false)
        return
      }

      const currentUserId = userData.user_id

      console.log('🔍 Cargando donaciones disponibles para fundación, user_id:', currentUserId)
      
      // Obtener productos tipo donación que no sean del usuario actual
      const { data, error } = await supabase
        .from('producto')
        .select(`
          producto_id,
          titulo,
          descripcion,
          estado,
          fecha_publicacion,
          visualizaciones,
          user_id,
          usuario:user_id(nombre, apellido, foto_perfil),
          imagen_producto(url_imagen, es_principal),
          ubicacion:ubicacion_id(ciudad, departamento)
        `)
        .eq('tipo_transaccion', 'donacion')
        .eq('estado_publicacion', 'activo')
        .eq('estado_validacion', 'approved')
        .neq('user_id', currentUserId)
        .order('fecha_publicacion', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error cargando donaciones disponibles:', error)
        return
      }

      console.log('✅ Donaciones encontradas:', data?.length || 0, data)
      setAvailableDonations(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyRequests = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setIsLoading(false)
        return
      }

      // Obtener el user_id del usuario actual
      const { data: userData } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', session.user.email)
        .single()

      if (!userData) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/donations/my-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMyRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadReceivedDonations = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsLoading(false)
        return
      }

      // Obtener el user_id del usuario actual
      const { data: userData } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', session.user.email)
        .single()

      if (!userData) {
        setIsLoading(false)
        return
      }

      // Obtener propuestas aceptadas
      const { data, error } = await supabase
        .from('propuesta')
        .select(`
          propuesta_id,
          descripcion,
          fecha_creacion,
          fecha_respuesta,
          fecha_encuentro,
          lugar_encuentro,
          chat:chat_id(
            intercambio:intercambio_id(
              producto_solicitado:producto_solicitado_id(
                producto_id,
                titulo,
                descripcion,
                precio,
                imagen_producto(url_imagen)
              )
            )
          ),
          usuario_recibe:usuario_recibe_id(nombre, apellido, foto_perfil)
        `)
        .eq('usuario_propone_id', userData.user_id)
        .eq('estado', 'aceptada')
        .like('descripcion', 'Solicitud de donación:%')
        .order('fecha_respuesta', { ascending: false })

      if (error) {
        console.error('Error cargando donaciones recibidas:', error)
        return
      }

      setReceivedDonations(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsLoading(false)
        return
      }

      // Obtener el user_id del usuario actual
      const { data: userData } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', session.user.email)
        .single()

      if (!userData) {
        setIsLoading(false)
        return
      }
      
      // Estadísticas de propuestas
      const { data: propuestas } = await supabase
        .from('propuesta')
        .select('estado, chat:chat_id(intercambio:intercambio_id(producto_solicitado:producto_solicitado_id(precio)))')
        .eq('usuario_propone_id', userData.user_id)
        .like('descripcion', 'Solicitud de donación:%')

      const totalRequested = propuestas?.length || 0
      const totalReceived = propuestas?.filter(p => p.estado === 'aceptada').length || 0
      const totalPending = propuestas?.filter(p => p.estado === 'pendiente').length || 0
      
      // Calcular valor estimado
      let estimatedValue = 0
      propuestas?.forEach(p => {
        if (p.estado === 'aceptada' && p.chat?.[0]?.intercambio?.[0]?.producto_solicitado?.[0]?.precio) {
          estimatedValue += Number(p.chat[0].intercambio[0].producto_solicitado[0].precio)
        }
      })

      setStats({
        totalReceived,
        totalRequested,
        totalPending,
        estimatedValue
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestDonation = (producto: any) => {
    // Importar dinámicamente la función
    import('@/components/chat/ChatModule').then(() => {
      // Usar SweetAlert para solicitar donación
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: '🎁 Solicitar Donación',
          html: `
            <div class="text-left space-y-4">
              <div class="bg-purple-50 p-3 rounded-lg">
                <h4 class="font-medium text-purple-900 mb-1">${producto.titulo}</h4>
                <p class="text-sm text-purple-700">Estás solicitando esta donación</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">📝 Mensaje de solicitud</label>
                <textarea id="donation-message" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" rows="6" placeholder="Explica cómo esta donación ayudará a los niños de tu fundación..."></textarea>
                <p class="text-xs text-gray-500 mt-1">El dueño coordinará contigo los detalles del encuentro.</p>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Enviar Solicitud',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#7C3AED',
          cancelButtonColor: '#6B7280',
          preConfirm: () => {
            const message = (document.getElementById('donation-message') as HTMLTextAreaElement)?.value
            if (!message || message.trim().length < 10) {
              (window as any).Swal.showValidationMessage('Por favor, escribe un mensaje de al menos 10 caracteres')
              return false
            }
            return { message: message.trim() }
          }
        }).then(async (result: any) => {
          if (result.isConfirmed) {
            try {
              (window as any).Swal.fire({
                title: 'Enviando solicitud...',
                allowOutsideClick: false,
                didOpen: () => {
                  (window as any).Swal.showLoading()
                }
              })

              const supabase = getSupabaseClient()
              const { data: { session } } = await supabase.auth.getSession()
              
              // Obtener el user_id del usuario actual
              const { data: userData } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', session.user.email)
                .single()

              if (!userData) {
                throw new Error('No se pudo obtener el ID del usuario')
              }

              const response = await fetch('/api/donations/request', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  producto_id: producto.producto_id,
                  mensaje: result.value.message,
                  owner_id: producto.user_id
                })
              })

              if (response.ok) {
                await (window as any).Swal.fire({
                  title: '✅ Solicitud Enviada',
                  text: 'Tu solicitud ha sido enviada. Te notificaremos cuando respondan.',
                  icon: 'success',
                  confirmButtonText: 'Entendido',
                  confirmButtonColor: '#7C3AED'
                })
                // Recargar la lista
                loadAvailableDonations()
              } else {
                throw new Error('Error al enviar solicitud')
              }
            } catch (error) {
              (window as any).Swal.fire({
                title: 'Error',
                text: 'No se pudo enviar la solicitud',
                icon: 'error'
              })
            }
          }
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <GiftIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Panel de Donaciones</h1>
        </div>
        <p className="text-purple-100">
          Gestiona las donaciones para tu fundación y ayuda a más niños
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('available')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'available'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <GiftIcon className="w-5 h-5" />
              <span>Disponibles</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('requested')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'requested'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5" />
              <span>Mis Solicitudes</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('received')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'received'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Recibidas</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('impact')}
            className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'impact'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5" />
              <span>Impacto</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Available Donations */}
            {activeTab === 'available' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableDonations.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <GiftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay donaciones disponibles en este momento
                    </p>
                  </div>
                ) : (
                  availableDonations.map(producto => (
                    <div
                      key={producto.producto_id}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Imagen */}
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                        {producto.imagen_producto?.[0]?.url_imagen ? (
                          <img
                            src={producto.imagen_producto[0].url_imagen}
                            alt={producto.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GiftIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Contenido */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {producto.titulo}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {producto.descripcion}
                        </p>
                        
                        {/* Info */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span>📍 {producto.ubicacion?.[0]?.ciudad || 'Colombia'}</span>
                          <span>Estado: {producto.estado}</span>
                        </div>
                        
                        {/* Botón */}
                        <button
                          onClick={() => handleRequestDonation(producto)}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                        >
                          <HeartIcon className="w-4 h-4" />
                          <span>Solicitar Donación</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Requests */}
            {activeTab === 'requested' && (
              <div className="space-y-4">
                {myRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No has solicitado ninguna donación aún
                    </p>
                  </div>
                ) : (
                  myRequests.map(request => (
                    <div
                      key={request.propuesta_id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {request.producto?.titulo}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {request.descripcion?.replace('Solicitud de donación: ', '')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Solicitado: {new Date(request.fecha_creacion).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.estado === 'aceptada' 
                            ? 'bg-green-100 text-green-800'
                            : request.estado === 'rechazada'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.estado === 'aceptada' ? '✅ Aceptada' :
                           request.estado === 'rechazada' ? '❌ Rechazada' :
                           '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Received Donations */}
            {activeTab === 'received' && (
              <div className="space-y-4">
                {receivedDonations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aún no has recibido donaciones
                    </p>
                  </div>
                ) : (
                  receivedDonations.map(donation => (
                    <div
                      key={donation.propuesta_id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Imagen */}
                        {donation.chat?.[0]?.intercambio?.[0]?.producto_solicitado?.[0]?.imagen_producto?.[0] && (
                          <img
                            src={donation.chat[0].intercambio[0].producto_solicitado[0].imagen_producto[0].url_imagen}
                            alt="Donación"
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        )}
                        
                        {/* Info */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {donation.chat?.[0]?.intercambio?.[0]?.producto_solicitado?.[0]?.titulo}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Donado por: {donation.usuario_recibe?.[0]?.nombre} {donation.usuario_recibe?.[0]?.apellido}
                          </p>
                          {donation.fecha_encuentro && (
                            <p className="text-xs text-gray-500">
                              📅 Encuentro: {new Date(donation.fecha_encuentro).toLocaleDateString('es-CO')}
                              {donation.lugar_encuentro && ` en ${donation.lugar_encuentro}`}
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            Recibido: {new Date(donation.fecha_respuesta).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Impact Stats */}
            {activeTab === 'impact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <CheckCircleIcon className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stats.totalReceived}</div>
                  <div className="text-blue-100 text-sm">Donaciones Recibidas</div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                  <ClockIcon className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stats.totalPending}</div>
                  <div className="text-yellow-100 text-sm">Solicitudes Pendientes</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <GiftIcon className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stats.totalRequested}</div>
                  <div className="text-purple-100 text-sm">Total Solicitadas</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <ChartBarIcon className="w-8 h-8 mb-2 opacity-80" />
                  <div className="text-3xl font-bold mb-1">
                    ${stats.estimatedValue.toLocaleString('es-CO')}
                  </div>
                  <div className="text-green-100 text-sm">Valor Estimado</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

