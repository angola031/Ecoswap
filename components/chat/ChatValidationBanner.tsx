import React from 'react'
import { Proposal } from './ChatModule'

interface ChatValidationBannerProps {
  proposals: Proposal[]
  userValidations: {usuario_id: number, es_exitoso: boolean, fecha_validacion: string}[]
  currentUserId: string
  currentUser: any
  bannerKey: number
  onValidateMeeting: (intercambioId: number) => void
  onViewProposal: (proposal: Proposal) => void
}

export const ChatValidationBanner: React.FC<ChatValidationBannerProps> = ({
  proposals,
  userValidations,
  currentUserId,
  currentUser,
  bannerKey,
  onValidateMeeting,
  onViewProposal
}) => {
  const hasAccepted = proposals.some(p => p.status === 'aceptada')
  const hasPendingValidation = proposals.some(p => p.status === 'pendiente_validacion')
  // Usar exchangeStatus en lugar de status para el estado del intercambio
  const isCompleted = proposals.some(p => (p as any).exchangeStatus === 'completado')
  const isRejected = proposals.some(p => (p as any).exchangeStatus === 'rechazado' || (p as any).exchangeStatus === 'fallido')
  
  // Verificar si el usuario actual ya validó con comparación normalizada
  const currentUserIdString = currentUserId
  const currentUserIdNumber = parseInt(currentUserIdString || '0')
  
  // Debug para identificar el problema con getCurrentUserId
  console.log('🔍 [Banner Debug] getCurrentUserId result:', {
    currentUserIdString,
    currentUserIdNumber,
    isNaN: Number.isNaN(currentUserIdNumber),
    type: typeof currentUserIdString,
    length: currentUserIdString?.length
  })
  
  // Si getCurrentUserId falla, intentar obtener el ID del currentUser
  let finalCurrentUserId = currentUserIdNumber
  if (Number.isNaN(currentUserIdNumber) && currentUser?.id) {
    finalCurrentUserId = parseInt(String(currentUser.id))
    console.log('🔍 [Banner Debug] Usando currentUser.id como fallback:', {
      currentUser_id: currentUser.id,
      finalCurrentUserId,
      isNaN: Number.isNaN(finalCurrentUserId)
    })
  }
  
  // 🔥 CRÍTICO: Normalizar TODOS los IDs a números para comparación
  const userAlreadyValidated = userValidations.some(validation => {
    const validationUserId = Number(validation.usuario_id)
    const matchNumber = validationUserId === finalCurrentUserId
    
    console.log('🔍 [Banner] Comparando IDs:', {
      validation_usuario_id: validation.usuario_id,
      validationUserId,
      finalCurrentUserId,
      matchNumber
    })
    
    return matchNumber
  })
  
  console.log('🔍 [Banner] Estado de validación:', {
    currentUserId: currentUserIdString,
    currentUserIdNumber,
    finalCurrentUserId,
    userValidations: userValidations.map(v => ({
      usuario_id: v.usuario_id,
      usuario_id_normalizado: Number(v.usuario_id)
    })),
    userAlreadyValidated,
    isCompleted,
    isRejected
  })
  
  // PRIORIDAD 1: Si el intercambio ya está completado o rechazado, mostrar estado final
  if (isCompleted || isRejected) {
    const statusText = isCompleted ? 'completado' : 'rechazado'
    const statusColor = isCompleted ? 'green' : 'red'
    const statusIcon = isCompleted ? '✅' : '❌'
    
    return (
      <div key={bannerKey} className={`bg-${statusColor}-50 border-b border-${statusColor}-200 flex-shrink-0`}>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`text-${statusColor}-700 text-sm font-medium`}>
              {statusIcon} Intercambio {statusText}
            </span>
            <span className={`text-xs text-${statusColor}-700 hidden sm:inline`}>
              {isCompleted ? 'El intercambio se ha completado exitosamente' : 'El intercambio ha sido rechazado'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const firstProposal = proposals.find(p => p.status === 'pendiente_validacion') || 
                                     proposals.find(p => p.status === 'aceptada') ||
                                     proposals.find(p => (p as any).status === 'completado') ||
                                     proposals.find(p => (p as any).status === 'rechazado') ||
                                     proposals.find(p => (p as any).status === 'fallido')
                if (firstProposal) onViewProposal(firstProposal)
              }}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Ver Detalles"
            >
              Ver
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // PRIORIDAD 2: Si el usuario ya validó pero el intercambio no está terminado, mostrar confirmación
  if (userAlreadyValidated) {
    console.log('✅ [Validation Banner] Usuario ya validó, mostrando mensaje de confirmación')
    return (
      <div key={bannerKey} className="bg-green-50 border-b border-green-200 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-700 text-sm font-medium">✅ Ya validaste este encuentro</span>
            <span className="text-xs text-green-700 hidden sm:inline">Esperando validación del otro usuario</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const firstProposal = proposals.find(p => p.status === 'pendiente_validacion') || proposals.find(p => p.status === 'aceptada')
                if (firstProposal) onViewProposal(firstProposal)
              }}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Ver Detalles"
            >
              Ver
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // PRIORIDAD 3: Si no hay propuestas aceptadas o pendientes de validación, no mostrar banner
  if (!hasAccepted && !hasPendingValidation) return null
  
  // PRIORIDAD 4: Mostrar banner de validación pendiente (usuario aún no ha validado)
  const first = proposals.find(p => p.status === 'pendiente_validacion') || proposals.find(p => p.status === 'aceptada')
  const intercambioId = (first as any)?.intercambioId || first?.id
  return (
    <div key={bannerKey} className="bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-700 text-sm font-medium">⏳ Pendiente de Validación</span>
          <span className="text-xs text-yellow-700 hidden sm:inline">Confirma si el encuentro fue exitoso para cerrar el intercambio</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onValidateMeeting(Number(intercambioId))}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Validar Encuentro
          </button>
          {/* Botón Ver detalles (reemplaza al de la sección superior) */}
          <button
            onClick={() => {
              const firstProposal = proposals.find(p => p.status === 'pendiente_validacion') || proposals.find(p => p.status === 'aceptada')
              if (firstProposal) onViewProposal(firstProposal)
            }}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            title="Ver Detalles"
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  )
}
