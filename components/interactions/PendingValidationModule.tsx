'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface PendingValidation {
  id: number
  estado: string
  fechaPropuesta: string
  fechaEncuentro?: string
  lugarEncuentro?: string
  notasEncuentro?: string
  mensajePropuesta: string
  montoAdicional?: number
  condicionesAdicionales?: string
  productoOfrecido: any
  productoSolicitado: any
  usuarioPropone: any
  usuarioRecibe: any
  otherUser: any
  isProposer: boolean
  userValidation?: any
  otherUserValidation?: any
  canValidate: boolean
  bothValidated: boolean
  isCompleted: boolean
  isFailed: boolean
}

interface PendingValidationModuleProps {
  userId: string
  onValidationComplete?: () => void
}

export default function PendingValidationModule({ 
  userId, 
  onValidationComplete 
}: PendingValidationModuleProps) {
  const [intercambios, setIntercambios] = useState<PendingValidation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingValidations()
  }, [userId])

  const fetchPendingValidations = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        setError('No hay sesión activa')
        return
      }

      const response = await fetch(`/api/intercambios/pending-validation?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setIntercambios(data.data)
      } else {
        setError('Error obteniendo intercambios')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateMeeting = async (intercambioId: number) => {
    try {
      const validationResult = await (window as any).Swal.fire({
        title: '¿El encuentro fue exitoso?',
        html: `
          <div class="text-left space-y-4">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>📋 Instrucciones:</strong> Confirma si el intercambio se realizó correctamente según lo acordado.
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">¿Cómo calificarías este intercambio?</label>
              <div class="flex space-x-2 mb-3">
                <button type="button" class="star-rating" data-rating="1" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">⭐</button>
                <button type="button" class="star-rating" data-rating="2" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">⭐⭐</button>
                <button type="button" class="star-rating" data-rating="3" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">⭐⭐⭐</button>
                <button type="button" class="star-rating" data-rating="4" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">⭐⭐⭐⭐</button>
                <button type="button" class="star-rating" data-rating="5" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">⭐⭐⭐⭐⭐</button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
              <textarea id="validation-comment" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="¿Cómo fue tu experiencia con este intercambio?"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Aspectos destacados (opcional)</label>
              <textarea id="validation-aspects" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="¿Qué aspectos positivos o negativos destacarías?"></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, fue exitoso',
        cancelButtonText: 'No, hubo problemas',
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#EF4444',
        width: '600px',
        didOpen: () => {
          // Manejar selección de estrellas
          const starButtons = document.querySelectorAll('.star-rating')
          let selectedRating = 0
          
          starButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
              selectedRating = index + 1
              starButtons.forEach((btn, i) => {
                if (i < selectedRating) {
                  btn.classList.add('bg-yellow-100', 'border-yellow-400')
                  btn.classList.remove('border-gray-300')
                } else {
                  btn.classList.remove('bg-yellow-100', 'border-yellow-400')
                  btn.classList.add('border-gray-300')
                }
              })
            })
          })
        },
        preConfirm: () => {
          const comment = (document.getElementById('validation-comment') as HTMLTextAreaElement)?.value
          const aspects = (document.getElementById('validation-aspects') as HTMLTextAreaElement)?.value
          const rating = document.querySelector('.star-rating.bg-yellow-100')?.getAttribute('data-rating')
          
          return {
            isValid: true,
            rating: rating ? parseInt(rating) : null,
            comment: comment || null,
            aspects: aspects || null
          }
        }
      })

      if (validationResult.isConfirmed) {
        await submitValidation(intercambioId, validationResult.value)
      } else if (validationResult.dismiss === Swal.DismissReason.cancel) {
        const problemResult = await (window as any).Swal.fire({
          title: '¿Qué problemas hubo?',
          input: 'textarea',
          inputLabel: 'Describe los problemas encontrados',
          inputPlaceholder: 'Explica qué problemas tuviste con este intercambio...',
          showCancelButton: true,
          confirmButtonText: 'Reportar problema',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#EF4444',
          cancelButtonColor: '#6B7280'
        })

        if (problemResult.isConfirmed) {
          await submitValidation(intercambioId, {
            isValid: false,
            comment: problemResult.value,
            rating: null,
            aspects: null
          })
        }
      }
    } catch (error) {
      console.error('Error validando encuentro:', error)
      ;(window as any).Swal.fire({
        title: 'Error',
        text: 'No se pudo validar el encuentro. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const submitValidation = async (intercambioId: number, validationData: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const response = await fetch(`/api/intercambios/${intercambioId}/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          ...validationData
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.data.bothValidated) {
          if (data.data.newEstado === 'completado') {
            ;(window as any).Swal.fire({
              title: '¡Intercambio Completado!',
              html: `
                <div class="text-center space-y-3">
                  <div class="text-6xl">🎉</div>
                  <p class="text-gray-700">El intercambio se ha completado exitosamente.</p>
                  <p class="text-sm text-gray-600">Ambos usuarios han confirmado que fue exitoso.</p>
                </div>
              `,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#10B981',
              width: '500px'
            })
          } else if (data.data.newEstado === 'fallido') {
            ;(window as any).Swal.fire({
              title: 'Intercambio Fallido',
              html: `
                <div class="text-center space-y-3">
                  <div class="text-6xl">❌</div>
                  <p class="text-gray-700">El intercambio no pudo completarse.</p>
                  <p class="text-sm text-gray-600">Los productos han vuelto a estar disponibles.</p>
                </div>
              `,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#EF4444',
              width: '500px'
            })
          }
        } else {
          ;(window as any).Swal.fire({
            title: 'Validación Enviada',
            text: 'Tu validación ha sido registrada. Esperando confirmación del otro usuario.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        }

        // Refrescar la lista
        fetchPendingValidations()
        onValidationComplete?.()
      } else {
        throw new Error('Error enviando validación')
      }
    } catch (error) {
      console.error('Error enviando validación:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (intercambios.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay intercambios pendientes</h3>
          <p className="text-gray-600">Todos tus intercambios están al día</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
        <h3 className="font-medium text-yellow-900">⏳ Intercambios Pendientes de Validación</h3>
        <p className="text-sm text-yellow-700">Confirma si tus encuentros fueron exitosos</p>
      </div>

      {intercambios.map((intercambio) => (
        <div key={intercambio.id} className="border border-gray-200 rounded-lg p-4 mx-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                intercambio.estado === 'en_progreso' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {intercambio.estado === 'en_progreso' ? 'En Progreso' : 'Pendiente Validación'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(intercambio.fechaPropuesta).toLocaleDateString('es-CO')}
              </span>
            </div>
            {intercambio.canValidate && (
              <button
                onClick={() => handleValidateMeeting(intercambio.id)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Validar</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">{intercambio.mensajePropuesta}</p>
            
            {intercambio.montoAdicional && intercambio.montoAdicional > 0 && (
              <p className="text-sm font-medium text-green-600">
                Monto adicional: ${intercambio.montoAdicional.toLocaleString('es-CO')}
              </p>
            )}

            {(intercambio.fechaEncuentro || intercambio.lugarEncuentro) && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <h5 className="text-xs font-medium text-blue-900 mb-1">Detalles del encuentro:</h5>
                {intercambio.fechaEncuentro && (
                  <p className="text-xs text-blue-800">📅 {new Date(intercambio.fechaEncuentro).toLocaleString('es-CO')}</p>
                )}
                {intercambio.lugarEncuentro && (
                  <p className="text-xs text-blue-800">📍 {intercambio.lugarEncuentro}</p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>Con:</span>
              <span className="font-medium">{intercambio.otherUser.nombre} {intercambio.otherUser.apellido}</span>
            </div>

            {intercambio.userValidation && (
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-800">
                  ✅ Ya validaste este intercambio
                  {intercambio.userValidation.calificacion && (
                    <span className="ml-2">
                      {'⭐'.repeat(intercambio.userValidation.calificacion)}
                    </span>
                  )}
                </p>
              </div>
            )}

            {intercambio.otherUserValidation && !intercambio.userValidation && (
              <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  ⏳ Esperando tu validación
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

