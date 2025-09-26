'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
    BookmarkIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadUserProfileImage } from '@/lib/storage'

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
    avatar: string
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
}

interface UserReview {
    id: string
    reviewerName: string
    reviewerAvatar: string
    rating: number
    comment: string
    date: string
    productTitle: string
}

interface UserActivity {
    id: string
    type: 'exchange' | 'product' | 'review' | 'login'
    title: string
    description: string
    date: string
    icon: string
}

export default function ProfileModule({ currentUser }: ProfileModuleProps) {
    const router = useRouter()
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [userProducts, setUserProducts] = useState<UserProduct[]>([])
    const [userReviews, setUserReviews] = useState<UserReview[]>([])
    const [userActivities, setUserActivities] = useState<UserActivity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'reviews' | 'activities' | 'settings'>('overview')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string>('')
    const [validationStatus, setValidationStatus] = useState<'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | null>(null)
    const [rejectionReason, setRejectionReason] = useState<string | null>(null)
    const [badgesDetail, setBadgesDetail] = useState<BadgeDetail[]>([])

    // Cargar datos del perfil desde Supabase
    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true)

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
                    avatar: dbUser.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                    location: loc,
                    bio: dbUser.biografia || '',
                    joinDate,
                    rating: typeof dbUser.calificacion_promedio === 'number' ? dbUser.calificacion_promedio : 0,
                    totalReviews: 0,
                    totalProducts: typeof dbUser.total_productos === 'number' ? dbUser.total_productos : 0,
                    totalExchanges: typeof dbUser.total_intercambios === 'number' ? dbUser.total_intercambios : 0,
                    totalViews: 0,
                    badges: dbUser.verificado ? ['Verificado', ...badgeNames] : badgeNames,
                    socialLinks: {}
                }

                setProfileData(profile)

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
                        imagenes:imagen_producto(
                            url_imagen,
                            es_principal,
                            orden
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
                    return {
                        id: String(p.producto_id),
                        title: p.titulo,
                        image: principal?.url_imagen || '/default-product.png',
                        price: p.precio || 0,
                        currency: 'COP',
                        status: p.estado === 'usado' || p.estado === 'nuevo' ? 'available' : 'available',
                        validationStatus: (p.estado_validacion || 'pending') as 'pending' | 'approved' | 'rejected',
                        transactionType: p.tipo_transaccion || 'mixto',
                        views: 0,
                        likes: 0,
                        createdAt: p.fecha_creacion || new Date().toISOString(),
                        publicationState: (p.estado_publicacion || 'activo') as any
                    }
                })

                const mockUserReviews: UserReview[] = []
                const mockUserActivities: UserActivity[] = []

                setUserProducts(transformed)
                setUserReviews(mockUserReviews)
                setUserActivities(mockUserActivities)
                setIsLoading(false)
            } catch (e) {
                setIsLoading(false)
            }
        }

        loadProfileData()
    }, [])

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
        try {
            setPausingId(productId)
            const { error } = await supabase
                .from('producto')
                .update({ estado_publicacion: pause ? 'pausado' : 'activo', fecha_actualizacion: new Date().toISOString() })
                .eq('producto_id', Number(productId))
            if (error) throw error
            setUserProducts(prev => prev.map(p => p.id === productId ? { ...p } : p))
        } catch (_) {
            alert('No se pudo actualizar el estado de publicación')
        } finally {
            setPausingId(null)
        }
    }

    const deleteProduct = async (productId: string) => {
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
            alert('No se pudo eliminar el producto')
        } finally {
            setDeletingId(null)
        }
    }

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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Perfil no encontrado</h3>
                <p className="text-gray-600">No se pudieron cargar los datos del perfil</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header del perfil */}
            <div className="card">
                <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                    {/* Avatar y foto */}
                    <div className="relative">
                        <img
                            src={previewUrl || profileData.avatar}
                            alt={profileData.name}
                            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover"
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
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null
                                    setSelectedFile(file || null)
                                    setUploadError(null)
                                    setUploadSuccess(null)
                                    if (file) {
                                        const reader = new FileReader()
                                        reader.onload = () => setPreviewUrl(reader.result as string)
                                        reader.readAsDataURL(file)
                                    } else {
                                        setPreviewUrl('')
                                    }
                                }}
                            />
                        </label>
                    </div>

                    {/* Información básica */}
                    <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center flex-wrap gap-2">
                                    {profileData.name}
                                    {profileData.badges?.includes('Verificado') && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <ShieldCheckIcon className="w-4 h-4 mr-1" /> Verificado
                                        </span>
                                    )}
                                </h1>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center space-x-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span>{profileData.location}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span>Miembro desde {profileData.joinDate}</span>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-4 max-w-2xl">
                                    {profileData.bio}
                                </p>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
                                <div className="flex gap-2 items-center flex-wrap">
                                    <button
                                        onClick={() => router.push('/verificacion-identidad')}
                                        className={`${profileData.badges?.includes('Verificado') ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'} px-3 py-2 rounded-md inline-flex items-center`}
                                    >
                                        <ShieldCheckIcon className="w-4 h-4 mr-2" />
                                        {profileData.badges?.includes('Verificado') ? 'Cuenta verificada' : 'Verificar cuenta'}
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
                                        className="btn-secondary"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Editar Perfil
                                    </button>
                                    <button className="btn-secondary">
                                        <Cog6ToothIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                {selectedFile && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                if (!selectedFile) return
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
                                                    const json = await resp.json()
                                                    if (!resp.ok) {
                                                        setUploadError(json?.error || 'Error al subir')
                                                    } else {
                                                        const newUrl = json.publicUrl || ''
                                                        setProfileData({ ...profileData, avatar: newUrl })
                                                        setUploadSuccess('Foto actualizada')
                                                        setSelectedFile(null)
                                                        setPreviewUrl('')
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
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary-600">{profileData.rating}</div>
                                <div className="text-sm text-gray-600">Calificación</div>
                                <div className="flex items-center justify-center space-x-1 mt-1">
                                    {[...Array(5)].map((_, i) => (
                                        <StarIcon
                                            key={i}
                                            className={`w-4 h-4 ${i < Math.floor(profileData.rating)
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-secondary-600">{profileData.totalProducts}</div>
                                <div className="text-sm text-gray-600">Productos</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-accent-600">{profileData.totalExchanges}</div>
                                <div className="text-sm text-gray-600">Intercambios</div>
                            </div>

                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{profileData.totalViews}</div>
                                <div className="text-sm text-gray-600">Visualizaciones</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insignias y Logros</h3>
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
            <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                    {[
                        { id: 'overview', name: 'Resumen', icon: UserIcon },
                        { id: 'products', name: 'Productos', icon: HeartIcon },
                        { id: 'reviews', name: 'Reseñas', icon: StarIcon },
                        { id: 'activities', name: 'Actividad', icon: EyeIcon },
                        { id: 'settings', name: 'Configuración', icon: Cog6ToothIcon }
                    ].map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
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

            {/* Contenido de las pestañas */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {/* Pestaña Resumen */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información de contacto */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{profileData.email}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{profileData.phone}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-700">{profileData.location}</span>
                                </div>
                                {profileData.socialLinks.website && (
                                    <div className="flex items-center space-x-3">
                                        <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                                        <a
                                            href={profileData.socialLinks.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-600 hover:text-primary-700"
                                        >
                                            {profileData.socialLinks.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Enlaces sociales */}
                        <div className="card">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Redes Sociales</h3>
                            <div className="space-y-3">
                                {profileData.socialLinks.instagram && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-pink-600 text-lg">📷</span>
                                        <span className="text-gray-700">{profileData.socialLinks.instagram}</span>
                                    </div>
                                )}
                                {profileData.socialLinks.facebook && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-blue-600 text-lg">📘</span>
                                        <span className="text-gray-700">{profileData.socialLinks.facebook}</span>
                                    </div>
                                )}
                                {profileData.socialLinks.twitter && (
                                    <div className="flex items-center space-x-3">
                                        <span className="text-blue-400 text-lg">🐦</span>
                                        <span className="text-gray-700">{profileData.socialLinks.twitter}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pestaña Productos */}
                {activeTab === 'products' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Mis Productos</h3>
                            <button 
                                className="btn-primary"
                                onClick={() => router.push('/agregar-producto')}
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

                                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                        {product.title}
                                    </h4>

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xl font-bold text-primary-600">
                                            {formatPrice(product.price, product.currency)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.validationStatus === 'approved' ? 'bg-green-100 text-green-800' : product.validationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {product.validationStatus === 'approved' ? 'Aprobado' : product.validationStatus === 'pending' ? 'Pendiente' : 'Rechazado'}
                                            </span>
                                            {product.publicationState === 'pausado' && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                                    Pausado
                                                </span>
                                            )}
                                            {product.transactionType && (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                                                    {product.transactionType === 'venta' ? 'Venta' : product.transactionType === 'intercambio' ? 'Intercambio' : product.transactionType === 'donacion' ? 'Donación' : 'Mixto'}
                                        </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <EyeIcon className="w-4 h-4" />
                                            <span>{product.views}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <HeartIcon className="w-4 h-4" />
                                            <span>{product.likes}</span>
                                        </div>
                                    </div>

                                    {/* Acciones por estado */}
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {/* Pendiente: solo Eliminar */}
                                        {product.validationStatus === 'pending' && (
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
                                        {product.validationStatus === 'rejected' && (
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
                                        {product.validationStatus === 'approved' && product.publicationState !== 'pausado' && (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/editar-producto/${product.id}`)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => pauseOrResumeProduct(product.id, true)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
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
                                        {product.validationStatus === 'approved' && product.publicationState === 'pausado' && (
                                            <>
                                                <button
                                                    onClick={() => router.push(`/editar-producto/${product.id}`)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => pauseOrResumeProduct(product.id, false)}
                                                    className="px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
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
                            <h3 className="text-lg font-semibold text-gray-900">Reseñas Recibidas</h3>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Calificación promedio:</span>
                                <div className="flex items-center space-x-1">
                                    <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />
                                    <span className="font-semibold">{profileData.rating}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {userReviews.map((review) => (
                                <motion.div
                                    key={review.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card"
                                >
                                    <div className="flex items-start space-x-4">
                                        <img
                                            src={review.reviewerAvatar}
                                            alt={review.reviewerName}
                                            className="w-12 h-12 rounded-full"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-gray-900">{review.reviewerName}</h4>
                                                <div className="flex items-center space-x-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarIcon
                                                            key={i}
                                                            className={`w-4 h-4 ${i < review.rating
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <p className="text-gray-700 mb-2">{review.comment}</p>

                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <span>Producto: {review.productTitle}</span>
                                                <span>{review.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pestaña Actividad */}
                {activeTab === 'activities' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>

                        <div className="space-y-4">
                            {userActivities.map((activity) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="text-2xl">{activity.icon}</div>

                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                        <p className="text-gray-600">{activity.description}</p>
                                    </div>

                                    <span className="text-sm text-gray-500">{activity.date}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pestaña Configuración */}
                {activeTab === 'settings' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Configuración de la Cuenta</h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card">
                                <h4 className="font-semibold text-gray-900 mb-4">Privacidad</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Perfil público</span>
                                        <button className="w-12 h-6 bg-primary-600 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Mostrar ubicación</span>
                                        <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <h4 className="font-semibold text-gray-900 mb-4">Notificaciones</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Mensajes nuevos</span>
                                        <button className="w-12 h-6 bg-primary-600 rounded-full relative">
                                            <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700">Intercambios</span>
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
