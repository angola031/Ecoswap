'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'
import {
    ArrowLeftIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarIcon,
    MapPinIcon,
    StarIcon,
    ChatBubbleLeftRightIcon,
    HandThumbUpIcon,
    HandThumbDownIcon,
    HeartIcon,
    EyeIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    TruckIcon,
    UserIcon,
    GiftIcon,
    CurrencyDollarIcon,
    TagIcon
} from '@heroicons/react/24/outline'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { InteractionDetail } from '@/lib/types/interactions'

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
    rating: number
    phone?: string
}

interface Product {
    id: string
    title: string
    image: string
    price: number
    currency: string
    description: string
    condition: string
    category: string
}

interface Message {
    id: string
    text: string
    timestamp: string
    sender: {
        id: string
        name: string
        lastName?: string
        avatar: string
    }
    type: 'text' | 'system' | 'proposal' | 'delivery' | 'image' | 'location'
    metadata?: {
        imageUrl?: string
        fileName?: string
        fileSize?: string
        coordinates?: { lat: number; lng: number }
    }
}

interface Proposal {
    id: string
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
    proposer?: {
        id: number
        name: string
        lastName: string
        avatar?: string
    }
    receiver?: {
        id: number
        name: string
        lastName: string
        avatar?: string
    }
}

interface Delivery {
    id: string
    type: 'meetup' | 'shipping' | 'pickup'
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed'
    location: string
    date: string
    time: string
    notes: string
    contactPhone?: string
}

interface Interaction {
    id: string
    chatId?: string
    type: 'exchange' | 'purchase' | 'donation' | 'collaboration'
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    title: string
    description: string
    product: Product
    otherUser: User
    createdAt: string
    updatedAt: string
    messages: Message[]
    proposals: Proposal[]
    deliveries: Delivery[]
    userValidations?: {
        usuario_id: number
        es_exitoso: boolean
        fecha_validacion: string
    }[]
    isUrgent: boolean
}

// Mock data para la interacción
const mockInteraction: Interaction = {
    id: '1',
    chatId: '1',
    type: 'exchange',
    status: 'in_progress',
    title: 'Intercambio Guitarra por Amplificador',
    description: 'Intercambio de guitarra acústica por amplificador de guitarra. Ambos productos están en excelente estado.',
    product: {
        id: '1',
        title: 'Guitarra Acústica Yamaha',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        price: 450000,
        currency: 'COP',
        description: 'Guitarra acústica Yamaha en excelente estado. Perfecta para principiantes y músicos intermedios.',
        condition: 'excellent',
        category: 'music'
    },
    otherUser: {
        id: '2',
        name: 'Carlos Mendoza',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
        location: 'Medellín, Antioquia',
        rating: 4.8,
        phone: '+57 300 123 4567',
        email: 'carlos.mendoza@email.com'
    },
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    messages: [
        {
            id: '1',
            text: 'Hola! Me interesa tu guitarra. ¿Te parece bien el intercambio por mi amplificador?',
            timestamp: '2024-01-20T10:00:00Z',
            sender: {
                id: '2',
                name: 'Carlos Mendoza',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        },
        {
            id: '2',
            text: '¡Hola Carlos! Sí, me parece una excelente idea. ¿Podrías enviarme fotos del amplificador?',
            timestamp: '2024-01-20T11:30:00Z',
            sender: {
                id: '1',
                name: 'Tú',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        },
        {
            id: '3',
            text: '¡Por supuesto! Te envío las fotos ahora mismo.',
            timestamp: '2024-01-20T12:00:00Z',
            sender: {
                id: '2',
                name: 'Carlos Mendoza',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
            },
            type: 'text'
        },
        {
            id: '4',
            text: '📝 Nueva propuesta enviada: Intercambio directo',
            timestamp: '2024-01-20T12:30:00Z',
            sender: {
                id: 'system',
                name: 'Sistema',
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
            },
            type: 'system'
        },
        {
            id: '5',
            text: '✅ Propuesta aceptada. Intercambio iniciado.',
            timestamp: '2024-01-20T13:00:00Z',
            sender: {
                id: 'system',
                name: 'Sistema',
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
            },
            type: 'system'
        }
    ],
    proposals: [
        {
            id: '1',
            type: 'intercambio',
            status: 'aceptada',
            description: 'Intercambio por amplificador de guitarra en buen estado',
            createdAt: '2024-01-20T11:00:00Z',
            proposer: {
                id: 2,
                name: 'Carlos',
                lastName: 'Mendoza',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
            },
            receiver: {
                id: 1,
                name: 'Usuario',
                lastName: 'Actual',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
            }
        }
    ],
    deliveries: [
        {
            id: '1',
            type: 'meetup',
            status: 'confirmed',
            location: 'Centro Comercial Pereira Plaza',
            date: '2024-01-25',
            time: '15:00',
            notes: 'Encuentro en la entrada principal del centro comercial',
            contactPhone: '+57 300 123 4567'
        }
    ],
    isUrgent: false
}

export default function InteraccionDetailPage() {
    const router = useRouter()
    const params = useParams()
    const interactionId = params.id as string

    const [interaction, setInteraction] = useState<Interaction | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'proposals' | 'delivery'>('overview')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [newMessage, setNewMessage] = useState('')
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showNewProposalModal, setShowNewProposalModal] = useState(false)
    const [realtimeChannel, setRealtimeChannel] = useState<any>(null)
    const [proposalsLoading, setProposalsLoading] = useState(false)
    const [proposalsError, setProposalsError] = useState<string | null>(null)
    const [newProposalDescription, setNewProposalDescription] = useState('')
    const [showAcceptModal, setShowAcceptModal] = useState(false)
    const [meetingPlace, setMeetingPlace] = useState('')
    const [meetingDate, setMeetingDate] = useState('')
    const [meetingTime, setMeetingTime] = useState('')
    const [meetingNotes, setMeetingNotes] = useState('')
    const [showRejectInteractionModal, setShowRejectInteractionModal] = useState(false)
    const [rejectInteractionReason, setRejectInteractionReason] = useState('')
    const [showRejectProposalModal, setShowRejectProposalModal] = useState(false)
    const [rejectProposalReason, setRejectProposalReason] = useState('')
    const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)

    useEffect(() => {
        const loadInteraction = async () => {
            if (!interactionId) return
            
            setIsLoading(true)
            setError(null)

            try {
                // Obtener sesión de Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                if (sessionError) {
                    console.error('Error obteniendo sesión:', sessionError)
                    setError('Error de autenticación')
                    setIsLoading(false)
                    return
                }

                if (!session?.access_token) {
                    console.error('No hay token de sesión')
                    setError('No estás autenticado')
                    setIsLoading(false)
                    return
                }

                // Obtener el ID del usuario actual desde la base de datos
                const { data: usuario, error: usuarioError } = await supabase
                    .from('usuario')
                    .select('user_id')
                    .eq('auth_user_id', session.user.id)
                    .single()

                if (usuarioError || !usuario) {
                    console.error('No se pudo obtener el usuario de la base de datos:', usuarioError)
                    setError('Error de autenticación')
                    setIsLoading(false)
                    return
                }

                const userId = usuario.user_id.toString()
                setCurrentUserId(userId)


                // Cargar detalles de la interacción desde la API
                const response = await fetch(`/api/interactions/${interactionId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })


                if (response.ok) {
                    const data = await response.json()
                    
                    // La API devuelve directamente el InteractionDetail, no envuelto en 'interaction'
                    const interactionData = data
                    
                    // Validar que tenemos los datos necesarios
                    if (!interactionData || !interactionData.id) {
                        console.error('❌ ERROR: Datos de interacción inválidos:', interactionData)
                        setError('Datos de interacción inválidos')
                        return
                    }
                    
                    // Transformar los datos de la API al formato esperado por el componente
                    const transformedInteraction: Interaction & { chatId?: string; proposerId?: string; receiverId?: string } = {
                        id: interactionData.id,
                        type: interactionData.type,
                        status: interactionData.status,
                        title: interactionData.title,
                        description: interactionData.description,
                        product: {
                            id: interactionData.offeredProduct?.id || '',
                            title: interactionData.offeredProduct?.title || '',
                            image: interactionData.offeredProduct?.image || '',
                            price: interactionData.offeredProduct?.price || 0,
                            currency: 'COP',
                            description: interactionData.offeredProduct?.title || '',
                            condition: interactionData.offeredProduct?.condition || 'usado',
                            category: interactionData.offeredProduct?.category || 'Sin categoría'
                        },
                        otherUser: {
                            id: interactionData.otherUser?.id || '',
                            name: interactionData.otherUser?.name || '',
                            email: '',
                            avatar: interactionData.otherUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                            location: interactionData.otherUser?.location || '',
                            rating: interactionData.otherUser?.rating || 0,
                            phone: interactionData.otherUser?.phone
                        },
                        createdAt: interactionData.createdAt || new Date().toISOString(),
                        updatedAt: interactionData.updatedAt || new Date().toISOString(),
                        messages: (() => {
                            return interactionData.messages || []
                        })(),
                        proposals: interactionData.proposals || [],
                        deliveries: interactionData.deliveries || [],
                        userValidations: interactionData.userValidations || [],
                        chatId: interactionData.chatId || '',
                        proposerId: interactionData.proposer?.user_id ? String(interactionData.proposer.user_id) : undefined,
                        receiverId: interactionData.receiver?.user_id ? String(interactionData.receiver.user_id) : undefined,
                        isUrgent: false
                    }
                    
                    setInteraction(transformedInteraction)
                } else {
                    const errorText = await response.text()
                    console.error('❌ ERROR: Error cargando detalles:', response.status, errorText)
                    setError('Error cargando los detalles de la interacción')
                }
            } catch (error) {
                console.error('❌ ERROR: Error inesperado:', error)
                setError('Error inesperado al cargar la interacción')
            } finally {
                setIsLoading(false)
            }
        }

        if (interactionId) {
            loadInteraction()
        }
    }, [interactionId])

    // Cargar propuestas reales del chat
    useEffect(() => {
        const loadProposals = async () => {
            if (!interaction?.chatId) return
            setProposalsLoading(true)
            setProposalsError(null)
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token
                if (!token) {
                    setProposalsError('No autenticado')
                    setProposalsLoading(false)
                    return
                }
                const chatIdNum = Number(interaction.chatId)
                if (!chatIdNum || isNaN(chatIdNum)) return
                const res = await fetch(`/api/chat/${chatIdNum}/proposals`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json?.error || 'Error cargando propuestas')
                const proposals = (json.data || []).map((p: any) => ({
                    id: String(p.id),
                    type: p.type,
                    status: p.status,
                    description: p.description,
                    proposedPrice: p.proposedPrice || undefined,
                    createdAt: p.createdAt,
                    meetingDate: p.meetingDate,
                    meetingPlace: p.meetingPlace,
                    response: p.response,
                    proposerId: p.proposer?.id ? String(p.proposer.id) : undefined,
                    receiverId: p.receiver?.id ? String(p.receiver.id) : undefined
                }))
                setInteraction(prev => prev ? { ...prev, proposals } : prev)
            } catch (e: any) {
                setProposalsError(e?.message || 'Error cargando propuestas')
            } finally {
                setProposalsLoading(false)
            }
        }
        loadProposals()
    }, [interaction?.chatId])

    // Cargar mensajes frescos desde la API (como en ChatModule)
    useEffect(() => {
        const loadMessages = async () => {
            if (!interaction?.chatId || !currentUserId) return
            
            const chatId = Number(interaction.chatId)
            if (!chatId) return
            
            try {
                
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token
                if (!token) {
                    console.error('❌ [InteractionDetail] No hay token de sesión')
                    return
                }
                
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)
                
                const res = await fetch(`/api/chat/${chatId}/messages?limit=50`, { 
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                })
                clearTimeout(timeoutId)
                
                const json = await res.json()
                console.log('📨 [InteractionDetail] Respuesta de mensajes:', { 
                    status: res.status, 
                    ok: res.ok, 
                    json: {
                        items: json.items?.length || 0,
                        firstMessage: json.items?.[0],
                        lastMessage: json.items?.[json.items?.length - 1]
                    }
                })
                
                if (!res.ok) throw new Error(json?.error || 'Error cargando mensajes')
                
                const messages: Message[] = (json.items || [])
                    .filter((m: any) => {
                        const content = m.contenido || ''
                        const isProductInfo = content.includes('Producto Ofrecido') && 
                                             content.includes('$') && 
                                             content.includes('Negociable')
                        return !isProductInfo && content.trim().length > 0
                    })
                    .map((m: any) => {
                        // Detectar mensajes del sistema de propuestas (igual que ChatModule)
                        let contentRaw = m.contenido || ''
                        const isSystemProposal = typeof contentRaw === 'string' && contentRaw.startsWith('[system_proposal]')
                        if (isSystemProposal) {
                            contentRaw = contentRaw.replace('[system_proposal]', '📝').trim()
                        }

                        return {
                            id: String(m.mensaje_id),
                            text: contentRaw,
                            timestamp: m.fecha_envio,
                            sender: {
                                id: isSystemProposal ? 'system' : String(m.usuario?.user_id || m.usuario_id),
                                name: isSystemProposal ? 'Sistema' : (m.usuario?.nombre || 'Usuario'),
                                lastName: isSystemProposal ? '' : (m.usuario?.apellido || ''),
                                avatar: isSystemProposal ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+' : (m.usuario?.foto_perfil || undefined)
                            },
                            type: isSystemProposal ? 'system' : (m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text'),
                            metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
                        }
                    })
                    .sort((a, b) => Number(a.id) - Number(b.id))
                
                console.log('💬 [InteractionDetail] Mensajes transformados:', {
                    count: messages.length,
                    firstMessage: messages[0],
                    lastMessage: messages[messages.length - 1]
                })
                
                // Actualizar interacción con mensajes frescos
                setInteraction(prev => {
                    if (!prev) return null
                    return {
                        ...prev,
                        messages: messages
                    }
                })
                
                // Scroll automático al final
                setTimeout(() => {
                    const messagesContainer = document.querySelector('.messages-container')
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight
                    }
                }, 100)
                
            } catch (error) {
                if (error.name === 'AbortError') {
                } else {
                    console.error('❌ [InteractionDetail] Error cargando mensajes:', error)
                }
            }
        }
        
        if (interaction?.chatId) {
            loadMessages()
        }
    }, [interaction?.chatId, currentUserId])

    // Configurar canal realtime para recibir mensajes en tiempo real
    useEffect(() => {
        // Limpiar canal anterior
        if (realtimeChannel) {
            supabase.removeChannel(realtimeChannel)
            setRealtimeChannel(null)
        }

        const chatIdString = interaction?.chatId
        const chatIdNumber = Number(chatIdString)
        
        if (!chatIdString || !chatIdNumber || isNaN(chatIdNumber) || !currentUserId) {
            console.log('⚠️ [InteractionDetail] No hay chatId válido o currentUserId para realtime:', {
                chatIdString,
                chatIdNumber,
                currentUserId
            })
            return
        }


        // Crear canal realtime
        const channel = supabase
            .channel(`chat_${chatIdNumber}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'mensaje',
                filter: `chat_id=eq.${chatIdNumber}`
            }, (payload: any) => {
                
                const m = payload.new
                if (!m) return

                const messageId = String(m.mensaje_id)
                
                // No procesar nuestros propios mensajes (ya los mostramos optimísticamente)
                if (String(m.usuario_id) === currentUserId) {
                    return
                }

                // Verificar si el mensaje ya existe
                const messageExists = interaction?.messages.some(msg => msg.id === messageId)
                if (messageExists) {
                    return
                }

                // Verificar si el mensaje es muy reciente (menos de 5 segundos) para evitar duplicados
                const messageTime = new Date(m.fecha_envio).getTime()
                const now = Date.now()
                if (now - messageTime < 5000) {
                    return
                }

                // Obtener información del usuario que envía el mensaje
                const getSenderInfo = async () => {
                    try {
                        const { data: userData, error: userError } = await supabase
                            .from('usuario')
                            .select('user_id, nombre, apellido, foto_perfil')
                            .eq('user_id', m.usuario_id)
                            .single()

                        if (userError) {
                            console.error('❌ [InteractionDetail] Error obteniendo info del usuario:', userError)
                            return {
                                id: String(m.usuario_id),
                                name: 'Usuario',
                                lastName: '',
                                avatar: undefined
                            }
                        }

                        return {
                            id: String(userData.user_id),
                            name: userData.nombre || 'Usuario',
                            lastName: userData.apellido || '',
                            avatar: userData.foto_perfil || undefined
                        }
                    } catch (error) {
                        console.error('❌ [InteractionDetail] Error obteniendo info del usuario:', error)
                        return {
                            id: String(m.usuario_id),
                            name: 'Usuario',
                            lastName: '',
                            avatar: undefined
                        }
                    }
                }

                // Crear mensaje con información del usuario
                getSenderInfo().then(senderInfo => {
                    // Detectar mensajes del sistema de propuestas (igual que ChatModule)
                    let contentRaw = m.contenido || ''
                    const isSystemProposal = typeof contentRaw === 'string' && contentRaw.startsWith('[system_proposal]')
                    if (isSystemProposal) {
                        contentRaw = contentRaw.replace('[system_proposal]', '📝').trim()
                    }

                    const incomingMessage: Message = {
                        id: messageId,
                        text: contentRaw,
                        timestamp: m.fecha_envio,
                        sender: isSystemProposal ? {
                            id: 'system',
                            name: 'Sistema',
                            lastName: '',
                            avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
                        } : senderInfo,
                        type: isSystemProposal ? 'system' : (m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text'),
                        metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
                    }


                    // Actualizar interacción con el nuevo mensaje
                    setInteraction(prev => {
                        if (!prev) return null
                        const updatedMessages = [...prev.messages, incomingMessage]
                            .sort((a, b) => Number(a.id) - Number(b.id)) // Mantener orden correcto
                        return {
                            ...prev,
                            messages: updatedMessages
                        }
                    })

                    // Scroll automático al final
                    setTimeout(() => {
                        const messagesContainer = document.querySelector('.messages-container')
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight
                        }
                    }, 100)
                }).catch(error => {
                    console.error('❌ [InteractionDetail] Error obteniendo info del usuario para mensaje realtime:', error)
                    
                    // Crear mensaje con información básica como fallback
                    const fallbackMessage: Message = {
                        id: messageId,
                        text: m.contenido || '',
                        timestamp: m.fecha_envio,
                        sender: {
                            id: String(m.usuario_id),
                            name: 'Usuario',
                            lastName: '',
                            avatar: undefined
                        },
                        type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
                        metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
                    }


                    // Actualizar interacción con el mensaje fallback
                    setInteraction(prev => {
                        if (!prev) return null
                        const updatedMessages = [...prev.messages, fallbackMessage]
                            .sort((a, b) => Number(a.id) - Number(b.id))
                        return {
                            ...prev,
                            messages: updatedMessages
                        }
                    })

                    // Scroll automático al final
                    setTimeout(() => {
                        const messagesContainer = document.querySelector('.messages-container')
                        if (messagesContainer) {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight
                        }
                    }, 100)
                })
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ [InteractionDetail] Error en canal realtime para chat:', chatIdNumber)
                } else if (status === 'TIMED_OUT') {
                    console.error('❌ [InteractionDetail] Timeout en canal realtime para chat:', chatIdNumber)
                } else if (status === 'CLOSED') {
                }
            })

        setRealtimeChannel(channel)

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
            setRealtimeChannel(null)
        }
    }, [interaction?.chatId, currentUserId])

    // Sistema de polling como respaldo para mensajes (como en ChatModule)
    useEffect(() => {
        if (!interaction?.chatId || !currentUserId) return

        const chatId = Number(interaction.chatId)
        let lastMessageId = interaction.messages.length > 0 
            ? Number(interaction.messages[interaction.messages.length - 1].id)
            : 0

        const pollForNewMessages = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
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
                                
                                // No procesar nuestros propios mensajes
                                if (String(m.usuario_id) === currentUserId) {
                                    return false
                                }
                                
                                // Solo mensajes más nuevos que el último
                                if (messageId <= lastMessageId) {
                                    return false
                                }
                                
                                // Verificar si el mensaje ya existe en el estado actual
                                const messageExists = interaction?.messages.some(msg => msg.id === String(messageId))
                                if (messageExists) {
                                    return false
                                }
                                
                                return true
                            })
                            .map((m: any) => ({
                                id: String(m.mensaje_id),
                                text: m.contenido || '',
                                timestamp: m.fecha_envio,
                                sender: {
                                    id: String(m.usuario?.user_id || m.usuario_id),
                                    name: m.usuario?.nombre || 'Usuario',
                                    lastName: m.usuario?.apellido || '',
                                    avatar: m.usuario?.foto_perfil || undefined
                                },
                                type: m.tipo === 'imagen' ? 'image' : m.tipo === 'ubicacion' ? 'location' : 'text',
                                metadata: m.archivo_url ? { imageUrl: m.archivo_url } : undefined
                            }))

                        if (transformedMessages.length > 0) {
                            
                            setInteraction(prev => {
                                if (!prev) return null
                                let updatedMessages = prev.messages
                                // Agregar cada mensaje individualmente para evitar duplicados
                                transformedMessages.forEach(msg => {
                                    const exists = updatedMessages.some(existingMsg => existingMsg.id === msg.id)
                                    if (!exists) {
                                        updatedMessages = [...updatedMessages, msg]
                                    }
                                })
                                return {
                                    ...prev,
                                    messages: updatedMessages.sort((a, b) => Number(a.id) - Number(b.id))
                                }
                            })

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
    }, [interaction?.chatId, currentUserId])

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'exchange':
                return <GiftIcon className="w-5 h-5" />
            case 'purchase':
                return <CurrencyDollarIcon className="w-5 h-5" />
            case 'donation':
                return <HeartIcon className="w-5 h-5" />
            case 'collaboration':
                return <UserIcon className="w-5 h-5" />
            default:
                return <TagIcon className="w-5 h-5" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'exchange':
                return 'Intercambio'
            case 'purchase':
                return 'Compra'
            case 'donation':
                return 'Donación'
            case 'collaboration':
                return 'Colaboración'
            default:
                return type
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pendiente'
            case 'in_progress':
                return 'En Progreso'
            case 'completed':
                return 'Completada'
            case 'cancelled':
                return 'Cancelada'
            default:
                return status
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'in_progress':
                return 'bg-blue-100 text-blue-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'cancelled':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getProposalStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'accepted':
                return 'bg-green-100 text-green-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            case 'counter':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getDeliveryStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'confirmed':
                return 'bg-blue-100 text-blue-800'
            case 'in_progress':
                return 'bg-purple-100 text-purple-800'
            case 'completed':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    // Función para verificar si ya hay un intercambio aceptado
    const hasAcceptedExchange = () => {
        if (!interaction?.proposals) return false
        return interaction.proposals.some(proposal => proposal.status === 'aceptada')
    }

    // Función para obtener texto del tipo de propuesta (igual que ChatModule)
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

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !interaction || !currentUserId) {
            console.log('❌ Validación fallida:', {
                hasMessage: !!newMessage.trim(),
                hasInteraction: !!interaction,
                hasCurrentUserId: !!currentUserId,
                chatId: interaction?.chatId
            })
            return
        }

        const messageContent = newMessage.trim()
        const chatIdNumber = Number(interaction.chatId)
        
        if (!chatIdNumber || isNaN(chatIdNumber)) {
            console.error('❌ chatId inválido:', interaction.chatId)
            alert('Error: ID de chat inválido')
            return
        }


        const tempId = `temp-${Date.now()}-${Math.random()}`
        const now = new Date()
        
        // Crear mensaje optimístico
        const optimisticMessage: Message = {
            id: tempId,
            text: messageContent,
            timestamp: now.toISOString(),
            sender: {
                id: currentUserId,
                name: 'Tú',
                lastName: '',
                avatar: undefined
            },
            type: 'text'
        }

        // Limpiar input inmediatamente para mejor UX
        setNewMessage('')

        // Actualizar UI optimísticamente - INMEDIATO
        setInteraction(prev => {
            if (!prev) return null
            const updatedMessages = [...prev.messages, optimisticMessage]
                .sort((a, b) => Number(a.id) - Number(b.id))
            return {
                ...prev,
                messages: updatedMessages
            }
        })

        // Scroll inmediato al final
        requestAnimationFrame(() => {
            const messagesContainer = document.querySelector('.messages-container')
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
        })

        // Enviar al servidor en background
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) {
                console.error('❌ [InteractionDetail] No hay token de sesión')
                return
            }

            
            // Usar AbortController para timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos timeout
            
            const res = await fetch(`/api/chat/${chatIdNumber}/messages`, {
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
            const realMessage: Message = {
                id: String(json.message.mensaje_id),
                text: json.message.contenido || '',
                timestamp: json.message.fecha_envio,
                sender: optimisticMessage.sender,
                type: 'text'
            }
            
            // Actualizar con el mensaje real del servidor
            setInteraction(prev => prev ? {
                ...prev,
                messages: prev.messages.map(msg => 
                    msg.id === tempId ? realMessage : msg
                ).sort((a, b) => Number(a.id) - Number(b.id)),
            } : prev)
            
        } catch (error) {
            console.error('❌ [InteractionDetail] Error enviando mensaje:', error)
            
            // Remover mensaje temporal en caso de error
            setInteraction(prev => prev ? {
                ...prev,
                messages: prev.messages.filter(msg => msg.id !== tempId)
            } : prev)
            
            // Restaurar mensaje en el input
            setNewMessage(messageContent)
            
            // Mostrar error solo si no es un timeout
            if (error.name !== 'AbortError') {
                alert('Error: No se pudo enviar el mensaje. Verifica tu conexión e inténtalo de nuevo.')
            }
        }
    }

    const handleCancelInteraction = () => {
        if (!interaction) return

        setInteraction(prev => prev ? {
            ...prev,
            status: 'cancelled'
        } : null)
        setShowCancelModal(false)
    }

    const handleCreateProposal = async () => {
        if (!interaction?.chatId || !newProposalDescription.trim()) {
            setShowNewProposalModal(false)
            return
        }
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new Error('No autenticado')
            const chatIdNum = Number(interaction.chatId)
            const res = await fetch(`/api/chat/${chatIdNum}/proposals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ type: 'otro', description: newProposalDescription.trim() })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error creando propuesta')
            const created = json.data
            // Prepend nueva propuesta
            setInteraction(prev => prev ? {
                ...prev,
                proposals: [
                    {
                        id: String(created.id),
                        type: created.type,
                        status: created.status,
                        description: created.description,
                        proposedPrice: created.proposedPrice || undefined,
                        createdAt: created.createdAt,
                        meetingDate: created.meetingDate,
                        meetingPlace: created.meetingPlace,
                        response: created.response
                    },
                    ...prev.proposals
                ]
            } : prev)

            // Crear mensaje del sistema sobre la nueva propuesta
            const systemMessage: Message = {
                id: `system-proposal-${created.id}-${Date.now()}`,
                text: `📝 Nueva propuesta enviada: ${created.description}`,
                timestamp: new Date().toISOString(),
                sender: {
                    id: 'system',
                    name: 'Sistema',
                    avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
                },
                type: 'system'
            }

            // Agregar mensaje del sistema al chat
            setInteraction(prev => prev ? {
                ...prev,
                messages: [...prev.messages, systemMessage].sort((a, b) => Number(a.id) - Number(b.id))
            } : prev)
        } catch (e) {
            alert('No se pudo crear la propuesta')
        } finally {
            setNewProposalDescription('')
            setShowNewProposalModal(false)
        }
    }

    const handleRespondProposal = async (proposalId: string, action: 'aceptar' | 'rechazar', reason?: string) => {
        if (!interaction?.chatId) return

        // Si es aceptar, mostrar flujo especial
        if (action === 'aceptar') {
            await handleAcceptProposal(proposalId)
            return
        }

        // Para rechazar, usar el flujo normal
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new Error('No autenticado')
            const chatIdNum = Number(interaction.chatId)
            const res = await fetch(`/api/chat/${chatIdNum}/proposals/${proposalId}/respond`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ response: action, reason })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error respondiendo propuesta')
            const updated = json.data
            setInteraction(prev => prev ? {
                ...prev,
                proposals: prev.proposals.map(p => p.id === String(updated.id) ? {
                    ...p,
                    status: updated.status,
                    response: updated.response,
                    createdAt: p.createdAt,
                    proposedPrice: updated.proposedPrice ?? p.proposedPrice
                } : p)
            } : prev)

            // Crear mensaje del sistema sobre el rechazo
            const systemMessage: Message = {
                id: `system-reject-${proposalId}-${Date.now()}`,
                text: `❌ Propuesta rechazada${reason ? `: ${reason}` : ''}`,
                timestamp: new Date().toISOString(),
                sender: {
                    id: 'system',
                    name: 'Sistema',
                    avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
                },
                type: 'system'
            }

            // Agregar mensaje del sistema al chat
            setInteraction(prev => prev ? {
                ...prev,
                messages: [...prev.messages, systemMessage].sort((a, b) => Number(a.id) - Number(b.id))
            } : prev)
        } catch (e: any) {
            alert(e?.message || 'No se pudo responder la propuesta')
        }
    }

    const handleAcceptProposal = async (proposalId: string) => {
        if (!interaction?.chatId) return

        const proposal = interaction.proposals.find(p => p.id === proposalId)
        if (!proposal) return

        try {
            // 1. Modal de confirmación de aceptación
            const confirmResult = await Swal.fire({
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
                const meetingResult = await Swal.fire({
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
                            Swal.showValidationMessage('Fecha, hora y lugar son requeridos')
                            return false
                        }

                        return { date, time, place, notes: notes || '' }
                    }
                })

                if (!meetingResult.isConfirmed) return
                meetingDetails = meetingResult.value
            }

            // 3. Mostrar loading
            Swal.fire({
                title: 'Procesando...',
                text: 'Aceptando propuesta y configurando intercambio',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            // 4. Enviar aceptación al servidor
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new Error('No hay token de sesión')

            const chatIdNum = Number(interaction.chatId)
            const responseData = await fetch(`/api/chat/${chatIdNum}/proposals/${proposalId}/respond`, {
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
            setInteraction(prev => prev ? {
                ...prev,
                proposals: prev.proposals.map(p => p.id === proposalId ? {
                    ...p,
                    status: data.data.status,
                    response: data.data.response,
                    meetingDate: meetingDetails?.date || p.meetingDate,
                    meetingPlace: meetingDetails?.place || p.meetingPlace
                } : p)
            } : prev)

            // 5.1. Crear mensaje del sistema sobre la aceptación
            const systemMessage: Message = {
                id: `system-accept-${proposalId}-${Date.now()}`,
                text: `✅ Propuesta aceptada. Intercambio iniciado. ${meetingDetails ? `Encuentro programado para ${meetingDetails.date} a las ${meetingDetails.time} en ${meetingDetails.place}` : ''}`,
                timestamp: new Date().toISOString(),
                sender: {
                    id: 'system',
                    name: 'Sistema',
                    avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'
                },
                type: 'system'
            }

            // Agregar mensaje del sistema al chat
            setInteraction(prev => prev ? {
                ...prev,
                messages: [...prev.messages, systemMessage].sort((a, b) => Number(a.id) - Number(b.id))
            } : prev)

            // 6. Mostrar confirmación final
            Swal.fire({
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
            Swal.fire({
                title: 'Error',
                text: 'No se pudo aceptar la propuesta. Inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'Entendido'
            })
        }
    }

    const handleUpdateInteractionStatus = async (
        status: 'aceptado' | 'rechazado' | 'cancelado' | 'completado',
        extra?: { rejectionReason?: string; meetingPlace?: string; meetingDate?: string; meetingTime?: string; meetingNotes?: string }
    ) => {
        if (!interaction) return
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) throw new Error('No autenticado')
            // Combinar fecha y hora si ambas existen
            const combinedMeetingDate = extra?.meetingDate && extra?.meetingTime
                ? `${extra.meetingDate}T${extra.meetingTime}`
                : extra?.meetingDate

            const res = await fetch(`/api/interactions/${interaction.id}/update-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    status,
                    rejectionReason: extra?.rejectionReason,
                    meetingPlace: extra?.meetingPlace,
                    meetingDate: combinedMeetingDate,
                    meetingNotes: extra?.meetingNotes
                })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error actualizando estado')
            // Mapear estados del backend al UI
            const mapStatus: any = { pendiente: 'pending', aceptado: 'in_progress', rechazado: 'cancelled', completado: 'completed', cancelado: 'cancelled' }
            setInteraction(prev => prev ? { ...prev, status: mapStatus[status] || prev.status, updatedAt: new Date().toISOString() } : prev)
        } catch (e: any) {
            alert(e?.message || 'No se pudo actualizar el estado')
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando detalles de la interacción...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/?m=interactions')}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    if (!interaction) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Interacción no encontrada</h2>
                    <p className="text-gray-600 mb-4">La interacción que buscas no existe o ha sido eliminada.</p>
                    <button
                        onClick={() => router.push('/?m=interactions')}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                           <button
                               onClick={() => router.push('/?m=interactions')}
                               className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                           >
                               <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                           </button>
                               <div>
                                   <h1 className="text-lg font-semibold text-gray-900">{interaction.title}</h1>
                               </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(interaction.status)}`}>
                                {getStatusLabel(interaction.status)}
                            </span>
                            {interaction.isUrgent && (
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    Urgente
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna principal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información general */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg bg-primary-100 text-primary-600`}>
                                        {getTypeIcon(interaction.type)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {getTypeLabel(interaction.type)}
                                        </h2>
                                        <p className="text-gray-600">{interaction.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Producto */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-medium text-gray-900 mb-3">Producto</h3>
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={interaction.product.image}
                                        alt={interaction.product.title}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{interaction.product.title}</h4>
                                        <p className="text-sm text-gray-600 mb-2">{interaction.product.description}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <span className="flex items-center space-x-1">
                                                <TagIcon className="w-4 h-4" />
                                                <span>{interaction.product.category}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <StarIcon className="w-4 h-4" />
                                                <span>{interaction.product.condition}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <CurrencyDollarIcon className="w-4 h-4" />
                                                <span>{interaction.product.price.toLocaleString()} {interaction.product.currency}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navegación de pestañas */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="border-b border-gray-200">
                                <nav className="flex space-x-8 px-6">
                                    {[
                                        { id: 'overview', name: 'Resumen', icon: EyeIcon },
                                        { id: 'messages', name: 'Mensajes', icon: ChatBubbleLeftRightIcon },
                                        { id: 'proposals', name: 'Propuestas', icon: HandThumbUpIcon },
                                        { id: 'delivery', name: 'Entrega', icon: TruckIcon }
                                    ].map((tab) => {
                                        const Icon = tab.icon
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as any)}
                                                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                                        ? 'border-primary-500 text-primary-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span>{tab.name}</span>
                                            </button>
                                        )
                                    })}
                                </nav>
                            </div>

                            <div className="p-6">
                                {(() => {
                                    const hasAccepted = (interaction?.proposals || []).some(p => p.status === 'aceptada')
                                    const hasPendingValidation = (interaction?.proposals || []).some(p => p.status === 'pendiente_validacion')
                                    
                                    // Verificar si el usuario actual ya validó el encuentro
                                    const userAlreadyValidated = interaction?.userValidations?.some(
                                        validation => validation.usuario_id === parseInt(currentUserId)
                                    ) || false
                                    
                                    // Si el usuario ya validó, no mostrar el mensaje de validación pendiente
                                    if (userAlreadyValidated) return null
                                    
                                    if (!hasAccepted && !hasPendingValidation) return null
                                    const first = (interaction?.proposals || []).find(p => p.status === 'pendiente_validacion') || (interaction?.proposals || []).find(p => p.status === 'aceptada')
                                    const intercambioId = interactionId
                                    return (
                                        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                            <div className="px-4 py-3 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-yellow-700 text-sm font-medium">⏳ Pendiente de Validación</span>
                                                    <span className="text-xs text-yellow-700 hidden sm:inline">Confirma si el encuentro fue exitoso para cerrar el intercambio</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const { data: { session } } = await supabase.auth.getSession()
                                                const token = session?.access_token
                                                if (!token) return
                                                // Determinar a quién vas a calificar: el otro usuario de la interacción
                                                const otherName = interaction?.otherUser?.name || 'Usuario'
                                                const otherAvatar = interaction?.otherUser?.avatar || '/default-avatar.png'
                                                const result = await (window as any).Swal.fire({
                                                    title: '¿El encuentro fue exitoso?',
                                                    allowOutsideClick: false,
                                                    allowEscapeKey: false,
                                                    html: `
                                                      <div class=\"text-left space-y-4\"> 
                                                        <div class=\"p-3 bg-blue-50 border border-blue-200 rounded-lg\"> 
                                                          <p class=\"text-sm text-blue-800\">Confirma el resultado y califica al otro usuario.</p>
                                                        </div>
                                                        <div class=\"flex items-center space-x-3\"> 
                                                          <img src=\"${otherAvatar}\" alt=\"${otherName}\" class=\"w-10 h-10 rounded-full object-cover border\" />
                                                          <div>
                                                            <p class=\"text-sm text-gray-900 font-medium\">Vas a calificar a</p>
                                                            <p class=\"text-sm text-gray-700\">${otherName}</p>
                                                          </div>
                                                        </div>
                                                        <div>
                                                          <label class=\"block text-sm font-medium text-gray-700 mb-2\">Calificación <span class=\"text-red-500\">*</span></label>
                                                          <div class=\"flex space-x-2 mb-3\">
                                                            <button type=\"button\" class=\"star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50\" data-rating=\"1\">⭐</button>
                                                            <button type=\"button\" class=\"star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50\" data-rating=\"2\">⭐⭐</button>
                                                            <button type=\"button\" class=\"star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50\" data-rating=\"3\">⭐⭐⭐</button>
                                                            <button type=\"button\" class=\"star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50\" data-rating=\"4\">⭐⭐⭐⭐</button>
                                                            <button type=\"button\" class=\"star-rating px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50\" data-rating=\"5\">⭐⭐⭐⭐⭐</button>
                                                          </div>
                                                        </div>
                                                        <div>
                                                          <label class=\"block text-sm font-medium text-gray-700 mb-2\">Comentario (opcional)</label>
                                                          <textarea id=\"validation-comment\" class=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\" rows=\"3\" placeholder=\"¿Cómo fue tu experiencia?\"></textarea>
                                                        </div>
                                                        <div>
                                                          <label class=\"block text-sm font-medium text-gray-700 mb-2\">Aspectos destacados (opcional)</label>
                                                          <textarea id=\"validation-aspects\" class=\"w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\" rows=\"2\" placeholder=\"Puntualidad, estado del producto, etc.\"></textarea>
                                                        </div>
                                                      </div>
                                                    `,
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Fue exitoso',
                                                    cancelButtonText: 'No fue exitoso',
                                                    confirmButtonColor: '#10B981',
                                                    cancelButtonColor: '#EF4444',
                                                    didOpen: () => {
                                                        const starButtons = document.querySelectorAll('.star-rating')
                                                        let selectedRating = 0
                                                        starButtons.forEach((btn, idx) => {
                                                            btn.addEventListener('click', () => {
                                                                selectedRating = idx + 1
                                                                starButtons.forEach((b, i) => {
                                                                    if (i < selectedRating) { b.classList.add('bg-yellow-100','border-yellow-400'); b.classList.remove('border-gray-300') }
                                                                    else { b.classList.remove('bg-yellow-100','border-yellow-400'); b.classList.add('border-gray-300') }
                                                                })
                                                            })
                                                        })
                                                    },
                                                    preConfirm: () => {
                                                        const comment = (document.getElementById('validation-comment') as HTMLTextAreaElement)?.value
                                                        const aspects = (document.getElementById('validation-aspects') as HTMLTextAreaElement)?.value
                                                        const rated = Array.from(document.querySelectorAll('.star-rating.bg-yellow-100')).length
                                                        
                                                        // Validar que la calificación sea obligatoria
                                                        if (rated === 0) {
                                                            (window as any).Swal.showValidationMessage('La calificación es obligatoria')
                                                            return false
                                                        }
                                                        
                                                        return { isValid: true, rating: rated, comment: comment || null, aspects: aspects || null }
                                                    }
                                                })
                                                if (result.isConfirmed) {
                                                    // Enviar validación usando el mismo endpoint que ChatModule
                                                    const response = await fetch(`/api/intercambios/${Number(intercambioId)}/validate`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                        body: JSON.stringify({
                                                            userId: currentUserId,
                                                            isValid: true,
                                                            rating: result.value.rating,
                                                            comment: result.value.comment,
                                                            aspects: result.value.aspects
                                                        })
                                                    })

                                                    if (response.ok) {
                                                        const data = await response.json()
                                                        
                                                        // Mostrar mensaje de éxito
                                                        await (window as any).Swal.fire({
                                                            title: '¡Validación Enviada!',
                                                            html: `
                                                                <div class="text-center space-y-3">
                                                                    <div class="text-6xl">✅</div>
                                                                    <p class="text-gray-700">Tu calificación ha sido registrada exitosamente.</p>
                                                                    ${data.data?.bothValidated ? 
                                                                        '<p class="text-sm text-green-600 font-medium">🎉 ¡El intercambio se ha completado! Ambos usuarios han confirmado.</p>' :
                                                                        '<p class="text-sm text-gray-600">Esperando confirmación del otro usuario...</p>'
                                                                    }
                                                                </div>
                                                            `,
                                                            confirmButtonText: 'Entendido',
                                                            confirmButtonColor: '#10B981',
                                                            width: '500px'
                                                        })
                                                    } else {
                                                        // Manejar error
                                                        const errorData = await response.json()
                                                        await (window as any).Swal.fire({
                                                            title: 'Error',
                                                            text: errorData.error || 'No se pudo validar el encuentro',
                                                            icon: 'error',
                                                            confirmButtonText: 'Entendido'
                                                        })
                                                        return
                                                    }
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
                                                        const failResponse = await fetch(`/api/intercambios/${Number(intercambioId)}/validate`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                            body: JSON.stringify({ 
                                                            userId: currentUserId,
                                                            isValid: false, 
                                                            comment: problem.value || null 
                                                        })
                                                        })
                                                        
                                                        if (failResponse.ok) {
                                                            // Mostrar mensaje de intercambio fallido
                                                            await (window as any).Swal.fire({
                                                                title: 'Intercambio Reportado',
                                                                html: `
                                                                    <div class="text-center space-y-3">
                                                                        <div class="text-6xl">⚠️</div>
                                                                        <p class="text-gray-700">Has reportado que el intercambio no fue exitoso.</p>
                                                                        <p class="text-sm text-gray-600">Los administradores revisarán tu reporte.</p>
                                                                    </div>
                                                                `,
                                                                confirmButtonText: 'Entendido',
                                                                confirmButtonColor: '#EF4444',
                                                                width: '500px'
                                                            })
                                                        }
                                                    }
                                                }
                                                
                                                // Actualizar el estado local sin recargar la página
                                                try {
                                                    // Recargar la interacción para obtener el estado actualizado
                                                    const updateResponse = await fetch(`/api/interactions/${interactionId}`)
                                                    if (updateResponse.ok) {
                                                        const updatedInteraction = await updateResponse.json()
                                                        setInteraction(updatedInteraction)
                                                        
                                                        // Mostrar mensaje de estado actualizado si es exitoso
                                                        if (result.isConfirmed) {
                                                            setTimeout(() => {
                                                                (window as any).Swal.fire({
                                                                    title: 'Estado Actualizado',
                                                                    text: 'La información de la interacción se ha actualizado correctamente.',
                                                                    icon: 'success',
                                                                    timer: 2000,
                                                                    showConfirmButton: false
                                                                })
                                                            }, 1000)
                                                        }
                                                    }
                                                } catch (error) {
                                                    console.error('Error al actualizar el estado:', error)
                                                    // Fallback: recargar la página si falla la actualización
                                                    window.location.reload()
                                                }
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
                                {/* Pestaña Resumen */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="font-medium text-gray-900">Información de la Interacción</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Tipo:</span>
                                                        <span className="font-medium">{getTypeLabel(interaction.type)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Estado:</span>
                                                        <span className={`font-medium ${getStatusColor(interaction.status)} px-2 py-1 rounded-full text-xs`}>
                                                            {getStatusLabel(interaction.status)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Creada:</span>
                                                        <span className="font-medium">{new Date(interaction.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Actualizada:</span>
                                                        <span className="font-medium">{new Date(interaction.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-medium text-gray-900">Estadísticas</h3>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Mensajes:</span>
                                                        <span className="font-medium">{interaction.messages.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Propuestas:</span>
                                                        <span className="font-medium">{interaction.proposals.length}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Entregas:</span>
                                                        <span className="font-medium">{interaction.deliveries.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Acciones rápidas */}
                                        <div className="border-t border-gray-200 pt-6">
                                            <h3 className="font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {/* Aceptar solo si el usuario actual es receptor */}
                                                {(currentUserId && (interaction as any).receiverId && currentUserId === (interaction as any).receiverId) && (
                                                <button onClick={() => setShowAcceptModal(true)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2">
                                                    <HandThumbUpIcon className="w-4 h-4" />
                                                    <span>Aceptar</span>
                                                </button>
                                                )}
                                                <button onClick={() => setShowRejectInteractionModal(true)} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2">
                                                    <HandThumbDownIcon className="w-4 h-4" />
                                                    <span>Rechazar</span>
                                                </button>
                                                <button
                                                    onClick={() => setShowCancelModal(true)}
                                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                    <span>Cancelar</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pestaña Mensajes */}
                                {activeTab === 'messages' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-900">Mensajes</h3>
                                            <span className="text-sm text-gray-500">{interaction.messages.length} mensajes</span>
                                        </div>

                                        <div className="space-y-4 max-h-96 overflow-y-auto messages-container">
                                            {interaction.messages.map((message) => {
                                                // Validar y proporcionar valores por defecto para el sender (como en ChatModule)
                                                const sender = message.sender || {
                                                    id: 'unknown',
                                                    name: 'Usuario',
                                                    lastName: '',
                                                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
                                                }
                                                
                                                // Determinar si es el usuario actual comparando con el ID real
                                                const isCurrentUser = currentUserId && sender.id === currentUserId
                                                
                                                // Detectar mensajes del sistema
                                                const isSystemMessage = message.type === 'system' || sender.id === 'system'
                                                
                                                // Renderizar mensaje del sistema de manera especial
                                                if (isSystemMessage) {
                                                    return (
                                                        <div key={message.id} className="flex justify-center mb-4">
                                                            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
                                                                <div className="flex items-center space-x-2">
                                                                    <img
                                                                        src={sender.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJjMS4xIDAgMiAuOSAyIDJzLS45IDItMiAyLTIgMC0yLTIgLjktMiAyLTJ6bTkgN3YtMmw2LS41VjlIMjF6bS0xOCAwaDZWNi41TDMgN1Y5em05IDEuNWMxLjY2IDAgMyAxLjM0IDMgM3YxLjVIOXYtMS41YzAtMS42NiAxLjM0LTMgMy0zem0tNC41IDZjMCAuODMuNjcgMS41IDEuNSAxLjVoOWMuODMgMCAxLjUtLjY3IDEuNS0xLjV2LTIuNUg3LjV2Mi41em0xMiAwYzAgLjgzLjY3IDEuNSAxLjUgMS41djJoLTJ2LTJoLTZ2MkgxNHYtMmgyem0tMTggMHYtMmgyVjE1SDNWMTMuNXptMTggMGMwLS44My0uNjctMS41LTEuNS0xLjVINmMtLjgzIDAtMS41LjY3LTEuNSAxLjV2Mi41SDN2LTJjMC0uODMuNjctMS41IDEuNS0xLjVoMTJjLjgzIDAgMS41LjY3IDEuNSAxLjV2MkgxOHptLTYtM2g2djJoLTZ2LTJ6IiBmaWxsPSIjMzMzIi8+PC9zdmc+'}
                                                                        alt="Avatar del Sistema"
                                                                        className="w-6 h-6 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                                                        onError={(e) => {
                                                                            const target = e.target as HTMLImageElement;
                                                                            target.style.display = 'none';
                                                                            const fallback = document.createElement('div');
                                                                            fallback.className = 'w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600 border border-gray-200 flex-shrink-0';
                                                                            fallback.textContent = 'S';
                                                                            target.parentNode?.insertBefore(fallback, target.nextSibling);
                                                                        }}
                                                                    />
                                                                    <div>
                                                                        <p className="text-sm font-medium text-blue-800">Sistema</p>
                                                                        <p className="text-sm text-blue-700">{message.text}</p>
                                                                        <p className="text-xs text-blue-600 mt-1">
                                                                            {message.timestamp ? new Date(message.timestamp).toLocaleString('es-CO', { 
                                                                                hour: '2-digit', 
                                                                                minute: '2-digit',
                                                                                day: '2-digit',
                                                                                month: '2-digit'
                                                                            }) : 'Sin fecha'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                
                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                                                    >
                                                        <div className={`flex items-end space-x-2 max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                            {!isCurrentUser && (
                                                                <img
                                                                    src={sender.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                                                                    alt={sender.name}
                                                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.style.display = 'none';
                                                                        const fallback = document.createElement('div');
                                                                        fallback.className = 'w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200 flex-shrink-0';
                                                                        fallback.textContent = sender.name.charAt(0).toUpperCase();
                                                                        target.parentNode?.insertBefore(fallback, target.nextSibling);
                                                                    }}
                                                                />
                                                            )}

                                                            <div className={`rounded-xl px-4 py-2 relative group shadow-sm ${isCurrentUser
                                                                ? 'bg-primary-600 text-white'
                                                                : 'bg-white text-gray-900 border border-gray-200'
                                                            }`}>
                                                                {/* Contenido del mensaje */}
                                                                {message.type === 'text' && (
                                                                    <p className="text-sm leading-relaxed">{message.text || 'Mensaje sin contenido'}</p>
                                                                )}

                                                                {message.type === 'image' && message.metadata?.imageUrl && (
                                                                    <div className="space-y-2">
                                                                        {message.text && message.text.trim() && (
                                                                            <p className="text-sm leading-relaxed">{message.text}</p>
                                                                        )}
                                                                        <img
                                                                            src={message.metadata.imageUrl}
                                                                            alt="Imagen del chat"
                                                                            className="rounded-lg max-w-32 max-h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-200"
                                                                            onClick={() => {
                                                                                // Aquí podrías abrir un modal de imagen si lo implementas
                                                                            }}
                                                                        />
                                                                    </div>
                                                                )}

                                                                {/* Timestamp y sender info */}
                                                                <div className={`flex items-center justify-between mt-1`}>
                                                                    <div className="flex items-center space-x-1">
                                                                        <span className={`text-xs ${isCurrentUser ? 'text-primary-100' : 'text-gray-500'}`}>
                                                                            {message.timestamp ? new Date(message.timestamp).toLocaleString('es-CO', { 
                                                                                hour: '2-digit', 
                                                                                minute: '2-digit',
                                                                                day: '2-digit',
                                                                                month: '2-digit'
                                                                            }) : 'Sin fecha'}
                                                                        </span>
                                                                        <span className={`text-xs ${isCurrentUser ? 'text-primary-200' : 'text-gray-400'}`}>
                                                                            • {sender.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Caja de entrada de mensajes */}
                                        <div className="mt-6 border-t pt-4">
                                            <div className="flex space-x-3">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                    placeholder="Escribe un mensaje..."
                                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleSendMessage()
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={handleSendMessage}
                                                    disabled={!newMessage.trim()}
                                                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Enviar
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                )}

                                       {/* Pestaña Propuestas */}
                                       {activeTab === 'proposals' && (
                                           <div className="space-y-4">
                                               <div className="flex items-center justify-between">
                                                   <h3 className="font-medium text-gray-900">Propuestas</h3>
                                                   <button
                                                       onClick={() => setShowNewProposalModal(true)}
                                                       className="bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                                                   >
                                                       Nueva Propuesta
                                                   </button>
                                               </div>

                                               {proposalsLoading && (
                                                   <div className="text-sm text-gray-500">Cargando propuestas...</div>
                                               )}
                                               {proposalsError && (
                                                   <div className="text-sm text-red-600">{proposalsError}</div>
                                               )}

                                               {interaction.proposals.length === 0 ? (
                                                   <div className="text-center py-8 text-gray-500">
                                                       <p className="text-sm">No hay propuestas en esta interacción</p>
                                                   </div>
                                               ) : (
                                                   <div className="space-y-3 max-h-60 overflow-y-auto">
                                                       {/* Indicador de intercambio aceptado */}
                                                       {hasAcceptedExchange() && (
                                                           <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                                               <div className="flex items-center space-x-2">
                                                                   <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                   </svg>
                                                                   <p className="text-sm font-medium text-green-800">
                                                                       Intercambio ya aceptado - Las nuevas propuestas están deshabilitadas
                                                                   </p>
                                                               </div>
                                                           </div>
                                                       )}
                                                       
                                                       {interaction.proposals.map((proposal) => (
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
                                                               
                                                               {/* Botones de acción para propuestas pendientes - Lógica igual que ChatModule */}
                                                               {proposal.status === 'pendiente' && (() => {
                                                                   const anyAccepted = interaction?.proposals?.some(p => p.status === 'aceptada')
                                                                   if (anyAccepted) return false
                                                                   
                                                                   const currentUserIdNum = currentUserId ? parseInt(currentUserId) : null
                                                                   const proposerId = proposal.proposer?.id
                                                                   
                                                                   // Si soy el receptor y la propuesta la envió otro usuario, puedo aceptar/rechazar
                                                                   if (currentUserIdNum && proposerId && proposerId !== currentUserIdNum) {
                                                                       return true
                                                                   }
                                                                   
                                                                   return false
                                                               })() && (
                                                                   <div className="flex space-x-2 mt-3">
                                                                       <button
                                                                           onClick={() => handleRespondProposal(proposal.id, 'aceptar')}
                                                                           disabled={hasAcceptedExchange()}
                                                                           className={`px-3 py-1 text-xs rounded ${
                                                                               hasAcceptedExchange() 
                                                                                   ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                                                   : 'bg-green-600 text-white hover:bg-green-700'
                                                                           }`}
                                                                           title={hasAcceptedExchange() ? 'Ya hay un intercambio aceptado' : ''}
                                                                       >
                                                                           Aceptar
                                                                       </button>
                                                                       <button
                                                                            onClick={() => { setSelectedProposalId(proposal.id); setShowRejectProposalModal(true) }}
                                                                            disabled={hasAcceptedExchange()}
                                                                            className={`px-3 py-1 text-xs rounded ${
                                                                                hasAcceptedExchange() 
                                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                                                    : 'bg-red-600 text-white hover:bg-red-700'
                                                                            }`}
                                                                            title={hasAcceptedExchange() ? 'Ya hay un intercambio aceptado' : ''}
                                                                       >
                                                                           Rechazar
                                                                       </button>
                                                                   </div>
                                                               )}
                                                           </div>
                                                       ))}
                                                   </div>
                                               )}
                                           </div>
                                       )}

                                {/* Pestaña Entrega */}
                                {activeTab === 'delivery' && (
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-gray-900">Información de Entrega</h3>

                                        <div className="space-y-4">
                                            {interaction.deliveries.map((delivery) => (
                                                <div key={delivery.id} className="border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(delivery.status)}`}>
                                                            {delivery.status === 'pending' ? 'Pendiente' :
                                                                delivery.status === 'confirmed' ? 'Confirmada' :
                                                                    delivery.status === 'in_progress' ? 'En Progreso' :
                                                                        delivery.status === 'completed' ? 'Completada' : delivery.status}
                                                        </span>
                                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                            <CalendarIcon className="w-4 h-4" />
                                                            <span>{delivery.date} - {delivery.time}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-center space-x-2">
                                                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                                                            <span className="text-gray-900">{delivery.location}</span>
                                                        </div>

                                                        {delivery.contactPhone && (
                                                            <div className="flex items-center space-x-2">
                                                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-900">{delivery.contactPhone}</span>
                                                            </div>
                                                        )}

                                                        {delivery.notes && (
                                                            <div className="text-sm text-gray-600">
                                                                <strong>Notas:</strong> {delivery.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Barra lateral */}
                    <div className="space-y-6">
                        {/* Información del usuario */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="font-medium text-gray-900 mb-4">Usuario</h3>
                            <div className="flex items-center space-x-3 mb-4">
                                <img
                                    src={interaction.otherUser.avatar}
                                    alt={interaction.otherUser.name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <h4 className="font-medium text-gray-900">{interaction.otherUser.name}</h4>
                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                        <StarIcon className="w-4 h-4 text-yellow-400" />
                                        <span>{interaction.otherUser.rating}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center space-x-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-900">{interaction.otherUser.location}</span>
                                </div>

                                {interaction.otherUser.phone && (
                                    <div className="flex items-center space-x-2">
                                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{interaction.otherUser.phone}</span>
                                    </div>
                                )}

                                {interaction.otherUser.email && (
                                    <div className="flex items-center space-x-2">
                                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{interaction.otherUser.email}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mt-4">
                                <button className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    <span>Contactar</span>
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="font-medium text-gray-900 mb-4">Timeline</h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Interacción creada</p>
                                        <p className="text-xs text-gray-500">{new Date(interaction.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {interaction.proposals.length > 0 && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Propuesta enviada</p>
                                            <p className="text-xs text-gray-500">{new Date(interaction.proposals[0].createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                {interaction.deliveries.length > 0 && (
                                    <div className="flex items-start space-x-3">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Entrega coordinada</p>
                                            <p className="text-xs text-gray-500">{new Date(interaction.deliveries[0].date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Última actualización</p>
                                        <p className="text-xs text-gray-500">{new Date(interaction.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de cancelación */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Cancelar Interacción</h3>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que quieres cancelar esta interacción? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCancelInteraction}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Sí, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de nueva propuesta */}
            {showNewProposalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Nueva Propuesta</h3>
                        <p className="text-gray-600 mb-6">
                            Crea una nueva propuesta para esta interacción.
                        </p>
                        <div className="space-y-4">
                            <textarea
                                placeholder="Describe tu propuesta..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={4}
                                value={newProposalDescription}
                                onChange={(e) => setNewProposalDescription(e.target.value)}
                            />
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowNewProposalModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateProposal}
                                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de aceptar (configurar ubicación/fecha/hora) */}
            {showAcceptModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar aceptación</h3>
                        <p className="text-gray-600 mb-4">Configura el lugar y la fecha del encuentro.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lugar de encuentro</label>
                                <input value={meetingPlace} onChange={(e) => setMeetingPlace(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Ej: Centro Comercial ..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Fecha</label>
                                    <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-700 mb-1">Hora</label>
                                    <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Notas</label>
                                <textarea value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Notas adicionales (opcional)" />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowAcceptModal(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button onClick={async () => {
                                await handleUpdateInteractionStatus('aceptado', { meetingPlace, meetingDate, meetingTime, meetingNotes })
                                setShowAcceptModal(false)
                                setMeetingPlace(''); setMeetingDate(''); setMeetingTime(''); setMeetingNotes('')
                            }} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de rechazo de interacción */}
            {showRejectInteractionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Rechazar interacción</h3>
                        <p className="text-gray-600 mb-4">Indica el motivo del rechazo.</p>
                        <textarea value={rejectInteractionReason} onChange={(e) => setRejectInteractionReason(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Motivo del rechazo" />
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowRejectInteractionModal(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button onClick={async () => {
                                if (!rejectInteractionReason.trim()) return
                                await handleUpdateInteractionStatus('rechazado', { rejectionReason: rejectInteractionReason.trim() })
                                setShowRejectInteractionModal(false)
                                setRejectInteractionReason('')
                            }} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de rechazo de propuesta */}
            {showRejectProposalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Rechazar propuesta</h3>
                        <p className="text-gray-600 mb-4">Indica el motivo del rechazo de la propuesta.</p>
                        <textarea value={rejectProposalReason} onChange={(e) => setRejectProposalReason(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Motivo del rechazo" />
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => { setShowRejectProposalModal(false); setRejectProposalReason(''); setSelectedProposalId(null) }} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button onClick={async () => {
                                if (!rejectProposalReason.trim() || !selectedProposalId) return
                                await handleRespondProposal(selectedProposalId, 'rechazar', rejectProposalReason.trim())
                                setShowRejectProposalModal(false)
                                setRejectProposalReason('')
                                setSelectedProposalId(null)
                            }} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

