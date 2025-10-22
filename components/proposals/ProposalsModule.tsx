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
      if (!token) return

      console.log('🔄 [ProposalsModule] Cargando todas las propuestas del usuario')

      // Cargar todas las propuestas del usuario
      const response = await fetch('/api/proposals/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ [ProposalsModule] Respuesta del servidor:', data)
        console.log('✅ [ProposalsModule] Propuestas cargadas:', data.proposals?.length || 0)
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Propuestas</h1>
          <p className="text-gray-600">Gestiona todas tus propuestas de intercambio</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ➕ Nueva Propuesta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2 mb-6">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pendiente', label: 'Pendientes' },
          { key: 'aceptada', label: 'Aceptadas' },
          { key: 'rechazada', label: 'Rechazadas' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === key
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de Propuestas */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
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
          filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedProposal(proposal)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Información del producto */}
                  {proposal.product && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{proposal.product.title}</h4>
                      <p className="text-xs text-gray-600">
                        {formatPrice(
                          proposal.product.price,
                          proposal.product.type,
                          proposal.product.exchangeConditions,
                          proposal.product.exchangeSeeking,
                          proposal.product.negotiable
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(proposal.type)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {proposal.type === 'precio' && 'Propuesta de Precio'}
                        {proposal.type === 'intercambio' && 'Propuesta de Intercambio'}
                        {proposal.type === 'encuentro' && 'Propuesta de Encuentro'}
                        {proposal.type === 'condiciones' && 'Propuesta de Condiciones'}
                        {proposal.type === 'otro' && 'Otra Propuesta'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {proposal.proposer.id === currentUser?.user_id 
                          ? `Para: ${proposal.receiver.name} ${proposal.receiver.lastName}`
                          : `De: ${proposal.proposer.name} ${proposal.proposer.lastName}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3 line-clamp-2">{proposal.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>📅 {new Date(proposal.createdAt).toLocaleDateString('es-CO')}</span>
                    {proposal.proposedPrice && (
                      <span>💰 ${proposal.proposedPrice.toLocaleString('es-CO')}</span>
                    )}
                    {proposal.meetingDate && (
                      <span>🤝 {new Date(proposal.meetingDate).toLocaleDateString('es-CO')}</span>
                    )}
                    {proposal.meetingPlace && (
                      <span>📍 {proposal.meetingPlace}</span>
                    )}
                    {proposal.nota_intercambio && (
                      <span>📝 {proposal.nota_intercambio}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status === 'aceptada' && '✅ Aceptada'}
                    {proposal.status === 'pendiente' && '⏳ Pendiente'}
                    {proposal.status === 'pendiente_validacion' && '🔍 En Validación'}
                    {proposal.status === 'rechazada' && '❌ Rechazada'}
                    {!['aceptada', 'pendiente', 'pendiente_validacion', 'rechazada'].includes(proposal.status) && proposal.status}
                  </span>
                  
                  {/* Mostrar botones de acción solo si el usuario es el receptor y está pendiente */}
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
                        ✅ Aceptar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRespondToProposal(proposal, 'rechazar')
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Rechazar propuesta"
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleProposalClick(proposal)
                    }}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    Ver detalles →
                  </button>
                </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Detalle de Propuesta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        {/* Información del producto */}
        {proposal.product && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">📦 Producto</h3>
            <h4 className="font-medium text-gray-900">{proposal.product.title}</h4>
            <p className="text-sm text-gray-600">
              {formatPrice(
                proposal.product.price,
                proposal.product.type,
                proposal.product.exchangeConditions,
                proposal.product.exchangeSeeking,
                proposal.product.negotiable
              )}
            </p>
          </div>
        )}

        {/* Información de la propuesta */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">📝 Propuesta</h3>
          <div className="space-y-2">
            <p><strong>Tipo:</strong> {proposal.type}</p>
            <p><strong>Descripción:</strong> {proposal.description}</p>
            {proposal.proposedPrice && (
              <p><strong>Precio propuesto:</strong> ${proposal.proposedPrice.toLocaleString('es-CO')}</p>
            )}
            {proposal.conditions && (
              <p><strong>Condiciones:</strong> {proposal.conditions}</p>
            )}
            {proposal.meetingDate && (
              <p><strong>Fecha de encuentro:</strong> {new Date(proposal.meetingDate).toLocaleDateString('es-ES')}</p>
            )}
            {proposal.meetingPlace && (
              <p><strong>Lugar de encuentro:</strong> {proposal.meetingPlace}</p>
            )}
            {proposal.nota_intercambio && (
              <p><strong>Notas del encuentro:</strong> {proposal.nota_intercambio}</p>
            )}
          </div>
        </div>

        {/* Información de usuarios */}
        <div className="mb-4">
          <h3 className="font-medium text-gray-900 mb-2">👥 Participantes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Proponente</p>
              <p className="font-medium">{proposal.proposer.name} {proposal.proposer.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Receptor</p>
              <p className="font-medium">{proposal.receiver.name} {proposal.receiver.lastName}</p>
            </div>
          </div>
        </div>

        {/* Estado y fecha */}
        <div className="mb-4">
          <p><strong>Estado:</strong> {proposal.status}</p>
          <p><strong>Fecha de creación:</strong> {new Date(proposal.createdAt).toLocaleString('es-ES')}</p>
        </div>

        {/* Botones de acción */}
        {proposal.status === 'pendiente' && (
          <div className="flex space-x-3">
            <button
              onClick={() => handleRespondToProposal('aceptar')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ✅ Aceptar Propuesta
            </button>
            <button
              onClick={() => handleRespondToProposal('rechazar')}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ❌ Rechazar Propuesta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const CreateProposalModal = ({ onClose, onSuccess }: any) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Crear Nueva Propuesta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        {/* Contenido del modal */}
        <p>Modal de creación en desarrollo...</p>
      </div>
    </div>
  )
}
