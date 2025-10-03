// Funciones para manejar acciones de interacciones desde el frontend
import { 
  InteractionSummary, 
  InteractionDetail,
  NewProposalForm,
  RatingForm,
  DeliveryForm
} from './types/interactions'

// Función para aceptar un intercambio
export async function acceptInteraction(
  interactionId: string,
  meetingData: {
    location: string
    date: string
    time: string
    notes?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/${interactionId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al aceptar intercambio' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error aceptando intercambio:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para rechazar un intercambio
export async function rejectInteraction(
  interactionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/${interactionId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al rechazar intercambio' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error rechazando intercambio:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para cancelar un intercambio
export async function cancelInteraction(
  interactionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/${interactionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al cancelar intercambio' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error cancelando intercambio:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para completar un intercambio
export async function completeInteraction(
  interactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/${interactionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al completar intercambio' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error completando intercambio:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para crear una propuesta
export async function createProposal(
  chatId: string,
  proposalData: NewProposalForm
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`/api/chat/${chatId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proposalData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al crear propuesta' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error creando propuesta:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para responder a una propuesta
export async function respondToProposal(
  proposalId: string,
  response: {
    estado: 'aceptada' | 'rechazada' | 'contrapropuesta'
    respuesta: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Necesitamos el chatId para esta operación, por lo que lo pasamos como parámetro
    const response_api = await fetch(`/api/chat/proposals/${proposalId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response)
    })

    if (!response_api.ok) {
      const errorData = await response_api.json()
      return { success: false, error: errorData.error || 'Error al responder propuesta' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error respondiendo propuesta:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para crear una calificación
export async function createRating(
  exchangeId: string,
  ratingData: RatingForm & { calificado_id: number }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/${exchangeId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratingData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al crear calificación' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error creando calificación:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para obtener estadísticas de interacciones
export async function getInteractionStats(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch('/api/interactions/stats')

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al obtener estadísticas' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para obtener interacciones con filtros
export async function getInteractions(
  filters: {
    status?: string
    type?: string
    page?: number
    limit?: number
    search?: string
    dateFrom?: string
    dateTo?: string
  } = {}
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.type) params.append('type', filters.type)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.search) params.append('search', filters.search)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    const response = await fetch(`/api/interactions?${params.toString()}`)

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al obtener interacciones' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo interacciones:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para obtener detalles de una interacción
export async function getInteractionDetail(
  interactionId: string
): Promise<{ success: boolean; data?: InteractionDetail; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/${interactionId}`)

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al obtener detalles' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo detalles de interacción:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para obtener actividades del usuario
export async function getUserActivities(
  limit: number = 50
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/activities?limit=${limit}`)

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al obtener actividades' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo actividades:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para obtener eventos del sistema
export async function getSystemEvents(
  limit: number = 20
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`/api/interactions/events?limit=${limit}`)

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al obtener eventos' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error obteniendo eventos:', error)
    return { success: false, error: 'Error de conexión' }
  }
}

// Función para marcar notificación como leída
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST'
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, error: errorData.error || 'Error al marcar notificación' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error marcando notificación:', error)
    return { success: false, error: 'Error de conexión' }
  }
}
