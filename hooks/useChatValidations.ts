import { useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface ValidationData {
  usuario_id: number
  es_exitoso: boolean
  fecha_validacion: string
}

interface ValidationFormData {
  rating?: number
  comment?: string
  aspects?: string
  meetingPlace?: string
  meetingDate?: string
  meetingNotes?: string
  rejectionReason?: string
}

export const useChatValidations = () => {
  const [userValidations, setUserValidations] = useState<ValidationData[]>([])
  const [isLoadingValidations, setIsLoadingValidations] = useState(false)
  const [bannerKey, setBannerKey] = useState(0)

  const loadUserValidations = useCallback(async (chatId: string, forceReload = false): Promise<ValidationData[]> => {
    if (!chatId) {
      setUserValidations([])
      return []
    }

    setIsLoadingValidations(true)
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return []

      console.log('🔄 [loadUserValidations] Consulta directa con timestamp:', new Date().toISOString())
      
      // Obtener el intercambio_id del chat
      const chatResponse = await fetch(`/api/chat/${chatId}/proposals?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (!chatResponse.ok) {
        console.error('❌ [ChatModule] Error obteniendo datos del chat:', chatResponse.status)
        return []
      }

      const chatData = await chatResponse.json()
      const proposals = chatData.data || []
      
      // Encontrar el intercambio_id de las propuestas
      const firstProposal = proposals.find((p: any) => p.intercambioId)
      if (!firstProposal?.intercambioId) {
        console.log('ℹ️ [loadUserValidations] No hay intercambio asociado a este chat')
        setUserValidations([])
        return []
      }

      const intercambioId = firstProposal.intercambioId
      console.log('🔍 [loadUserValidations] Intercambio ID encontrado:', intercambioId)

      // Consulta directa a la tabla validacion_intercambio CON TIMESTAMP para evitar caché
      const validationResponse = await fetch(`/api/intercambios/${intercambioId}/validations?t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (validationResponse.ok) {
        const validationData = await validationResponse.json()
        console.log('✅ [loadUserValidations] Validaciones obtenidas:', validationData)
        
        // FORZAR actualización del estado con un nuevo array para garantizar re-render
        setUserValidations([...validationData])
        
        if (forceReload) {
          console.log('🔄 [loadUserValidations] Re-render forzado completado')
          // Forzar re-render del banner
          setBannerKey(prev => prev + 1)
        }
        
        return validationData
      } else {
        console.error('❌ [ChatModule] Error consultando validaciones:', validationResponse.status)
        // Fallback a datos del chat si la consulta directa falla
        const fallbackValidations = [...(chatData.userValidations || [])]
        setUserValidations(fallbackValidations)
        return fallbackValidations
      }
    } catch (error) {
      console.error('❌ [ChatModule] Error cargando validaciones:', error)
      return []
    } finally {
      setIsLoadingValidations(false)
    }
  }, [])

  const validateMeeting = useCallback(async (
    intercambioId: number, 
    validationData: ValidationFormData,
    currentUserId: string
  ) => {
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('No hay token de sesión')
      }

      const requestBody = {
        userId: currentUserId,
        ...validationData
      }
      
      console.log('🔄 [DEBUG] Enviando validación:', {
        intercambioId,
        requestBody,
        timestamp: new Date().toISOString()
      })

      const response = await fetch(`/api/intercambios/${intercambioId}/validate`, {
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
      console.log('✅ [DEBUG] Respuesta de validación:', data)

      return data
    } catch (error) {
      console.error('❌ [DEBUG] Error en validación:', error)
      throw error
    }
  }, [])

  const checkUserAlreadyValidated = useCallback((currentUserId: string | number): boolean => {
    const currentUserIdNumber = typeof currentUserId === 'string' ? parseInt(currentUserId) : currentUserId
    
    return userValidations.some(validation => {
      const validationUserId = Number(validation.usuario_id)
      return validationUserId === currentUserIdNumber
    })
  }, [userValidations])

  return {
    userValidations,
    isLoadingValidations,
    bannerKey,
    loadUserValidations,
    validateMeeting,
    checkUserAlreadyValidated
  }
}
