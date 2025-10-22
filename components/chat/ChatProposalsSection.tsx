import React from 'react'
import { Proposal } from './types'

interface ChatProposalsSectionProps {
  proposals: Proposal[]
  isLoadingProposals: boolean
  onViewAllProposals: () => void
  onSendProposal: () => void
}

export const ChatProposalsSection: React.FC<ChatProposalsSectionProps> = ({
  proposals,
  isLoadingProposals,
  onViewAllProposals,
  onSendProposal
}) => {
  const activeProposals = proposals.filter(p => 
    p.status === 'pendiente' || p.status === 'aceptada' || p.status === 'pendiente_validacion'
  )

  if (isLoadingProposals) {
    return (
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900">Propuestas</h3>
          {activeProposals.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeProposals.length}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onViewAllProposals}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            title="Ver todas las propuestas"
          >
            Ver Todas
          </button>
          <button
            onClick={onSendProposal}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Nueva
          </button>
        </div>
      </div>
      
      {activeProposals.length === 0 ? (
        <div className="text-center py-2">
          <p className="text-gray-500 text-xs">No hay propuestas activas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeProposals.slice(0, 2).map((proposal) => (
            <div key={proposal.id} className="border border-gray-100 rounded p-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs">
                      {proposal.type === 'precio' && '💰'}
                      {proposal.type === 'intercambio' && '🔄'}
                      {proposal.type === 'encuentro' && '🤝'}
                      {proposal.type === 'condiciones' && '📋'}
                      {proposal.type === 'otro' && '💬'}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      proposal.status === 'aceptada' ? 'bg-green-100 text-green-700' :
                      proposal.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      proposal.status === 'pendiente_validacion' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {proposal.status === 'aceptada' && 'Aceptada'}
                      {proposal.status === 'pendiente' && 'Pendiente'}
                      {proposal.status === 'pendiente_validacion' && 'Validación'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{proposal.description}</p>
                  {proposal.proposedPrice && (
                    <p className="text-xs text-green-600 font-medium">
                      ${proposal.proposedPrice.toLocaleString('es-CO')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onViewAllProposals()}
                  className="text-green-600 hover:text-green-800 text-xs ml-2"
                >
                  →
                </button>
              </div>
            </div>
          ))}
          
          {activeProposals.length > 2 && (
            <div className="text-center">
              <button
                onClick={onViewAllProposals}
                className="text-xs text-green-600 hover:text-green-800"
              >
                Ver {activeProposals.length - 2} más...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
