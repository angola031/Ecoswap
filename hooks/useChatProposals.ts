import { useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface Proposal {
  id: number
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  status: 'pendiente' | 'aceptada' | 'rechazada' | 'contrapropuesta' | 'cancelada' | 'pendiente_validacion'
  createdAt: string
  respondedAt?: string
  response?: string
  meetingDate?: string
  meetingPlace?: string
  nota_intercambio?: string
  proposer: {
    id: number
    name: string
    lastName: string
    avatar?: string
  }
  receiver: {
    id: number
    name: string
    lastName: string
    avatar?: string
  }
}

interface ProposalFormData {
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  meetingDate?: string
  meetingPlace?: string
  meetingNotes?: string
}

export const useChatProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)

  const loadProposals = useCallback(async (chatId: string): Promise<Proposal[]> => {
    if (!chatId) {
      setProposals([])
      return []
    }

    setIsLoadingProposals(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return []

      console.log('🔄 [loadProposals] Cargando propuestas para chat:', chatId)
      
      const response = await fetch(`/api/chat/${chatId}/proposals?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        console.error('❌ [ChatModule] Error cargando propuestas:', response.status)
        return []
      }

      const data = await response.json()
      const proposalsData = data.data || []
      
      console.log('✅ [loadProposals] Propuestas cargadas:', proposalsData.length)
      setProposals(proposalsData)
      return proposalsData
    } catch (error) {
      console.error('❌ [ChatModule] Error cargando propuestas:', error)
      return []
    } finally {
      setIsLoadingProposals(false)
    }
  }, [])

  const createProposal = useCallback(async (
    chatId: string,
    proposalData: ProposalFormData,
    currentUserId: string
  ): Promise<Proposal | null> => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('No hay token de sesión')
      }

      const requestBody = {
        userId: currentUserId,
        ...proposalData
      }

      console.log('🔄 [createProposal] Creando propuesta:', requestBody)

      const response = await fetch(`/api/chat/${chatId}/proposals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ [createProposal] Propuesta creada:', data)

      // Recargar propuestas para actualizar la lista
      await loadProposals(chatId)
      
      return data
    } catch (error) {
      console.error('❌ [createProposal] Error creando propuesta:', error)
      throw error
    }
  }, [loadProposals])

  const respondToProposal = useCallback(async (
    chatId: string,
    proposalId: number,
    response: 'aceptar' | 'rechazar' | 'contrapropuesta',
    responseData?: {
      message?: string
      meetingDetails?: {
        date?: string
        time?: string
        place?: string
        notes?: string
      }
    }
  ): Promise<any> => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('No hay token de sesión')
      }

      const requestBody = {
        response,
        ...responseData
      }

      console.log('🔄 [respondToProposal] Respondiendo a propuesta:', {
        proposalId,
        response,
        responseData
      })

      const response_api = await fetch(`/api/chat/${chatId}/proposals/${proposalId}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response_api.ok) {
        const errorData = await response_api.json()
        throw new Error(errorData.error || `Error ${response_api.status}`)
      }

      const data = await response_api.json()
      console.log('✅ [respondToProposal] Respuesta enviada:', data)

      // Recargar propuestas para actualizar la lista
      await loadProposals(chatId)
      
      return data
    } catch (error) {
      console.error('❌ [respondToProposal] Error respondiendo a propuesta:', error)
      throw error
    }
  }, [loadProposals])

  return {
    proposals,
    isLoadingProposals,
    loadProposals,
    createProposal,
    respondToProposal
  }
}
