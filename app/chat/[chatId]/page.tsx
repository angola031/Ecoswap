'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChatInfo, ChatMessage, ChatProposal } from '@/lib/types/chat'
import { useUserStatus } from '@/hooks/useUserStatus'
import AuthGuard from '@/components/auth/AuthGuard'
import { getSupabaseClient } from '@/lib/supabase-client'
// import imageCompression from 'browser-image-compression' // Importación dinámica


function ChatPageContent() {
  const params = useParams()
  const router = useRouter()
  const chatId = params?.chatId as string
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [proposals, setProposals] = useState<ChatProposal[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isUnderAdminReview, setIsUnderAdminReview] = useState(false)
  const [reviewTicketId, setReviewTicketId] = useState<number | null>(null)
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [showProposals, setShowProposals] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const { onlineUsers } = useUserStatus()
  
  // Estados para imágenes
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
  
  // Función auxiliar para obtener el ID del usuario actual
  const getCurrentUserId = () => {
    return currentUserId
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setShowSidebar(!isMobile)
  }, [isMobile])

  // Modal de validación de encuentro con calificación
  const handleValidateMeeting = async (intercambioId: number) => {
    try {
      // Determinar a quién vas a calificar
      let otherName = 'Usuario'
      let otherAvatar = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Ccircle fill=%22%2310B981%22 cx=%2212%22 cy=%2212%22 r=%2212%22/%3E%3Cpath fill=%22white%22 d=%22M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z%22/%3E%3C/svg%3E'
      try {
        const me = currentUserId ? String(currentUserId) : null
        const seller = (chatInfo as any)?.seller
        const buyer = (chatInfo as any)?.buyer
        const sellerId = seller?.id ? String(seller.id) : null
        const isMeSeller = me && sellerId && me === sellerId
        const target = isMeSeller ? buyer : seller
        if (target) {
          otherName = `${target.name || ''} ${target.lastName || ''}`.trim() || otherName
          otherAvatar = target.avatar || otherAvatar
        }
      } catch {}

      const result = await (window as any).Swal.fire({
        title: '¿El encuentro fue exitoso?',
        html: `
          <div class="text-left space-y-4">
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p class="text-sm text-blue-800">
                Confirma el resultado y califica al otro usuario.
              </p>
            </div>
            <div class="flex items-center space-x-3">
              <img src="${otherAvatar}" alt="${otherName}" class="w-10 h-10 rounded-full object-cover border" />
              <div>
                <p class="text-sm text-gray-900 font-medium">Vas a calificar a</p>
                <p class="text-sm text-gray-700">${otherName}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
              <div class="flex space-x-2 mb-3">
                <button type="button" class="star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" data-rating="1">⭐</button>
                <button type="button" class="star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" data-rating="2">⭐⭐</button>
                <button type="button" class="star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" data-rating="3">⭐⭐⭐</button>
                <button type="button" class="star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" data-rating="4">⭐⭐⭐⭐</button>
                <button type="button" class="star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50" data-rating="5">⭐⭐⭐⭐⭐</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Comentario (opcional)</label>
              <textarea id="validation-comment" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3" placeholder="¿Cómo fue tu experiencia?"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Aspectos destacados (opcional)</label>
              <textarea id="validation-aspects" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Puntualidad, estado del producto, etc."></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Fue exitoso',
        cancelButtonText: 'No fue exitoso',
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#EF4444',
        width: '600px',
        didOpen: () => {
          const starButtons = document.querySelectorAll('.star-rating')
          let selectedRating = 0
          starButtons.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
              selectedRating = idx + 1
              starButtons.forEach((b, i) => {
                if (i < selectedRating) {
                  b.classList.add('bg-yellow-100','border-yellow-400')
                  b.classList.remove('border-gray-300')
                } else {
                  b.classList.remove('bg-yellow-100','border-yellow-400')
                  b.classList.add('border-gray-300')
                }
              })
            })
          })
        },
        preConfirm: () => {
          const comment = (document.getElementById('validation-comment') as HTMLTextAreaElement)?.value
          const aspects = (document.getElementById('validation-aspects') as HTMLTextAreaElement)?.value
          const rated = Array.from(document.querySelectorAll('.star-rating.bg-yellow-100')).length
          return { isValid: true, rating: rated || null, comment: comment || null, aspects: aspects || null }
        }
      })

      const supabase = getSupabaseClient()
      if (!supabase) return
      
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

       let validateResponse: Response | null = null
       if (result.isConfirmed) {
         validateResponse = await fetch(`/api/intercambios/${intercambioId}/validate`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(result.value)
        })
      } else if (result.dismiss) {
        const problem = await (window as any).Swal.fire({
          title: 'Cuéntanos qué pasó',
          input: 'textarea',
          inputPlaceholder: 'Describe el problema...',
          showCancelButton: true,
          confirmButtonText: 'Reportar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#EF4444'
        })
         if (problem.isConfirmed) {
           validateResponse = await fetch(`/api/intercambios/${intercambioId}/validate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ isValid: false, comment: problem.value || null })
          })
        }
      }

       // Manejo de respuesta y UX
       if (validateResponse && validateResponse.ok) {
         const payload = await validateResponse.json().catch(() => ({}))
         if (payload?.adminReview) {
           setIsUnderAdminReview(true)
           const tid = payload?.ticket?.ticket_id || null
           setReviewTicketId(tid)
           // Notificar a usuarios: actual y contraparte
           try {
             const { data: { session: session2 } } = await supabase.auth.getSession()
             const tok = session2?.access_token
             if (tok) {
               // Determinar otro usuario
               const sellerId = (chatInfo as any)?.seller?.id ? Number((chatInfo as any).seller.id) : null
               const buyerId = (chatInfo as any)?.buyer?.id ? Number((chatInfo as any).buyer.id) : null
               const me = currentUserId ? Number(currentUserId) : null
               const otherUserId = me && sellerId && buyerId ? (me === sellerId ? buyerId : sellerId) : null
               const notify = async (uid: number | null, who: 'tú' | 'la contraparte') => {
                 if (!uid) return
                 await fetch('/api/notifications', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
                   body: JSON.stringify({
                     usuario_id: uid,
                     tipo: 'revision_intercambio',
                     titulo: `Intercambio enviado a revisión` ,
                     mensaje: `Se generó un ticket #${tid || ''} por discrepancia en la validación (${who}).`,
                     datos_adicionales: { ticket_id: tid, intercambio_id: intercambioId },
                     es_push: true,
                     es_email: false
                   })
                 })
               }
               await notify(me as any, 'tú')
               await notify(otherUserId as any, 'la contraparte')
             }
           } catch {}

           if ((window as any).Swal) {
             ;(window as any).Swal.fire({
               icon: 'info',
               title: 'Enviado a revisión',
               text: `Ticket #${tid || '—'} creado. Un administrador verificará la discrepancia.`,
               confirmButtonText: 'Entendido'
             })
           }
         } else if (payload?.intercambioEstado === 'completado') {
           if ((window as any).Swal) {
             ;(window as any).Swal.fire({
               icon: 'success',
               title: 'Intercambio completado',
               text: 'Ahora puedes calificar a la otra persona.',
               confirmButtonText: 'Aceptar'
             })
           }
         } else if (payload?.intercambioEstado === 'fallido') {
           if ((window as any).Swal) {
             ;(window as any).Swal.fire({
               icon: 'warning',
               title: 'Intercambio fallido',
               text: 'Se registró como no exitoso por ambas partes.',
               confirmButtonText: 'Aceptar'
             })
           }
         }
       }

       // Opcional: refrescar datos del chat sin recargar toda la página
       // window.location.reload()
    } catch (e) {
      console.error('Error en validación:', e)
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

  // Cargar información del usuario actual
  useEffect(() => {
    let isMounted = true
    
    const getCurrentUser = async () => {
      try {
        const supabase = getSupabaseClient()
        if (!supabase) return
        
        const { data: { user } } = await supabase.auth.getUser()
        if (isMounted && user) {
          // Obtener el user_id de la tabla usuario
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.access_token) {
            const response = await fetch('/api/users/me', {
              headers: { Authorization: `Bearer ${session.access_token}` }
            })
            if (response.ok) {
              const userData = await response.json()
              setCurrentUserId(String(userData.user_id))
              setCurrentUserInfo(userData)
            } else {
              // Fallback al auth user ID si no se puede obtener el user_id
              setCurrentUserId(user.id)
              setCurrentUserInfo({ user_id: user.id, nombre: 'Usuario', apellido: '', foto_perfil: null })
            }
          } else {
            setCurrentUserId(user.id)
            setCurrentUserInfo({ user_id: user.id, nombre: 'Usuario', apellido: '', foto_perfil: null })
          }
        }
      } catch (error) {
        console.error('Error obteniendo usuario actual:', error)
        if (isMounted) {
          setError('Error de autenticación')
        }
      }
    }
    
    getCurrentUser()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Cargar información del chat
  useEffect(() => {
    let isMounted = true
    
    const loadChatInfo = async () => {
      if (!chatId || !currentUserId) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        // Obtener token de sesión
        const supabase = getSupabaseClient()
        if (!supabase) return
        
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No hay sesión activa')
        }
        
        const response = await fetch(`/api/chat/${chatId}/info`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Error cargando información del chat')
        }
        
        if (isMounted) {
          setChatInfo(data.data)
        }
      } catch (error) {
        console.error('Error cargando información del chat:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Error desconocido')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    loadChatInfo()
    
    return () => {
      isMounted = false
    }
  }, [chatId, currentUserId])

  // Cargar mensajes del chat con sistema híbrido (realtime + polling)
  useEffect(() => {
    let isMounted = true
    
    const loadMessages = async () => {
      if (!chatId || !currentUserId || !isMounted) return
      
      try {
        
        // Obtener token de sesión
        const supabase = getSupabaseClient()
        if (!supabase) return
        
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          return
        }
        
        const response = await fetch(`/api/chat/${chatId}/messages`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        
        if (response.ok && isMounted) {
          const data = await response.json()
          const messagesData = data.items || data.data || []
          
          
          // Transformar mensajes al formato esperado
          const transformedMessages = messagesData.map((msg: any) => {
            // Detectar mensajes del sistema de propuestas
            let contentRaw = msg.contenido || ''
            const isSystemProposal = typeof contentRaw === 'string' && contentRaw.startsWith('[system_proposal]')
            if (isSystemProposal) {
              contentRaw = contentRaw.replace('[system_proposal]', '📝').trim()
            }

            return {
              id: String(msg.mensaje_id),
              senderId: isSystemProposal ? 'system' : String(msg.usuario_id),
              content: contentRaw,
              timestamp: new Date(msg.fecha_envio).toLocaleString('es-CO', { 
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              isRead: msg.leido,
              type: msg.tipo === 'imagen' ? 'imagen' : msg.tipo === 'ubicacion' ? 'ubicacion' : 'texto',
              metadata: msg.archivo_url ? { imageUrl: msg.archivo_url } : undefined,
              sender: {
                id: isSystemProposal ? 'system' : String(msg.usuario?.user_id || msg.usuario_id),
                name: isSystemProposal ? 'Sistema' : (msg.usuario?.nombre || 'Usuario'),
                lastName: isSystemProposal ? '' : (msg.usuario?.apellido || ''),
                avatar: isSystemProposal ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+' : (msg.usuario?.foto_perfil || undefined)
                  }
                }
              })

          if (transformedMessages.length > 0) {
            
            setMessages(prev => {
              let updatedMessages = prev
              // Agregar cada mensaje individualmente para evitar duplicados
              transformedMessages.forEach(msg => {
                updatedMessages = addMessageIfNotExists(updatedMessages, msg)
              })
              return updatedMessages
            })
          }
        }
      } catch (error) {
        console.error('Error cargando mensajes:', error)
      }
    }
    
    // Cargar mensajes inicialmente
    loadMessages()

    // Polling cada 3 segundos como respaldo
    const pollInterval = setInterval(loadMessages, 3000)

    return () => {
      clearInterval(pollInterval)
      isMounted = false
    }
  }, [chatId, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Limpiar URL temporal al desmontar el componente
  useEffect(() => {
    return () => {
      if (imagePreview.url) {
        URL.revokeObjectURL(imagePreview.url)
      }
    }
  }, [imagePreview.url])

  // Manejar eventos del modal de propuesta
  useEffect(() => {
    if (!showProposalModal) return

    const setupProposalModal = () => {
      // Formateo de precio
      const priceInput = document.getElementById('proposal-price') as HTMLInputElement
      if (priceInput) {
        priceInput.addEventListener('input', () => {
          const digits = priceInput.value.replace(/[^0-9]/g, '')
          priceInput.dataset.raw = digits
          if (!digits) {
            priceInput.value = ''
            return
          }
          const formatted = new Intl.NumberFormat('es-CO').format(Number(digits))
          priceInput.value = formatted
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
    }

    // Ejecutar después de que el modal se renderice
    setTimeout(setupProposalModal, 100)

    return () => {
      // Cleanup si es necesario
    }
  }, [showProposalModal])

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUserId) {
      console.log('❌ [ChatPage] No se puede enviar mensaje:', {
        hasMessage: !!newMessage.trim(),
        hasChatId: !!chatId,
        hasCurrentUserId: !!currentUserId
      })
      return
    }
    
    const supabase = getSupabaseClient()
    
    const messageContent = newMessage.trim()
    setNewMessage('')
    
    console.log('📤 [ChatPage] Enviando mensaje:', {
      chatId,
      currentUserId,
      messageContent
    })
    
    // Optimistic UI - agregar mensaje inmediatamente
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      content: messageContent,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      type: 'texto',
      sender: {
        id: currentUserId,
        name: currentUserInfo?.nombre || 'Tú',
        lastName: currentUserInfo?.apellido || '',
        avatar: currentUserInfo?.foto_perfil || undefined
      }
    }
    
    console.log('🖼️ [ChatPage] Avatar en mensaje temporal:', {
      currentUserInfo: currentUserInfo,
      foto_perfil: currentUserInfo?.foto_perfil,
      avatar: tempMessage.sender.avatar
    })
    
    setMessages(prev => {
      const combined = [...prev, tempMessage]
      // Ordenar todos los mensajes por ID para mantener el orden correcto
      return combined.sort((a, b) => Number(a.id) - Number(b.id))
    })
    
    // Scroll inmediato al final
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'end' 
        })
      }
    }, 0)
    
    try {
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Usar AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout

      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          contenido: messageContent,
          tipo: 'texto'
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('📨 [ChatPage] Respuesta de envío:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ [ChatPage] Error en respuesta:', errorData)
        throw new Error(errorData.error || 'Error enviando mensaje')
      }
      
      const data = await response.json()
      
      // Reemplazar mensaje temporal con el real
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === tempMessage.id 
            ? {
                id: String(data.message.mensaje_id),
                senderId: String(data.message.usuario_id),
                content: data.message.contenido,
                timestamp: new Date(data.message.fecha_envio).toLocaleString('es-CO', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                }),
                isRead: data.message.leido,
                type: (data.message.tipo === 'imagen' ? 'imagen' : data.message.tipo === 'ubicacion' ? 'ubicacion' : 'texto') as 'texto' | 'imagen' | 'ubicacion' | 'propuesta' | 'respuesta_propuesta',
                metadata: data.message.archivo_url ? { imageUrl: data.message.archivo_url } : undefined,
                sender: {
                  id: currentUserId,
                  name: currentUserInfo?.nombre || 'Tú',
                  lastName: currentUserInfo?.apellido || '',
                  avatar: currentUserInfo?.foto_perfil || undefined
                }
              }
            : msg
        )
        // Ordenar todos los mensajes por ID para mantener el orden correcto
        return updated.sort((a, b) => Number(a.id) - Number(b.id))
      })
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      
      // Solo remover mensaje temporal si no es un AbortError
      if (error instanceof Error && error.name !== 'AbortError') {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        setNewMessage(messageContent) // Restaurar mensaje
      }
    }
  }

  const handleSubmitProposal = async (proposalData: any) => {
    if (!chatId || !currentUserId) return

    const supabase = getSupabaseClient()
    setIsSubmittingProposal(true)
    
    try {
      const response = await fetch(`/api/chat/${chatId}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(proposalData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error enviando propuesta')
      }

      // Actualizar lista de propuestas
      const newProposal = data.data
      setProposals(prev => [newProposal, ...prev])
      
      // Agregar notificación mejorada en el chat sobre la propuesta enviada
      await addProposalNotificationToChat(newProposal)
      
      // Enviar notificación push al otro usuario
      await sendProposalNotification(newProposal)
      
    } catch (error) {
      console.error('Error enviando propuesta:', error)
      throw error
    } finally {
      setIsSubmittingProposal(false)
    }
  }

  // Función para redimensionar imágenes (igual que en ChatModule)
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

  // Función para ver detalles de una propuesta
  const handleViewProposal = (proposal: ChatProposal) => {
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

  // Función para manejar el envío de propuesta desde el modal
  const handleSubmitProposalFromModal = async () => {
    if (!chatId || !currentUserId) return

    const supabase = getSupabaseClient()
    
    try {
      // Obtener datos del formulario
      const type = (document.getElementById('proposal-type') as HTMLSelectElement)?.value
      const description = (document.getElementById('proposal-description') as HTMLTextAreaElement)?.value
      const priceEl = (document.getElementById('proposal-price') as HTMLInputElement)
      const raw = priceEl?.dataset?.raw || ''
      const conditions = (document.getElementById('proposal-conditions') as HTMLTextAreaElement)?.value
      const meetingDate = (document.getElementById('proposal-date') as HTMLInputElement)?.value
      const meetingPlace = (document.getElementById('proposal-place') as HTMLInputElement)?.value
      const imageFile = (document.getElementById('proposal-image') as HTMLInputElement)?.files?.[0]
      
      // Validaciones
      if (!type || !description) {
        alert('Tipo y descripción son requeridos')
        return
      }
      
      if (description.length < 10) {
        alert('La descripción debe tener al menos 10 caracteres')
        return
      }

      setIsSubmittingProposal(true)
      
      let imageUrl = undefined
      
      // Subir imagen si existe
      if (imageFile) {
        try {
          const resizedFile = await resizeImage(imageFile)
          
          const formData = new FormData()
          formData.append('image', resizedFile)
          formData.append('chatId', chatId)
          formData.append('userId', currentUserId)
          
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          if (!token) {
            throw new Error('No hay sesión activa')
          }
          
          const response = await fetch('/api/chat/upload-image', {
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
            throw new Error('Error subiendo la imagen: ' + (errorData.error || 'Error desconocido'))
          }
        } catch (error) {
          console.error('❌ Error subiendo imagen:', error)
          alert('Error subiendo la imagen')
          return
        }
      }
      
      // Crear propuesta
      const proposalData = { 
        type, 
        description, 
        proposedPrice: raw ? parseFloat(raw) : undefined,
        conditions: conditions || undefined,
        meetingDate: meetingDate || undefined,
        meetingPlace: meetingPlace || undefined,
        archivo_url: imageUrl
      }

      await handleSubmitProposal(proposalData)
      
      // Cerrar modal
      setShowProposalModal(false)
      
      // Limpiar formulario
      const form = document.querySelector('#proposal-type')?.closest('form') || document
      const inputs = form.querySelectorAll('input, textarea, select')
      inputs.forEach((input: any) => {
        if (input.type === 'file') {
          input.value = ''
        } else if (input.type === 'checkbox' || input.type === 'radio') {
          input.checked = false
        } else {
          input.value = ''
        }
      })
      
    } catch (error) {
      console.error('Error enviando propuesta:', error)
      alert('Error enviando la propuesta. Inténtalo de nuevo.')
    } finally {
      setIsSubmittingProposal(false)
    }
  }

  const handleNegotiate = () => {
    // Abrir modal de propuesta para negociación
    setShowProposalModal(true)
  }

  // Función para manejar respuestas a propuestas
  const handleRespondToProposal = async (proposalId: number, response: 'aceptar' | 'rechazar' | 'contrapropuesta', reason?: string) => {
    if (!chatId) return

    const supabase = getSupabaseClient()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const responseData = await fetch(`/api/chat/${chatId}/proposals/${proposalId}/respond`, {
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
        
        // Agregar notificación en el chat sobre la respuesta a la propuesta
        await addProposalResponseNotificationToChat(updatedProposal, response)
        
        // Enviar notificación push al otro usuario
        await sendProposalResponseNotification(updatedProposal, response)
        
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

  // Función para agregar notificación de propuesta al chat
  const addProposalNotificationToChat = async (proposal: any) => {
    try {
      // Obtener información del usuario que envió la propuesta
      const senderId = proposal.usuario_id || proposal.user_id
      const senderInfo = senderId === currentUserId ? currentUserInfo : chatInfo?.seller
      
      // Crear mensaje del sistema sobre la propuesta con información del usuario
      const systemMessage: ChatMessage = {
        id: `system-proposal-${proposal.id}-${Date.now()}`,
        senderId: 'system',
        content: `📝 ${senderInfo?.nombre || 'Usuario'} envió una nueva propuesta: ${getProposalTypeText(proposal.tipo_propuesta)}`,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        type: 'texto',
        sender: {
          id: senderId || 'system',
          name: senderInfo?.nombre || 'Usuario',
          lastName: senderInfo?.apellido || '',
          avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
        }
      }

      // Agregar mensaje al chat
      setMessages(prev => [...prev, systemMessage])
      
      console.log('✅ [ChatPage] Notificación de propuesta agregada al chat:', {
        proposalId: proposal.id,
        senderId: senderId,
        senderName: senderInfo?.nombre
      })
    } catch (error) {
      console.error('❌ [ChatPage] Error agregando notificación de propuesta:', error)
    }
  }

  // Función para agregar notificación de respuesta a propuesta en el chat
  const addProposalResponseNotificationToChat = async (proposal: any, response: string) => {
    try {
      const responseText = getResponseText(response)
      const responseIcon = getResponseIcon(response)

      // Obtener información del usuario que respondió a la propuesta
      const senderId = proposal.usuario_id || proposal.user_id
      const senderInfo = senderId === currentUserId ? currentUserInfo : chatInfo?.seller

      // Crear mensaje del sistema sobre la respuesta a la propuesta con información del usuario
      const systemMessage: ChatMessage = {
        id: `system-response-${proposal.id}-${Date.now()}`,
        senderId: 'system',
        content: `${responseIcon} ${senderInfo?.nombre || 'Usuario'} ${responseText} la propuesta: ${getProposalTypeText(proposal.tipo_propuesta)}`,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        type: 'texto',
        sender: {
          id: senderId || 'system',
          name: senderInfo?.nombre || 'Usuario',
          lastName: senderInfo?.apellido || '',
          avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
        }
      }

      // Agregar mensaje al chat
      setMessages(prev => [...prev, systemMessage])
      
      console.log('✅ [ChatPage] Notificación de respuesta a propuesta agregada al chat:', {
        proposalId: proposal.id,
        response: response,
        senderId: senderId,
        senderName: senderInfo?.nombre
      })
    } catch (error) {
      console.error('❌ [ChatPage] Error agregando notificación de respuesta:', error)
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

  // Función para enviar notificación push sobre la propuesta
  const sendProposalNotification = async (proposal: any) => {
    const supabase = getSupabaseClient()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      // Determinar el usuario que recibe la notificación
      const otherUserId = proposal.usuario_propone_id === Number(currentUserId) 
        ? proposal.usuario_recibe_id 
        : proposal.usuario_propone_id

      const notificationData = {
        usuario_id: otherUserId,
        tipo: 'nueva_propuesta',
        titulo: `Nueva ${getProposalTypeText(proposal.tipo_propuesta)}`,
        mensaje: `Un usuario te ha enviado una nueva propuesta en el chat`,
        datos_adicionales: {
          propuesta_id: proposal.id,
          chat_id: chatId,
          tipo_propuesta: proposal.tipo_propuesta,
          remitente_id: currentUserId
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
      console.error('❌ [ChatPage] Error enviando notificación push:', error)
    }
  }

  // Función para enviar notificación push sobre la respuesta a propuesta
  const sendProposalResponseNotification = async (proposal: any, response: string) => {
    const supabase = getSupabaseClient()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      // Determinar el usuario que recibe la notificación
      const otherUserId = proposal.usuario_propone_id === Number(currentUserId) 
        ? proposal.usuario_recibe_id 
        : proposal.usuario_propone_id

      const responseText = getResponseText(response)

      const notificationData = {
        usuario_id: otherUserId,
        tipo: 'respuesta_propuesta',
        titulo: `Propuesta ${responseText}`,
        mensaje: `Un usuario ha ${responseText} tu ${getProposalTypeText(proposal.tipo_propuesta)}`,
        datos_adicionales: {
          propuesta_id: proposal.id,
          chat_id: chatId,
          tipo_propuesta: proposal.tipo_propuesta,
          respuesta: response,
          remitente_id: currentUserId
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
      console.error('❌ [ChatPage] Error enviando notificación push de respuesta:', error)
    }
  }

  // Función para determinar el rol del usuario
  const getUserRole = () => {
    if (!chatInfo) return null
    
    // Lógica para determinar si es vendedor o comprador
    // Esto depende de cómo esté estructurada la información del chat
    return 'vendedor' // Por ahora asumimos vendedor, se puede ajustar según la lógica de negocio
  }

  const handleNegotiateOld = () => {
    // Abrir modal de propuesta para negociación
    setShowProposalModal(true)
    
    // Agregar mensaje informativo al chat
    const negotiateMessage: ChatMessage = {
      id: `negotiate-${Date.now()}`,
      senderId: currentUserId,
      content: '🔄 Iniciando negociación...',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'texto',
      sender: {
        id: currentUserId,
        name: 'Tú',
        lastName: '',
        avatar: undefined
      }
    }
    
    setMessages(prev => [...prev, negotiateMessage])
  }

  const handleAccept = () => {
    // Agregar mensaje de aceptación al chat
    const acceptMessage: ChatMessage = {
      id: `accept-${Date.now()}`,
      senderId: currentUserId,
      content: '✅ Has aceptado el intercambio',
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
      type: 'texto',
      sender: {
        id: currentUserId,
        name: 'Tú',
        lastName: '',
        avatar: undefined
      }
    }
    
    setMessages(prev => [...prev, acceptMessage])
    
    // Aquí puedes implementar lógica adicional para actualizar el estado del intercambio
  }

  // Funciones para manejo de imágenes
  const compressImage = async (file: File): Promise<File> => {
    try {
      // Importación dinámica solo en el cliente
      const imageCompression = (await import('browser-image-compression')).default
      
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg' as const,
        quality: 0.8,
        initialQuality: 0.8,
        alwaysKeepResolution: false
      }
      
      const compressedFile = await imageCompression(file, options)
      console.log('✅ [ChatPage] Imagen comprimida:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        reduction: Math.round((1 - compressedFile.size / file.size) * 100) + '%'
      })
      return compressedFile
    } catch (error) {
      console.error('❌ [ChatPage] Error comprimiendo imagen:', error)
      return file // Retornar archivo original si falla la compresión
    }
  }

  const onImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !chatId || !currentUserId) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen')
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 10MB')
      return
    }

    console.log('📸 [ChatPage] Imagen seleccionada:', {
      name: file.name,
      size: file.size,
      type: file.type
    })

    // Iniciar compresión
    setImagePreview(prev => ({ ...prev, isCompressing: true }))
    
    try {
      const compressedFile = await compressImage(file)
      const url = URL.createObjectURL(compressedFile)
      
      setImagePreview({
        file: compressedFile,
        url,
        comment: '',
        originalSize: file.size,
        compressedSize: compressedFile.size,
        isCompressing: false
      })
    } catch (error) {
      console.error('❌ [ChatPage] Error procesando imagen:', error)
      setImagePreview(prev => ({ ...prev, isCompressing: false }))
      alert('Error procesando la imagen. Inténtalo de nuevo.')
    }
  }

  const uploadImageWithComment = async () => {
    if (!imagePreview.file || !chatId || !currentUserId || !currentUserInfo) return

    const supabase = getSupabaseClient()

    // Crear mensaje temporal optimista
    const tempId = `temp-image-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      content: imagePreview.comment || 'Subiendo imagen...',
      timestamp: new Date().toLocaleString('es-CO', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }),
      isRead: false,
      type: 'imagen',
      metadata: { 
        imageUrl: imagePreview.url!,
        fileName: imagePreview.file.name,
        fileSize: `${Math.round(imagePreview.file.size / 1024)} KB`
      },
      sender: {
        id: currentUserId,
        name: currentUserInfo?.nombre || 'Tú',
        lastName: currentUserInfo?.apellido || '',
        avatar: currentUserInfo?.foto_perfil || undefined
      }
    }

    // Agregar mensaje temporal
    setMessages(prev => [...prev, optimisticMessage])

    // Scroll al final
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
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
      // Obtener token de sesión
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No hay sesión activa')
      }

      // Subir imagen al servidor
      const formData = new FormData()
      formData.append('image', imagePreview.file)
      formData.append('chatId', chatId)
      formData.append('userId', currentUserId)

      const uploadResponse = await fetch('/api/chat/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error('❌ [ChatPage] Error en respuesta de subida:', {
          status: uploadResponse.status,
          error: errorData,
          chatId,
          userId: currentUserId
        })
        throw new Error(errorData.error || errorData.details || 'Error subiendo imagen')
      }

      const uploadData = await uploadResponse.json()
      if (!uploadData || !uploadData.data || !uploadData.data.url) {
        console.error('❌ [ChatPage] Estructura de respuesta inválida:', uploadData)
        throw new Error('Respuesta del servidor inválida: falta URL de la imagen')
      }

      // Ahora enviar el mensaje con la imagen al chat
      const messageResponse = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
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
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? {
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
              type: 'imagen',
              metadata: { 
                imageUrl: uploadData.data.url,
                fileName: uploadData.data.originalName,
                fileSize: `${Math.round(uploadData.data.size / 1024)} KB`
              },
              sender: optimisticMessage.sender
            }
          : msg
      ))

    } catch (error: any) {
      console.error('❌ [ChatPage] Error subiendo imagen:', error)
      
      // Remover mensaje temporal
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      
      // Mostrar error
      alert(error.message || 'No se pudo subir la imagen. Inténtalo de nuevo.')
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

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando chat...</p>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium mb-2">Error</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              // Verificar si hay una ruta guardada desde donde se vino
              const lastPage = sessionStorage.getItem('lastPageBeforeChat')
              
              if (lastPage) {
                // Limpiar la ruta guardada y navegar a ella
                sessionStorage.removeItem('lastPageBeforeChat')
                router.push(lastPage)
              } else {
                router.back()
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay información del chat
  if (!chatInfo) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se pudo cargar la información del chat</p>
          <button
            onClick={() => {
              // Verificar si hay una ruta guardada desde donde se vino
              const lastPage = sessionStorage.getItem('lastPageBeforeChat')
              
              if (lastPage) {
                // Limpiar la ruta guardada y navegar a ella
                sessionStorage.removeItem('lastPageBeforeChat')
                router.push(lastPage)
              } else {
                router.back()
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  const exchangeStatusNormalized = chatInfo?.exchangeInfo?.status ? chatInfo.exchangeInfo.status.toLowerCase() : null
  const productPublicationStatus = chatInfo?.offeredProduct?.estado_publicacion ? chatInfo.offeredProduct.estado_publicacion.toLowerCase() : null
  const productStateStatus = chatInfo?.offeredProduct?.estado ? chatInfo.offeredProduct.estado.toLowerCase() : null
  const isExchangeCompleted = [exchangeStatusNormalized, productPublicationStatus, productStateStatus].some(status => status === 'completado' || status === 'intercambiado')
  const isExchangeAccepted = !isExchangeCompleted && exchangeStatusNormalized === 'aceptado'
  const isExchangeUnavailable = exchangeStatusNormalized === 'cancelado' || exchangeStatusNormalized === 'rechazado'

  const exchangeStatusConfig = (() => {
    if (isExchangeCompleted) {
      return {
        containerClass: 'bg-green-50 border border-green-200',
        dotClass: 'bg-green-500',
        title: 'Intercambio completado',
        description: 'Este producto ya se intercambió con éxito. Te recomendamos explorar otras publicaciones disponibles.'
      }
    }

    if (isExchangeAccepted) {
      return {
        containerClass: 'bg-blue-50 border border-blue-200',
        dotClass: 'bg-blue-500',
        title: 'Propuesta aceptada',
        description: 'Ya se aceptó una propuesta para este producto. El intercambio está en proceso de coordinación.'
      }
    }

    if (isExchangeUnavailable) {
      return {
        containerClass: 'bg-red-50 border border-red-200',
        dotClass: 'bg-red-500',
        title: 'Intercambio no disponible',
        description: 'Esta propuesta fue cancelada o rechazada. Puedes seguir conversando, pero considera explorar otras opciones.'
      }
    }

    return {
      containerClass: 'bg-yellow-50 border border-yellow-200',
      dotClass: 'bg-yellow-500',
      title: 'En negociación',
      description: 'Continúa conversando para coordinar los detalles del intercambio y concretarlo exitosamente.'
    }
  })()

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* HEADER - Producto + Vendedor */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
              <button 
                onClick={() => {
                  // Verificar si hay una ruta guardada desde donde se vino
                  const lastPage = sessionStorage.getItem('lastPageBeforeChat')
                  
                  if (lastPage) {
                    // Limpiar la ruta guardada y navegar a ella
                    sessionStorage.removeItem('lastPageBeforeChat')
                    router.push(lastPage)
                  } else {
                    // Intentar obtener el ID del producto de diferentes maneras
                    let productId = null
                    
                    if (chatInfo?.offeredProduct?.id) {
                      productId = chatInfo.offeredProduct.id
                    } else if (chatInfo?.offeredProduct?.id) {
                      productId = chatInfo.offeredProduct.id
                    }
                    
                    if (productId) {
                      router.push(`/producto/${productId}`)
                    } else {
                      // En lugar de router.back(), redirigir a la página principal con módulo de productos
                      router.push('/?m=products')
                    }
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Volver"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={chatInfo.seller?.avatar || '/placeholder-image.svg'}
                    alt={`${chatInfo.seller?.name || 'Vendedor'} ${chatInfo.seller?.lastName || ''}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${chatInfo?.seller?.id && onlineUsers.some(u => u.id === String(chatInfo.seller.id) && u.isOnline) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {(chatInfo.seller?.name || 'Vendedor')} {(chatInfo.seller?.lastName || '')}
                  </h1>
                  <p className="text-sm text-gray-500">{chatInfo?.seller?.id && onlineUsers.some(u => u.id === String(chatInfo.seller.id) && u.isOnline) ? 'En línea' : 'Desconectado'}</p>
                  {chatInfo.seller?.location && (
                    <p className="text-xs text-gray-400">{chatInfo.seller.location}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title={showSidebar ? "Ocultar sidebar" : "Mostrar sidebar"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Aviso de revisión administrativa por discrepancia */}
          {isUnderAdminReview && (
            <div className="mt-3 p-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Caso en revisión por administración</p>
                  <p className="text-sm mt-1">Se detectó una discrepancia en la validación del intercambio. Esto está siendo revisado por el equipo y puede influir en la calificación de los usuarios involucrados.</p>
                  <p className="text-sm mt-1">Ticket: <span className="font-semibold">#{reviewTicketId ?? '—'}</span></p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL - Sidebar + Chat */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {isMobile && showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* SIDEBAR (Opcional) */}
        {showSidebar && (
          <motion.div 
            initial={{ x: isMobile ? -320 : -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className={`${isMobile ? 'fixed inset-y-0 left-0 z-40 w-full max-w-xs shadow-2xl' : 'w-80'} bg-white border-r border-gray-200 flex flex-col`}
          >
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Detalles del Intercambio</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Información del vendedor */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Vendedor</h4>
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={chatInfo.seller?.avatar || '/placeholder-image.svg'}
                    alt={`${chatInfo.seller?.name || 'Vendedor'} ${chatInfo.seller?.lastName || ''}`}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {(chatInfo.seller?.name || 'Vendedor')} {(chatInfo.seller?.lastName || '')}
                    </p>
                    <p className="text-sm text-gray-500">{chatInfo.seller?.location || 'Ubicación no disponible'}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-yellow-600">★</span>
                      <span className="text-xs text-gray-600">{Number(chatInfo.seller?.rating ?? 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Estadísticas</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Calificación:</span>
                    <span className="font-medium">{Number(chatInfo.seller?.rating ?? 0).toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Intercambios:</span>
                    <span className="font-medium">{chatInfo.seller?.totalExchanges ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Miembro desde:</span>
                    <span className="font-medium">{chatInfo.seller?.memberSince || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Información del producto */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Producto</h4>
                <div className="space-y-2">
                  {chatInfo.offeredProduct?.title && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Título:</span>
                      <span className="font-medium text-right">{chatInfo.offeredProduct.title}</span>
                    </div>
                  )}
                  {chatInfo.offeredProduct?.type && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{chatInfo.offeredProduct.type}</span>
                    </div>
                  )}
                  {chatInfo.offeredProduct?.price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio:</span>
                      <span className="font-medium">${chatInfo.offeredProduct.price.toLocaleString()} COP</span>
                    </div>
                  )}
                  {chatInfo.offeredProduct?.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Categoría:</span>
                      <span className="font-medium">{chatInfo.offeredProduct.category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado del intercambio */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Estado</h4>
                <div className={`flex items-start space-x-3 rounded-lg px-3 py-3 ${exchangeStatusConfig.containerClass}`}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${exchangeStatusConfig.dotClass}`}></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{exchangeStatusConfig.title}</p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{exchangeStatusConfig.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CHAT (Centrado y Limitado) */}
        <div className="flex-1 flex justify-center overflow-hidden px-4 sm:px-0">
          <div className="w-full max-w-4xl flex flex-col gap-4 px-0 sm:px-6">
            {/* Banners de estado del intercambio - Prioridad: Completado > Aceptado > No disponible */}
            {isExchangeCompleted && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm flex items-start gap-2 rounded-lg">
                <span className="text-lg">✅</span>
                <div>
                  <p className="font-semibold">Este intercambio ya se completó con éxito.</p>
                  <p className="text-xs mt-1 text-green-700">Puedes revisar el historial en tu panel o explorar otros productos disponibles en EcoSwap.</p>
                </div>
              </div>
            )}

            {!isExchangeCompleted && isExchangeAccepted && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 text-sm flex items-start gap-2 rounded-lg">
                <span className="text-lg">ℹ️</span>
                <div>
                  <p className="font-semibold">Ya hay una propuesta aceptada para este producto.</p>
                  <p className="text-xs mt-1 text-blue-700">El intercambio está en proceso de coordinación. Si estabas interesado, permanece atento por si se libera nuevamente.</p>
                </div>
              </div>
            )}

            {!isExchangeCompleted && !isExchangeAccepted && isExchangeUnavailable && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm flex items-start gap-2 rounded-lg">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="font-semibold">Este intercambio ya no está disponible.</p>
                  <p className="text-xs mt-1 text-red-700">La propuesta fue cancelada o rechazada. Puedes seguir conversando o explorar otras opciones de trueque.</p>
                </div>
              </div>
            )}

            {/* Banner de validación pendiente - Solo si NO está completado */}
            {!isExchangeCompleted && (() => {
              const hasAccepted = proposals.some(p => p.status === 'aceptada')
              const hasPendingValidation = proposals.some(p => (p as any).status === 'pendiente_validacion')
              if (!hasAccepted && !hasPendingValidation) return null
              const first = proposals.find(p => (p as any).status === 'pendiente_validacion') || proposals.find(p => p.status === 'aceptada')
              const intercambioId = (first as any)?.intercambioId || first?.id
              return (
                <div className="sticky top-0 z-10 bg-yellow-50 border-b border-yellow-200">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-700 text-sm font-medium">⏳ Pendiente de Validación</span>
                      <span className="text-xs text-yellow-700 hidden sm:inline">Confirma si el encuentro fue exitoso para cerrar el intercambio</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          const supabase = getSupabaseClient()
                          
                          try {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (!session?.access_token) return
                            await fetch(`/api/intercambios/${Number(intercambioId)}/validate`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                              body: JSON.stringify({ isValid: true })
                            })
                            window.location.reload()
                          } catch {}
                        }}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Validar Encuentro
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
             {/* Sección de Propuestas - Arriba */}
            {proposals.length > 0 && (
              <div className="bg-white border-b border-gray-200">
                <button
                  onClick={() => setShowProposals(!showProposals)}
                  className={`w-full flex items-center justify-between px-4 sm:px-6 py-3 text-left transition-colors ${
                    showProposals 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Propuestas</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      showProposals 
                        ? 'bg-primary-200 text-primary-800' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {proposals.length}
                    </span>
                  </div>
                  <svg 
                    className={`w-5 h-5 transition-transform ${showProposals ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showProposals && (
                  <div className="border-t border-gray-200">
                    <div className="max-h-64 overflow-y-auto">
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
                              <span className="text-xs text-gray-500">
                                {new Date(proposal.createdAt).toLocaleDateString('es-CO')}
                              </span>
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
                            
                            <div className="mt-3 flex space-x-2">
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
                              
                              {proposal.status === 'pendiente' && (() => {
                                const anyAccepted = proposals.some(p => p.status === 'aceptada')
                                if (anyAccepted) return false
                                const role = getUserRole()
                                const currentUserIdNum = parseInt(currentUserId || '0')
                                const proposerId = (proposal as any)?.proposer?.id ? Number((proposal as any).proposer.id) : null
                                
                                // Si soy el vendedor y la propuesta la envió el comprador, puedo aceptar
                                if (role === 'vendedor' && proposerId && proposerId !== currentUserIdNum) {
                                  return true
                                }
                                
                                // Si soy el comprador y la propuesta la envió el vendedor, puedo aceptar
                                if (role === 'comprador' && proposerId && proposerId !== currentUserIdNum) {
                                  return true
                                }
                                
                                return false
                              })() && (
                                <>
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
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

             {/* Banner de revisión dentro del flujo de interacción */}
             {isUnderAdminReview && (
               <div className="sticky top-0 z-10 bg-yellow-50 border-b border-yellow-200">
                 <div className="px-4 py-2 flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <span className="text-yellow-700 text-sm font-medium">⚠️ En revisión por administración</span>
                     <span className="text-xs text-yellow-700 hidden sm:inline">Ticket #{reviewTicketId ?? '—'} — Este proceso puede afectar las calificaciones</span>
                   </div>
                 </div>
               </div>
             )}

             {/* Chat Box - Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No hay mensajes aún</p>
                    <p className="text-sm">¡Inicia la conversación!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUserId
                  const isSystemMessage = message.senderId === 'system'
                  
                  console.log('💬 [ChatPage] Renderizando mensaje:', {
                    messageId: message.id,
                    senderId: message.senderId,
                    currentUserId: currentUserId,
                    isOwnMessage: isOwnMessage,
                    isSystemMessage: isSystemMessage
                  })
                  
                  // Renderizar mensaje del sistema como mensaje normal pero con estilo especial
                  if (isSystemMessage) {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start my-2"
                      >
                        <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                          <div className="w-8 h-8 rounded-full border border-gray-200 bg-blue-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 6.5V9H21ZM3 9H9V6.5L3 7V9ZM12 7.5C13.66 7.5 15 8.84 15 10.5V12H9V10.5C9 8.84 10.34 7.5 12 7.5ZM7.5 13.5C7.5 12.67 8.17 12 9 12H15C15.83 12 16.5 12.67 16.5 13.5V16H7.5V13.5ZM18 10.5C18.83 10.5 19.5 11.17 19.5 12V15H21V17H19.5V20H17.5V17H6.5V20H4.5V17H3V15H4.5V12C4.5 11.17 5.17 10.5 6 10.5H18Z"/>
                            </svg>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 text-gray-900 px-4 py-2 rounded-2xl">
                            <div className="flex items-center space-x-1 mb-1">
                              <span className="text-xs font-medium text-blue-600">🔔</span>
                              <span className="text-xs font-medium text-blue-600">Sistema</span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                  
                  return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <img
                        src={message.sender.avatar || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Ccircle fill=%22%2310B981%22 cx=%2212%22 cy=%2212%22 r=%2212%22/%3E%3Cpath fill=%22white%22 d=%22M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z%22/%3E%3C/svg%3E'}
                        alt={`${message.sender.name} ${message.sender.lastName}`}
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          console.log('❌ [ChatPage] Error cargando imagen:', {
                            src: e.currentTarget.src,
                            messageId: message.id,
                            senderId: message.senderId,
                            avatar: message.sender.avatar
                          })
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Ccircle fill=%22%2310B981%22 cx=%2212%22 cy=%2212%22 r=%2212%22/%3E%3Cpath fill=%22white%22 d=%22M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z%22/%3E%3C/svg%3E'
                        }}
                        onLoad={() => {
                          console.log('✅ [ChatPage] Imagen cargada exitosamente:', {
                            src: message.sender.avatar,
                            messageId: message.id
                          })
                        }}
                      />
                      <div className={`px-4 py-2 rounded-2xl ${isOwnMessage 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        {/* Contenido del mensaje */}
                        {message.type === 'imagen' && message.metadata?.imageUrl ? (
                          <div className="space-y-2">
                            {/* Comentario si existe */}
                            {message.content && message.content.trim() && message.content !== 'Subiendo imagen...' && (
                              <p className="text-sm">{message.content}</p>
                            )}
                            
                            {/* Imagen pequeña */}
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
                                  fallback.textContent = 'Error al cargar'
                                  target.parentNode?.insertBefore(fallback, target.nextSibling)
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
                            {message.timestamp}
                          </p>
                          {isOwnMessage && (
                            <div className={`w-2 h-2 rounded-full ${message.isRead ? 'bg-green-300' : 'bg-gray-400'}`}></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* SECCIÓN DE PROPUESTA */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t-2 border-green-200 px-4 sm:px-6 py-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-1">💰 Sesión de Propuesta</h3>
                <p className="text-sm text-gray-600">Gestiona las propuestas del intercambio</p>
              </div>
              
              <div className="flex items-center justify-center flex-wrap gap-4">
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <span className="text-xl">💰</span>
                  <span className="font-semibold">Enviar Propuesta</span>
                </button>
                
                <button
                  onClick={() => handleNegotiate()}
                  className="flex items-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <span className="text-xl">🔄</span>
                  <span className="font-semibold">Negociar</span>
                </button>
                
                <button
                  onClick={() => handleAccept()}
                  className="flex items-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <span className="text-xl">✅</span>
                  <span className="font-semibold">Aceptar</span>
                </button>
              </div>
            </div>


            {/* Input de mensaje */}
            <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-end space-x-3">
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Subir imagen"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Escribe tu mensaje..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              
              {/* Input oculto para imágenes */}
              <input 
                ref={imageInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={onImageSelected} 
              />
            </div>
          </div>
        </div>
      </div>

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
              {imagePreview.isCompressing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Comprimiendo imagen...</p>
                  <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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

            {/* Footer del modal - simplificado */}
            {!imagePreview.isCompressing && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={cancelImageUpload}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                {imagePreview.file && (
                  <button
                    onClick={uploadImageWithComment}
                    className="px-4 sm:px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Enviar</span>
                  </button>
                )}
              </div>
            )}
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

      {/* Modal de Propuesta - Actualizado como ChatModule */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Propuesta</h2>
                <button
                  onClick={() => setShowProposalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de propuesta</label>
                  <select id="proposal-type" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="precio">💰 Propuesta de precio</option>
                    <option value="intercambio">🔄 Propuesta de intercambio</option>
                    <option value="encuentro">📅 Propuesta de encuentro</option>
                    <option value="condiciones">📋 Propuesta de condiciones</option>
                    <option value="otro">📝 Otra propuesta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción de la propuesta</label>
                  <textarea id="proposal-description" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows={4} placeholder="Describe detalladamente tu propuesta..."></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio propuesto (opcional)</label>
                  <input type="text" id="proposal-price" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0" inputMode="numeric" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones adicionales (opcional)</label>
                  <textarea id="proposal-conditions" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Condiciones especiales, garantías, etc..."></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de encuentro (opcional)</label>
                    <input type="date" id="proposal-date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lugar de encuentro (opcional)</label>
                    <input type="text" id="proposal-place" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Centro comercial, parque, etc..." />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del producto (opcional)</label>
                  <div className="space-y-2">
                    <input type="file" id="proposal-image" accept="image/*" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" style={{display: 'none'}} />
                    <div className="flex space-x-2">
                      <button type="button" id="take-photo-btn" className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>Tomar foto</span>
                      </button>
                      <button type="button" id="select-file-btn" className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <span>Seleccionar archivo</span>
                      </button>
                      <button type="button" id="clear-image-btn" className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700">
                        Limpiar
                      </button>
                    </div>
                    <div id="image-preview" className="hidden">
                      <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                      <img id="preview-img" className="w-full max-w-xs rounded border border-gray-300" alt="Vista previa" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, GIF. Máximo 10MB. Se redimensionará automáticamente.</p>
                </div>
              </div>

              <div className="flex space-x-4 pt-6">
                  <button
                    onClick={() => setShowProposalModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                  onClick={handleSubmitProposalFromModal}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Enviar Propuesta
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}

export default function ChatPageRedesign() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  )
}