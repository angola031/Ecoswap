import React, { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Proposal } from '../chat/types'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

interface ProposalsModuleProps {
  currentUser: any
}

export const ProposalsModule: React.FC<ProposalsModuleProps> = ({ currentUser }) => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'aceptada' | 'rechazada'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadAllProposals()
  }, [])

  const loadAllProposals = async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      console.log('🔄 [ProposalsModule] Iniciando carga de propuestas')
      console.log('🔄 [ProposalsModule] Session:', session ? 'Existe' : 'No existe')
      console.log('🔄 [ProposalsModule] Token:', token ? 'Existe' : 'No existe')
      
      if (!token) {
        console.error('❌ [ProposalsModule] No hay token de autenticación')
        return
      }

      console.log('🔄 [ProposalsModule] Cargando todas las propuestas del usuario')

      // Cargar todas las propuestas del usuario
      const response = await fetch('/api/proposals/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔄 [ProposalsModule] Respuesta HTTP:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [ProposalsModule] Respuesta del servidor:', data)
        console.log('✅ [ProposalsModule] Propuestas cargadas:', data.proposals?.length || 0)
        console.log('✅ [ProposalsModule] Propuestas detalle:', data.proposals)
        setProposals(data.proposals || [])
      } else {
        const errorData = await response.text()
        console.error('❌ [ProposalsModule] Error cargando propuestas:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ [ProposalsModule] Error cargando propuestas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true
    return proposal.status === filter
  })

  // Agrupar propuestas por producto
  const groupedProposals = filteredProposals.reduce((groups, proposal) => {
    const productId = proposal.product?.id || 'sin-producto'
    if (!groups[productId]) {
      groups[productId] = {
        product: proposal.product,
        proposals: []
      }
    }
    groups[productId].proposals.push(proposal)
    return groups
  }, {} as Record<string, { product: any, proposals: Proposal[] }>)

  const handleProposalClick = (proposal: Proposal) => {
    setSelectedProposal(proposal)
  }

  const handleRespondToProposal = async (proposal: Proposal, response: 'aceptar' | 'rechazar') => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response_api = await fetch(`/api/chat/${proposal.chatId}/proposals/${proposal.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      })

      if (response_api.ok) {
        await loadAllProposals() // Recargar propuestas
        setSelectedProposal(null)
        
        Swal.fire({
          title: response === 'aceptar' ? '✅ Propuesta Aceptada' : '❌ Propuesta Rechazada',
          text: response === 'aceptar' 
            ? 'Has aceptado la propuesta. Puedes coordinar los detalles del encuentro.'
            : 'Has rechazado la propuesta.',
          icon: response === 'aceptar' ? 'success' : 'info',
          confirmButtonColor: '#16a34a'
        })
      } else {
        throw new Error('Error respondiendo a la propuesta')
      }
    } catch (error) {
      console.error('Error respondiendo a propuesta:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo procesar la respuesta. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const formatPrice = (precio: number | null, tipoTransaccion: string | null, condicionesIntercambio: string | null, queBuscoCambio: string | null, precioNegociable: boolean | null) => {
    if (tipoTransaccion === 'donacion') {
      return '🎁 Donación'
    } else if (tipoTransaccion === 'cambio') {
      return condicionesIntercambio || queBuscoCambio || 'Intercambio'
    } else if (precio) {
      const formattedPrice = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(precio)
      return precioNegociable ? `${formattedPrice} (Negociable)` : formattedPrice
    }
    return 'Precio no especificado'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptada': return 'bg-green-100 text-green-800'
      case 'pendiente': return 'bg-yellow-100 text-yellow-800'
      case 'pendiente_validacion': return 'bg-blue-100 text-blue-800'
      case 'rechazada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'precio': return '💰'
      case 'intercambio': return '🔄'
      case 'encuentro': return '🤝'
      case 'condiciones': return '📋'
      default: return '💬'
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Mis Propuestas</h1>
          <p className="text-sm md:text-base text-gray-600">Gestiona todas tus propuestas de intercambio</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
        >
          ➕ Nueva Propuesta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'aceptada', label: 'Aceptadas' },
          { key: 'rechazada', label: 'Rechazadas' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-3 py-1 rounded-full text-xs md:text-sm transition-colors ${
              filter === key
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de Propuestas Agrupadas por Producto */}
      <div className="space-y-6">
        {Object.keys(groupedProposals).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No tienes propuestas' : `No hay propuestas ${filter}`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Crea tu primera propuesta para empezar a intercambiar'
                : 'Intenta cambiar el filtro para ver más propuestas'
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Crear Primera Propuesta
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedProposals).map(([productId, group]) => (
            <div key={productId} className="space-y-4">
              {/* Header del Producto - Estilo similar a la imagen */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  {/* Imagen del producto */}
                  <div className="flex-shrink-0">
                    {group.product?.image ? (
                      <img
                        src={group.product.image}
                        alt={group.product.title}
                        className="w-16 h-16 object-cover rounded border border-gray-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xl">📦</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Información del producto */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {group.product?.title || 'nombre producto'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {group.product?.price ? `$${group.product.price.toLocaleString('es-CO')}` : 
                       group.product?.type === 'donacion' ? 'donación' : 'precio o donación'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {group.proposals.length} propuesta{group.proposals.length !== 1 ? 's' : ''}
                      {group.proposals.length > 3 && ' (scroll para ver más)'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Lista de propuestas del producto - Estilo de cajas como en la imagen */}
              <div className={`space-y-3 ${group.proposals.length > 3 ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                {group.proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => setSelectedProposal(proposal)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getTypeIcon(proposal.type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {proposal.type === 'precio' && 'Propuesta de Precio'}
                              {proposal.type === 'intercambio' && 'Propuesta de Intercambio'}
                              {proposal.type === 'encuentro' && 'Propuesta de Encuentro'}
                              {proposal.type === 'condiciones' && 'Propuesta de Condiciones'}
                              {proposal.type === 'otro' && 'Otra Propuesta'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {proposal.proposer.id === currentUser?.user_id 
                                ? `Para: ${proposal.receiver.name} ${proposal.receiver.lastName}`
                                : `De: ${proposal.proposer.name} ${proposal.proposer.lastName}`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status === 'aceptada' && '✅ Aceptada'}
                          {proposal.status === 'pendiente' && '⏳ Pendiente'}
                          {proposal.status === 'pendiente_validacion' && '🔍 En Validación'}
                          {proposal.status === 'rechazada' && '❌ Rechazada'}
                          {!['aceptada', 'pendiente', 'pendiente_validacion', 'rechazada'].includes(proposal.status) && proposal.status}
                        </span>
                        
                        {/* Botones de acción */}
                        {proposal.receiver.id === currentUser?.user_id && proposal.status === 'pendiente' && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRespondToProposal(proposal, 'aceptar')
                              }}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              title="Aceptar propuesta"
                            >
                              ✅
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRespondToProposal(proposal, 'rechazar')
                              }}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              title="Rechazar propuesta"
                            >
                              ❌
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicador de scroll cuando hay más de 3 propuestas */}
                {group.proposals.length > 3 && (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                      <span>📜</span>
                      <span>Desplázate para ver más propuestas</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Detalle de Propuesta */}
      {selectedProposal && (
        <ProposalDetailModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
          onUpdate={loadAllProposals}
        />
      )}

      {/* Modal de Crear Propuesta */}
      {showCreateModal && (
        <CreateProposalModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadAllProposals}
        />
      )}
    </div>
  )
}

// Componentes auxiliares
const ProposalDetailModal = ({ proposal, onClose, onUpdate }: any) => {
  const handleRespondToProposal = async (response: 'aceptar' | 'rechazar') => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response_api = await fetch(`/api/chat/${proposal.chatId}/proposals/${proposal.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ response })
      })

      if (response_api.ok) {
        await onUpdate() // Recargar propuestas
        onClose()
        
        Swal.fire({
          title: response === 'aceptar' ? '✅ Propuesta Aceptada' : '❌ Propuesta Rechazada',
          text: response === 'aceptar' 
            ? 'Has aceptado la propuesta. Puedes coordinar los detalles del encuentro.'
            : 'Has rechazado la propuesta.',
          icon: response === 'aceptar' ? 'success' : 'info',
          confirmButtonColor: '#16a34a'
        })
      } else {
        throw new Error('Error respondiendo a la propuesta')
      }
    } catch (error) {
      console.error('Error respondiendo a propuesta:', error)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo procesar la respuesta. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const formatPrice = (precio: number | null, tipoTransaccion: string | null, condicionesIntercambio: string | null, queBuscoCambio: string | null, precioNegociable: boolean | null) => {
    if (tipoTransaccion === 'donacion') {
      return '🎁 Donación'
    } else if (tipoTransaccion === 'cambio') {
      return condicionesIntercambio || queBuscoCambio || 'Intercambio'
    } else if (precio) {
      const formattedPrice = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(precio)
      return precioNegociable ? `${formattedPrice} (Negociable)` : formattedPrice
    }
    return 'Precio no especificado'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">Detalles de la Propuesta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{proposal.type === 'precio' ? '💰' : proposal.type === 'intercambio' ? '🔄' : '💬'}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {proposal.type === 'precio' && 'Propuesta de Precio'}
                {proposal.type === 'intercambio' && 'Propuesta de Intercambio'}
                {proposal.type === 'encuentro' && 'Propuesta de Encuentro'}
                {proposal.type === 'condiciones' && 'Propuesta de Condiciones'}
                {proposal.type === 'otro' && 'Otra Propuesta'}
              </h3>
              <p className="text-sm text-gray-600">
                {proposal.proposer.id === proposal.receiver.id 
                  ? `Para: ${proposal.receiver.name} ${proposal.receiver.lastName}`
                  : `De: ${proposal.proposer.name} ${proposal.proposer.lastName}`
                }
              </p>
            </div>
          </div>

          {proposal.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Descripción:</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{proposal.description}</p>
            </div>
          )}

          {proposal.proposedPrice && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Precio Propuesto:</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {formatPrice(proposal.proposedPrice, proposal.product?.type || null, proposal.product?.exchangeConditions || null, proposal.product?.exchangeSeeking || null, proposal.product?.negotiable || null)}
              </p>
            </div>
          )}

          {proposal.conditions && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Condiciones:</h4>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{proposal.conditions}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${proposal.status === 'aceptada' ? 'bg-green-100 text-green-800' : proposal.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {proposal.status === 'aceptada' && '✅ Aceptada'}
              {proposal.status === 'pendiente' && '⏳ Pendiente'}
              {proposal.status === 'pendiente_validacion' && '🔍 En Validación'}
              {proposal.status === 'rechazada' && '❌ Rechazada'}
              {!['aceptada', 'pendiente', 'pendiente_validacion', 'rechazada'].includes(proposal.status) && proposal.status}
            </span>
            
            {proposal.receiver.id === proposal.proposer.id && proposal.status === 'pendiente' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleRespondToProposal('aceptar')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => handleRespondToProposal('rechazar')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateProposalModal = ({ onClose, onSuccess }: any) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">Crear Nueva Propuesta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>
        {/* Contenido del modal */}
        <p className="text-sm md:text-base">Modal de creación en desarrollo...</p>
      </div>
    </div>
  )
}