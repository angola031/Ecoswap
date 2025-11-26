'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSupabaseClient } from '@/lib/supabase-client'
import {
    UserIcon,
    MapPinIcon,
    CalendarIcon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    StarIcon,
    HeartIcon,
    ChatBubbleLeftRightIcon,
    EyeIcon,
    PencilIcon,
    CameraIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    BellIcon,
    BookmarkIcon,
    CheckCircleIcon,
    ClockIcon,
    InformationCircleIcon,
    CheckIcon,
    QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { uploadUserProfileImage } from '@/lib/storage'
import Avatar from '@/components/ui/Avatar'
import FoundationBadge, { FoundationBadgeTooltip } from '@/components/foundation/FoundationBadge'
import EventsManager from '@/components/foundation/EventsManager'
import DocumentUploader from '@/components/foundation/DocumentUploader'

interface BadgeDetail {
    nombre: string
    icono?: string
    color?: string
}

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
}

interface ProfileModuleProps {
    currentUser: User | null
}

interface ProfileData {
    id: string
    name: string
    email: string
    phone: string
    avatar: string | null
    location: string
    bio: string
    joinDate: string
    rating: number
    totalReviews: number
    totalProducts: number
    totalExchanges: number
    totalViews: number
    badges: string[]
    socialLinks: {
        website?: string
        instagram?: string
        facebook?: string
        twitter?: string
    }
    // Datos de fundación
    es_fundacion?: boolean
    fundacion_verificada?: boolean
    nombre_fundacion?: string
    tipo_fundacion?: string
    nit_fundacion?: string
    descripcion_fundacion?: string
    pagina_web_fundacion?: string
    documento_fundacion?: string
    documentos_fundacion?: {
        acta_constitucion?: string
        estatutos?: string
        pre_rut?: string
        cartas_aceptacion?: string
        formulario_rues?: string
    }
}

interface UserProduct {
    id: string
    title: string
    image: string
    price: number
    currency: string
    status: string
    validationStatus: 'pending' | 'approved' | 'rejected'
    transactionType?: 'venta' | 'intercambio' | 'donacion' | 'mixto'
    views: number
    likes: number
    createdAt: string
    publicationState?: 'activo' | 'pausado' | 'intercambiado' | 'eliminado'
    hasSuccessfulExchange?: boolean
}

interface UserReview {
    id: string
    reviewerName: string
    reviewerAvatar: string | null
    rating: number
    comment: string
    date: string
    productTitle: string
    aspects?: string
    recommend?: boolean
    exchangeId?: string
}

interface UserActivity {
    id: string
    type: 'exchange' | 'product' | 'review' | 'login'
    title: string
    description: string
    date: string
    icon: string
    imagen_producto?: string
}

export default function ProfileModule({ currentUser }: ProfileModuleProps) {
    const router = useRouter()
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [userProducts, setUserProducts] = useState<UserProduct[]>([])
    const [userReviews, setUserReviews] = useState<UserReview[]>([])
    const [userActivities, setUserActivities] = useState<UserActivity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'verification' | 'events' | 'products' | 'reviews' | 'activities' | 'settings'>('overview')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [validationStatus, setValidationStatus] = useState<'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | null>(null)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)
    const [badgesDetail, setBadgesDetail] = useState<BadgeDetail[]>([])
    const [showDocumentUpload, setShowDocumentUpload] = useState(false)
    const [documentFile, setDocumentFile] = useState<File | null>(null)
    const [documentUploading, setDocumentUploading] = useState(false)
    const [uploadMode, setUploadMode] = useState<'separated' | 'single'>('separated')

    // Función para subir documento de fundación (con tipo específico)
    const handleUploadDocument = async (documentType?: string) => {
        if (!documentFile || !currentUser) {
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Archivo no seleccionado',
                text: 'Por favor selecciona el archivo con la documentación de tu fundación'
            })
            return
        }

        // Validar tipo de archivo (solo PDFs e imágenes)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(documentFile.type)) {
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Tipo de archivo no válido',
                html: `
                    <p class="text-sm text-gray-600 mb-2">Solo se permiten archivos en formato:</p>
                    <ul class="text-xs text-left text-gray-700 bg-gray-50 rounded p-2">
                        <li>• PDF (recomendado)</li>
                        <li>• JPG/JPEG</li>
                        <li>• PNG</li>
                    </ul>
                `
            })
            return
        }

        // Validar tamaño (máximo 5MB)
        if (documentFile.size > 5 * 1024 * 1024) {
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Archivo muy grande',
                html: `
                    <p class="text-sm text-gray-600 mb-2">
                        El archivo no debe superar los <strong>5MB</strong>
                    </p>
                    <p class="text-xs text-gray-500 mt-2">
                        Tamaño actual: <strong>${(documentFile.size / 1024 / 1024).toFixed(2)} MB</strong>
                    </p>
                    <p class="text-xs text-gray-500 mt-2">
                        💡 Tip: Puedes comprimir el PDF en línea o reducir la calidad de las imágenes
                    </p>
                `
            })
            return
        }

        setDocumentUploading(true)

        try {
            const supabase = getSupabaseClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                throw new Error('No hay sesión activa')
            }

            // Crear nombre único para el archivo
            const fileExt = documentFile.name.split('.').pop()
            const fileName = `${currentUser.id}_fundacion_${Date.now()}.${fileExt}`
            const filePath = `fundaciones/${fileName}`

            // Subir archivo a Supabase Storage (bucket Ecoswap)
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('Ecoswap')
                .upload(filePath, documentFile)

            if (uploadError) {
                throw uploadError
            }

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('Ecoswap')
                .getPublicUrl(filePath)

            // Si hay tipo específico, actualizar documentos_fundacion (JSONB)
            if (documentType) {
                // Obtener documentos actuales
                const { data: currentData } = await supabase
                    .from('usuario')
                    .select('documentos_fundacion')
                    .eq('user_id', currentUser.id)
                    .single()

                const currentDocs = currentData?.documentos_fundacion || {}
                const updatedDocs = {
                    ...currentDocs,
                    [documentType]: publicUrl
                }

                const { error: updateError } = await supabase
                    .from('usuario')
                    .update({ documentos_fundacion: updatedDocs })
                    .eq('user_id', currentUser.id)

                if (updateError) {
                    throw updateError
                }

                // Actualizar estado local
                if (profileData) {
                    setProfileData({
                        ...profileData,
                        documentos_fundacion: updatedDocs
                    })
                }
            } else {
                // Fallback: actualizar documento_fundacion (campo legacy)
                const { error: updateError } = await supabase
                    .from('usuario')
                    .update({ documento_fundacion: publicUrl })
                    .eq('user_id', currentUser.id)

                if (updateError) {
                    throw updateError
                }

                // Actualizar estado local
                if (profileData) {
                    setProfileData({
                        ...profileData,
                        documento_fundacion: publicUrl
                    })
                }
            }

            // Notificar a los administradores que se subieron documentos
            try {
                const notifyResponse = await fetch('/api/foundation/notify-document', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })
                
                if (notifyResponse.ok) {
                    console.log('✅ Notificaciones enviadas a administradores')
                } else {
                    console.warn('⚠️ No se pudieron enviar notificaciones a administradores')
                }
            } catch (notifyError) {
                console.error('Error enviando notificaciones:', notifyError)
                // No fallar si las notificaciones fallan
            }

            await (window as any).Swal.fire({
                icon: 'success',
                title: '✅ Documentación subida',
                html: `
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Tu documentación ha sido subida exitosamente.
                    </p>
                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-3">
                        <p class="text-xs text-blue-800 dark:text-blue-200">
                            <strong>Próximo paso:</strong> Nuestro equipo revisará tu documentación de ESAL. 
                            Te notificaremos cuando tu fundación sea verificada.
                        </p>
                    </div>
                `,
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#10B981'
            })

            setShowDocumentUpload(false)
            setDocumentFile(null)

        } catch (error: any) {
            console.error('Error subiendo documento:', error)
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Error al subir documentación',
                html: `
                    <p class="text-sm text-gray-600 mb-2">
                        ${error.message || 'No se pudo subir la documentación.'}
                    </p>
                    <div class="bg-gray-50 dark:bg-gray-800 rounded p-2 mt-3">
                        <p class="text-xs text-gray-500">
                            Si el problema persiste, contacta a soporte con el siguiente código de error:
                        </p>
                        <p class="text-xs font-mono text-red-600 mt-1">${error.code || 'UPLOAD_ERROR'}</p>
                    </div>
                `
            })
        } finally {
            setDocumentUploading(false)
        }
    }

    const handlePublishProduct = async () => {
        // Verificar si el usuario está autenticado
        const { getCurrentUser } = await import('@/lib/auth')
        const user = await getCurrentUser()
        
        if (!user) {
            // Si no está autenticado, redirigir a la interfaz de login del AuthModule
            router.push(`/?returnUrl=${encodeURIComponent('/agregar-producto')}&auth=true`)
            return
        }

        // Si está autenticado, verificar si está verificado
        const { isUserVerified } = await import('@/lib/auth')
        const isVerified = await isUserVerified()
        
        if (!isVerified) {
            // Mostrar mensaje de verificación requerida
            const result = await (window as any).Swal.fire({
                title: 'Verificación Requerida',
                text: 'Por favor, primero verifica tu cuenta para poder publicar productos.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ir a Verificación',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3B82F6',
                cancelButtonColor: '#6B7280'
            })
            
            if (result.isConfirmed) {
                router.push('/verificacion-identidad')
            }
            return
        }

        // Si está verificado, redirigir a agregar producto
        router.push('/agregar-producto')
    }

    // Cargar datos del perfil desde Supabase
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true)

                const supabase = getSupabaseClient()
                if (!supabase) {
                    setProfileData(null)
                    setIsLoading(false)
                    return
                }
                
                const { data: { session } } = await supabase.auth.getSession()
                const email = session?.user?.email || currentUser?.email

                if (!email) {
                    setProfileData(null)
                    setIsLoading(false)
                    return
                }

                const { data: dbUser, error: userErr } = await supabase
                    .from('usuario')
                    .select('*')
                    .eq('email', email)
                    .single()

                if (userErr || !dbUser) {
                    setProfileData(null)
                    setIsLoading(false)
                    return
                }

                console.log('👤 Usuario de BD:', {
                    email: dbUser.email,
                    es_fundacion: dbUser.es_fundacion,
                    fundacion_verificada: dbUser.fundacion_verificada,
                    nombre_fundacion: dbUser.nombre_fundacion
                })

                const { data: location } = await supabase
                    .from('ubicacion')
                    .select('ciudad, departamento')
                    .eq('user_id', dbUser.user_id)
                    .eq('es_principal', true)
                    .single()

                // Estado de validación de identidad
                const { data: val } = await supabase
                    .from('validacion_usuario')
                    .select('estado, motivo_rechazo')
                    .eq('usuario_id', dbUser.user_id)
                    .eq('tipo_validacion', 'identidad')
                    .single()
                if (val) {
                    setValidationStatus(val.estado as any)
                    setRejectionReason(val.motivo_rechazo || null)
                } else {
                    setValidationStatus(null)
                    setRejectionReason(null)
                }

                // Insignias del usuario
                let badgeNames: string[] = []
                try {
                    const { data: userBadges } = await supabase
                        .from('usuario_insignia')
                        .select('insignia_id')
                        .eq('usuario_id', dbUser.user_id)

                    if (userBadges && userBadges.length > 0) {
                        const ids = userBadges.map((b: any) => b.insignia_id)
                        const { data: insignias } = await supabase
                            .from('insignia')
                            .select('nombre, icono, color')
                            .in('insignia_id', ids)
                        badgeNames = (insignias || []).map((i: any) => i.nombre)
                        setBadgesDetail((insignias || []).map((i: any) => ({ nombre: i.nombre, icono: i.icono, color: i.color })))
                    }
                } catch (_) {
                    // ignore badge fetch errors
                }

                const fullName = `${dbUser.nombre || ''} ${dbUser.apellido || ''}`.trim() || (dbUser.email || 'Usuario')
                const loc = location ? `${location.ciudad || ''}${location.departamento ? ', ' + location.departamento : ''}` : 'Colombia'
                const joinDate = dbUser.fecha_registro ? new Date(dbUser.fecha_registro).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }) : '—'

                const profile: ProfileData = {
                    id: String(dbUser.user_id),
                    name: fullName,
                    email: dbUser.email,
                    phone: dbUser.telefono || '',
                    avatar: dbUser.foto_perfil || null,
                    location: loc,
                    bio: dbUser.biografia || '',
                    joinDate,
                    rating: typeof dbUser.calificacion_promedio === 'number' ? dbUser.calificacion_promedio : 0,
                    totalReviews: 0,
                    totalProducts: typeof dbUser.total_productos === 'number' ? dbUser.total_productos : 0,
                    totalExchanges: typeof dbUser.total_intercambios === 'number' ? dbUser.total_intercambios : 0,
                    totalViews: 0,
                    badges: dbUser.verificado ? ['Verificado', ...badgeNames] : badgeNames,
                    socialLinks: {},
                    // Datos de fundación
                    es_fundacion: dbUser.es_fundacion || false,
                    fundacion_verificada: dbUser.fundacion_verificada || false,
                    nombre_fundacion: dbUser.nombre_fundacion || undefined,
                    tipo_fundacion: dbUser.tipo_fundacion || undefined,
                    nit_fundacion: dbUser.nit_fundacion || undefined,
                    descripcion_fundacion: dbUser.descripcion_fundacion || undefined,
                    pagina_web_fundacion: dbUser.pagina_web_fundacion || undefined,
                    documento_fundacion: dbUser.documento_fundacion || undefined,
                    documentos_fundacion: dbUser.documentos_fundacion || undefined
                }

                setProfileData(profile)
                console.log('📊 ProfileData cargado:', {
                    es_fundacion: profile.es_fundacion,
                    fundacion_verificada: profile.fundacion_verificada,
                    nombre_fundacion: profile.nombre_fundacion
                })

                // Cargar productos del usuario (incluye pendientes, aprobados y rechazados)
                const { data: productsData, error: productsError } = await supabase
                    .from('producto')
                    .select(`
                        producto_id,
                        titulo,
                        descripcion,
                        precio,
                        estado,
                        tipo_transaccion,
                        estado_validacion,
                        estado_publicacion,
                        fecha_creacion,
                        total_likes,
                        imagenes:imagen_producto(
                            url_imagen,
                            es_principal,
                            orden
                        ),
                        intercambios_ofrecidos:intercambio!intercambio_producto_ofrecido_id_fkey(
                            intercambio_id,
                            estado,
                            validacion_intercambio(
                                es_exitoso
                            )
                        ),
                        intercambios_solicitados:intercambio!intercambio_producto_solicitado_id_fkey(
                            intercambio_id,
                            estado,
                            validacion_intercambio(
                                es_exitoso
                            )
                        )
                    `)
                    .eq('user_id', dbUser.user_id)
                    .order('fecha_creacion', { ascending: false })

                if (productsError) {
                    // Si hay error, dejamos la lista vacía
                    console.warn('Perfil: error obteniendo productos del usuario', productsError)
                }

                const transformed: UserProduct[] = (productsData || []).map((p: any) => {
                    const principal = Array.isArray(p.imagenes)
                        ? [...p.imagenes].sort((a, b) => (a.es_principal === b.es_principal ? (a.orden || 0) - (b.orden || 0) : a.es_principal ? -1 : 1))[0]
                        : undefined

                    // Verificar si el producto tiene algún intercambio exitoso
                    const intercambiosOfrecidos = Array.isArray(p.intercambios_ofrecidos) ? p.intercambios_ofrecidos : []
                    const intercambiosSolicitados = Array.isArray(p.intercambios_solicitados) ? p.intercambios_solicitados : []
                    
                    const hasSuccessfulExchange = [
                        ...intercambiosOfrecidos,
                        ...intercambiosSolicitados
                    ].some((intercambio: any) => 
                        intercambio.estado === 'completado' || 
                        (intercambio.validacion_intercambio && intercambio.validacion_intercambio.some((v: any) => v.es_exitoso === true))
                    )

                    return {
                        id: String(p.producto_id),
                        title: p.titulo,
                        image: principal?.url_imagen || '/default-product.png',
                        price: p.precio || 0,
                        currency: 'COP',
                        status: hasSuccessfulExchange ? 'exchanged' : (p.estado === 'usado' || p.estado === 'nuevo' ? 'available' : 'available'),
                        validationStatus: (p.estado_validacion || 'pending') as 'pending' | 'approved' | 'rejected',
                        transactionType: p.tipo_transaccion || 'mixto',
                        views: 0,
                        likes: p.total_likes || 0,
                        createdAt: p.fecha_creacion || new Date().toISOString(),
                        publicationState: hasSuccessfulExchange ? 'intercambiado' : (p.estado_publicacion || 'activo') as any,
                        hasSuccessfulExchange
                    }
                })

                // Cargar reseñas del usuario desde la tabla calificacion
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('calificacion')
                    .select(`
                        calificacion_id,
                        puntuacion,
                        comentario,
                        aspectos_destacados,
                        recomendaria,
                        fecha_calificacion,
                        intercambio_id,
                        calificador:usuario!calificacion_calificador_id_fkey(
                            user_id,
                            nombre,
                            apellido,
                            foto_perfil
                        ),
                        intercambio:intercambio(
                            intercambio_id,
                            producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey(
                                titulo
                            ),
                            producto_solicitado:producto!intercambio_producto_solicitado_id_fkey(
                                titulo
                            )
                        )
                    `)
                    .eq('calificado_id', dbUser.user_id)
                    .eq('es_publica', true)
                    .order('fecha_calificacion', { ascending: false })

                // Transformar reseñas a formato esperado
                const transformedReviews: UserReview[] = reviewsData?.map((review: any) => ({
                    id: review.calificacion_id.toString(),
                    reviewerName: `${review.calificador?.nombre || ''} ${review.calificador?.apellido || ''}`.trim() || 'Usuario',
                    reviewerAvatar: review.calificador?.foto_perfil || null,
                    rating: review.puntuacion,
                    comment: review.comentario || '',
                    date: new Date(review.fecha_calificacion).toLocaleDateString('es-CO'),
                    productTitle: review.intercambio?.producto_ofrecido?.titulo || review.intercambio?.producto_solicitado?.titulo || 'Producto',
                    aspects: review.aspectos_destacados || '',
                    recommend: review.recomendaria || false,
                    exchangeId: review.intercambio_id?.toString()
                })) || []

                // Calcular intercambios únicos correctamente
                const { data: intercambiosData } = await supabase
                    .from('intercambio')
                    .select('intercambio_id')
                    .or(`usuario_propone_id.eq.${dbUser.user_id},usuario_recibe_id.eq.${dbUser.user_id}`)
                    .eq('estado', 'completado')

                // Eliminar duplicados usando un Set
                const intercambiosUnicos = new Set(intercambiosData?.map(i => i.intercambio_id) || [])
                const totalIntercambiosUnicos = intercambiosUnicos.size

                // Actualizar el perfil con el conteo correcto de intercambios
                setProfileData(prev => prev ? {
                    ...prev,
                    totalExchanges: totalIntercambiosUnicos,
                    totalReviews: transformedReviews.length
                } : null)

                // Cargar productos vistos del usuario
                try {
                    const response = await fetch(`/api/users/${dbUser.user_id}/activity`)
                    if (response.ok) {
                        const { data } = await response.json()
                        const productosVistos = data.productos_vistos || []
                        
                        // Convertir productos vistos a formato de actividades
                        const actividades: UserActivity[] = productosVistos.map((producto: any) => ({
                            id: `view-${producto.id}`,
                            title: `Viste el producto "${producto.titulo}"`,
                            description: `${producto.categoria} • ${producto.ubicacion.ciudad}`,
                            date: new Date(producto.fecha_visualizacion).toLocaleDateString('es-CO'),
                            icon: '👁️',
                            imagen_producto: producto.imagen_principal
                        }))
                        
                        setUserActivities(actividades)
                    } else {
                        setUserActivities([])
                    }
                } catch (error) {
                    console.error('Error cargando productos vistos:', error)
                    setUserActivities([])
                }

                setUserProducts(transformed)
                setUserReviews(transformedReviews)
                setIsLoading(false)
            } catch (e) {
                setIsLoading(false)
            }
        }

        loadProfileData()
    }, [currentUser?.email])

    // Función para abrir la página de editar perfil
    const openEditProfile = () => {
        router.push('/editar-perfil')
    }

    const formatPrice = (price: number, currency: string) => {
        if (currency === 'COP') {
            return `COP$ ${price.toLocaleString('es-CO')}`
        }
        return `${currency} ${price.toLocaleString()}`
    }

    const getStatusColor = (status: string) => {
        const colors = {
            available: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            exchanged: 'bg-blue-100 text-blue-800',
            sold: 'bg-gray-100 text-gray-800'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    const getStatusLabel = (status: string) => {
        const labels = {
            available: 'Disponible',
            pending: 'Pendiente',
            exchanged: 'Intercambiado',
            sold: 'Vendido'
        }
        return labels[status as keyof typeof labels] || status
    }

    // Acciones sobre productos: pausar/reanudar y eliminar
    const [pausingId, setPausingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const pauseOrResumeProduct = async (productId: string, pause: boolean) => {
        const supabase = getSupabaseClient()
        try {
            setPausingId(productId)
            const { error } = await supabase
                .from('producto')
                .update({ estado_publicacion: pause ? 'pausado' : 'activo', fecha_actualizacion: new Date().toISOString() })
                .eq('producto_id', Number(productId))
            if (error) throw error
            setUserProducts(prev => prev.map(p => p.id === productId ? { ...p } : p))
        } catch (_) {
            (window as any).Swal.fire({
                title: 'Error',
                text: 'No se pudo actualizar el estado de publicación',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            })
        } finally {
            setPausingId(null)
        }
    }

    const deleteProduct = async (productId: string) => {
        const supabase = getSupabaseClient()
        const yes = confirm('¿Seguro que deseas eliminar este producto y su publicación? Esta acción no se puede deshacer.')
        if (!yes) return
        try {
            setDeletingId(productId)
            // Intentar eliminar archivos del bucket de Storage bajo productos/user_{user_id}/{producto_id}/
            try {
                const { data: prodRow } = await supabase
                    .from('producto')
                    .select('user_id')
                    .eq('producto_id', Number(productId))
                    .single()
                const userIdForPath = (prodRow as any)?.user_id
                if (userIdForPath) {
                    const dir = `productos/user_${userIdForPath}/${productId}`
                    const { data: files } = await supabase.storage
                        .from('Ecoswap')
                        .list(dir, { limit: 1000, offset: 0 })
                    if (Array.isArray(files) && files.length > 0) {
                        const paths = files.map(f => `${dir}/${f.name}`)
                        await supabase.storage.from('Ecoswap').remove(paths)
                    }
                    // Intento de remover carpeta (no es obligatorio)
                    await supabase.storage.from('Ecoswap').remove([dir])
                }
            } catch (_) {
                // Continuar aun si falla limpieza de Storage
            }
            // Eliminar imágenes asociadas primero (por integridad visual en UI); en BD hay FK con ON DELETE no especificado, así que borramos manualmente.
            await supabase.from('imagen_producto').delete().eq('producto_id', Number(productId))
            // Eliminar relaciones normalizadas
            await supabase.from('producto_tag').delete().eq('producto_id', Number(productId))
            await supabase.from('producto_especificacion').delete().eq('producto_id', Number(productId))
            // Eliminar producto
            const { error } = await supabase.from('producto').delete().eq('producto_id', Number(productId))
            if (error) throw error
            setUserProducts(prev => prev.filter(p => p.id !== productId))
        } catch (_) {
            (window as any).Swal.fire({
                title: 'Error',
                text: 'No se pudo eliminar el producto',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            })
        } finally {
            setDeletingId(null)
        }
    }

    // Debug logging
    useEffect(() => {
        console.log('🔄 Renderizando ProfileModule - activeTab:', activeTab)
        console.log('📋 ProfileData:', profileData ? {
            es_fundacion: profileData.es_fundacion,
            fundacion_verificada: profileData.fundacion_verificada,
            nombre_fundacion: profileData.nombre_fundacion
        } : 'null')
    }, [activeTab, profileData])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!profileData) {
        return (
            <div className="text-center py-20">
                <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Perfil no encontrado</h3>
                <p className="text-gray-600 dark:text-gray-400">No se pudieron cargar los datos del perfil</p>
            </div>
        )
    }

    // Helper para evitar caché en imágenes de perfil
    const bust = (url: string | null) => url ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : null

    return (
        <div className="space-y-6">
            {/* Header del perfil */}
            <div className="card">
                <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                    {/* Avatar y foto */}
                    <div className="relative">
                        <Avatar
                            src={previewUrl || bust(profileData.avatar)}
                            alt={profileData.name}
                            size="xl"
                            className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32"
                        />
                        {profileData.badges?.includes('Verificado') && (
                            <span className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                            </span>
                        )}
                        <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors cursor-pointer">
                            <CameraIcon className="w-4 h-4" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0] || null
                                    setUploadError(null)
                                    setUploadSuccess(null)
                                    if (!file) { setSelectedFile(null); setPreviewUrl(''); return }
                                    // Convertir a WebP (max 400px, calidad 0.82)
                                    const convertToWebP = async (f: File): Promise<File> => {
                                        return new Promise((resolve, reject) => {
                                            const canvas = document.createElement('canvas')
                                            const ctx = canvas.getContext('2d')
                                            if (!ctx) { reject(new Error('Canvas no disponible')); return }
                                            const img = new Image()
                                            const url = URL.createObjectURL(f)
                                            img.onload = () => {
                                                try {
                                                    let w = img.width
                                                    let h = img.height
                                                    const max = 400
                                                    if (w > max || h > max) {
                                                        if (w > h) { h = (h / w) * max; w = max } else { w = (w / h) * max; h = max }
                                                    }
                                                    canvas.width = w
                                                    canvas.height = h
                                                    ctx.clearRect(0, 0, w, h)
                                                    ctx.drawImage(img, 0, 0, w, h)
                                                    URL.revokeObjectURL(url)
                                                    canvas.toBlob((blob) => {
                                                        if (!blob) { reject(new Error('No se pudo convertir a WebP')); return }
                                                        const webp = new File([blob], f.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })
                                                        resolve(webp)
                                                    }, 'image/webp', 0.82)
                                                } catch (err) {
                                                    URL.revokeObjectURL(url)
                                                    reject(err as any)
                                                }
                                            }
                                            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al cargar imagen')) }
                                            img.src = url
                                        })
                                    }
                                    try {
                                        const webp = await convertToWebP(file)
                                        setSelectedFile(webp)
                                        setPreviewUrl(URL.createObjectURL(webp))
                                    } catch (_) {
                                        setSelectedFile(file)
                                        const reader = new FileReader()
                                        reader.onload = () => setPreviewUrl(reader.result as string)
                                        reader.readAsDataURL(file)
                                    }
                                }}
                            />
                        </label>
                    </div>

                    {/* Información básica */}
                    <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center flex-wrap gap-2">
                                    {profileData.es_fundacion && profileData.nombre_fundacion ? profileData.nombre_fundacion : profileData.name}
                                    {profileData.badges?.includes('Verificado') && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                            <ShieldCheckIcon className="w-4 h-4 mr-1" /> Verificado
                                        </span>
                                    )}
                                    {profileData.es_fundacion && profileData.fundacion_verificada && (
                                        <FoundationBadgeTooltip>
                                            <FoundationBadge size="md" showText={false} />
                                        </FoundationBadgeTooltip>
                                    )}
                                </h1>
                                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    <div className="flex items-center space-x-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span>{profileData.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>Miembro desde {profileData.joinDate}</span>
                                    </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl text-sm sm:text-base">
                                    {profileData.bio}
                                </p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
                                <div className="flex gap-2 items-center flex-wrap">
                                    <button
                                        onClick={() => {
                                            console.log('🔍 Botón Verificar clickeado')
                                            console.log('🏛️ es_fundacion:', profileData.es_fundacion)
                                            console.log('📋 activeTab antes:', activeTab)
                                            
                                            if (profileData.es_fundacion) {
                                                // Para fundaciones, ir a la pestaña de Verificación
                                                console.log('✅ Cambiando a pestaña verification')
                                                setActiveTab('verification')
                                                // Hacer scroll hacia arriba para ver el contenido
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            } else {
                                                // Para usuarios normales, ir a verificación de identidad
                                                console.log('👤 Redirigiendo a verificación de identidad')
                                                router.push('/verificacion-identidad')
                                            }
                                        }}
                                        className={`${profileData.badges?.includes('Verificado') || profileData.fundacion_verificada ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'} px-3 py-2 rounded-md inline-flex items-center text-sm`}
                                    >
                                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
                                        {profileData.es_fundacion 
                                            ? (profileData.fundacion_verificada ? 'Fundación Verificada' : 'Verificar Fundación')
                                            : (profileData.badges?.includes('Verificado') ? 'Cuenta verificada' : 'Verificar cuenta')
                                        }
                                    </button>

                                    {/* Indicador de estado de validación */}
                                    {validationStatus && (
                                        <span className={`px-2 py-1 rounded text-xs ${validationStatus === 'aprobada' ? 'bg-green-100 text-green-700' : validationStatus === 'rechazada' ? 'bg-red-100 text-red-700' : validationStatus === 'en_revision' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {validationStatus === 'pendiente' && 'Validación pendiente'}
                                            {validationStatus === 'en_revision' && 'En revisión'}
                                            {validationStatus === 'aprobada' && 'Validación aprobada'}
                                            {validationStatus === 'rechazada' && 'Validación rechazada'}
                                        </span>
                                    )}

                                    {(validationStatus === 'pendiente' || validationStatus === 'rechazada') && (
                                        <button
                                            onClick={() => router.push('/verificacion-identidad')}
                                            className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
                                        >
                                            Volver a subir documentos
                                        </button>
                                    )}

                                    <button
                                        onClick={openEditProfile}
                                        className="btn-secondary text-sm"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Editar Perfil
                                    </button>
                                    <button className="btn-secondary text-sm">
                                        <Cog6ToothIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {selectedFile && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!selectedFile) return
                                                const supabase = getSupabaseClient()
                                                try {
                                                    setIsUploading(true)
                                                    setUploadError(null)
                                                    const userId = profileData.id

                                                    const { data } = await supabase.auth.getSession()
                                                    const token = data.session?.access_token
                                                    if (!token) {
                                                        setUploadError('No hay sesión activa')
                                                        setIsUploading(false)
                                                        return
                                                    }

                                                    const form = new FormData()
                                                    form.append('file', selectedFile)
                                                    form.append('userId', userId)

                                                    const resp = await fetch('/api/upload/profile', {
                                                        method: 'POST',
                                                        headers: { Authorization: `Bearer ${token}` },
                                                        body: form
                                                    })
                                                    let json: any = null
                                                    try { json = await resp.json() } catch {}
                                                    if (!resp.ok) {
                                                        const msg = json?.error || `Error ${resp.status}`
                                                        setUploadError(msg)
                                                        ;(window as any).Swal?.fire({ title: 'Error', text: msg, icon: 'error', confirmButtonText: 'Ok' })
                                                    } else {
                                                        const newUrl = json.publicUrl || ''
                                                        // cache busting para evitar CDN stale
                                                        const busted = newUrl ? `${newUrl}?t=${Date.now()}` : ''
                                                        setProfileData({ ...profileData, avatar: busted })
                                                        setUploadSuccess('Foto actualizada')
                                                        setSelectedFile(null)
                                                        setPreviewUrl('')
                                                        ;(window as any).Swal?.fire({ title: '¡Listo!', text: 'Tu foto de perfil fue actualizada.', icon: 'success', confirmButtonText: 'Aceptar', confirmButtonColor: '#10B981' })
                                                    }
                                                } catch (e: any) {
                                                    setUploadError(e.message || 'Error al subir')
                                                } finally {
                                                    setIsUploading(false)
                                                }
                                            }}
                                            className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? 'Subiendo...' : 'Guardar foto'}
                                        </button>
                                        <button
                                            onClick={() => { setSelectedFile(null); setPreviewUrl('') }}
                                            className="px-3 py-2 border border-gray-300 rounded-md"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mensajes de subida */}
                        {(uploadError || uploadSuccess || (validationStatus === 'rechazada' && rejectionReason)) && (
                            <div className="mt-3">
                                {uploadError && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{uploadError}</div>}
                                {uploadSuccess && <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">{uploadSuccess}</div>}
                                {validationStatus === 'rechazada' && rejectionReason && (
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">Motivo de rechazo: {rejectionReason}</div>
                                )}
                            </div>
                        )}

                        {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{profileData.rating}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Calificación</div>
                                <div className="flex items-center justify-center space-x-1 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.floor(profileData.rating)
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300 dark:text-gray-600'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{profileData.totalProducts}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Productos</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">{profileData.totalExchanges}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Intercambios</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{profileData.totalViews}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Visualizaciones</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insignias y Logros</h3>
                <div className="flex flex-wrap gap-2">
                    {(badgesDetail.length > 0 ? badgesDetail : profileData.badges.map((n) => ({ nombre: n }))).map((b: any, index: number) => {
                        const bg = b.color ? `${b.color}` : '#E5F0FF'
                        const text = '#0F172A'
                        return (
                            <span
                                key={index}
                                className="px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1"
                                style={{ backgroundColor: bg, color: text }}
                            >
                                {b.icono ? <span aria-hidden>{b.icono}</span> : <BookmarkIcon className="w-4 h-4" />}
                                {b.nombre}
                            </span>
                        )
                    })}
                </div>
            </div>

            {/* Navegación de pestañas */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-6 md:space-x-8 overflow-x-auto no-scrollbar -mx-4 px-4 whitespace-nowrap">
                    {[
                        { id: 'overview', name: 'Resumen', icon: UserIcon },
                        ...(profileData.es_fundacion ? [{ id: 'verification', name: 'Verificación', icon: ShieldCheckIcon }] : []),
                        ...(profileData.es_fundacion ? [{ id: 'events', name: 'Eventos', icon: CalendarIcon }] : []),
                        ...(!profileData.es_fundacion ? [{ id: 'products', name: 'Productos', icon: HeartIcon }] : []),
                        { id: 'reviews', name: 'Reseñas', icon: StarIcon },
                        { id: 'activities', name: 'Actividad', icon: EyeIcon },
                        { id: 'settings', name: 'Configuración', icon: Cog6ToothIcon }
                    ].map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm md:text-base transition-colors ${activeTab === tab.id
                                    ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                <span>{tab.name}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Contenido de las pestañas */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Pestaña Resumen */}
                {activeTab === 'overview' && (
                    <>
                        {/* Información de fundación */}
                        {profileData.es_fundacion && (
                            <div className="card mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
                                <div className="flex items-center space-x-3 mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🏛️ Información de Fundación</h3>
                                    {profileData.fundacion_verificada && (
                                        <FoundationBadge size="sm" showText={true} />
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre de la Fundación</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{profileData.nombre_fundacion}</p>
                                    </div>
                                    {profileData.tipo_fundacion && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Enfoque</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{profileData.tipo_fundacion}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Responsable</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{profileData.name}</p>
                                    </div>
                                    {!profileData.fundacion_verificada && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3 mt-3">
                                            <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                ⏳ Verificación pendiente
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información de contacto */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información de Contacto</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <EnvelopeIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{profileData.email}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <PhoneIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{profileData.phone}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPinIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <span className="text-gray-700 dark:text-gray-300">{profileData.location}</span>
                                </div>
                                {profileData.socialLinks.website && (
                                    <div className="flex items-center space-x-3">
                                        <GlobeAltIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                        <a
                                            href={profileData.socialLinks.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                        >
                                            {profileData.socialLinks.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enlaces sociales */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Redes Sociales</h3>
                            <div className="space-y-3">
                                {profileData.socialLinks.instagram && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-pink-600 dark:text-pink-400 text-lg">📷</span>
                                        <span className="text-gray-700 dark:text-gray-300">{profileData.socialLinks.instagram}</span>
                                    </div>
                                )}
                                {profileData.socialLinks.facebook && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-blue-600 dark:text-blue-400 text-lg">📘</span>
                                        <span className="text-gray-700 dark:text-gray-300">{profileData.socialLinks.facebook}</span>
                                    </div>
                                )}
                                {profileData.socialLinks.twitter && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-blue-400 dark:text-blue-300 text-lg">🐦</span>
                                        <span className="text-gray-700 dark:text-gray-300">{profileData.socialLinks.twitter}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </>
                )}

                {/* Pestaña Verificación (solo fundaciones) */}
                {activeTab === 'verification' && profileData.es_fundacion && (
                    <div className="space-y-6">
                        {/* Estado de Verificación */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Estado de Verificación
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Estado actual:</span>
                                    {(() => {
                                        // Verificar si hay documentos subidos
                                        const hasDocuments = !!(
                                            (profileData as any).documento_fundacion || 
                                            (profileData as any).documentos_fundacion && Object.keys((profileData as any).documentos_fundacion).length > 0
                                        )
                                        
                                        if (profileData.fundacion_verificada) {
                                            return (
                                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                                    ✓ Verificada
                                                </span>
                                            )
                                        } else if (hasDocuments) {
                                            return (
                                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    <ClockIcon className="w-5 h-5 mr-2" />
                                                    ⏳ Verificación Pendiente
                                                </span>
                                            )
                                        } else {
                                            return (
                                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    📤 Subir Documentación
                                                </span>
                                            )
                                        }
                                    })()}
                                </div>

                                {/* Información de Verificación */}
                                {(() => {
                                    const hasDocuments = !!(
                                        (profileData as any).documento_fundacion || 
                                        (profileData as any).documentos_fundacion && Object.keys((profileData as any).documentos_fundacion).length > 0
                                    )
                                    
                                    if (profileData.fundacion_verificada) {
                                        return (
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                                <div className="flex items-start space-x-3">
                                                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                                                            ¡Tu fundación está verificada!
                                                        </h4>
                                                        <p className="text-sm text-green-800 dark:text-green-200">
                                                            Tu fundación ha sido verificada y ahora puedes recibir donaciones de la comunidad y crear eventos.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    } else if (hasDocuments) {
                                        return (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                                <div className="flex items-start space-x-3">
                                                    <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                            Tu solicitud está en revisión
                                                        </h4>
                                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                                            Nuestro equipo está revisando la documentación de tu fundación. Te notificaremos cuando el proceso esté completo.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                                                <div className="flex items-start space-x-3">
                                                    <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <div>
                                                        <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                                                            Documentación pendiente
                                                        </h4>
                                                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                                                            Necesitas subir la documentación de tu fundación para iniciar el proceso de verificación.
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                // Scroll a la sección de documentos
                                                                const docSection = document.querySelector('[data-section="documentos"]')
                                                                if (docSection) {
                                                                    docSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                                }
                                                            }}
                                                            className="text-sm text-red-900 dark:text-red-100 font-medium hover:underline flex items-center"
                                                        >
                                                            Ir a subir documentos →
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                })()}

                                {/* Detalles de la Fundación */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre de la Fundación</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{profileData.nombre_fundacion}</p>
                                    </div>
                                    {profileData.tipo_fundacion && (
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Fundación</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{profileData.tipo_fundacion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Información Completa de la Fundación */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Información Registrada
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre de la Fundación</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{profileData.nombre_fundacion || 'No proporcionado'}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NIT</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {(profileData as any).nit_fundacion || 'No proporcionado'}
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo de Fundación</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{profileData.tipo_fundacion || 'No proporcionado'}</p>
                                </div>
                                
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descripción</p>
                                    <p className="text-sm text-gray-900 dark:text-white">
                                        {(profileData as any).descripcion_fundacion || 'No proporcionada'}
                                    </p>
                                </div>
                                
                                {(profileData as any).pagina_web_fundacion && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Página Web</p>
                                        <a 
                                            href={(profileData as any).pagina_web_fundacion} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                                        >
                                            {(profileData as any).pagina_web_fundacion}
                                        </a>
                                    </div>
                                )}
                                
                                <div data-section="documentos">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Documentos de Registro (ESAL)</p>
                                    
                                    {/* Selector de modo de subida */}
                                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                            📤 ¿Cómo deseas subir tus documentos?
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setUploadMode('separated')}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                    uploadMode === 'separated'
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300'
                                                }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                                        uploadMode === 'separated'
                                                            ? 'bg-primary-500 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                    }`}>
                                                        {uploadMode === 'separated' ? (
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                            </svg>
                                                        ) : (
                                                            <span className="text-xs">○</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                            📁 Por separado
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Sube cada documento en su propio archivo (Recomendado)
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setUploadMode('single')}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                    uploadMode === 'single'
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300'
                                                }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                                        uploadMode === 'single'
                                                            ? 'bg-primary-500 text-white'
                                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                                    }`}>
                                                        {uploadMode === 'single' ? (
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                            </svg>
                                                        ) : (
                                                            <span className="text-xs">○</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                            📄 Todo en uno
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Sube todos los documentos compilados en un solo PDF
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Mostrar interfaz según modo seleccionado */}
                                    {uploadMode === 'separated' ? (
                                        <>
                                            {/* Componente de subida de documentos por separado */}
                                            <DocumentUploader 
                                                currentUser={currentUser}
                                                documentos={profileData.documentos_fundacion}
                                                onUpdate={(newDocs) => {
                                                    setProfileData({
                                                        ...profileData,
                                                        documentos_fundacion: newDocs
                                                    })
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {/* Interfaz de subida de documento único */}
                                            <div className="space-y-4">
                                                {/* Lista de documentos que debe incluir */}
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                                                        📋 Tu PDF debe incluir estos documentos:
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        <div className="flex items-center space-x-2 text-xs text-blue-800 dark:text-blue-200">
                                                            <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 text-white rounded-full flex items-center justify-center font-bold text-xs">1</div>
                                                            <span>Acta de Constitución</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-blue-800 dark:text-blue-200">
                                                            <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 text-white rounded-full flex items-center justify-center font-bold text-xs">2</div>
                                                            <span>Estatutos</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-blue-800 dark:text-blue-200">
                                                            <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 text-white rounded-full flex items-center justify-center font-bold text-xs">3</div>
                                                            <span>PRE-RUT de la DIAN</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-blue-800 dark:text-blue-200">
                                                            <div className="w-5 h-5 bg-gray-400 dark:bg-gray-600 text-white rounded-full flex items-center justify-center text-xs">+</div>
                                                            <span>Otros (opcional)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Preview si ya hay documento subido */}
                                                {(profileData as any).documento_fundacion && (
                                                    <div className="card">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                Documento Actual
                                                            </p>
                                                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">
                                                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                                </svg>
                                                                Subido
                                                            </span>
                                                        </div>
                                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-3">
                                                            {(profileData as any).documento_fundacion.toLowerCase().endsWith('.pdf') ? (
                                                                <iframe
                                                                    src={(profileData as any).documento_fundacion}
                                                                    className="w-full h-64"
                                                                    title="Documento completo"
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={(profileData as any).documento_fundacion}
                                                                    alt="Documento completo"
                                                                    className="w-full h-auto max-h-64 object-contain bg-gray-50 dark:bg-gray-800"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <a
                                                                href={(profileData as any).documento_fundacion}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 text-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                                                            >
                                                                Ver completo
                                                            </a>
                                                            <button
                                                                onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                                                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
                                                            >
                                                                {showDocumentUpload ? '✕ Cancelar' : '🔄 Reemplazar'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Formulario de subida (mostrar si no hay documento o si showDocumentUpload está activo) */}
                                                {(!(profileData as any).documento_fundacion || showDocumentUpload) && (
                                                    <div className="card">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            {(profileData as any).documento_fundacion ? 'Reemplazar Documento' : 'Subir Documento Completo'}
                                                        </label>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                            Sube un archivo PDF con todos los documentos requeridos (Máx. 5MB)
                                                        </p>
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    setDocumentFile(file)
                                                                }
                                                            }}
                                                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                                                                file:mr-4 file:py-2 file:px-4
                                                                file:rounded-md file:border-0
                                                                file:text-sm file:font-semibold
                                                                file:bg-primary-50 file:text-primary-700
                                                                hover:file:bg-primary-100
                                                                dark:file:bg-primary-900/30 dark:file:text-primary-400
                                                                dark:hover:file:bg-primary-900/50"
                                                        />
                                                        {documentFile && (
                                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                                                                <p className="text-xs text-green-700 dark:text-green-300 flex items-center font-medium mb-1">
                                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                                    </svg>
                                                                    Archivo seleccionado
                                                                </p>
                                                                <p className="text-xs text-green-600 dark:text-green-400 ml-6">
                                                                    {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2 mt-4">
                                                            <button
                                                                onClick={() => handleUploadDocument()}
                                                                disabled={!documentFile || documentUploading}
                                                                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center"
                                                            >
                                                                {documentUploading ? (
                                                                    <>
                                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                        Subiendo...
                                                                    </>
                                                                ) : (
                                                                    <>📄 Subir documento completo</>
                                                                )}
                                                            </button>
                                                            {showDocumentUpload && (
                                                                <button
                                                                    onClick={() => {
                                                                        setShowDocumentUpload(false)
                                                                        setDocumentFile(null)
                                                                    }}
                                                                    disabled={documentUploading}
                                                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    
                                </div>

                        {/* Proceso de Verificación */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Proceso de Verificación
                            </h3>
                        </div>

                        {/* Proceso de Verificación */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Proceso de Verificación
                            </h3>
                            
                            <div className="space-y-4">
                                {(() => {
                                    const hasDocuments = !!(
                                        (profileData as any).documento_fundacion || 
                                        (profileData as any).documentos_fundacion && Object.keys((profileData as any).documentos_fundacion).length > 0
                                    )
                                    
                                    return (
                                        <>
                                            {/* Paso 1 */}
                                            <div className="flex items-start space-x-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    hasDocuments
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                                }`}>
                                                    {hasDocuments ? (
                                                        <CheckIcon className="w-5 h-5" />
                                                    ) : (
                                                        <span className="text-sm font-bold">1</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        1. Subir Documentación
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {hasDocuments 
                                                            ? '✓ Documentos recibidos correctamente.'
                                                            : 'Sube los documentos de registro de tu fundación (ESAL).'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Paso 2 */}
                                            <div className="flex items-start space-x-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    profileData.fundacion_verificada
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : hasDocuments
                                                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                                }`}>
                                                    {profileData.fundacion_verificada ? (
                                                        <CheckIcon className="w-5 h-5" />
                                                    ) : hasDocuments ? (
                                                        <ClockIcon className="w-5 h-5" />
                                                    ) : (
                                                        <span className="text-sm font-bold">2</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        2. Revisión Administrativa
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {profileData.fundacion_verificada
                                                            ? '✓ Tu fundación ha sido revisada y aprobada.'
                                                            : hasDocuments 
                                                                ? '⏳ Nuestro equipo está verificando tu información.'
                                                                : 'Pendiente de recibir documentación.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Paso 3 */}
                                            <div className="flex items-start space-x-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    profileData.fundacion_verificada
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                                }`}>
                                                    {profileData.fundacion_verificada ? (
                                                        <CheckIcon className="w-5 h-5" />
                                                    ) : (
                                                        <span className="text-sm font-bold">3</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        3. Verificación Completa
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {profileData.fundacion_verificada
                                                            ? '✓ ¡Felicitaciones! Tu fundación está verificada y activa.'
                                                            : 'Una vez aprobada, podrás recibir donaciones y crear eventos.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )
                                })()}
                            </div>
                        </div>
                        
                        {/* Beneficios de la Verificación */}
                        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                🎁 Beneficios de la Verificación
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            Badge Verificado
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Insignia visible en tu perfil que genera confianza
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            Recibir Donaciones
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Acceso al panel de donaciones disponibles
                                                </p>
                                                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-2">
                                                    <li className="flex items-start space-x-2">
                                                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                                        <span>Cartas de aceptación de cargos (Junta Directiva, Revisor Fiscal)</span>
                                                    </li>
                                                    <li className="flex items-start space-x-2">
                                                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                                        <span>Formulario RUES (Registro Único Empresarial y Social)</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                                            <p className="text-xs text-blue-700 dark:text-blue-300 italic flex items-start">
                                                <svg className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                                </svg>
                                                <span>Puedes subir todos los documentos compilados en un solo archivo PDF (Máx. 5MB)</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {(profileData as any).documento_fundacion ? (
                                        <div className="space-y-3">
                                            {/* Preview del documento */}
                                            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                                                {(profileData as any).documento_fundacion.toLowerCase().endsWith('.pdf') ? (
                                                    <iframe
                                                        src={(profileData as any).documento_fundacion}
                                                        className="w-full h-64"
                                                        title="Vista previa del documento"
                                                    />
                                                ) : (
                                                    <img
                                                        src={(profileData as any).documento_fundacion}
                                                        alt="Documento de fundación"
                                                        className="w-full h-auto max-h-64 object-contain bg-gray-100 dark:bg-gray-800"
                                                    />
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <a 
                                                    href={(profileData as any).documento_fundacion} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    <span>Ver en nueva ventana</span>
                                                </a>
                                                <button
                                                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                                                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium transition-colors"
                                                >
                                                    {showDocumentUpload ? '✕ Cancelar' : '🔄 Actualizar'}
                                                </button>
                                            </div>

                                            {/* Formulario para actualizar documento */}
                                            {showDocumentUpload && (
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Actualizar Documentación
                                                        </label>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                            Reemplaza la documentación con una versión actualizada. Asegúrate de incluir todos los documentos requeridos (PDF, JPG, PNG - Máx. 5MB)
                                                        </p>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    setDocumentFile(file)
                                                                }
                                                            }}
                                                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                                                                file:mr-4 file:py-2 file:px-4
                                                                file:rounded-md file:border-0
                                                                file:text-sm file:font-semibold
                                                                file:bg-primary-50 file:text-primary-700
                                                                hover:file:bg-primary-100
                                                                dark:file:bg-primary-900/30 dark:file:text-primary-400
                                                                dark:hover:file:bg-primary-900/50"
                                                        />
                                                        {documentFile && (
                                                            <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                                                                ✓ Archivo seleccionado: {documentFile.name}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUploadDocument()}
                                                            disabled={!documentFile || documentUploading}
                                                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center"
                                                        >
                                                            {documentUploading ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Subiendo...
                                                                </>
                                                            ) : (
                                                                <>📄 Actualizar documentación</>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowDocumentUpload(false)
                                                                setDocumentFile(null)
                                                            }}
                                                            disabled={documentUploading}
                                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
                                                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                                                    ⚠️ Documentos Pendientes
                                                </p>
                                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                                    No has subido los documentos de registro. Son necesarios para la verificación de tu fundación como ESAL.
                                                </p>
                                                <button 
                                                    onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                                                    className="mt-2 text-sm text-yellow-900 dark:text-yellow-100 font-medium hover:underline flex items-center"
                                                >
                                                    {showDocumentUpload ? '✕ Cancelar' : '📤 Subir documentación completa →'}
                                                </button>
                                            </div>

                                            {/* Formulario de subir documento */}
                                            {showDocumentUpload && (
                                                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Subir Documentación de la Fundación
                                                        </label>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                            Compila todos los documentos requeridos en un solo archivo PDF. Si tienes documentos por separado, puedes usar herramientas en línea para combinarlos. Formato: PDF, JPG, PNG - Máx. 5MB
                                                        </p>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    setDocumentFile(file)
                                                                }
                                                            }}
                                                            className="block w-full text-sm text-gray-500 dark:text-gray-400
                                                                file:mr-4 file:py-2 file:px-4
                                                                file:rounded-md file:border-0
                                                                file:text-sm file:font-semibold
                                                                file:bg-primary-50 file:text-primary-700
                                                                hover:file:bg-primary-100
                                                                dark:file:bg-primary-900/30 dark:file:text-primary-400
                                                                dark:hover:file:bg-primary-900/50"
                                                        />
                                                        {documentFile && (
                                                            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700">
                                                                <p className="text-xs text-green-700 dark:text-green-300 flex items-center">
                                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                                                    </svg>
                                                                    <span className="font-medium">Archivo seleccionado:</span>
                                                                </p>
                                                                <p className="text-xs text-green-600 dark:text-green-400 ml-6 mt-1">
                                                                    {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUploadDocument()}
                                                            disabled={!documentFile || documentUploading}
                                                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors flex items-center justify-center"
                                                        >
                                                            {documentUploading ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Subiendo...
                                                                </>
                                                            ) : (
                                                                <>📄 Subir documentación</>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowDocumentUpload(false)
                                                                setDocumentFile(null)
                                                            }}
                                                            disabled={documentUploading}
                                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium text-sm transition-colors disabled:opacity-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {!profileData.fundacion_verificada && (
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button 
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                                            onClick={() => {
                                                alert('La funcionalidad de actualizar información estará disponible próximamente. Por favor contacta a soporte si necesitas realizar cambios.')
                                            }}
                                        >
                                            ✏️ Actualizar información
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Proceso de Verificación */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Proceso de Verificación
                            </h3>
                            
                            <div className="space-y-4">
                                {(() => {
                                    const hasDocuments = !!(
                                        (profileData as any).documento_fundacion || 
                                        (profileData as any).documentos_fundacion && Object.keys((profileData as any).documentos_fundacion).length > 0
                                    )
                                    
                                    return (
                                        <>
                                            {/* Paso 1 */}
                                            <div className="flex items-start space-x-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    hasDocuments
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                                }`}>
                                                    {hasDocuments ? (
                                                        <CheckIcon className="w-5 h-5" />
                                                    ) : (
                                                        <span className="text-sm font-bold">1</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        1. Subir Documentación
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {hasDocuments 
                                                            ? '✓ Documentos recibidos correctamente.'
                                                            : 'Sube los documentos de registro de tu fundación (ESAL).'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Paso 2 */}
                                            <div className="flex items-start space-x-4">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    profileData.fundacion_verificada
                                                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                        : hasDocuments
                                                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                                }`}>
                                                    {profileData.fundacion_verificada ? (
                                                        <CheckIcon className="w-5 h-5" />
                                                    ) : hasDocuments ? (
                                                        <ClockIcon className="w-5 h-5" />
                                                    ) : (
                                                        <span className="text-sm font-bold">2</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                                        2. Revisión Administrativa
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {profileData.fundacion_verificada
                                                            ? '✓ Tu fundación ha sido revisada y aprobada.'
                                                            : hasDocuments 
                                                                ? '⏳ Nuestro equipo está verificando tu información.'
                                                                : 'Pendiente de recibir documentación.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )
                                })()}

                                {/* Paso 3 */}
                                <div className="flex items-start space-x-4">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        profileData.fundacion_verificada
                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                                    }`}>
                                        {profileData.fundacion_verificada ? (
                                            <CheckIcon className="w-5 h-5" />
                                        ) : (
                                            <span className="text-sm font-bold">3</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            3. Verificación Completa
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {profileData.fundacion_verificada
                                                ? '✓ ¡Felicitaciones! Tu fundación está verificada y activa.'
                                                : 'Una vez aprobada, podrás recibir donaciones y crear eventos.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Beneficios de la Verificación */}
                        <div className="card bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                🎁 Beneficios de la Verificación
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            Badge Verificado
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Insignia visible en tu perfil que genera confianza
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            Recibir Donaciones
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Acceso al panel de donaciones disponibles
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            Prioridad
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Mayor visibilidad en solicitudes de donación
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            Estadísticas de Impacto
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Dashboard con métricas de donaciones recibidas
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Soporte */}
                        <div className="card bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-start space-x-3">
                                <QuestionMarkCircleIcon className="w-6 h-6 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                        ¿Necesitas ayuda?
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Si tienes preguntas sobre el proceso de verificación o necesitas actualizar tu información, contáctanos.
                                    </p>
                                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                                        Contactar Soporte →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pestaña Eventos (solo fundaciones) */}
                {activeTab === 'events' && profileData.es_fundacion && (
                    <EventsManager 
                        currentUser={currentUser}
                        isFoundation={profileData.es_fundacion}
                        isVerified={profileData.fundacion_verificada || false}
                    />
                )}

                {/* Pestaña Productos (solo para usuarios normales, no fundaciones) */}
                {activeTab === 'products' && !profileData.es_fundacion && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Productos</h3>
                            <button 
                                className="btn-primary"
                                onClick={handlePublishProduct}
                            >
                                <HeartIcon className="w-4 h-4 mr-2" />
                                Publicar Nuevo Producto
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                    />

                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                        {product.title}
                                    </h4>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                            {formatPrice(product.price, product.currency)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.validationStatus === 'approved' ? 'bg-green-100 text-green-800' : product.validationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.validationStatus === 'approved' ? 'Aprobado' : product.validationStatus === 'pending' ? 'Pendiente' : 'Rechazado'}
                                            </span>
                                            {product.hasSuccessfulExchange && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Concretado
                                                </span>
                                            )}
                                            {product.publicationState === 'pausado' && !product.hasSuccessfulExchange && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                                    Pausado
                                                </span>
                                            )}
                                            {product.transactionType && !product.hasSuccessfulExchange && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                                                    {product.transactionType === 'venta' ? 'Venta' : product.transactionType === 'intercambio' ? 'Intercambio' : product.transactionType === 'donacion' ? 'Donación' : 'Mixto'}
                                        </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <EyeIcon className="w-4 h-4" />
                                    <span>{product.views ?? 0}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <HeartIcon className="w-4 h-4" />
                                    <span>{product.likes ?? 0}</span>
                                </div>
                                    </div>

                                    {/* Acciones por estado */}
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {/* Producto con intercambio exitoso: Solo mensaje de éxito */}
                                        {product.hasSuccessfulExchange && (
                                            <div className="col-span-2 text-center py-3 bg-green-50 border border-green-200 rounded-md">
                                                <div className="flex items-center justify-center space-x-2 text-green-800">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="font-medium">Concretado con éxito</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Pendiente: solo Eliminar */}
                                        {product.validationStatus === 'pending' && !product.hasSuccessfulExchange && (
                                            <>
                                                <div></div>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                                    disabled={deletingId === product.id}
                                                >
                                                    {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                                                </button>
                                            </>
                                        )}

                                        {/* Rechazado: Editar + Reenviar + Eliminar */}
                                        {product.validationStatus === 'rejected' && !product.hasSuccessfulExchange && (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/editar-producto/${product.id}`)}
                                                    className="px-3 py-2 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                                                >
                                                    Editar y Reenviar validación
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                                    disabled={deletingId === product.id}
                                                >
                                                    {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                                                </button>
                                            </>
                                        )}

                                        {/* Aprobado + Activo: Editar + Pausar + Eliminar */}
                                        {product.validationStatus === 'approved' && product.publicationState !== 'pausado' && !product.hasSuccessfulExchange && (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/editar-producto/${product.id}`)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 text-gray-700 border-gray-300 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => pauseOrResumeProduct(product.id, true)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 text-gray-700 border-gray-300 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                                                    disabled={pausingId === product.id}
                                                >
                                                    {pausingId === product.id ? 'Actualizando…' : 'Pausar'}
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 col-span-2"
                                                    disabled={deletingId === product.id}
                                                >
                                                    {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                                                </button>
                                            </>
                                        )}

                                        {/* Aprobado + Pausado: Editar + Reanudar + Eliminar */}
                                        {product.validationStatus === 'approved' && product.publicationState === 'pausado' && !product.hasSuccessfulExchange && (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/editar-producto/${product.id}`)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 text-gray-700 border-gray-300 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => pauseOrResumeProduct(product.id, false)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50 text-gray-700 border-gray-300 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                                                    disabled={pausingId === product.id}
                                                >
                                                    {pausingId === product.id ? 'Actualizando…' : 'Reanudar'}
                                                </button>
                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 col-span-2"
                                                    disabled={deletingId === product.id}
                                                >
                                                    {deletingId === product.id ? 'Eliminando…' : 'Eliminar'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pestaña Reseñas */}
                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reseñas Recibidas</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Calificación promedio:</span>
                                <div className="flex items-center space-x-1">
                                    <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                                    <span className="font-semibold">{profileData.rating}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {userReviews.length === 0 ? (
                                <div className="text-center py-12">
                                    <StarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay reseñas aún</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Las reseñas aparecerán aquí cuando otros usuarios te califiquen.</p>
                                </div>
                            ) : (
                                userReviews.map((review) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="card"
                                    >
                                        <div className="flex items-start space-x-4">
                                            <Avatar
                                                src={review.reviewerAvatar}
                                                alt={review.reviewerName}
                                                size="lg"
                                                className="w-12 h-12"
                                            />

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{review.reviewerName}</h4>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="flex items-center space-x-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <StarIcon
                                                                    key={i}
                                                                    className={`w-4 h-4 ${i < review.rating
                                                                        ? 'text-yellow-400 fill-current'
                                                                        : 'text-gray-300 dark:text-gray-600'
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        {review.recommend && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                                Recomendado
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {review.comment && (
                                                    <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
                                                )}

                                                {review.aspects && (
                                                    <div className="mb-3">
                                                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Aspectos destacados:</h5>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{review.aspects}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                    <span>Intercambio: {review.productTitle}</span>
                                                    <span>{review.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Pestaña Actividad */}
                {activeTab === 'activities' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Productos Vistos Recientemente</h3>

                        <div className="space-y-4">
                            {userActivities.length > 0 ? (
                                userActivities.map((activity, index) => {
                                    // Extraer el ID del producto del activity.id
                                    const productId = activity.id.replace('view-', '')
                                    
                                    return (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            onClick={() => router.push(`/producto/${productId}`)}
                                                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors dark:bg-[#181A1B] dark:hover:bg-[#181A1B] border border-transparent dark:border-gray-700"
                                        >
                                            <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                    {activity.imagen_producto ? (
                                                        <img 
                                                            src={activity.imagen_producto} 
                                                            alt="Producto"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/default-product.png'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="text-2xl text-gray-400">{activity.icon}</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate">
                                                    {activity.title}
                                                </h4>
                                                <p className="text-gray-600 dark:text-gray-400 text-sm truncate">{activity.description}</p>
                                            </div>

                                            <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</span>
                                                <span className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                                                    Ver producto →
                                                </span>
                                            </div>
                                        </motion.div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <EyeIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay actividad reciente</h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Cuando veas productos, aparecerán aquí para que puedas acceder fácilmente a ellos.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Pestaña Configuración */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuración de la Cuenta</h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Privacidad</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Perfil público</span>
                                        <button className="w-12 h-6 bg-primary-600 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Mostrar ubicación</span>
                                        <button className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Notificaciones</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Mensajes nuevos</span>
                                        <button className="w-12 h-6 bg-primary-600 dark:bg-primary-500 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Intercambios</span>
                                        <button className="w-12 h-6 bg-primary-600 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

        </div>
    )
}
