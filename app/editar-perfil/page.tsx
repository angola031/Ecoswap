'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhotoIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, GlobeAltIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { uploadUserProfileImage } from '@/lib/storage'
import { getSupabaseClient } from '@/lib/supabase-client'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

interface User {
    user_id: number
    nombre: string
    apellido: string
    email: string
    telefono?: string
    fecha_nacimiento?: string
    biografia?: string
    foto_perfil?: string
    calificacion_promedio: number
    total_intercambios: number
    eco_puntos: number
    fecha_registro: string
    verificado: boolean
    activo: boolean
    es_admin: boolean
    ubicacion?: {
        ciudad?: string
        departamento?: string
        pais: string
    }
    configuracion?: {
        notif_nuevas_propuestas: boolean
        notif_mensajes: boolean
        notif_actualizaciones: boolean
        notif_newsletter: boolean
        perfil_publico: boolean
        mostrar_ubicacion_exacta: boolean
        mostrar_telefono: boolean
        recibir_mensajes_desconocidos: boolean
        distancia_maxima_km: number
    }
}

export default function EditarPerfilPage() {
    const router = useRouter()
    const [formData, setFormData] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [showPasswordSection, setShowPasswordSection] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string>('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const getAdultMaxDate = () => {
        const date = new Date()
        date.setFullYear(date.getFullYear() - 18)
        return date.toISOString().split('T')[0]
    }

    type ColombiaDepartamento = { id: number; departamento: string; ciudades: string[] }
    const [departamentos, setDepartamentos] = useState<string[]>([])
    const [departamentosData, setDepartamentosData] = useState<ColombiaDepartamento[]>([])

    useEffect(() => {
        const load = async () => {
            try {
                const supabase = getSupabaseClient()
                if (!supabase) {
                    console.log('❌ Supabase no está configurado')
                    return
                }
                const { data: { session } } = await supabase.auth.getSession()
                const email = session?.user?.email
                if (!email) return

                // Obtener datos del usuario
                const { data: dbUser } = await supabase
                    .from('usuario')
                    .select('*')
                    .eq('email', email)
                    .single()

                if (!dbUser) return

                // Obtener ubicación principal
                const { data: ubicacion } = await supabase
                    .from('ubicacion')
                    .select('ciudad, departamento, pais, es_principal')
                    .eq('user_id', dbUser.user_id)
                    .eq('es_principal', true)
                    .single()

                // Obtener configuración del usuario
                const { data: configuracion } = await supabase
                    .from('configuracion_usuario')
                    .select('*')
                    .eq('usuario_id', dbUser.user_id)
                    .single()

                const user: User = {
                    user_id: dbUser.user_id,
                    nombre: dbUser.nombre || '',
                    apellido: dbUser.apellido || '',
                    email: dbUser.email,
                    telefono: dbUser.telefono || '',
                    fecha_nacimiento: dbUser.fecha_nacimiento || '',
                    biografia: dbUser.biografia || '',
                    foto_perfil: dbUser.foto_perfil || '/api/placeholder/150/150',
                    calificacion_promedio: dbUser.calificacion_promedio || 0,
                    total_intercambios: dbUser.total_intercambios || 0,
                    eco_puntos: dbUser.eco_puntos || 0,
                    fecha_registro: dbUser.fecha_registro || '',
                    verificado: dbUser.verificado || false,
                    activo: dbUser.activo || true,
                    es_admin: dbUser.es_admin || false,
                    ubicacion: ubicacion ? {
                        ciudad: ubicacion.ciudad || '',
                        departamento: ubicacion.departamento || '',
                        pais: ubicacion.pais || 'Colombia'
                    } : {
                        pais: 'Colombia'
                    },
                    configuracion: configuracion ? {
                        notif_nuevas_propuestas: configuracion.notif_nuevas_propuestas ?? true,
                        notif_mensajes: configuracion.notif_mensajes ?? true,
                        notif_actualizaciones: configuracion.notif_actualizaciones ?? false,
                        notif_newsletter: configuracion.notif_newsletter ?? true,
                        perfil_publico: configuracion.perfil_publico ?? true,
                        mostrar_ubicacion_exacta: configuracion.mostrar_ubicacion_exacta ?? false,
                        mostrar_telefono: configuracion.mostrar_telefono ?? false,
                        recibir_mensajes_desconocidos: configuracion.recibir_mensajes_desconocidos ?? true,
                        distancia_maxima_km: configuracion.distancia_maxima_km || 50
                    } : {
                        notif_nuevas_propuestas: true,
                        notif_mensajes: true,
                        notif_actualizaciones: false,
                        notif_newsletter: true,
                        perfil_publico: true,
                        mostrar_ubicacion_exacta: false,
                        mostrar_telefono: false,
                        recibir_mensajes_desconocidos: true,
                        distancia_maxima_km: 50
                    }
                }

                setFormData(user)
                setAvatarPreview(user.foto_perfil)
            } catch (e) {
                console.error('Error cargando datos del usuario:', e)
            }
        }
        load()
    }, [])

    useEffect(() => {
        const loadDepartamentos = async () => {
            try {
                const res = await fetch('/data/colombia.json')
                const data: ColombiaDepartamento[] = await res.json()
                setDepartamentosData(data)
                setDepartamentos(data.map(d => d.departamento))
            } catch (e) {
                console.error('No se pudieron cargar los departamentos:', e)
            }
        }
        loadDepartamentos()
    }, [])

    const getCiudadesForDepartamento = (departamento?: string) => {
        if (!departamento) return [] as string[]
        const dep = departamentosData.find(d => d.departamento === departamento)
        return dep ? dep.ciudades : []
    }

    const handleInputChange = (field: string, value: string | boolean | number) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.')
            setFormData(prev => prev ? {
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof User] as any),
                    [child]: value
                }
            } : null)
        } else {
            setFormData(prev => prev ? { ...prev, [field]: value } : null)
        }

        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
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
            setAvatarFile(webp)
            setAvatarPreview(URL.createObjectURL(webp))
        } catch (_) {
            setAvatarFile(file)
            const reader = new FileReader()
            reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
            reader.readAsDataURL(file)
        }
    }

    const removeAvatar = () => {
        setAvatarFile(null)
        setAvatarPreview('/api/placeholder/150/150')
    }

    const validateForm = () => {
        if (!formData) return false

        const errors: Record<string, string> = {}

        if (!formData.nombre.trim()) errors.nombre = 'El nombre es requerido'
        if (!formData.apellido.trim()) errors.apellido = 'El apellido es requerido'
        if (!formData.email.trim()) errors.email = 'El email es requerido'
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'El email no es válido'
        }
        if (formData.telefono && !/^\+?[\d\s\-\(\)]+$/.test(formData.telefono)) {
            errors.telefono = 'El teléfono no es válido'
        }
        if (formData.fecha_nacimiento && formData.fecha_nacimiento > new Date().toISOString().split('T')[0]) {
            errors.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura'
        }
        if (formData.fecha_nacimiento && formData.fecha_nacimiento > getAdultMaxDate()) {
            errors.fecha_nacimiento = 'Debes ser mayor de 18 años'
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const validatePasswordForm = () => {
        const errors: Record<string, string> = {}

        if (!passwordData.currentPassword) errors.currentPassword = 'La contraseña actual es requerida'
        if (!passwordData.newPassword) errors.newPassword = 'La nueva contraseña es requerida'
        if (passwordData.newPassword.length < 8) {
            errors.newPassword = 'La contraseña debe tener al menos 8 caracteres'
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Las contraseñas no coinciden'
        }

        setPasswordErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        try {
            // Obtener usuario autenticado y token
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.error('❌ Supabase no está configurado')
                return
            }
            const { data: { session } } = await supabase.auth.getSession()
            const accessToken = session?.access_token
            if (!accessToken) throw new Error('No hay sesión activa')

            let newAvatarUrl: string | undefined
            if (avatarFile) {
                const form = new FormData()
                form.append('file', avatarFile)
                form.append('userId', String(formData.user_id))
                const respUpload = await fetch('/api/upload/profile', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${accessToken}` },
                    body: form
                })
                const json = await respUpload.json().catch(() => ({}))
                if (!respUpload.ok) throw new Error(json?.error || 'Error subiendo avatar')
                newAvatarUrl = json.publicUrl ? `${json.publicUrl}?t=${Date.now()}` : undefined
            }

            const resp = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    nombre: formData.nombre || null,
                    apellido: formData.apellido || null,
                    telefono: formData.telefono || null,
                    fecha_nacimiento: formData.fecha_nacimiento || null,
                    biografia: formData.biografia || null,
                    foto_perfil: newAvatarUrl,
                    ubicacion: formData.ubicacion ? {
                        ciudad: formData.ubicacion.ciudad || null,
                        departamento: formData.ubicacion.departamento || null,
                        pais: formData.ubicacion.pais || 'Colombia'
                    } : undefined,
                    configuracion: formData.configuracion ? {
                        notif_nuevas_propuestas: formData.configuracion.notif_nuevas_propuestas,
                        notif_mensajes: formData.configuracion.notif_mensajes,
                        notif_actualizaciones: formData.configuracion.notif_actualizaciones,
                        notif_newsletter: formData.configuracion.notif_newsletter,
                        perfil_publico: formData.configuracion.perfil_publico,
                        mostrar_ubicacion_exacta: formData.configuracion.mostrar_ubicacion_exacta,
                        mostrar_telefono: formData.configuracion.mostrar_telefono,
                        recibir_mensajes_desconocidos: formData.configuracion.recibir_mensajes_desconocidos,
                        distancia_maxima_km: formData.configuracion.distancia_maxima_km
                    } : undefined
                })
            })

            if (!resp.ok) {
                const j = await resp.json().catch(() => ({}))
                throw new Error(j.error || 'Error guardando perfil')
            }

            router.push('/')
        } catch (error) {
            console.error('Error al actualizar perfil:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async (e?: React.SyntheticEvent) => {
        // Prevenir envío/navegación si viene de un submit/click
        e?.preventDefault()

        if (!validatePasswordForm()) return

        setIsLoading(true)

        try {
            const supabase = getSupabaseClient()
            if (!supabase) throw new Error('Supabase no está configurado')
            const { data: { session } } = await supabase.auth.getSession()
            const accessToken = session?.access_token
            if (!accessToken) throw new Error('No hay sesión activa')

            const resp = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            if (!resp.ok) {
                const j = await resp.json().catch(() => ({}))
                throw new Error(j.error || 'Error al cambiar la contraseña')
            }

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setShowPasswordSection(false)
            setGlobalMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' })
            setTimeout(() => setGlobalMessage(null), 4000)
            Swal.fire({
                icon: 'success',
                title: 'Contraseña actualizada',
                text: 'Se cambió la contraseña correctamente.',
                confirmButtonText: 'Aceptar'
            })
        } catch (error) {
            console.error('Error al cambiar contraseña:', error)
            const message = (error as any)?.message || 'No se pudo cambiar la contraseña.'
            setGlobalMessage({ type: 'error', text: message })
            setTimeout(() => setGlobalMessage(null), 5000)
            Swal.fire({
                icon: 'error',
                title: 'Error al cambiar la contraseña',
                text: message,
                confirmButtonText: 'Entendido'
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (!formData) return null

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => router.push('/?m=profile')}
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            Volver
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">
                            Editar Perfil
                        </h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-lg shadow-sm border"
                >
                    {globalMessage && (
                        <div className={`px-6 py-3 rounded-t-lg ${globalMessage.type === 'success' ? 'bg-green-50 text-green-700 border-b border-green-200' : 'bg-red-50 text-red-700 border-b border-red-200'}`}>
                            {globalMessage.text}
                        </div>
                    )}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">
                            Información Personal
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Actualiza tu información personal y preferencias
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-8">
                        {/* Avatar */}
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <img
                                    src={avatarPreview}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('avatar-upload')?.click()}
                                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors"
                                >
                                    <PhotoIcon className="h-4 w-4" />
                                </button>
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Foto de Perfil
                                </h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Sube una nueva imagen para tu perfil. Formato requerido: WebP (se convierte automáticamente).
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => document.getElementById('avatar-upload')?.click()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Cambiar Foto
                                    </button>
                                    {avatarFile && (
                                        <button
                                            type="button"
                                            onClick={removeAvatar}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                        >
                                            Restaurar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Información Personal */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Información Básica
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre *
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.nombre}
                                            onChange={(e) => handleInputChange('nombre', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.nombre ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Tu nombre"
                                        />
                                    </div>
                                    {formErrors.nombre && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.nombre}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Apellido *
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.apellido}
                                            onChange={(e) => handleInputChange('apellido', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.apellido ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Tu apellido"
                                        />
                                    </div>
                                    {formErrors.apellido && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.apellido}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <div className="relative">
                                        <EnvelopeIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="tu@email.com"
                                        />
                                    </div>
                                    {formErrors.email && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={formData.telefono || ''}
                                            onChange={(e) => handleInputChange('telefono', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.telefono ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="+57 300 123 4567"
                                        />
                                    </div>
                                    {formErrors.telefono && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.telefono}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha de Nacimiento
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={formData.fecha_nacimiento || ''}
                                            onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                                    max={getAdultMaxDate()}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.fecha_nacimiento ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {formErrors.fecha_nacimiento && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.fecha_nacimiento}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Departamento
                                    </label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <select
                                            value={formData.ubicacion?.departamento || ''}
                                            onChange={(e) => { handleInputChange('ubicacion.departamento', e.target.value); handleInputChange('ubicacion.ciudad', '') }}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">Selecciona un departamento</option>
                                            {departamentos.map(dep => (
                                                <option key={dep} value={dep}>{dep}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ciudad
                                    </label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <select
                                            value={formData.ubicacion?.ciudad || ''}
                                            onChange={(e) => handleInputChange('ubicacion.ciudad', e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="">Selecciona una ciudad</option>
                                            {getCiudadesForDepartamento(formData.ubicacion?.departamento).map(ci => (
                                                <option key={ci} value={ci}>{ci}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Biografía
                                </label>
                                <textarea
                                    value={formData.biografia || ''}
                                    onChange={(e) => handleInputChange('biografia', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Cuéntanos un poco sobre ti..."
                                />
                            </div>
                        </div>

                        {/* Estadísticas del Usuario */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Estadísticas de tu Cuenta
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{formData.calificacion_promedio.toFixed(1)}</div>
                                    <div className="text-sm text-gray-600">Calificación Promedio</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{formData.total_intercambios}</div>
                                    <div className="text-sm text-gray-600">Intercambios Completados</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">{formData.eco_puntos}</div>
                                    <div className="text-sm text-gray-600">Eco Puntos</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600">Miembro desde</div>
                                    <div className="font-medium">{new Date(formData.fecha_registro).toLocaleDateString('es-CO')}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600">Estado de Verificación</div>
                                    <div className="font-medium flex items-center">
                                        {formData.verificado ? (
                                            <><CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />Verificado</>
                                        ) : (
                                            <><ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />Pendiente</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preferencias de Privacidad */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Preferencias de Privacidad
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Perfil Público</h4>
                                        <p className="text-sm text-gray-600">Permitir que otros usuarios vean tu perfil</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('configuracion.perfil_publico', !formData.configuracion?.perfil_publico)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.configuracion?.perfil_publico ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.configuracion?.perfil_publico ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Mostrar Ubicación Exacta</h4>
                                        <p className="text-sm text-gray-600">Mostrar tu ubicación exacta en tu perfil</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('configuracion.mostrar_ubicacion_exacta', !formData.configuracion?.mostrar_ubicacion_exacta)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.configuracion?.mostrar_ubicacion_exacta ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.configuracion?.mostrar_ubicacion_exacta ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Mostrar Teléfono</h4>
                                        <p className="text-sm text-gray-600">Mostrar tu teléfono en tu perfil público</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('configuracion.mostrar_telefono', !formData.configuracion?.mostrar_telefono)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.configuracion?.mostrar_telefono ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.configuracion?.mostrar_telefono ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Notificaciones de Nuevas Propuestas</h4>
                                        <p className="text-sm text-gray-600">Recibir notificaciones cuando recibas nuevas propuestas</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('configuracion.notif_nuevas_propuestas', !formData.configuracion?.notif_nuevas_propuestas)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.configuracion?.notif_nuevas_propuestas ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.configuracion?.notif_nuevas_propuestas ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Notificaciones de Mensajes</h4>
                                        <p className="text-sm text-gray-600">Recibir notificaciones de nuevos mensajes</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('configuracion.notif_mensajes', !formData.configuracion?.notif_mensajes)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.configuracion?.notif_mensajes ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.configuracion?.notif_mensajes ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Newsletter</h4>
                                        <p className="text-sm text-gray-600">Recibir newsletter con actualizaciones de EcoSwap</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('configuracion.notif_newsletter', !formData.configuracion?.notif_newsletter)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.configuracion?.notif_newsletter ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.configuracion?.notif_newsletter ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Distancia Máxima (km)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={formData.configuracion?.distancia_maxima_km || 50}
                                        onChange={(e) => handleInputChange('configuracion.distancia_maxima_km', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Distancia máxima para mostrar productos cercanos</p>
                                </div>
                            </div>
                        </div>

                        {/* Cambiar Contraseña */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Cambiar Contraseña
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    {showPasswordSection ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>

                            {showPasswordSection && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contraseña Actual *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                                    className={`w-full pr-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Tu contraseña actual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            {passwordErrors.currentPassword && (
                                                <p className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nueva Contraseña *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordData.newPassword}
                                                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                    className={`w-full pr-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                                                        }`}
                                                    placeholder="Mínimo 8 caracteres"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            {passwordErrors.newPassword && (
                                                <p className="text-red-600 text-sm mt-1">{passwordErrors.newPassword}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirmar Nueva Contraseña *
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className={`w-full pr-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                                    }`}
                                                placeholder="Repite la nueva contraseña"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {passwordErrors.confirmPassword && (
                                            <p className="text-red-600 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handlePasswordChange}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                                        </button>
                                    </div>
                                    {globalMessage && (
                                        <div className={`mt-3 text-sm ${globalMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                            {globalMessage.text}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
