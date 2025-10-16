'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MapPinIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { 
  Message, 
  User, 
  Product, 
  ChatInfo 
} from '@/lib/types'
import { useUserStatus } from '@/hooks/useUserStatus'
import { useInactivity } from '@/hooks/useInactivity'
import { getSupabaseClient } from '@/lib/supabase-client'
// import imageCompression from 'browser-image-compression' // Importación dinámica


interface ChatModuleProps {
  currentUser: User | null
}

interface ChatUser {
  id: string
  name: string
  avatar: string
  location: string
  isOnline: boolean
  lastSeen: string
}

interface ChatConversation {
  id: string
  user: ChatUser
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
  product?: {
    id: string
    title: string
    price?: string
    category?: string
    description?: string
    mainImage?: string
    exchangeConditions?: string
  } | null
}

interface ChatMessage {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'text' | 'image' | 'location' | 'file'
  metadata?: {
    imageUrl?: string
    fileName?: string
    fileSize?: string
    coordinates?: { lat: number; lng: number }
  }
  reactions?: Record<string, number>
  myReaction?: string
  replyToId?: string
  sender?: {
    id: string
    name: string
    lastName: string
    avatar?: string
  }
}

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


// Función para formatear precio
const formatPrice = (precio: number | null, tipoTransaccion: string | null, condicionesIntercambio: string | null, queBuscoCambio: string | null, precioNegociable: boolean | null) => {
  if (tipoTransaccion === 'cambio') {
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

// Función para renderizar información de producto compacta
const renderProductInfoCompact = (product: any, label: string) => {
  if (!product) return null
  
  return (
    <div className="p-2 bg-white rounded border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-10 h-10 rounded object-cover border border-gray-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-10 h-10 bg-gray-100 rounded flex items-center justify-center border border-gray-200 ${product.imageUrl ? 'hidden' : ''}`}>
            <span className="text-gray-600 text-sm">📦</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
              {label}
            </span>
            {product.estado && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                product.estado === 'activo' ? 'bg-green-100 text-green-700' :
                product.estado === 'pausado' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {product.estado}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {product.title}
          </h4>
          <p className="text-xs text-green-600 font-medium">
            {formatPrice(
              product.precio,
              product.tipo_transaccion,
              product.condiciones_intercambio,
              product.que_busco_cambio,
              product.precio_negociable
            )}
          </p>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => window.open(`/producto/${product.producto_id || product.id}`, '_blank')}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
            title="Ver producto"
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  )
}

// Función para renderizar información de producto completa (mantener para otros usos)
const renderProductInfo = (product: any, label: string) => {
  if (!product) return null
  
  return (
    <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-16 h-16 rounded-lg object-cover border border-blue-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200 ${product.imageUrl ? 'hidden' : ''}`}>
            <span className="text-blue-600 text-2xl">📦</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs font-medium text-blue-800 bg-blue-200 px-3 py-1 rounded-full">
              {label}
            </span>
            {product.estado && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                product.estado === 'activo' ? 'bg-green-100 text-green-800' :
                product.estado === 'pausado' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {product.estado}
              </span>
            )}
          </div>
          <h4 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.title}
          </h4>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.descripcion}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-600">
            {formatPrice(
              product.precio,
              product.tipo_transaccion,
              product.condiciones_intercambio,
              product.que_busco_cambio,
              product.precio_negociable
            )}
          </p>
            {product.visualizaciones && (
              <p className="text-xs text-gray-500">
                👁️ {product.visualizaciones} vistas
              </p>
            )}
          </div>
          {product.ciudad_snapshot && (
            <p className="text-xs text-gray-500 mt-1">
              📍 {product.ciudad_snapshot}, {product.departamento_snapshot}
            </p>
          )}
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => window.open(`/producto/${product.producto_id || product.id}`, '_blank')}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
            >
              Ver Producto
            </button>
            <button
              onClick={() => {
                const productUrl = `${window.location.origin}/producto/${product.producto_id || product.id}`
                navigator.clipboard.writeText(productUrl).then(() => {
                  if ((window as any).Swal) {
                    (window as any).Swal.fire({
                      title: 'Enlace copiado',
                      text: 'El enlace del producto se ha copiado al portapapeles',
                      icon: 'success',
                      timer: 2000,
                      showConfirmButton: false
                    })
                  }
                })
              }}
              className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              Copiar Enlace
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatModule({ currentUser }: ChatModuleProps) {
  const router = useRouter()
  
  // Función auxiliar para obtener sesión de Supabase
  const getSession = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [ChatModule] Supabase client no disponible')
      return null
    }
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ [ChatModule] Error obteniendo sesión:', error.message)
        return null
      }
      
      if (!session) {
        console.warn('⚠️ [ChatModule] No hay sesión activa')
        return null
      }
      
      // Verificar si la sesión está expirada
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.warn('⚠️ [ChatModule] Sesión expirada, intentando renovar...')
        
        // Intentar renovar la sesión
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('❌ [ChatModule] Error renovando sesión:', refreshError.message)
          return null
        }
        
        if (newSession) {
          console.log('✅ [ChatModule] Sesión renovada exitosamente')
          return newSession
        }
      }
      
      console.log('✅ [ChatModule] Sesión válida encontrada')
      return session
    } catch (error: any) {
      console.error('❌ [ChatModule] Error inesperado obteniendo sesión:', error.message)
      return null
    }
  }
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [openReactionsFor, setOpenReactionsFor] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [offeredProduct, setOfferedProduct] = useState<any>(null)
  const [imagePreview, setImagePreview] = useState<{
    file: File | null
    url: string | null
    comment: string
    originalSize: number
    compressedSize: number
    isCompressing: boolean
  }>({
    file: null,
    url: null,
    comment: '',
    originalSize: 0,
    compressedSize: 0,
    isCompressing: false
  })

  // Estado para el modal de visualización de imágenes
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean
    imageUrl: string | null
    alt: string
  }>({
    isOpen: false,
    imageUrl: null,
    alt: ''
  })
  
  const { onlineUsers, updateUserStatus } = useUserStatus()
  const [requestedProduct, setRequestedProduct] = useState<any>(null)
  const [exchangeInfo, setExchangeInfo] = useState<{
    usuarioProponeId: number | null
    usuarioRecibeId: number | null
  }>({
    usuarioProponeId: null,
    usuarioRecibeId: null
  })
  
  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.some(user => user.id === userId && user.isOnline)
  }

  // Función para determinar el rol del usuario actual
  const getUserRole = (): 'vendedor' | 'comprador' | null => {
    
    if (!exchangeInfo.usuarioProponeId || !exchangeInfo.usuarioRecibeId || !currentUser?.id) {
      return null
    }
    
    const currentUserId = Number(currentUser.id)
    
    
    if (currentUserId === exchangeInfo.usuarioProponeId) {
      return 'comprador' // Usuario que propone -> comprador
    } else if (currentUserId === exchangeInfo.usuarioRecibeId) {
      return 'vendedor' // Usuario que recibe -> vendedor
    }
    
    return null
  }

  // Función para validar encuentro exitoso
  const handleValidateMeeting = async (intercambioId: number) => {
    try {
      // Obtener información del usuario de la conversación
      const otherUser = selectedConversation?.user
      const otherUserName = otherUser ? otherUser.name : 'el otro usuario'
      const otherUserAvatar = otherUser?.avatar || '/default-avatar.png'
      
      const validationResult = await (window as any).Swal.fire({
        title: '¿El encuentro fue exitoso?',
        html: `
          <div class="text-left space-y-4">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div class="flex items-center space-x-3">
                <img 
                  src="${otherUserAvatar}" 
                  alt="${otherUserName}" 
                  class="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                  onerror="this.src='/default-avatar.png'"
                />
                <div>
                  <p class="text-sm text-blue-800">
                    <strong>📋 Vas a calificar a ${otherUserName}</strong>
                  </p>
                  <p class="text-xs text-blue-600">Confirma si el intercambio se realizó correctamente según lo acordado.</p>
                </div>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Calificación <span class="text-red-500">*</span>
              </label>
              <p class="text-xs text-gray-500 mb-2">Selecciona de 1 a 5 estrellas (obligatorio)</p>
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
          
          // Función para actualizar el estado del botón de confirmación
          const updateConfirmButton = () => {
            const confirmButton = document.querySelector('.swal2-confirm') as HTMLButtonElement
            if (confirmButton) {
              if (selectedRating > 0) {
                confirmButton.style.opacity = '1'
                confirmButton.disabled = false
                confirmButton.textContent = 'Sí, fue exitoso'
              } else {
                confirmButton.style.opacity = '0.6'
                confirmButton.disabled = true
                confirmButton.textContent = 'Selecciona una calificación'
              }
            }
          }
          
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
              
              // Actualizar estado del botón después de seleccionar
              updateConfirmButton()
            })
          })
          
          // Inicializar estado del botón
          setTimeout(updateConfirmButton, 100)
        },
        preConfirm: () => {
          const comment = (document.getElementById('validation-comment') as HTMLTextAreaElement)?.value
          const aspects = (document.getElementById('validation-aspects') as HTMLTextAreaElement)?.value
          const rating = document.querySelector('.star-rating.bg-yellow-100')?.getAttribute('data-rating')
          
          // Validación obligatoria de calificación
          if (!rating) {
            ;(window as any).Swal.showValidationMessage('⚠️ Por favor selecciona una calificación con estrellas')
            return false
          }
          
          // Validación de calificación válida
          if (parseInt(rating) < 1 || parseInt(rating) > 5) {
            ;(window as any).Swal.showValidationMessage('⚠️ La calificación debe ser entre 1 y 5 estrellas')
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

      if (validationResult.isConfirmed) {
        // Enviar validación exitosa
        const submitResult = await submitValidation(intercambioId, validationResult.value)
        if (!submitResult) {
          return
        }
      } else if (validationResult.dismiss === (window as any).Swal.DismissReason.cancel) {
        // Mostrar modal para problemas
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
          const submitResult = await submitValidation(intercambioId, {
            isValid: false,
            comment: problemResult.value,
            rating: null,
            aspects: null
          })
          if (!submitResult) {
            return
          }
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

  // Función para enviar validación al servidor
  const submitValidation = async (intercambioId: number, validationData: any) => {
    try {
      const session = await getSession()
      const token = session?.access_token
      
      
      if (!token) {
        throw new Error('No hay token de sesión')
      }

      const requestBody = {
        userId: getCurrentUserId(),
        ...validationData
      }
      

      const response = await fetch(`/api/intercambios/${intercambioId}/validate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
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
      } else {
        // Manejar errores específicos
        let errorMessage = 'Error enviando validación'
        
        if (response.status === 404) {
          errorMessage = 'Intercambio no encontrado. Verifica que el intercambio existe y tienes permisos para validarlo.'
        } else if (response.status === 403) {
          errorMessage = 'No tienes permisos para validar este intercambio.'
        } else if (response.status === 400) {
          errorMessage = 'Datos de validación inválidos. Verifica que seleccionaste una calificación.'
        } else if (response.status >= 500) {
          errorMessage = 'Error del servidor. Inténtalo de nuevo en unos momentos.'
        }
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('❌ ERROR: Error enviando validación:', error)
      
      // Mostrar error detallado al usuario
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
              Usuario ID: ${getCurrentUserId()}<br/>
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
      
      // No hacer throw para evitar que se propague el error
      return false
    }
  }

  // Helper fiable para saber si el usuario actual es COMPRADOR según exchangeInfo
  const isCurrentUserBuyer = (): boolean => {
    if (!exchangeInfo.usuarioProponeId || !exchangeInfo.usuarioRecibeId || !currentUser?.id) {
      return false
    }
    const buyer = Number(currentUser.id) === exchangeInfo.usuarioProponeId
    return buyer
  }

  // Función para agregar notificación de propuesta al chat
  const addProposalNotificationToChat = async (proposal: any) => {
    if (!selectedConversation || !currentUser) return

    try {
      const session = await getSession()
      const token = session?.access_token
      if (!token) return

      // Crear mensaje del sistema sobre la propuesta
      const systemMessage: ChatMessage = {
        id: `system-proposal-${proposal.id}-${Date.now()}`,
        senderId: 'system',
        content: `📝 Nueva propuesta enviada: ${getProposalTypeText(proposal.tipo_propuesta)}`,
        timestamp: new Date().toLocaleString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isRead: false,
        type: 'text',
        sender: {
          id: 'system',
          name: 'Sistema',
          lastName: '',
          avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
        }
      }

      // Agregar mensaje al chat actual
      setSelectedConversation(prev => {
        if (!prev) return prev
        const updatedMessages = [...prev.messages, systemMessage]
          .sort((a, b) => Number(a.id) - Number(b.id))
        
        return {
          ...prev,
          messages: updatedMessages,
          lastMessage: systemMessage.content,
          lastMessageTime: systemMessage.timestamp
        }
      })

      // Actualizar también la lista de conversaciones
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          lastMessage: systemMessage.content,
          lastMessageTime: systemMessage.timestamp
        } : conv
      ))

      // Enviar notificación push al otro usuario
      await sendProposalNotification(proposal)

    } catch (error) {
      console.error('❌ [ChatModule] Error agregando notificación de propuesta:', error)
    }
  }

  // Función para obtener texto del tipo de propuesta
  const getProposalTypeText = (type: string): string => {
    const types = {
      'precio': 'Propuesta de precio',
      'intercambio': 'Propuesta de intercambio',
      'encuentro': 'Propuesta de encuentro',
      'condiciones': 'Propuesta de condiciones',
      'otro': 'Propuesta general'
    }
    return types[type as keyof typeof types] || 'Propuesta'
  }

  // Función para agregar notificación de respuesta a propuesta en el chat
  const addProposalResponseNotificationToChat = async (proposal: any, response: string) => {
    if (!selectedConversation || !currentUser) return

    try {
      const responseText = getResponseText(response)
      const responseIcon = getResponseIcon(response)

      // Crear mensaje del sistema sobre la respuesta a la propuesta
      const systemMessage: ChatMessage = {
        id: `system-response-${proposal.id}-${Date.now()}`,
        senderId: 'system',
        content: `${responseIcon} Propuesta ${responseText}: ${getProposalTypeText(proposal.tipo_propuesta)}`,
        timestamp: new Date().toLocaleString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isRead: false,
        type: 'text',
        sender: {
          id: 'system',
          name: 'Sistema',
          lastName: '',
          avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
        }
      }

      // Agregar mensaje al chat actual
      setSelectedConversation(prev => {
        if (!prev) return prev
        const updatedMessages = [...prev.messages, systemMessage]
          .sort((a, b) => Number(a.id) - Number(b.id))
        
        return {
          ...prev,
          messages: updatedMessages,
          lastMessage: systemMessage.content,
          lastMessageTime: systemMessage.timestamp
        }
      })

      // Actualizar también la lista de conversaciones
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          lastMessage: systemMessage.content,
          lastMessageTime: systemMessage.timestamp
        } : conv
      ))

      // Enviar notificación push al otro usuario
      await sendProposalResponseNotification(proposal, response)

    } catch (error) {
      console.error('❌ [ChatModule] Error agregando notificación de respuesta:', error)
    }
  }

  // Función para obtener texto de la respuesta
  const getResponseText = (response: string): string => {
    const responses = {
      'aceptar': 'aceptada',
      'rechazar': 'rechazada',
      'contrapropuesta': 'respondida con contrapropuesta'
    }
    return responses[response as keyof typeof responses] || response
  }

  // Función para obtener icono de la respuesta
  const getResponseIcon = (response: string): string => {
    const icons = {
      'aceptar': '✅',
      'rechazar': '❌',
      'contrapropuesta': '💬'
    }
    return icons[response as keyof typeof icons] || '📝'
  }

  // Función para enviar notificación push sobre la respuesta a propuesta
  const sendProposalResponseNotification = async (proposal: any, response: string) => {
    try {
      const session = await getSession()
      const token = session?.access_token
      if (!token) return

      // Determinar el usuario que recibe la notificación
      const otherUserId = proposal.usuario_propone_id === Number(currentUser?.id) 
        ? proposal.usuario_recibe_id 
        : proposal.usuario_propone_id

      const responseText = getResponseText(response)
      const responseIcon = getResponseIcon(response)

      const notificationData = {
        usuario_id: otherUserId,
        tipo: 'respuesta_propuesta',
        titulo: `Propuesta ${responseText}`,
        mensaje: `${currentUser?.email || 'Usuario'} ha ${responseText} tu ${getProposalTypeText(proposal.tipo_propuesta)}`,
        datos_adicionales: {
          propuesta_id: proposal.id,
          chat_id: selectedConversation?.id,
          tipo_propuesta: proposal.tipo_propuesta,
          respuesta: response,
          remitente_id: currentUser?.id
        },
        es_push: true,
        es_email: false
      }

      // Enviar notificación a través de la API
      const apiResponse = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      })

      if (apiResponse.ok) {
      } else {
      }
    } catch (error) {
      console.error('❌ [ChatModule] Error enviando notificación push de respuesta:', error)
    }
  }

  // Función para enviar notificación push sobre la propuesta
  const sendProposalNotification = async (proposal: any) => {
    try {
      const session = await getSession()
      const token = session?.access_token
      if (!token) return

      // Determinar el usuario que recibe la notificación
      const otherUserId = proposal.usuario_propone_id === Number(currentUser?.id) 
        ? proposal.usuario_recibe_id 
        : proposal.usuario_propone_id

      const notificationData = {
        usuario_id: otherUserId,
        tipo: 'nueva_propuesta',
        titulo: `Nueva ${getProposalTypeText(proposal.tipo_propuesta)}`,
        mensaje: `${currentUser?.email || 'Usuario'} te ha enviado una nueva propuesta en el chat`,
        datos_adicionales: {
          propuesta_id: proposal.id,
          chat_id: selectedConversation?.id,
          tipo_propuesta: proposal.tipo_propuesta,
          remitente_id: currentUser?.id
        },
        es_push: true,
        es_email: false
      }

      // Enviar notificación a través de la API
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      })

      if (response.ok) {
      } else {
      }
    } catch (error) {
      console.error('❌ [ChatModule] Error enviando notificación push:', error)
    }
  }

  // Función para comprimir imágenes
  const compressImage = async (file: File): Promise<File> => {
    try {
      // Importación dinámica solo en el cliente
      const imageCompression = (await import('browser-image-compression')).default
      
      const options = {
        maxSizeMB: 1, // Máximo 1MB después de compresión
        maxWidthOrHeight: 1920, // Máximo 1920px de ancho o alto
        useWebWorker: true,
        fileType: 'image/jpeg', // Convertir a JPEG para mejor compresión
        quality: 0.8, // Calidad del 80%
        initialQuality: 0.8,
        alwaysKeepResolution: false
      }


      const compressedFile = await imageCompression(file, options)
      

      return compressedFile
    } catch (error) {
      console.error('❌ [ChatModule] Error comprimiendo imagen:', error)
      // Si falla la compresión, devolver el archivo original
      return file
    }
  }

  // Función helper para evitar mensajes duplicados
  const addMessageIfNotExists = (messages: ChatMessage[], newMessage: ChatMessage): ChatMessage[] => {
    const exists = messages.some(msg => msg.id === newMessage.id)
    if (exists) {
      return messages
    }
    return [...messages, newMessage].sort((a, b) => Number(a.id) - Number(b.id))
  }

  // Hook para detectar inactividad y cerrar sesión automáticamente
  useInactivity({
    timeout: 30 * 60 * 1000, // 30 minutos de inactividad
    onInactive: async () => {
      // El hook ya maneja el logout automáticamente
    }
  })

  useEffect(() => {
    if (currentUser) {
      updateUserStatus(true)
    }
  }, [currentUser, updateUserStatus])

  // Limpiar URL temporal al desmontar el componente
  useEffect(() => {
    return () => {
      if (imagePreview.url) {
        URL.revokeObjectURL(imagePreview.url)
      }
    }
  }, [imagePreview.url])

  // Manejar tecla ESC para cerrar el modal de imagen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModal.isOpen) {
        closeImageModal()
      }
    }

    if (imageModal.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [imageModal.isOpen])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [userValidations, setUserValidations] = useState<{usuario_id: number, es_exitoso: boolean, fecha_validacion: string}[]>([])
  const [showProposals, setShowProposals] = useState(false)
  const [isLoadingProposals, setIsLoadingProposals] = useState(false)
const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
const [isUserScrolling, setIsUserScrolling] = useState(false)

const getCurrentUserId = () => {
  return String(currentUser?.id || '')
}
  useEffect(() => {
    let isMounted = true
    
    const loadConversations = async () => {
      if (!isMounted) return
      
      setIsLoading(true)
      try {
        const session = await getSession()
        
        const token = session?.access_token
        if (!token) {
          router.push('/login')
          return
        }
        
        const res = await fetch('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        
        if (!res.ok) throw new Error(json?.error || 'Error cargando chats')
        const list: ChatConversation[] = (json.items || []).map((c: any) => {
          
          return {
          id: String(c.id),
          user: c.user,
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: c.unreadCount || 0,
            messages: [],
            product: c.product || c.offered || null
          }
        })
        
        if (isMounted) {
        setConversations(list)
          if (list.length > 0 && !selectedConversation) {
            setSelectedConversation(list[0])
          }
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando conversaciones:', error)
        if (isMounted) {
        setConversations([])
        }
      } finally {
        if (isMounted) {
        setIsLoading(false)
      }
    }
    }
    
    loadConversations()
    
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const loadMessages = async () => {
      if (!selectedConversation || !isMounted) return
      
        const chatId = Number(selectedConversation.id)
        if (!chatId) return
        
      const cachedConversation = conversations.find(c => c.id === String(chatId))
      if (cachedConversation?.messages?.length > 0) {
        setSelectedConversation(prev => prev ? { ...prev, messages: cachedConversation.messages } : prev)
        
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' })
          }
        }, 50)
      }
      
      try {
        const session = await getSession()
        const token = session?.access_token
        if (!token) {
          router.push('/login')
          return
        }
        
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const res = await fetch(`/api/chat/${chatId}/messages?limit=50`, { 
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error cargando mensajes')
        
        const messages: ChatMessage[] = (json.items || [])
          .filter((m: any) => {
            const content = m.contenido || ''
            const isProductTag = typeof content === 'string' && /^\[product:\d+\]$/.test(content.trim())
            const hasImage = !!m.archivo_url || m.tipo === 'imagen'
            // Permitir imágenes aunque no haya contenido; ocultar únicamente la marca técnica
            return hasImage || (!isProductTag && content.trim().length > 0)
          })
          .map((m: any) => {
            // Detectar mensajes del sistema de propuestas
            let contentRaw = m.contenido || ''
            const isSystemProposal = typeof contentRaw === 'string' && contentRaw.startsWith('[system_proposal]')
            if (isSystemProposal) {
              contentRaw = contentRaw.replace('[system_proposal]', '📝').trim()
            }

            return {
              id: String(m.mensaje_id),
              senderId: isSystemProposal ? 'system' : String(m.usuario_id),
              content: contentRaw,
              timestamp: new Date(m.fecha_envio).toLocaleString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              isRead: m.leido,
              // Priorizar archivo_url para tipo imagen
              type: m.archivo_url ? 'image' : (m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text'),
              metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
              sender: {
                id: isSystemProposal ? 'system' : String(m.usuario?.user_id || m.usuario_id),
                name: isSystemProposal ? 'Sistema' : (m.usuario?.nombre || 'Usuario'),
                lastName: isSystemProposal ? '' : (m.usuario?.apellido || ''),
                avatar: isSystemProposal ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+' : (m.usuario?.foto_perfil || undefined)
              }
            }
          })
          .sort((a, b) => Number(a.id) - Number(b.id)) // Ordenar por ID (del más antiguo al más reciente)
        
        
        if (isMounted) {
        setSelectedConversation(prev => prev ? { ...prev, messages } : prev)
        setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, messages } : c))

          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
            }
          }, 100)

          fetch(`/api/chat/${chatId}/read`, { 
            method: 'POST', 
            headers: { Authorization: `Bearer ${token}` } 
          }).then(readRes => {
            if (readRes.ok && isMounted) {
              setConversations(prev => prev.map(c => c.id === String(chatId) ? { ...c, unreadCount: 0 } : c))
            }
          }).catch(err => {
            console.error('Error marcando como leído:', err)
          })
      }
      } catch (error) {
        if (error.name === 'AbortError') {
        } else {
        console.error('❌ [ChatModule] Error cargando mensajes:', error)
        }
    }
    }
    
    loadMessages()
    
    return () => {
      isMounted = false
    }
  }, [selectedConversation?.id])

  // Función para reducir el tamaño de la imagen
  const resizeImage = (file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Dibujar la imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convertir a blob y luego a File
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(resizedFile)
          } else {
            resolve(file)
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleViewProposal = (proposal: Proposal) => {
    const formatCOP = (n?: number) => typeof n === 'number' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) : '—'
    const rows = [
      `<tr><td class="py-1 pr-3 text-gray-500">Tipo</td><td class="py-1 font-medium">${proposal.type}</td></tr>`,
      `<tr><td class="py-1 pr-3 text-gray-500">Estado</td><td class="py-1 font-medium">${proposal.status}</td></tr>`,
      `<tr><td class="py-1 pr-3 text-gray-500">Precio</td><td class="py-1 font-medium">${formatCOP(proposal.proposedPrice)}</td></tr>`,
      proposal.conditions ? `<tr><td class="py-1 pr-3 text-gray-500">Condiciones</td><td class="py-1">${proposal.conditions}</td></tr>` : '',
      proposal.meetingDate ? `<tr><td class="py-1 pr-3 text-gray-500">Encuentro</td><td class="py-1">${new Date(proposal.meetingDate).toLocaleString('es-CO')} ${proposal.meetingPlace ? ' - ' + proposal.meetingPlace : ''}</td></tr>` : '',
      `<tr><td class="py-1 pr-3 text-gray-500">Creada</td><td class="py-1">${new Date(proposal.createdAt).toLocaleString('es-CO')}</td></tr>`,
      proposal.respondedAt ? `<tr><td class="py-1 pr-3 text-gray-500">Respondida</td><td class="py-1">${new Date(proposal.respondedAt).toLocaleString('es-CO')}</td></tr>` : '',
      `<tr><td class="py-1 pr-3 text-gray-500">Propone</td><td class="py-1">${proposal.proposer?.name || ''} ${proposal.proposer?.lastName || ''}</td></tr>`,
      `<tr><td class="py-1 pr-3 text-gray-500">Recibe</td><td class="py-1">${proposal.receiver?.name || ''} ${proposal.receiver?.lastName || ''}</td></tr>`,
    ].filter(Boolean).join('')

    if ((window as any).Swal) {
      ;(window as any).Swal.fire({
        title: 'Detalle de Propuesta',
        html: `
          <div class="text-left space-y-3">
            <div class="p-2 bg-gray-50 rounded border border-gray-200">
              <p class="text-sm text-gray-700 whitespace-pre-line">${proposal.description || ''}</p>
            </div>
            ${(proposal as any).archivo_url ? `
              <div class="p-2 bg-gray-50 rounded border border-gray-200">
                <p class="text-sm font-medium text-gray-700 mb-2">Imagen del producto:</p>
                <div class="flex justify-center">
                  <img src="${(proposal as any).archivo_url}" alt="Imagen de la propuesta" class="max-w-full max-h-64 rounded border border-gray-300 object-contain">
                </div>
              </div>
            ` : ''}
            <table class="w-full text-sm">
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#3B82F6',
        width: '600px'
      })
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const loadProductInfo = async () => {
      if (!selectedConversation?.id || !isMounted) {
        if (isMounted) {
          setOfferedProduct(null)
          setRequestedProduct(null)
        }
        return
      }

      try {
        const session = await getSession()
        const token = session?.access_token
        if (!token) return

        
        const response = await fetch(`/api/chat/${selectedConversation.id}/info`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        
        if (response.ok && isMounted) {
          const responseData = await response.json()
          
          const data = responseData.data || responseData
          setOfferedProduct(data.offeredProduct)
          setRequestedProduct(data.requestedProduct)
          
          // Obtener información del intercambio desde la respuesta
          if (data.exchangeInfo) {
            setExchangeInfo({
              usuarioProponeId: data.exchangeInfo.usuarioProponeId,
              usuarioRecibeId: data.exchangeInfo.usuarioRecibeId
            })
          }
          
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando información de productos:', error)
      }
    }

    loadProductInfo()
    
    return () => {
      isMounted = false
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    let isMounted = true
    
    const loadProposals = async () => {
      if (!selectedConversation?.id || !isMounted) {
        if (isMounted) {
          setProposals([])
        }
        return
      }

      try {
        setIsLoadingProposals(true)
        const session = await getSession()
        const token = session?.access_token
        if (!token) return

        
        const response = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        
        if (response.ok && isMounted) {
          const data = await response.json()
          setProposals(data.data || [])
          setUserValidations(data.userValidations || [])
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          console.error('❌ [ChatModule] Error cargando propuestas:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
        }
      } catch (error) {
        console.error('❌ [ChatModule] Error cargando propuestas:', error)
      } finally {
        if (isMounted) {
          setIsLoadingProposals(false)
        }
      }
    }

    loadProposals()
    
    return () => {
      isMounted = false
    }
  }, [selectedConversation?.id])

  useEffect(() => {
    // Limpiar canal anterior
    if (realtimeChannel) {
      const supabase = getSupabaseClient()
      if (supabase) {
        supabase.removeChannel(realtimeChannel)
      }
      setRealtimeChannel(null)
    }

    const chatId = Number(selectedConversation?.id)
    if (!chatId || !currentUser?.id) {
      return
    }


    // Crear canal más simple y directo
    const supabase = getSupabaseClient()
    if (!supabase) return
    
    const channel = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensaje',
        filter: `chat_id=eq.${chatId}`
      }, (payload: any) => {
        
        const m = payload.new
        if (!m) return

        const messageId = String(m.mensaje_id)
        const currentUserId = getCurrentUserId()
        
        // No procesar nuestros propios mensajes
        if (String(m.usuario_id) === currentUserId) {
          return
        }

        // Verificar si el mensaje ya existe
        const messageExists = selectedConversation?.messages.some(msg => msg.id === messageId)
        if (messageExists) {
          return
        }

        // No filtrar por tiempo; dejamos que la lógica de duplicados basada en IDs maneje coincidencias

        // Crear mensaje con información básica (sin hacer fetch adicional)
        const incoming: ChatMessage = {
          id: messageId,
          senderId: String(m.usuario_id),
          content: m.contenido || '',
          timestamp: new Date(m.fecha_envio).toLocaleString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          }),
          isRead: m.leido,
          type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
          metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
          sender: {
            id: String(m.usuario_id),
            name: 'Usuario',
            lastName: '',
            avatar: undefined
          }
        }


        // Actualizar conversación seleccionada
        setSelectedConversation(prev => {
          if (!prev) return prev
          const updatedMessages = addMessageIfNotExists(prev.messages, incoming)
          return {
            ...prev,
            messages: updatedMessages,
            lastMessage: incoming.content || incoming.type,
            lastMessageTime: incoming.timestamp
          }
        })

        // Actualizar lista de conversaciones
        setConversations(prev => prev.map(c => c.id === String(chatId) ? {
          ...c,
          messages: [...(c.messages || []), incoming]
            .sort((a, b) => Number(a.id) - Number(b.id)), // Mantener orden correcto
          lastMessage: incoming.content || incoming.type,
          lastMessageTime: incoming.timestamp,
          unreadCount: (c.unreadCount || 0) + 1
        } : c))

        // Scroll automático al final
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'end' 
            })
          }
        }, 100)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [ChatModule] Error en canal realtime para chat:', chatId)
        } else if (status === 'TIMED_OUT') {
          console.error('❌ [ChatModule] Timeout en canal realtime para chat:', chatId)
        } else if (status === 'CLOSED') {
        }
      })

    setRealtimeChannel(channel)

    return () => {
      if (channel) {
        const supabase = getSupabaseClient()
        if (supabase) {
          supabase.removeChannel(channel)
        }
      }
      setRealtimeChannel(null)
    }
  }, [selectedConversation?.id, currentUser?.id])

  // Sistema de polling como respaldo para mensajes
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser?.id) return

    const chatId = Number(selectedConversation.id)
    let lastMessageId = selectedConversation.messages.length > 0 
      ? Number(selectedConversation.messages[selectedConversation.messages.length - 1].id)
      : 0

    const pollForNewMessages = async () => {
      try {
        const session = await getSession()
        if (!session?.access_token) return

        const response = await fetch(`/api/chat/${chatId}/messages?since=${lastMessageId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })

        if (response.ok) {
          const data = await response.json()
          const newMessages = data.items || []
          
          if (newMessages.length > 0) {
            
            const transformedMessages = newMessages
              .filter((m: any) => {
                const messageId = Number(m.mensaje_id)
                const currentUserId = getCurrentUserId()
                
                // No procesar nuestros propios mensajes
                if (String(m.usuario_id) === currentUserId) {
                  return false
                }
                
                // Solo mensajes más nuevos que el último
                if (messageId <= lastMessageId) {
                  return false
                }
                
                // Verificar si el mensaje ya existe en el estado actual
                const messageExists = selectedConversation?.messages.some(msg => msg.id === String(messageId))
                if (messageExists) {
                  return false
                }
                
                return true
              })
              .map((m: any) => ({
                id: String(m.mensaje_id),
                senderId: String(m.usuario_id),
                content: m.contenido || '',
                timestamp: new Date(m.fecha_envio).toLocaleString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                }),
                isRead: m.leido,
                type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
                metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined,
                sender: {
                  id: String(m.usuario?.user_id || m.usuario_id),
                  name: m.usuario?.nombre || 'Usuario',
                  lastName: m.usuario?.apellido || '',
                  avatar: m.usuario?.foto_perfil || undefined
                }
              }))

            if (transformedMessages.length > 0) {
              
              setSelectedConversation(prev => {
                if (!prev) return prev
                let updatedMessages = prev.messages
                // Agregar cada mensaje individualmente para evitar duplicados
                transformedMessages.forEach(msg => {
                  updatedMessages = addMessageIfNotExists(updatedMessages, msg)
                })
                return {
                  ...prev,
                  messages: updatedMessages,
                  lastMessage: transformedMessages[transformedMessages.length - 1].content,
                  lastMessageTime: transformedMessages[transformedMessages.length - 1].timestamp
                }
              })

              setConversations(prev => prev.map(c => c.id === String(chatId) ? {
                ...c,
                messages: [...(c.messages || []), ...transformedMessages]
                  .sort((a, b) => Number(a.id) - Number(b.id)), // Mantener orden correcto
                lastMessage: transformedMessages[transformedMessages.length - 1].content,
                lastMessageTime: transformedMessages[transformedMessages.length - 1].timestamp,
                unreadCount: (c.unreadCount || 0) + transformedMessages.length
              } : c))

              // Actualizar último mensaje ID
              lastMessageId = Math.max(...transformedMessages.map(m => Number(m.id)))
            }
          }
        }
      } catch (error) {
      }
    }

    // Polling cada 3 segundos como respaldo
    const pollInterval = setInterval(pollForNewMessages, 3000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [selectedConversation?.id, currentUser?.id])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    if (!selectedConversation?.messages || selectedConversation.messages.length === 0 || isUserScrolling) {
      return () => {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }
    
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        })
      }
    }
    
    timeoutId = setTimeout(scrollToBottom, 100)
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [selectedConversation?.messages?.length, isUserScrolling])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const currentUserId = getCurrentUserId()
    
    const now = new Date()
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      content: messageContent,
      timestamp: now.toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'text',
      sender: {
        id: currentUserId,
        name: currentUser?.name || 'Usuario',
        lastName: '',
        avatar: currentUser?.avatar || undefined
      }
    }

    // Limpiar input inmediatamente para mejor UX
    setNewMessage('')
    setReplyToMessageId(null)

    // Actualizar UI optimísticamente - INMEDIATO
    const updatedMessages = [...selectedConversation.messages, optimisticMessage]
      .sort((a, b) => Number(a.id) - Number(b.id)) // Mantener orden correcto
    const updatedConversation = {
      ...selectedConversation,
      messages: updatedMessages,
      lastMessage: optimisticMessage.content,
      lastMessageTime: optimisticMessage.timestamp
    }
    
    setSelectedConversation(updatedConversation)
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id ? updatedConversation : conv
    ))
    
    // Scroll inmediato al final
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'end' 
        })
      }
    })
    
    // Enviar al servidor en background
    try {
      const chatId = Number(selectedConversation.id)
      const session = await getSession()
      const token = session?.access_token
      if (!token) {
        console.error('❌ [ChatModule] No hay token de sesión')
        return
      }
      
      
      // Usar AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout
      
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          contenido: messageContent, 
          tipo: 'texto' 
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Error al enviar')
      
      
      // Reemplazar mensaje temporal con el real (con ID del servidor)
      const realMessage: ChatMessage = {
        id: String(json.message.mensaje_id),
        senderId: String(json.message.usuario_id),
        content: json.message.contenido || '',
        timestamp: new Date(json.message.fecha_envio).toLocaleString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isRead: json.message.leido,
        type: 'text',
        sender: optimisticMessage.sender
      }
      
      // Actualizar con el mensaje real del servidor
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId ? realMessage : msg
        ).sort((a, b) => Number(a.id) - Number(b.id)), // Mantener orden correcto
        lastMessage: realMessage.content,
        lastMessageTime: realMessage.timestamp
      } : prev)
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          messages: conv.messages?.map(msg => 
            msg.id === tempId ? realMessage : msg
          ).sort((a, b) => Number(a.id) - Number(b.id)) || [realMessage], // Mantener orden correcto
          lastMessage: realMessage.content,
          lastMessageTime: realMessage.timestamp
        } : conv
      ))
      
    } catch (error) {
      console.error('❌ [ChatModule] Error enviando mensaje:', error)
      
      // Remover mensaje temporal en caso de error
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== tempId)
      } : prev)
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          messages: conv.messages?.filter(msg => msg.id !== tempId) || []
        } : conv
      ))
      
      // Restaurar mensaje en el input
      setNewMessage(messageContent)
      
      // Mostrar error solo si no es un timeout
      if (error.name !== 'AbortError') {
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar el mensaje. Verifica tu conexión e inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        })
      } else {
        alert('Error: No se pudo enviar el mensaje. Verifica tu conexión e inténtalo de nuevo.')
      }
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCreateProposal = async (proposalData: {
    type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
    description: string
    proposedPrice?: number
    conditions?: string
    meetingDate?: string
    meetingPlace?: string
  }) => {
    if (!selectedConversation) {
      return
    }


    try {
      const session = await getSession()
      const token = session?.access_token
      if (!token) {
        return
      }

      
      const response = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(proposalData)
      })


      if (response.ok) {
        const data = await response.json()
        setProposals(prev => [data.data, ...prev])
        
        // Agregar notificación en el chat sobre la propuesta enviada
        await addProposalNotificationToChat(data.data)
        
        if ((window as any).Swal) {
          (window as any).Swal.fire({
            title: 'Propuesta enviada',
            text: 'Tu propuesta ha sido enviada exitosamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ [ChatModule] Error creando propuesta:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(errorData.error || 'Error creando propuesta')
      }
    } catch (error) {
      console.error('❌ [ChatModule] Error creando propuesta:', error)
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar la propuesta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  const handleRespondToProposal = async (proposalId: number, response: 'aceptar' | 'rechazar' | 'contrapropuesta', reason?: string) => {
    if (!selectedConversation) return

    // Si es aceptar, mostrar flujo especial
    if (response === 'aceptar') {
      await handleAcceptProposal(proposalId)
      return
    }

    // Para rechazar, usar el flujo normal
    try {
      const session = await getSession()
      const token = session?.access_token
      if (!token) return

      const responseData = await fetch(`/api/chat/${selectedConversation.id}/proposals/${proposalId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response, reason })
      })

      if (responseData.ok) {
        const data = await responseData.json()
        const updatedProposal = { ...data.data }
        setProposals(prev => prev.map(prop => 
          prop.id === proposalId ? updatedProposal : prop
        ))
        
        // Refrescar validaciones si hay cambio de estado a pendiente_validacion
        if (updatedProposal.status === 'pendiente_validacion') {
          try {
            const validationResponse = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (validationResponse.ok) {
              const validationData = await validationResponse.json()
              setUserValidations(validationData.userValidations || [])
            }
          } catch (error) {
            console.error('Error refrescando validaciones:', error)
          }
        }
        
        // Agregar notificación en el chat sobre la respuesta a la propuesta
        await addProposalResponseNotificationToChat(updatedProposal, response)
        
        if ((window as any).Swal) {
          (window as any).Swal.fire({
            title: 'Respuesta enviada',
            text: `Has ${response === 'rechazar' ? 'rechazado' : 'respondido a'} la propuesta`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          })
        }
      } else {
        throw new Error('Error respondiendo a propuesta')
      }
    } catch (error) {
      console.error('Error respondiendo a propuesta:', error)
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'No se pudo enviar la respuesta. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  const handleAcceptProposal = async (proposalId: number) => {
    if (!selectedConversation) return

    const proposal = proposals.find(p => p.id === proposalId)
    if (!proposal) return

    try {
      // 1. Modal de confirmación de aceptación
      const confirmResult = await (window as any).Swal.fire({
        title: '¿Aceptar esta propuesta?',
        html: `
          <div class="text-left space-y-3">
            <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p class="text-sm text-green-800">
                <strong>⚠️ Importante:</strong> Al aceptar esta propuesta, se iniciará el proceso de intercambio.
              </p>
            </div>
            
            <div class="space-y-2">
              <h4 class="font-medium text-gray-900">Detalles de la propuesta:</h4>
              <p class="text-sm text-gray-700">${proposal.description}</p>
              ${proposal.proposedPrice ? `<p class="text-sm font-medium text-green-600">Precio: $${proposal.proposedPrice.toLocaleString('es-CO')}</p>` : ''}
              ${proposal.meetingDate ? `<p class="text-sm text-gray-600">📅 Fecha: ${new Date(proposal.meetingDate).toLocaleDateString('es-CO')}</p>` : ''}
              ${proposal.meetingPlace ? `<p class="text-sm text-gray-600">📍 Lugar: ${proposal.meetingPlace}</p>` : ''}
            </div>
          </div>
        `,
        confirmButtonText: 'Sí, Aceptar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#6B7280',
        width: '500px'
      })

      if (!confirmResult.isConfirmed) return

      // 2. Si no tiene fecha/lugar, mostrar modal de configuración
      let meetingDetails = null
      if (!proposal.meetingDate || !proposal.meetingPlace) {
        const meetingResult = await (window as any).Swal.fire({
          title: 'Configurar Encuentro',
          html: `
            <div class="text-left space-y-4">
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm text-blue-800">
                  <strong>💡 Sugerencia:</strong> Coordina el encuentro para completar el intercambio.
                </p>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fecha del encuentro</label>
                  <input type="date" id="meeting-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Hora del encuentro</label>
                  <input type="time" id="meeting-time" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lugar del encuentro</label>
                <input type="text" id="meeting-place" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ej: Centro comercial, parque, etc.">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Notas adicionales (opcional)</label>
                <textarea id="meeting-notes" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="3" placeholder="Instrucciones especiales, punto de encuentro específico, etc."></textarea>
              </div>
            </div>
          `,
          confirmButtonText: 'Confirmar Encuentro',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#3B82F6',
          cancelButtonColor: '#6B7280',
          width: '600px',
          preConfirm: () => {
            const date = (document.getElementById('meeting-date') as HTMLInputElement)?.value
            const time = (document.getElementById('meeting-time') as HTMLInputElement)?.value
            const place = (document.getElementById('meeting-place') as HTMLInputElement)?.value
            const notes = (document.getElementById('meeting-notes') as HTMLTextAreaElement)?.value

            if (!date || !time || !place) {
              (window as any).Swal.showValidationMessage('Fecha, hora y lugar son requeridos')
              return false
            }

            return { date, time, place, notes: notes || '' }
          }
        })

        if (!meetingResult.isConfirmed) return
        meetingDetails = meetingResult.value
      }

      // 3. Mostrar loading
      ;(window as any).Swal.fire({
        title: 'Procesando...',
        text: 'Aceptando propuesta y configurando intercambio',
        allowOutsideClick: false,
        didOpen: () => {
          ;(window as any).Swal.showLoading()
        }
      })

      // 4. Enviar aceptación al servidor
      const session = await getSession()
      const token = session?.access_token
      if (!token) throw new Error('No hay token de sesión')

      const responseData = await fetch(`/api/chat/${selectedConversation.id}/proposals/${proposalId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          response: 'aceptar',
          meetingDetails: meetingDetails
        })
      })

      if (!responseData.ok) {
        throw new Error('Error aceptando propuesta')
      }

      const data = await responseData.json()
      
      // 5. Actualizar estado local
      setProposals(prev => prev.map(prop => 
        prop.id === proposalId ? { ...prop, ...data.data } : prop
      ))
      
      // Refrescar validaciones si hay cambio de estado a pendiente_validacion
      if (data.data.status === 'pendiente_validacion') {
        try {
          const validationResponse = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (validationResponse.ok) {
            const validationData = await validationResponse.json()
            setUserValidations(validationData.userValidations || [])
          }
        } catch (error) {
          console.error('Error refrescando validaciones:', error)
        }
      }

      // 6. Crear mensaje automático en el chat
      const systemMessage = {
        id: `system-${Date.now()}`,
        senderId: 'system',
        content: `✅ Propuesta aceptada. Intercambio iniciado. ${meetingDetails ? `Encuentro programado para ${meetingDetails.date} a las ${meetingDetails.time} en ${meetingDetails.place}` : ''}`,
        timestamp: new Date().toLocaleString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isRead: true,
        type: 'text' as const,
        sender: {
          id: 'system',
          name: 'Sistema',
          lastName: '',
          avatar: undefined
        }
      }

      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, systemMessage]
      } : prev)

      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          messages: [...(conv.messages || []), systemMessage],
          lastMessage: systemMessage.content,
          lastMessageTime: systemMessage.timestamp
        } : conv
      ))

      // 7. Mostrar confirmación final
      ;(window as any).Swal.fire({
        title: '¡Propuesta Aceptada!',
        html: `
          <div class="text-center space-y-3">
            <div class="text-6xl">🎉</div>
            <p class="text-gray-700">Se ha iniciado el proceso de intercambio.</p>
            <p class="text-sm text-gray-600">El otro usuario ha sido notificado.</p>
            ${meetingDetails ? `
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <h4 class="font-medium text-blue-900 mb-2">Detalles del encuentro:</h4>
                <p class="text-sm text-blue-800">📅 ${meetingDetails.date} a las ${meetingDetails.time}</p>
                <p class="text-sm text-blue-800">📍 ${meetingDetails.place}</p>
                ${meetingDetails.notes ? `<p class="text-sm text-blue-800">📝 ${meetingDetails.notes}</p>` : ''}
              </div>
            ` : ''}
          </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#10B981',
        width: '500px'
      })

    } catch (error) {
      console.error('Error aceptando propuesta:', error)
      ;(window as any).Swal.fire({
        title: 'Error',
        text: 'No se pudo aceptar la propuesta. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Entendido'
      })
    }
  }

  const formatTime = (time: string) => {
    return time
  }

  const isOwnMessage = (message: ChatMessage) => {
    const currentUserId = getCurrentUserId()
    return message.senderId === currentUserId
  }

  const handleInputChange = (value: string) => {
    setNewMessage(value)
    if (textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 160) + 'px'
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      c.user.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      c.user.location.toLowerCase().includes(q)
    )
  })

  const findMessageById = (id?: string) => {
    if (!id || !selectedConversation) return undefined
    return selectedConversation.messages.find(m => m.id === id)
  }

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!selectedConversation) return
    const updated = {
      ...selectedConversation,
      messages: selectedConversation.messages.map(m => {
        if (m.id !== messageId) return m
        const count = (m.reactions?.[emoji] || 0) + 1
        return {
          ...m,
          reactions: { ...(m.reactions || {}), [emoji]: count },
          myReaction: emoji
        }
      })
    }
    setSelectedConversation(updated)
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
    setOpenReactionsFor(null)
  }

  const handleReply = (messageId: string) => {
    setReplyToMessageId(messageId)
  }

  const handleAttachImage = () => imageInputRef.current?.click()
  const handleAttachFile = () => fileInputRef.current?.click()

  const handleSendProposal = () => {
    if (!selectedConversation) return
    
    if ((window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Crear Nueva Propuesta',
        html: `
          <div class="text-left space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de propuesta</label>
              <select id="proposal-type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="precio">💰 Propuesta de precio</option>
                <option value="intercambio">🔄 Propuesta de intercambio</option>
                <option value="encuentro">📅 Propuesta de encuentro</option>
                <option value="condiciones">📋 Propuesta de condiciones</option>
                <option value="otro">📝 Otra propuesta</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Descripción de la propuesta</label>
              <textarea id="proposal-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="4" placeholder="Describe detalladamente tu propuesta..."></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Precio propuesto (opcional)</label>
              <input type="text" id="proposal-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" inputmode="numeric">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Condiciones adicionales (opcional)</label>
              <textarea id="proposal-conditions" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="2" placeholder="Condiciones especiales, garantías, etc..."></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de encuentro (opcional)</label>
                <input type="date" id="proposal-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Lugar de encuentro (opcional)</label>
                <input type="text" id="proposal-place" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Centro comercial, parque, etc...">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Imagen del producto (opcional)</label>
              <div class="space-y-2">
                <input type="file" id="proposal-image" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" style="display: none;">
                <div class="flex space-x-2">
                  <button type="button" id="take-photo-btn" class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>Tomar foto</span>
                  </button>
                  <button type="button" id="select-file-btn" class="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <span>Seleccionar archivo</span>
                  </button>
                  <button type="button" id="clear-image-btn" class="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                    Limpiar
                  </button>
                </div>
                <div id="image-preview" class="hidden">
                  <p class="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                  <img id="preview-img" class="w-full max-w-xs rounded border border-gray-300" alt="Vista previa">
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, GIF. Máximo 10MB. Se redimensionará automáticamente.</p>
            </div>
          </div>
        `,
        width: '600px',
        showCancelButton: true,
        confirmButtonText: 'Enviar Propuesta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        didOpen: () => {
          const input = document.getElementById('proposal-price') as HTMLInputElement | null
          if (input) {
            input.addEventListener('input', () => {
              const digits = input.value.replace(/[^0-9]/g, '')
              input.dataset.raw = digits
              if (!digits) {
                input.value = ''
                return
              }
              const formatted = new Intl.NumberFormat('es-CO').format(Number(digits))
              input.value = formatted
            })
          }

          // Botón tomar foto
          const takePhotoBtn = document.getElementById('take-photo-btn')
          const selectFileBtn = document.getElementById('select-file-btn')
          const fileInput = document.getElementById('proposal-image') as HTMLInputElement
          const imagePreview = document.getElementById('image-preview')
          const previewImg = document.getElementById('preview-img') as HTMLImageElement
          
          if (takePhotoBtn && fileInput) {
            takePhotoBtn.addEventListener('click', () => {
              // Crear input temporal para cámara
              const cameraInput = document.createElement('input')
              cameraInput.type = 'file'
              cameraInput.accept = 'image/*'
              cameraInput.capture = 'environment'
              cameraInput.style.display = 'none'
              
              cameraInput.addEventListener('change', (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (file) {
                  // Actualizar el input principal
                  const dataTransfer = new DataTransfer()
                  dataTransfer.items.add(file)
                  fileInput.files = dataTransfer.files
                  
                  // Mostrar vista previa
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    if (previewImg && imagePreview) {
                      previewImg.src = e.target?.result as string
                      imagePreview.classList.remove('hidden')
                    }
                  }
                  reader.readAsDataURL(file)
                }
              })
              
              document.body.appendChild(cameraInput)
              cameraInput.click()
              document.body.removeChild(cameraInput)
            })
          }

          // Botón seleccionar archivo
          if (selectFileBtn && fileInput) {
            selectFileBtn.addEventListener('click', () => {
              fileInput.click()
            })
          }

          // Manejar cambio en input de archivo
          if (fileInput && previewImg && imagePreview) {
            fileInput.addEventListener('change', (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  previewImg.src = e.target?.result as string
                  imagePreview.classList.remove('hidden')
                }
                reader.readAsDataURL(file)
              }
            })
          }

          // Botón limpiar imagen
          const clearBtn = document.getElementById('clear-image-btn')
          if (clearBtn && fileInput && imagePreview) {
            clearBtn.addEventListener('click', () => {
              fileInput.value = ''
              imagePreview.classList.add('hidden')
            })
          }
        },
        preConfirm: async () => {
          const type = (document.getElementById('proposal-type') as HTMLSelectElement)?.value
          const description = (document.getElementById('proposal-description') as HTMLTextAreaElement)?.value
          const priceEl = (document.getElementById('proposal-price') as HTMLInputElement)
          const raw = priceEl?.dataset?.raw || ''
          const conditions = (document.getElementById('proposal-conditions') as HTMLTextAreaElement)?.value
          const meetingDate = (document.getElementById('proposal-date') as HTMLInputElement)?.value
          const meetingPlace = (document.getElementById('proposal-place') as HTMLInputElement)?.value
          const imageFile = (document.getElementById('proposal-image') as HTMLInputElement)?.files?.[0]
          
          if (!type || !description) {
            (window as any).Swal.showValidationMessage('Tipo y descripción son requeridos')
            return false
          }
          
          if (description.length < 10) {
            (window as any).Swal.showValidationMessage('La descripción debe tener al menos 10 caracteres')
            return false
          }
          
          let imageUrl = undefined
          
          // Subir imagen si existe
          if (imageFile) {
            try {
              ;(window as any).Swal.showLoading()
              
              const formData = new FormData()
              formData.append('image', imageFile)
              formData.append('chatId', selectedConversation.id)
              formData.append('userId', currentUser?.id || '')
              
              const session = await getSession()
              const token = session?.access_token
              if (!token) {
                console.error('❌ No hay token de sesión')
                ;(window as any).Swal.showValidationMessage('No hay sesión activa. Por favor, inicia sesión nuevamente.')
                return false
              }
              const response = await fetch('/api/chat/upload-image-debug', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                },
                body: formData
              })
              
              if (response.ok) {
                const data = await response.json()
                imageUrl = data.data.url
              } else {
                const errorData = await response.json()
                console.error('❌ Error subiendo imagen:', errorData)
                ;(window as any).Swal.showValidationMessage('Error subiendo la imagen: ' + (errorData.error || 'Error desconocido'))
                return false
              }
            } catch (error) {
              console.error('❌ Error subiendo imagen:', error)
              ;(window as any).Swal.showValidationMessage('Error subiendo la imagen')
              return false
            }
          }
          
          return { 
            type, 
            description, 
            proposedPrice: raw ? parseFloat(raw) : undefined,
            conditions: conditions || undefined,
            meetingDate: meetingDate || undefined,
            meetingPlace: meetingPlace || undefined,
            archivo_url: imageUrl
          }
        }
      }).then((result: any) => {
        if (result.isConfirmed) {
          handleCreateProposal(result.value)
    
    const proposalMessage = {
      id: `proposal-${Date.now()}`,
      senderId: currentUser?.id,
            content: `💰 Nueva propuesta de ${result.value.type}: ${result.value.description.substring(0, 50)}${result.value.description.length > 50 ? '...' : ''}`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'text' as const,
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Tú',
        lastName: '',
        avatar: currentUser?.avatar
      }
    }
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, proposalMessage]
    } : prev)
    
          setShowProposals(true)
        }
      })
    }
  }

  const handleNegotiate = () => {
    if (!selectedConversation) return
    
    if ((window as any).Swal) {
      (window as any).Swal.fire({
        title: '💬 Iniciar Negociación',
        html: `
          <div class="text-left space-y-4">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>💡 Negociación:</strong> Propón un precio diferente o condiciones especiales para llegar a un acuerdo.
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">💰 Tu oferta de precio</label>
              <input type="text" id="negotiate-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ej: 150.000" inputmode="numeric">
              <p class="text-xs text-gray-500 mt-1">Ingresa el precio que estás dispuesto a pagar</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">📝 Mensaje de negociación</label>
              <textarea id="negotiate-message" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="4" placeholder="Ej: Hola, me interesa tu producto. ¿Podrías considerar $150.000? Estoy disponible para encontrarnos esta semana..."></textarea>
              <p class="text-xs text-gray-500 mt-1">Explica tu propuesta y por qué es justa para ambos</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">🤝 Condiciones especiales (opcional)</label>
              <textarea id="negotiate-conditions" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="2" placeholder="Ej: Incluye garantía de 30 días, entrega a domicilio, etc."></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">📅 ¿Cuándo puedes encontrarte?</label>
                <input type="date" id="negotiate-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" min="${new Date().toISOString().split('T')[0]}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">📍 ¿Dónde prefieres encontrarte?</label>
                <input type="text" id="negotiate-place" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ej: Centro comercial, estación de metro...">
              </div>
            </div>
          </div>
        `,
        width: '500px',
        showCancelButton: true,
        confirmButtonText: 'Enviar Oferta',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        didOpen: () => {
          const input = document.getElementById('negotiate-price') as HTMLInputElement | null
          if (input) {
            input.addEventListener('input', () => {
              const digits = input.value.replace(/[^0-9]/g, '')
              input.dataset.raw = digits
              if (!digits) {
                input.value = ''
                return
              }
              const formatted = new Intl.NumberFormat('es-CO').format(Number(digits))
              input.value = formatted
            })
          }
        },
        preConfirm: () => {
          const priceEl = (document.getElementById('negotiate-price') as HTMLInputElement)
          const raw = priceEl?.dataset?.raw || ''
          const message = (document.getElementById('negotiate-message') as HTMLTextAreaElement)?.value
          const conditions = (document.getElementById('negotiate-conditions') as HTMLTextAreaElement)?.value
          const meetingDate = (document.getElementById('negotiate-date') as HTMLInputElement)?.value
          const meetingPlace = (document.getElementById('negotiate-place') as HTMLInputElement)?.value
          
          if (!message || message.trim().length < 10) {
            (window as any).Swal.showValidationMessage('El mensaje de negociación es requerido y debe tener al menos 10 caracteres')
            return false
          }
          
          if (!raw) {
            (window as any).Swal.showValidationMessage('Debes ingresar un precio para tu oferta')
            return false
          }
          
          return { 
            type: 'precio',
            description: message.trim(),
            proposedPrice: parseFloat(raw),
            conditions: conditions || undefined,
            meetingDate: meetingDate || undefined,
            meetingPlace: meetingPlace || undefined
          }
        }
      }).then((result: any) => {
        if (result.isConfirmed) {
          handleCreateProposal(result.value)
          
    const negotiateMessage = {
      id: `negotiate-${Date.now()}`,
      senderId: currentUser?.id,
            content: `💬 Oferta de negociación: $${result.value.proposedPrice.toLocaleString('es-CO')} - ${result.value.description.substring(0, 50)}${result.value.description.length > 50 ? '...' : ''}`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'text' as const,
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Tú',
        lastName: '',
        avatar: currentUser?.avatar
      }
    }
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, negotiateMessage]
    } : prev)
    
          setShowProposals(true)
        }
      })
    }
  }

  const handleAccept = () => {
    if (!selectedConversation) return
    
    const acceptMessage = {
      id: `accept-${Date.now()}`,
      senderId: currentUser?.id,
      content: '✅ Has aceptado el intercambio',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'text' as const,
      sender: {
        id: currentUser?.id,
        name: currentUser?.name || 'Tú',
        lastName: '',
        avatar: currentUser?.avatar
      }
    }
    
    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, acceptMessage]
    } : prev)
    
  }

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation || !currentUser) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'Solo se permiten archivos de imagen',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
      return
    }

    // Validar tamaño (máximo 10MB para archivos originales)
    if (file.size > 10 * 1024 * 1024) {
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: 'El archivo es demasiado grande. Máximo 10MB',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
      return
    }

    // Mostrar estado de compresión
    setImagePreview({
      file: null,
      url: null,
      comment: '',
      originalSize: file.size,
      compressedSize: 0,
      isCompressing: true
    })

    try {
      // Comprimir la imagen
      const compressedFile = await compressImage(file)
      
      // Crear URL para preview
      const imageUrl = URL.createObjectURL(compressedFile)
      
      // Actualizar preview con imagen comprimida
      setImagePreview({
        file: compressedFile,
        url: imageUrl,
        comment: '',
        originalSize: file.size,
        compressedSize: compressedFile.size,
        isCompressing: false
      })

    } catch (error) {
      console.error('❌ [ChatModule] Error procesando imagen:', error)
      
      // En caso de error, usar el archivo original
      const imageUrl = URL.createObjectURL(file)
      setImagePreview({
        file,
        url: imageUrl,
        comment: '',
        originalSize: file.size,
        compressedSize: file.size,
        isCompressing: false
      })

      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Advertencia',
          text: 'No se pudo comprimir la imagen. Se subirá el archivo original.',
          icon: 'warning',
          timer: 3000,
          showConfirmButton: false
        })
      }
    }

    // Limpiar input
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const uploadImageWithComment = async () => {
    if (!imagePreview.file || !selectedConversation || !currentUser) return

    const tempId = `temp-image-${Date.now()}-${Math.random()}`
    const currentUserId = getCurrentUserId()
    
    // Crear mensaje temporal optimista
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      content: imagePreview.comment || 'Imagen adjunta',
      timestamp: new Date().toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'image',
      metadata: { 
        imageUrl: imagePreview.url!,
        fileName: imagePreview.file.name,
        fileSize: `${Math.round(imagePreview.file.size / 1024)} KB`
      },
      sender: {
        id: currentUserId,
        name: currentUser?.name || 'Usuario',
        lastName: '',
        avatar: currentUser?.avatar || undefined
      }
    }

    // Actualizar UI inmediatamente
    const updatedMessages = [...selectedConversation.messages, optimisticMessage]
      .sort((a, b) => Number(a.id) - Number(b.id))
    const updatedConversation = {
      ...selectedConversation,
      messages: updatedMessages,
      lastMessage: optimisticMessage.content,
      lastMessageTime: optimisticMessage.timestamp
    }
    
    setSelectedConversation(updatedConversation)
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id ? updatedConversation : conv
    ))

    // Scroll al final
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'end' 
        })
      }
    })

    // Cerrar modal de preview
    setImagePreview({ 
      file: null, 
      url: null, 
      comment: '',
      originalSize: 0,
      compressedSize: 0,
      isCompressing: false
    })

    try {
      // Subir imagen al servidor
      const formData = new FormData()
      formData.append('image', imagePreview.file)
      formData.append('chatId', selectedConversation.id)
      formData.append('userId', currentUserId)

      const session = await getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error('No hay token de sesión')
      }

      
      const uploadResponse = await fetch('/api/chat/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error('❌ [ChatModule] Error en respuesta de subida:', {
          status: uploadResponse.status,
          error: errorData,
          chatId: selectedConversation.id,
          userId: currentUserId
        })
        throw new Error(errorData.error || errorData.details || 'Error subiendo imagen')
      }

      const uploadData = await uploadResponse.json()
      
      // Validar la estructura de la respuesta
      if (!uploadData || !uploadData.data || !uploadData.data.url) {
        console.error('❌ [ChatModule] Estructura de respuesta inválida:', uploadData)
        throw new Error('Respuesta del servidor inválida: falta URL de la imagen')
      }

      console.log('✅ [ChatModule] Datos de subida recibidos:', uploadData.data)

      // Ahora enviar el mensaje con la imagen al chat
      const chatId = Number(selectedConversation.id)
      const messageResponse = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          contenido: imagePreview.comment || '', // Incluir comentario si existe
          tipo: 'imagen',
          archivo_url: uploadData.data.url
        })
      })

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json()
        throw new Error(errorData.error || 'Error enviando mensaje')
      }

      const messageData = await messageResponse.json()

      // Reemplazar mensaje temporal con el real
      const realMessage: ChatMessage = {
        id: String(messageData.message.mensaje_id),
        senderId: String(messageData.message.usuario_id),
        content: messageData.message.contenido || '',
        timestamp: new Date(messageData.message.fecha_envio).toLocaleString('es-CO', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit'
        }),
        isRead: messageData.message.leido,
        type: 'image',
        metadata: { 
          imageUrl: uploadData.data.url,
          fileName: uploadData.data.originalName,
          fileSize: `${Math.round(uploadData.data.size / 1024)} KB`
        },
        sender: optimisticMessage.sender
      }

      // Actualizar con el mensaje real
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === tempId ? realMessage : msg
        ).sort((a, b) => Number(a.id) - Number(b.id)),
        lastMessage: realMessage.content,
        lastMessageTime: realMessage.timestamp
      } : prev)
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          messages: conv.messages?.map(msg => 
            msg.id === tempId ? realMessage : msg
          ).sort((a, b) => Number(a.id) - Number(b.id)) || [realMessage],
          lastMessage: realMessage.content,
          lastMessageTime: realMessage.timestamp
        } : conv
      ))

    } catch (error) {
      console.error('❌ [ChatModule] Error subiendo imagen:', error)
      
      // Remover mensaje temporal en caso de error
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== tempId)
      } : prev)
      
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id ? {
          ...conv,
          messages: conv.messages?.filter(msg => msg.id !== tempId) || []
        } : conv
      ))
      
      // Mostrar error
      if ((window as any).Swal) {
        (window as any).Swal.fire({
          title: 'Error',
          text: error.message || 'No se pudo subir la imagen. Inténtalo de nuevo.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        })
      }
    }
  }

  const cancelImageUpload = () => {
    // Limpiar URL temporal para liberar memoria
    if (imagePreview.url) {
      URL.revokeObjectURL(imagePreview.url)
    }
    setImagePreview({ 
      file: null, 
      url: null, 
      comment: '',
      originalSize: 0,
      compressedSize: 0,
      isCompressing: false
    })
  }

  // Funciones para el modal de visualización de imágenes
  const openImageModal = (imageUrl: string, alt: string = 'Imagen del chat') => {
    setImageModal({
      isOpen: true,
      imageUrl,
      alt
    })
  }

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: null,
      alt: ''
    })
  }

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedConversation) return
    const message: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser?.id || '1',
      content: '',
      timestamp: new Date().toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'file',
      metadata: { fileName: file.name, fileSize: `${Math.round(file.size / 1024)} KB` }
    }
    const updated = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, message],
      lastMessage: `Archivo: ${file.name}`,
      lastMessageTime: message.timestamp
    }
    setSelectedConversation(updated)
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full max-w-full" style={{ height: '100vh' }}>
      {/* Lista de conversaciones */}
      <div className={`w-full sm:w-80 border-r border-gray-200 flex flex-col flex-shrink-0 ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 space-y-3 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, mensaje o ubicación"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-sm text-gray-500">Cargando chats...</p>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay conversaciones</p>
                <p className="text-xs text-gray-400">Inicia un chat desde un producto</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={conversation.user.avatar}
                      alt={conversation.user.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                      isUserOnline(conversation.user.id) ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.user.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPinIcon className="w-3 h-3" />
                      <span>{conversation.user.location}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden ${selectedConversation ? 'flex' : 'hidden sm:flex'}`}>
        {selectedConversation ? (
          <>
            {/* Header del chat */}
            <div className="border-b border-gray-200 flex-shrink-0">
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Botón volver (solo móvil) */}
                  <button
                    onClick={() => setSelectedConversation(null as any)}
                    className="sm:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                    aria-label="Volver a la lista"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="relative">
                    <img
                      src={selectedConversation.user.avatar}
                      alt={selectedConversation.user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      isUserOnline(selectedConversation.user.id) ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">
                      {selectedConversation.user.name}
                    </h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPinIcon className="w-3 h-3" />
                      <span>{selectedConversation.user.location}</span>
                      <span>•</span>
                      <span>En línea</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button 
                    onClick={async () => {
                      setShowProposals(!showProposals)
                      // Refrescar propuestas cuando se hace clic
                      if (!showProposals) {
                        try {
                          setIsLoadingProposals(true)
                          const session = await getSession()
                          const token = session?.access_token
                          if (!token) return

                          
                          const response = await fetch(`/api/chat/${selectedConversation.id}/proposals`, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          
                          if (response.ok) {
                            const data = await response.json()
                            setProposals(data.data || [])
                            setUserValidations(data.userValidations || [])
                          }
                        } catch (error) {
                          console.error('❌ [ChatModule] Error refrescando propuestas:', error)
                        } finally {
                          setIsLoadingProposals(false)
                        }
                      }
                    }} 
                    className={`hidden sm:flex items-center space-x-2 px-2 md:px-3 py-1.5 rounded-lg transition-colors text-xs md:text-sm ${
                      showProposals 
                        ? 'text-primary-600 bg-primary-100' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                    title="Ver propuestas"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Propuestas</span>
                    {proposals.length > 0 && (
                      <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                        showProposals 
                          ? 'bg-primary-200 text-primary-800' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {proposals.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setShowProfile(true)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <PhoneIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <VideoCameraIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <EllipsisVerticalIcon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
              
              {/* Información de productos - Compacta */}
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                  <span className="text-sm">📦</span>
                  <h3 className="text-sm font-medium text-gray-700">Producto en Negociación</h3>
                  </div>
                  {(() => {
                    const userRole = getUserRole()
                    if (userRole) {
                      return (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          userRole === 'vendedor' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {userRole === 'vendedor' ? '🛒 Vendedor' : '💰 Comprador'}
                        </span>
                      )
                    }
                    return null
                  })()}
                </div>
                <div className="space-y-2">
                  {offeredProduct && renderProductInfoCompact(offeredProduct, 'Ofrecido')}
                  {requestedProduct && renderProductInfoCompact(requestedProduct, 'Solicitado')}
                  {!offeredProduct && !requestedProduct && (
                    <div className="text-center py-2 text-gray-500">
                      <div className="animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/3 mx-auto"></div>
                      </div>
                      <p className="text-xs mt-1">Cargando producto...</p>
                    </div>
                  )}
              </div>
            </div>

            </div>

            {/* Sección de propuestas - Panel lateral independiente */}
              {showProposals && (
              <div className="border-t border-gray-200 bg-white flex-shrink-0 overflow-hidden flex flex-col" style={{ maxHeight: '260px' }}>
                <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Propuestas</h4>
                    {(() => {
                      const buyer = isCurrentUserBuyer()
                      const handleClick = () => {
                        if (!buyer) return
                        if ((window as any).Swal) {
                          (window as any).Swal.fire({
                            title: 'Crear Propuesta',
                            html: `
                              <div class="text-left space-y-3">
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de propuesta</label>
                                  <select id="proposal-type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="precio">Propuesta de precio</option>
                                    <option value="intercambio">Propuesta de intercambio</option>
                                    <option value="encuentro">Propuesta de encuentro</option>
                                    <option value="condiciones">Propuesta de condiciones</option>
                                    <option value="otro">Otra propuesta</option>
                                  </select>
                                </div>
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                  <textarea id="proposal-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows="3" placeholder="Describe tu propuesta..."></textarea>
                                </div>
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Precio propuesto (opcional)</label>
                                  <input type="text" id="proposal-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" inputmode="numeric">
                                </div>
                                <div>
                                  <label class="block text-sm font-medium text-gray-700 mb-1">Imagen del producto (opcional)</label>
                                  <input type="file" id="proposal-image" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                                  <p class="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, GIF. Máximo 10MB</p>
                                </div>
                              </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Enviar Propuesta',
                            cancelButtonText: 'Cancelar',
                            confirmButtonColor: '#3B82F6',
                            cancelButtonColor: '#6B7280',
                        didOpen: () => {
                          const input = document.getElementById('proposal-price') as HTMLInputElement | null
                          if (input) {
                            input.addEventListener('input', () => {
                              const digits = input.value.replace(/[^0-9]/g, '')
                              input.dataset.raw = digits
                              if (!digits) {
                                input.value = ''
                                return
                              }
                              const formatted = new Intl.NumberFormat('es-CO').format(Number(digits))
                              input.value = formatted
                            })
                          }
                        },
                            preConfirm: async () => {
                              const type = (document.getElementById('proposal-type') as HTMLSelectElement)?.value
                              const description = (document.getElementById('proposal-description') as HTMLTextAreaElement)?.value
                          const priceEl = (document.getElementById('proposal-price') as HTMLInputElement)
                          const raw = priceEl?.dataset?.raw || ''
                          const imageFile = (document.getElementById('proposal-image') as HTMLInputElement)?.files?.[0]
                              
                              if (!type || !description) {
                                (window as any).Swal.showValidationMessage('Tipo y descripción son requeridos')
                                return false
                              }
                              
                              let imageUrl = undefined
                              
                              // Subir imagen si existe
                              if (imageFile) {
                                try {
                                  ;(window as any).Swal.showLoading()
                                  
                                  const formData = new FormData()
                                  formData.append('image', imageFile)
                                  formData.append('chatId', selectedConversation.id)
                                  formData.append('userId', currentUser?.id || '')
                                  
                                  const session = await getSession()
              const token = session?.access_token
              if (!token) {
                console.error('❌ No hay token de sesión')
                ;(window as any).Swal.showValidationMessage('No hay sesión activa. Por favor, inicia sesión nuevamente.')
                return false
              }
                                  const response = await fetch('/api/chat/upload-image-debug', {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    },
                                    body: formData
                                  })
                                  
                                  if (response.ok) {
                                    const data = await response.json()
                                    imageUrl = data.data.url
                                  } else {
                                    const errorData = await response.json()
                                    console.error('❌ Error subiendo imagen:', errorData)
                                    ;(window as any).Swal.showValidationMessage('Error subiendo la imagen: ' + (errorData.error || 'Error desconocido'))
                                    return false
                                  }
                                } catch (error) {
                                  console.error('❌ Error subiendo imagen:', error)
                                  ;(window as any).Swal.showValidationMessage('Error subiendo la imagen')
                                  return false
                                }
                              }
                              
                          return { type, description, proposedPrice: raw ? parseFloat(raw) : undefined, archivo_url: imageUrl }
                            }
                          }).then((result: any) => {
                            if (result.isConfirmed) {
                              handleCreateProposal(result.value)
                            }
                          })
                        }
                      }
                      return (
                        <button
                          onClick={handleClick}
                          disabled={!buyer}
                          className={`text-sm font-medium ${
                            !buyer ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'
                          }`}
                          title={!buyer ? 'Solo los compradores pueden crear propuestas' : 'Crear propuesta'}
                        >
                          + Nueva propuesta
                        </button>
                      )
                    })()}
                  </div>
                  </div>
                  
                <div className="flex-1 overflow-y-auto">
                  {isLoadingProposals ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  ) : proposals.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No hay propuestas en esta conversación</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {proposals.map((proposal) => (
                        <div key={proposal.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                proposal.type === 'precio' ? 'bg-blue-100 text-blue-800' :
                                proposal.type === 'intercambio' ? 'bg-green-100 text-green-800' :
                                proposal.type === 'encuentro' ? 'bg-purple-100 text-purple-800' :
                                proposal.type === 'condiciones' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {proposal.type}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                proposal.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                                proposal.status === 'aceptada' ? 'bg-green-100 text-green-800' :
                                proposal.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {proposal.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(proposal.createdAt).toLocaleDateString('es-CO')}
                            </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{proposal.description}</p>
                          
                          {proposal.proposedPrice && (
                            <p className="text-sm font-medium text-green-600 mb-2">
                              Precio propuesto: ${proposal.proposedPrice.toLocaleString('es-CO')}
                            </p>
                          )}
                          
                          {proposal.meetingDate && (
                            <p className="text-sm text-gray-600 mb-2">
                              📅 Encuentro: {new Date(proposal.meetingDate).toLocaleDateString('es-CO')}
                              {proposal.meetingPlace && ` en ${proposal.meetingPlace}`}
                            </p>
                          )}
                          
                          {proposal.response && (
                            <div className="mt-2 p-2 bg-white rounded border-l-4 border-primary-500">
                              <p className="text-sm text-gray-700">
                                <strong>Respuesta:</strong> {proposal.response}
                              </p>
                            </div>
                          )}
                          
                          {proposal.status === 'pendiente' && (() => {
                            const anyAccepted = proposals.some(p => p.status === 'aceptada')
                            if (anyAccepted) return false
                            const role = getUserRole()
                            const currentUserId = parseInt(getCurrentUserId())
                            const proposerId = (proposal as any)?.proposer?.id ? Number((proposal as any).proposer.id) : null
                            
                            // Si soy el vendedor y la propuesta la envió el comprador, puedo aceptar
                            if (role === 'vendedor' && proposerId && proposerId !== currentUserId) {
                              return true
                            }
                            
                            // Si soy el comprador y la propuesta la envió el vendedor, puedo aceptar
                            if (role === 'comprador' && proposerId && proposerId !== currentUserId) {
                              return true
                            }
                            
                            return false
                          })() && (
                            <div className="flex space-x-2 mt-3">
                              <button
                                disabled={proposals.some(p => p.status === 'aceptada')}
                                onClick={() => handleRespondToProposal(proposal.id, 'aceptar')}
                                className={`px-3 py-1 text-xs rounded ${proposals.some(p => p.status === 'aceptada') ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                              >
                                Aceptar
                              </button>
                              <button
                                disabled={proposals.some(p => p.status === 'aceptada')}
                                onClick={() => {
                                  if ((window as any).Swal) {
                                    (window as any).Swal.fire({
                                      title: 'Rechazar Propuesta',
                                      input: 'textarea',
                                      inputLabel: 'Motivo del rechazo (opcional)',
                                      inputPlaceholder: 'Explica por qué rechazas esta propuesta...',
                                      showCancelButton: true,
                                      confirmButtonText: 'Rechazar',
                                      cancelButtonText: 'Cancelar',
                                      confirmButtonColor: '#EF4444',
                                      cancelButtonColor: '#6B7280'
                                    }).then((result: any) => {
                                      if (result.isConfirmed) {
                                        handleRespondToProposal(proposal.id, 'rechazar', result.value)
                                      }
                                    })
                                  }
                                }}
                                className={`px-3 py-1 text-xs rounded ${proposals.some(p => p.status === 'aceptada') ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleViewProposal(proposal)}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Ver</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>
              )}

            {/* Seguimiento de Intercambios Activos */}
            {(() => {
              const acceptedProposals = proposals.filter(p => p.status === 'aceptada')
              
              // Verificar si el usuario actual ya validó el encuentro
              const currentUserId = parseInt(getCurrentUserId())
              const userAlreadyValidated = userValidations.some(
                validation => validation.usuario_id === currentUserId
              )
              
              
              // Si el usuario ya validó, no mostrar la sección de intercambios activos
              if (userAlreadyValidated) return null
              
              return acceptedProposals.length > 0 && (
                <div className="border-t border-gray-200 bg-blue-50 flex-shrink-0 overflow-hidden flex flex-col" style={{ maxHeight: '220px' }}>
                  <div className="px-3 py-2 flex-shrink-0">
                    <h4 className="font-medium text-blue-900 mb-3">🔄 Intercambios Activos</h4>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 pb-3">
                    <div className="space-y-3">
                      {acceptedProposals.map((proposal) => (
                        <div key={proposal.id} className="bg-white border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Aceptada
                              </span>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {proposal.type}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(proposal.createdAt).toLocaleDateString('es-CO')}
                            </span>
            </div>
                          
                          <p className="text-sm text-gray-700 mb-2">{proposal.description}</p>
                          
                          {proposal.proposedPrice && (
                            <p className="text-sm font-medium text-green-600 mb-2">
                              Precio acordado: ${proposal.proposedPrice.toLocaleString('es-CO')}
                            </p>
                          )}
                          
                          {(proposal.meetingDate || proposal.meetingPlace) && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <h5 className="text-xs font-medium text-blue-900 mb-1">Detalles del encuentro:</h5>
                              {proposal.meetingDate && (
                                <p className="text-xs text-blue-800">📅 {new Date(proposal.meetingDate).toLocaleDateString('es-CO')}</p>
                              )}
                              {proposal.meetingPlace && (
                                <p className="text-xs text-blue-800">📍 {proposal.meetingPlace}</p>
                              )}
                            </div>
                          )}
                          
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => handleViewProposal(proposal)}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver Detalles</span>
                            </button>
                            <button
                              onClick={() => handleValidateMeeting((proposal as any).intercambioId || proposal.id)}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Validar Encuentro</span>
                            </button>
                            <button
                              onClick={() => {
                                if ((window as any).Swal) {
                                  (window as any).Swal.fire({
                                    title: '¿Cancelar Intercambio?',
                                    text: 'Esta acción cancelará el intercambio en curso.',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonText: 'Sí, Cancelar',
                                    cancelButtonText: 'No',
                                    confirmButtonColor: '#EF4444',
                                    cancelButtonColor: '#6B7280'
                                  }).then((result: any) => {
                                    if (result.isConfirmed) {
                                      // Aquí se implementaría la lógica de cancelación
                                    }
                                  })
                                }
                              }}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Banner fijo: Pendiente de Validación */}
            {(() => {
              const hasAccepted = proposals.some(p => p.status === 'aceptada')
              const hasPendingValidation = proposals.some(p => p.status === 'pendiente_validacion')
              
              // Verificar si el usuario actual ya validó el encuentro
              const currentUserId = parseInt(getCurrentUserId())
              const userAlreadyValidated = userValidations.some(
                validation => validation.usuario_id === currentUserId
              )
              
              
              // Si el usuario ya validó, no mostrar el banner
              if (userAlreadyValidated) return null
              
              if (!hasAccepted && !hasPendingValidation) return null
              const first = proposals.find(p => p.status === 'pendiente_validacion') || proposals.find(p => p.status === 'aceptada')
              const intercambioId = (first as any)?.intercambioId || first?.id
              return (
                <div className="bg-yellow-50 border-b border-yellow-200 flex-shrink-0">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-700 text-sm font-medium">⏳ Pendiente de Validación</span>
                      <span className="text-xs text-yellow-700 hidden sm:inline">Confirma si el encuentro fue exitoso para cerrar el intercambio</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleValidateMeeting(Number(intercambioId))}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Validar Encuentro
                      </button>
                      
                      {/* Botón de diagnóstico temporal */}
                      <button
                        onClick={async () => {
                          try {
                            console.log('🔍 [DEBUG] Iniciando validación manual...')
                            const session = await getSession()
                            const token = session?.access_token
                            
                            console.log('🔍 [DEBUG] Sesión obtenida:', {
                              hasSession: !!session,
                              hasToken: !!token,
                              tokenLength: token?.length || 0,
                              expiresAt: session?.expires_at,
                              isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
                            })
                            
                            if (!token) {
                              console.error('❌ [DEBUG] No hay token disponible')
                              return
                            }

                            // Crear FormData de prueba
                            const testFormData = new FormData()
                            testFormData.append('chatId', selectedConversation?.id || 'test')
                            testFormData.append('userId', currentUser?.id || 'test')
                            
                            // Crear un archivo de prueba
                            const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
                            testFormData.append('image', testFile)

                            console.log('🔍 [DEBUG] Enviando validación al servidor...')
                            
                            const response = await fetch('/api/chat/validate-auth', {
                              method: 'POST',
                              headers: {
                                Authorization: `Bearer ${token}`
                              },
                              body: testFormData
                            })

                            const result = await response.json()
                            console.log('🔍 [DEBUG] Resultado de validación:', result)
                            
                            if (result.canProceed) {
                              console.log('✅ [DEBUG] La autenticación es válida, puede proceder con la subida')
                            } else {
                              console.log('❌ [DEBUG] La autenticación no es válida:', {
                                tokenValid: result.authentication?.tokenValid,
                                sessionValid: result.supabase?.sessionValid,
                                canAccessStorage: result.storage?.canAccess,
                                tokenExpired: result.authentication?.tokenExpired
                              })
                            }
                            
                            
                            // Probar con datos de prueba
                            const testResponse = await fetch(`/api/intercambios/${intercambioId}/validate`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                userId: getCurrentUserId(),
                                isValid: true,
                                rating: 5,
                                comment: 'Prueba de conexión',
                                aspects: 'Conexión funcionando'
                              })
                            })
                            
                            
                            if (testResponse.ok) {
                              const data = await testResponse.json()
                              alert('✅ Conexión a la API funcionando correctamente')
                            } else {
                              const errorText = await testResponse.text()
                              alert(`❌ Error ${testResponse.status}: ${testResponse.statusText}\n\nDetalles: ${errorText}`)
                            }
                          } catch (error) {
                            alert(`❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`)
                          }
                        }}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 ml-2"
                      >
                        🔍 Probar API
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* MENSAJES - ÁREA MÁS GRANDE CON SCROLL */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-0"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement
                const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10
                setIsUserScrolling(!isAtBottom)
              }}
            >
              {selectedConversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay mensajes en esta conversación</p>
                  </div>
                </div>
              ) : (
                selectedConversation.messages.map((message) => {
                  const isOwnMsg = isOwnMessage(message)
                  const isSystemMsg = message.senderId === 'system'
                  
                  // Renderizar mensaje del sistema de manera especial
                  if (isSystemMsg) {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center mb-4"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full border border-gray-200 bg-blue-100 flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V9H21ZM3 9H9V6.5L3 7V9ZM12 7.5C13.66 7.5 15 8.84 15 10.5V12H9V10.5C9 8.84 10.34 7.5 12 7.5ZM7.5 13.5C7.5 12.67 8.17 12 9 12H15C15.83 12 16.5 12.67 16.5 13.5V16H7.5V13.5ZM18 10.5C18.83 10.5 19.5 11.17 19.5 12V15H21V17H19.5V20H17.5V17H6.5V20H4.5V17H3V15H4.5V12C4.5 11.17 5.17 10.5 6 10.5H18Z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-800">Sistema</p>
                              <p className="text-sm text-blue-700">{message.content}</p>
                              <p className="text-xs text-blue-600 mt-1">{message.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                  
                  return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwnMsg ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div className={`flex items-end space-x-2 max-w-md ${isOwnMessage(message) ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwnMessage(message) && (
                      <img
                        src={message.sender?.avatar || selectedConversation.user.avatar}
                        alt={message.sender?.name || selectedConversation.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200 flex-shrink-0';
                          fallback.textContent = (message.sender?.name || selectedConversation.user.name).charAt(0).toUpperCase();
                          target.parentNode?.insertBefore(fallback, target.nextSibling);
                        }}
                      />
                    )}

                    <div className={`rounded-xl px-4 py-2 relative group shadow-sm ${isOwnMessage(message)
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                      {message.replyToId && (
                        <div className={`text-xs mb-2 px-3 py-1.5 rounded-lg ${isOwnMessage(message) ? 'bg-primary-700/40' : 'bg-gray-100'}`}>
                          <span className="opacity-80">Respuesta a:</span>
                          <span className="ml-1 font-medium">
                            {findMessageById(message.replyToId)?.content?.slice(0, 60) || 'mensaje'}
                          </span>
                        </div>
                      )}
                      {message.type === 'text' && (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}

                      {message.type === 'image' && message.metadata?.imageUrl && (
                        <div className="space-y-2">
                          {/* Comentario si existe */}
                          {message.content && message.content.trim() && message.content !== 'Subiendo imagen...' && (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                          
                          {/* Imagen */}
                          <div className="relative group">
                        <img
                          src={message.metadata.imageUrl}
                              alt="Imagen del chat"
                              className="rounded-lg max-w-32 max-h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                              onClick={() => {
                                openImageModal(message.metadata?.imageUrl!, 'Imagen del chat')
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = document.createElement('div')
                                fallback.className = 'w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400'
                                fallback.innerHTML = `
                                  <div class="text-center">
                                    <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p class="text-xs">Error cargando imagen</p>
                                  </div>
                                `
                                target.parentNode?.insertBefore(fallback, target.nextSibling)
                              }}
                            />
                            {message.content === 'Subiendo imagen...' && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <div className="text-white text-sm flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Subiendo...</span>
                                </div>
                              </div>
                            )}
                            {message.metadata?.fileName && message.content !== 'Subiendo imagen...' && (
                              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {message.metadata.fileName}
                                {message.metadata.fileSize && ` (${message.metadata.fileSize})`}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {message.type === 'location' && message.metadata?.coordinates && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="w-4 h-4" />
                          <span className="text-sm">Ubicación compartida</span>
                        </div>
                      )}

                      {message.type === 'file' && message.metadata?.fileName && (
                        <div className="flex items-center space-x-2">
                          <PaperClipIcon className="w-4 h-4" />
                          <span className="text-sm">{message.metadata.fileName}</span>
                        </div>
                      )}

              {/* Fecha integrada dentro del mensaje */}
              <div className={`flex items-center justify-between ${isOwnMessage(message) ? '' : ''}`}>
                        <div className="flex items-center space-x-1">
                          <span className={`text-xs ${isOwnMessage(message) ? 'text-primary-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </span>
                          <span className={`text-xs ${isOwnMessage(message) ? 'text-primary-200' : 'text-gray-400'}`}>
                            • {message.sender?.name || selectedConversation.user.name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                      {isOwnMessage(message) && (
                        <div className="flex items-center">
                          {message.isRead ? (
                                <CheckIcon className="w-3 h-3 text-primary-200" />
                          ) : (
                                <CheckIcon className="w-3 h-3 text-primary-300" />
                          )}
                        </div>
                      )}
                      {message.reactions && (
                            <div className="flex space-x-1">
                          {Object.entries(message.reactions).map(([emoji, count]) => (
                                <span key={emoji} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${isOwnMessage(message) ? 'border-primary-400/40' : 'border-gray-300'}`}>
                              {emoji} {count}
                            </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`absolute -top-3 ${isOwnMessage(message) ? 'right-2' : 'left-2'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-1 py-0.5 flex space-x-1">
                          <button onClick={() => setOpenReactionsFor(message.id)} className="text-xs px-2 py-1 hover:bg-gray-100 rounded">🙂</button>
                          <button onClick={() => handleReply(message.id)} className="text-xs px-2 py-1 hover:bg-gray-100 rounded">Responder</button>
                        </div>
                      </div>

                      {openReactionsFor === message.id && (
                        <div className={`absolute ${isOwnMessage(message) ? 'right-0' : 'left-0'} -top-12 bg-white border border-gray-200 shadow-lg rounded-lg p-1 flex space-x-1 z-10`}>
                          {['👍', '❤️', '🎉', '😂', '😮', '😢'].map(e => (
                            <button key={e} className="px-1 hover:scale-110 transition" onClick={() => handleAddReaction(message.id, e)}>{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                  )
                })
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs order-1">
                    <img
                      src={selectedConversation.user.avatar}
                      alt={selectedConversation.user.name}
                      className="w-8 h-8 rounded-full mb-2"
                    />
                    <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
              
              {isUserScrolling && (
                <div className="sticky bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                  <button
                    onClick={() => {
                      if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ 
                          behavior: 'smooth', 
                          block: 'end' 
                        })
                      }
                      setIsUserScrolling(false)
                    }}
                    className="bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
                    title="Ir al final"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Barra de acciones - FIJA */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex-shrink-0">
              <div className="flex items-center justify-center gap-2">
                {(() => {
                  const buyer = isCurrentUserBuyer()
                  return (
                    <button
                      onClick={() => { if (buyer) handleSendProposal() }}
                      disabled={!buyer}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded transition-colors text-sm ${
                        !buyer
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      title={!buyer ? 'Solo los compradores pueden enviar propuestas' : 'Enviar propuesta'}
                    >
                      <span>💰</span>
                      <span>Enviar</span>
                    </button>
                  )
                })()}
                
                <button
                  onClick={handleNegotiate}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  title="Negociar"
                >
                  <span>🔄</span>
                  <span>Negociar</span>
                </button>
              </div>
            </div>

            {/* Input de mensaje - FIJO */}
            <div className="p-4 border-t border-gray-200 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button onClick={handleAttachFile} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <button onClick={handleAttachImage} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" title="Adjuntar imagen">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <FaceSmileIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={1}
                    style={{ maxHeight: '100px' }}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageSelected} />
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
              </div>
            </div>
          </>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center">
            {/* vista placeholder desktop */}
          </div>
        )}
      </div>
      {showProfile && selectedConversation && (
        <div className="hidden lg:flex w-80 border-l border-gray-200 bg-white flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Perfil y Producto</h3>
            <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <div className="p-4 space-y-3">
            <img src={selectedConversation.user.avatar} alt={selectedConversation.user.name} className="w-20 h-20 rounded-full" />
            <div>
              <p className="font-medium text-gray-900">{selectedConversation.user.name}</p>
              <p className="text-sm text-gray-500 flex items-center space-x-1"><MapPinIcon className="w-4 h-4" /><span>{selectedConversation.user.location}</span></p>
              <p className={`text-sm flex items-center space-x-1 ${
                isUserOnline(selectedConversation.user.id) ? 'text-green-600' : 'text-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isUserOnline(selectedConversation.user.id) ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span>{isUserOnline(selectedConversation.user.id) ? 'En línea' : 'Desconectado'}</span>
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button className="w-full text-left text-sm text-primary-700 hover:underline">Ver perfil completo</button>
              <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Reportar usuario</button>
              <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Bloquear</button>
            </div>
          </div>

          {(() => {
            return selectedConversation.product
          })() && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Producto en Negociación</h4>
                {(() => {
                  const userRole = getUserRole()
                  if (userRole) {
                    return (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        userRole === 'vendedor' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {userRole === 'vendedor' ? '🛒 Vendedor' : '💰 Comprador'}
                      </span>
                    )
                  }
                  return null
                })()}
              </div>
              
              {selectedConversation.product.mainImage && (
                <div className="relative">
                  <img 
                    src={selectedConversation.product.mainImage} 
                    alt={selectedConversation.product.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900 text-sm">{selectedConversation.product.title}</h5>
                
                {selectedConversation.product.price && (
                  <p className="text-sm font-semibold text-green-600">
                    {selectedConversation.product.price}
                  </p>
                )}
                
                {selectedConversation.product.category && (
                  <p className="text-xs text-gray-500">
                    Categoría: {selectedConversation.product.category}
                  </p>
                )}
                
                {selectedConversation.product.description && (
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {selectedConversation.product.description}
                  </p>
                )}
                
                {selectedConversation.product.exchangeConditions && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs font-medium text-blue-800">Condiciones de Intercambio:</p>
                    <p className="text-xs text-blue-700">{selectedConversation.product.exchangeConditions}</p>
                  </div>
                )}
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <button className="w-full text-left text-sm text-primary-700 hover:underline">Ver producto completo</button>
                <button className="w-full text-left text-sm text-gray-700 hover:underline mt-1">Reportar producto</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Preview de Imagen */}
      {(imagePreview.file || imagePreview.isCompressing) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {imagePreview.isCompressing ? 'Procesando imagen...' : 'Vista previa de imagen'}
              </h3>
              <button
                onClick={cancelImageUpload}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={imagePreview.isCompressing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-4 space-y-4">
              {/* Estado de compresión */}
              {imagePreview.isCompressing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Comprimiendo imagen...</p>
                    <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
                  </div>
                </div>
              ) : imagePreview.url ? (
                <>
                  {/* Preview de la imagen - simplificado */}
                  <div className="relative flex justify-center">
                    <img
                      src={imagePreview.url}
                      alt="Preview"
                      className="max-w-xs max-h-64 object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                </>
              ) : null}

              {/* Campo de comentario - simplificado */}
              {!imagePreview.isCompressing && imagePreview.url && (
                <div className="space-y-2">
                  <label htmlFor="image-comment" className="block text-sm font-medium text-gray-700">
                    Comentario (opcional)
                  </label>
                  <textarea
                    id="image-comment"
                    value={imagePreview.comment}
                    onChange={(e) => setImagePreview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Escribe un comentario para tu imagen..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {imagePreview.comment.length}/500
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del modal - siempre visible */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cancelImageUpload}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={uploadImageWithComment}
                disabled={imagePreview.isCompressing || !(imagePreview.file || imagePreview.url)}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center space-x-2 ${imagePreview.isCompressing || !(imagePreview.file || imagePreview.url) ? 'bg-green-500/60 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
              >
                {imagePreview.isCompressing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v4m0 0a4 4 0 100 8v4m0-4a4 4 0 110-8" />
                    </svg>
                    <span>Procesando…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualización de Imagen */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Botón de cerrar */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Imagen - Contenedor que se adapta a la pantalla */}
            <div className="w-full h-full flex items-center justify-center p-12">
              <img
                src={imageModal.imageUrl!}
                alt={imageModal.alt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{
                  maxWidth: 'calc(100vw - 8rem)',
                  maxHeight: 'calc(100vh - 8rem)',
                  width: 'auto',
                  height: 'auto'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = document.createElement('div')
                  fallback.className = 'w-96 h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400'
                  fallback.textContent = 'Error al cargar la imagen'
                  target.parentNode?.insertBefore(fallback, target.nextSibling)
                }}
              />
            </div>

            {/* Información adicional - centrada con el ancho de la imagen */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white rounded-lg p-2 max-w-fit">
              <p className="text-xs opacity-90 whitespace-nowrap">Haz clic fuera de la imagen o presiona ESC para cerrar</p>
            </div>
          </div>

          {/* Backdrop clickable para cerrar */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeImageModal}
          ></div>
        </div>
      )}
    </div>
  )
}