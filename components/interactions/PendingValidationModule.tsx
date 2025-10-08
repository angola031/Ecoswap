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
    console.log('🔍 DEBUG: Iniciando handleValidateMeeting para intercambio:', intercambioId)
    
    // Variables para el contador de tiempo (fuera del scope de didOpen)
    let countdownTimer: NodeJS.Timeout | null = null
    
    try {
      // Obtener información del intercambio para mostrar el nombre del usuario
      const intercambio = intercambios.find(i => i.id === intercambioId)
      const otherUserName = intercambio?.otherUser?.nombre || 'el otro usuario'
      
      console.log('🔍 DEBUG: Información del intercambio:', { 
        intercambio: intercambio ? 'encontrado' : 'no encontrado',
        otherUserName,
        userId
      })
      
      const validationResult = await (window as any).Swal.fire({
        title: '¿El encuentro fue exitoso?',
        html: `
          <div class="text-left space-y-4">
            <p class="text-sm text-gray-600 mb-4">Confirma el resultado y califica al otro usuario.</p>
            
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p class="text-sm text-blue-800">
                <strong>📋 Vas a calificar a ${otherUserName}</strong>
              </p>
            </div>
            
            <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Calificación <span class="text-red-500">*</span>
                </label>
                <p class="text-xs text-gray-500 mb-2">Selecciona de 1 a 5 estrellas (obligatorio)</p>
                <div class="flex space-x-2 mb-3" id="star-container">
                  <button type="button" class="star-rating" data-rating="1" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span class="text-xl">⭐</span>
                  </button>
                  <button type="button" class="star-rating" data-rating="2" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span class="text-xl">⭐</span><span class="text-xl">⭐</span>
                  </button>
                  <button type="button" class="star-rating" data-rating="3" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span class="text-xl">⭐</span><span class="text-xl">⭐</span><span class="text-xl">⭐</span>
                  </button>
                  <button type="button" class="star-rating" data-rating="4" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span class="text-xl">⭐</span><span class="text-xl">⭐</span><span class="text-xl">⭐</span><span class="text-xl">⭐</span>
                  </button>
                  <button type="button" class="star-rating" data-rating="5" class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <span class="text-xl">⭐</span><span class="text-xl">⭐</span><span class="text-xl">⭐</span><span class="text-xl">⭐</span><span class="text-xl">⭐</span>
                  </button>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
                <textarea 
                  id="validation-comment" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  rows="3" 
                  placeholder="¿Cómo fue tu experiencia?"
                ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Aspectos destacados (opcional)</label>
                <textarea 
                  id="validation-aspects" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  rows="2" 
                  placeholder="Puntualidad, estado del producto, etc."
                ></textarea>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Fue exitoso',
        cancelButtonText: 'No fue exitoso',
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#EF4444',
        allowOutsideClick: false,
        allowEscapeKey: false,
        width: '500px',
        willClose: () => {
          // Limpiar el timer cuando se cierre el modal
          if (countdownTimer) {
            clearInterval(countdownTimer)
          }
          // Remover notificaciones existentes
          const notification = document.querySelector('.countdown-notification')
          if (notification) {
            notification.remove()
          }
        },
        customClass: {
          popup: 'rounded-lg',
          title: 'text-lg font-semibold text-gray-900',
          htmlContainer: 'text-left',
          confirmButton: 'px-6 py-2 rounded-md font-medium',
          cancelButton: 'px-6 py-2 rounded-md font-medium'
        },
        didOpen: () => {
          // Manejar selección de estrellas mejorado
          const starButtons = document.querySelectorAll('.star-rating')
          let selectedRating = 0
          
          // Variables para el contador de tiempo
          let timeRemaining = 20
          let canConfirm = false
          
          // Función para actualizar el estado visual de validación
          const updateValidationState = () => {
            const confirmButton = document.querySelector('.swal2-confirm') as HTMLElement
            if (confirmButton) {
              if (selectedRating > 0 && canConfirm) {
                confirmButton.style.opacity = '1'
                confirmButton.disabled = false
                confirmButton.textContent = 'Fue exitoso'
              } else if (selectedRating > 0 && !canConfirm) {
                confirmButton.style.opacity = '0.6'
                confirmButton.disabled = true
                confirmButton.textContent = `Fue exitoso (${timeRemaining}s)`
              } else {
                confirmButton.style.opacity = '0.6'
                confirmButton.disabled = true
                confirmButton.textContent = 'Selecciona una calificación'
              }
            }
          }
          
          // Función para iniciar el contador
          const startCountdown = () => {
            if (countdownTimer) clearInterval(countdownTimer)
            
            timeRemaining = 20
            canConfirm = false
            
            countdownTimer = setInterval(() => {
              timeRemaining--
              updateValidationState()
              
              if (timeRemaining <= 0) {
                canConfirm = true
                clearInterval(countdownTimer!)
                updateValidationState()
              }
            }, 1000)
          }
          
          starButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
              selectedRating = index + 1
              
              // Actualizar estilos de todos los botones
              starButtons.forEach((btn, i) => {
                const btnElement = btn as HTMLElement
                if (i < selectedRating) {
                  btnElement.classList.remove('border-gray-300', 'bg-white')
                  btnElement.classList.add('bg-yellow-100', 'border-yellow-400', 'text-yellow-600')
                } else {
                  btnElement.classList.remove('bg-yellow-100', 'border-yellow-400', 'text-yellow-600')
                  btnElement.classList.add('border-gray-300', 'bg-white')
                }
              })
              
              // Iniciar contador de 20 segundos cuando se selecciona una calificación
              startCountdown()
              
              // Mostrar notificación sobre el tiempo de espera
              if (selectedRating === 1) {
                // Solo mostrar la notificación la primera vez
                const existingNotification = document.querySelector('.countdown-notification')
                if (!existingNotification) {
                  const notification = document.createElement('div')
                  notification.className = 'countdown-notification fixed top-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded-lg shadow-lg z-50'
                  notification.innerHTML = `
                    <div class="flex items-center space-x-2">
                      <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                      </svg>
                      <div>
                        <p class="font-medium">Tiempo de reflexión activado</p>
                        <p class="text-sm">Debes esperar 20 segundos antes de confirmar. Esto te ayuda a reconsiderar tu decisión.</p>
                      </div>
                    </div>
                  `
                  document.body.appendChild(notification)
                  
                  // Remover la notificación después de 5 segundos
                  setTimeout(() => {
                    notification.remove()
                  }, 5000)
                }
              }
              
              // Actualizar estado del botón de confirmación
              updateValidationState()
            })
            
            // Efecto hover
            button.addEventListener('mouseenter', () => {
              const btnElement = button as HTMLElement
              if (!btnElement.classList.contains('bg-yellow-100')) {
                btnElement.classList.add('bg-gray-50')
              }
            })
            
            button.addEventListener('mouseleave', () => {
              const btnElement = button as HTMLElement
              btnElement.classList.remove('bg-gray-50')
            })
          })
          
          // Inicializar estado del botón
          setTimeout(updateValidationState, 100)
        },
        preConfirm: () => {
          const comment = (document.getElementById('validation-comment') as HTMLTextAreaElement)?.value?.trim()
          const aspects = (document.getElementById('validation-aspects') as HTMLTextAreaElement)?.value?.trim()
          const selectedStar = document.querySelector('.star-rating.bg-yellow-100')
          const rating = selectedStar?.getAttribute('data-rating')
          
          // Validación obligatoria de calificación
          if (!rating) {
            Swal.showValidationMessage('⚠️ Por favor selecciona una calificación con estrellas')
            return false
          }
          
          // Validación de calificación mínima
          if (parseInt(rating) < 1 || parseInt(rating) > 5) {
            Swal.showValidationMessage('⚠️ La calificación debe ser entre 1 y 5 estrellas')
            return false
          }
          
          // Validación de tiempo de espera
          if (timeRemaining > 0) {
            Swal.showValidationMessage(`⚠️ Espera ${timeRemaining} segundos más antes de confirmar. Esto te da tiempo para reconsiderar tu decisión.`)
            return false
          }
          
          return {
            isValid: true,
            rating: parseInt(rating),
            comment: comment || null,
            aspects: aspects || null
          }
        }
      })

      console.log('🔍 DEBUG: Resultado del modal:', validationResult)

      if (validationResult.isConfirmed) {
        console.log('🔍 DEBUG: Usuario confirmó validación exitosa, enviando datos:', validationResult.value)
        
        // Verificar que los datos de validación son válidos antes de enviar
        if (validationResult.value && validationResult.value.isValid) {
          const submitResult = await submitValidation(intercambioId, validationResult.value)
          if (!submitResult) {
            console.log('🔍 DEBUG: La validación falló, no continuar')
            return
          }
        } else {
          console.log('🔍 DEBUG: Datos de validación inválidos:', validationResult.value)
          await (window as any).Swal.fire({
            title: 'Error de Validación',
            text: 'Los datos de validación no son válidos. Inténtalo de nuevo.',
            icon: 'error',
            confirmButtonText: 'Entendido'
          })
          return
        }
      } else if (validationResult.dismiss === Swal.DismissReason.cancel) {
        console.log('🔍 DEBUG: Usuario reportó problemas')
        const problemResult = await (window as any).Swal.fire({
          title: '¿Qué problemas hubo?',
          html: `
            <div class="text-left space-y-4">
              <p class="text-sm text-gray-600 mb-4">Describe los problemas que tuviste con este intercambio.</p>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del problema <span class="text-red-500">*</span>
                </label>
                <p class="text-xs text-gray-500 mb-2">Mínimo 10 caracteres, máximo 500 (obligatorio)</p>
                <textarea 
                  id="problem-description" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  rows="4" 
                  maxlength="500"
                  placeholder="Explica qué problemas tuviste con este intercambio..."
                  oninput="this.style.borderColor = this.value.length < 10 ? '#EF4444' : '#10B981'"
                ></textarea>
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span id="char-count">0/500 caracteres</span>
                  <span id="min-chars" class="text-red-500">Mínimo 10 caracteres</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Aspectos problemáticos (opcional)</label>
                <textarea 
                  id="problem-aspects" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  rows="2" 
                  placeholder="Estado del producto, puntualidad, comunicación, etc."
                ></textarea>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Reportar problema',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#EF4444',
          cancelButtonColor: '#6B7280',
          width: '500px',
          customClass: {
            popup: 'rounded-lg',
            title: 'text-lg font-semibold text-gray-900',
            htmlContainer: 'text-left',
            confirmButton: 'px-6 py-2 rounded-md font-medium',
            cancelButton: 'px-6 py-2 rounded-md font-medium'
          },
          didOpen: () => {
            // Contador de caracteres en tiempo real
            const descriptionTextarea = document.getElementById('problem-description') as HTMLTextAreaElement
            const charCount = document.getElementById('char-count')
            const minChars = document.getElementById('min-chars')
            
            if (descriptionTextarea && charCount && minChars) {
              const updateCharCount = () => {
                const length = descriptionTextarea.value.length
                charCount.textContent = `${length}/500 caracteres`
                
                if (length >= 10) {
                  minChars.textContent = '✓ Mínimo cumplido'
                  minChars.className = 'text-green-500'
                } else {
                  minChars.textContent = `Mínimo 10 caracteres (${10 - length} faltan)`
                  minChars.className = 'text-red-500'
                }
              }
              
              descriptionTextarea.addEventListener('input', updateCharCount)
              updateCharCount() // Inicializar
            }
          },
          preConfirm: () => {
            const problemDescription = (document.getElementById('problem-description') as HTMLTextAreaElement)?.value?.trim()
            const problemAspects = (document.getElementById('problem-aspects') as HTMLTextAreaElement)?.value?.trim()
            
            // Validación obligatoria de descripción del problema
            if (!problemDescription) {
              Swal.showValidationMessage('⚠️ Por favor describe el problema encontrado')
              return false
            }
            
            // Validación de longitud mínima
            if (problemDescription.length < 10) {
              Swal.showValidationMessage('⚠️ La descripción debe tener al menos 10 caracteres')
              return false
            }
            
            // Validación de longitud máxima
            if (problemDescription.length > 500) {
              Swal.showValidationMessage('⚠️ La descripción no puede exceder 500 caracteres')
              return false
            }
            
            return {
              description: problemDescription,
              aspects: problemAspects || null
            }
          }
        })

        if (problemResult.isConfirmed) {
          console.log('🔍 DEBUG: Usuario reportó problema, enviando datos:', problemResult.value)
          
          // Verificar que los datos del problema son válidos
          if (problemResult.value && problemResult.value.description) {
            const submitResult = await submitValidation(intercambioId, {
              isValid: false,
              comment: problemResult.value.description,
              rating: null,
              aspects: problemResult.value.aspects
            })
            
            if (!submitResult) {
              console.log('🔍 DEBUG: El reporte de problema falló, no continuar')
              return
            }
          } else {
            console.log('🔍 DEBUG: Datos del problema inválidos:', problemResult.value)
            await (window as any).Swal.fire({
              title: 'Error de Validación',
              text: 'Los datos del problema no son válidos. Inténtalo de nuevo.',
              icon: 'error',
              confirmButtonText: 'Entendido'
            })
            return
          }
        }
      }
    } catch (error) {
      console.error('Error validando encuentro:', error)
      
      // Mostrar error sin recargar la página
      await (window as any).Swal.fire({
        title: 'Error',
        html: `
          <div class="text-center space-y-3">
            <div class="text-4xl">⚠️</div>
            <p class="text-gray-700">No se pudo validar el encuentro.</p>
            <p class="text-sm text-red-600">${error instanceof Error ? error.message : 'Error desconocido'}</p>
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-800">
                💡 Intenta nuevamente en unos momentos<br/>
                💡 Verifica tu conexión a internet<br/>
                💡 Si el problema persiste, contacta soporte
              </p>
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444',
        width: '500px',
        allowOutsideClick: false,
        allowEscapeKey: false
      })
      
      // No hacer throw para evitar que se propague el error
      return
    }
  }

  const submitValidation = async (intercambioId: number, validationData: any) => {
    console.log('🔍 DEBUG: Iniciando validación:', { intercambioId, validationData, userId })
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      console.log('🔍 DEBUG: Sesión obtenida:', { hasToken: !!token, userId })
      
      if (!token) {
        throw new Error('No hay sesión activa')
      }

      const requestBody = {
        userId: userId,
        ...validationData
      }
      
      console.log('🔍 DEBUG: Enviando request:', { 
        url: `/api/intercambios/${intercambioId}/validate`,
        method: 'PATCH',
        body: requestBody
      })

      const response = await fetch(`/api/intercambios/${intercambioId}/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
        })
      
      console.log('🔍 DEBUG: Respuesta recibida:', { 
        status: response.status, 
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 DEBUG: Datos de respuesta:', data)
        
        if (data.data.bothValidated) {
          console.log('🔍 DEBUG: Ambos usuarios han validado, estado:', data.data.newEstado)
          if (data.data.newEstado === 'completado') {
            ;(window as any).Swal.fire({
              title: '¡Intercambio Completado!',
              html: `
                <div class="text-center space-y-3">
                  <div class="text-6xl">🎉</div>
                  <p class="text-gray-700">El intercambio se ha completado exitosamente.</p>
                  <p class="text-sm text-gray-600">Ambos usuarios han confirmado que fue exitoso.</p>
                  <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p class="text-sm text-green-800">
                      ✅ Estadísticas actualizadas<br/>
                      ✅ Productos marcados como intercambiados<br/>
                      ✅ 50 eco-puntos ganados<br/>
                      ✅ Notificaciones enviadas
                    </p>
                  </div>
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
                  <div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p class="text-sm text-orange-800">
                      ⚠️ Productos reactivados<br/>
                      ⚠️ Intercambio marcado como fallido<br/>
                      ⚠️ Notificaciones enviadas
                    </p>
                  </div>
                </div>
              `,
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#EF4444',
              width: '500px'
            })
          }
        } else {
          console.log('🔍 DEBUG: Solo un usuario ha validado, mostrando mensaje de espera')
          ;(window as any).Swal.fire({
            title: 'Validación Enviada',
            html: `
              <div class="text-center space-y-3">
                <div class="text-4xl">✅</div>
                <p class="text-gray-700">Tu validación ha sido registrada.</p>
                <p class="text-sm text-gray-600">Esperando confirmación del otro usuario.</p>
                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p class="text-sm text-blue-800">
                    📱 Notificación enviada al otro usuario<br/>
                    ⏳ Estado: Pendiente de validación
                  </p>
                </div>
              </div>
            `,
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#3B82F6',
            width: '500px'
          })
        }

        // Refrescar la lista
        fetchPendingValidations()
        onValidationComplete?.()
        
        // Retornar true para indicar éxito
        return true
      } else {
        console.log('🔍 DEBUG: Error en respuesta:', response.status)
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.log('🔍 DEBUG: Datos de error:', errorData)
        throw new Error(errorData.error || `Error del servidor: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ ERROR: Error enviando validación:', error)
      
      // Mostrar error sin recargar la página
      await (window as any).Swal.fire({
        title: 'Error al Validar',
        html: `
          <div class="text-center space-y-3">
            <div class="text-4xl">⚠️</div>
            <p class="text-gray-700">No se pudo validar el encuentro.</p>
            <p class="text-sm text-red-600">${error instanceof Error ? error.message : 'Error desconocido'}</p>
            <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-800">
                💡 Verifica tu conexión a internet<br/>
                💡 Intenta nuevamente en unos momentos<br/>
                💡 Si el problema persiste, contacta soporte
              </p>
            </div>
            <div class="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
              <strong>Detalles técnicos:</strong><br/>
              Intercambio ID: ${intercambioId}<br/>
              Usuario ID: ${userId}<br/>
              Error: ${error instanceof Error ? error.message : 'Desconocido'}
            </div>
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#EF4444',
        width: '600px',
        allowOutsideClick: false,
        allowEscapeKey: false
      })
      
      // No hacer throw para evitar que se propague el error y cause recarga de página
      return false
    }
    
    // Si llegamos aquí sin retornar, algo salió mal
    return false
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
              <div className="flex space-x-2">
              <button
                onClick={() => handleValidateMeeting(intercambio.id)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Validar</span>
              </button>
              </div>
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

            {/* Estado de validaciones */}
            <div className="space-y-2">
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

              {!intercambio.userValidation && !intercambio.otherUserValidation && (
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    🎯 Sé el primero en validar este intercambio
                  </p>
                </div>
              )}

              {/* Información sobre el sistema de validación */}
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>💡 Sistema de Validación Dual:</strong><br/>
                  • Ambos usuarios deben validar para completar<br/>
                  • Si no validas en 7 días, se completa automáticamente<br/>
                  • Ganas 50 eco-puntos por completar exitosamente
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

