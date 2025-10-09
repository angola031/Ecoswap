'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhotoIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, UserIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, GlobeAltIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadUserProfileImage } from '@/lib/storage'

interface User {
    id: string
    name: string
    email: string
    phone?: string
    avatar: string
    bio?: string
    location?: string
    website?: string
    instagram?: string
    facebook?: string
    twitter?: string
    rating: number
    memberSince: string
    totalProducts: number
    totalSales: number
    preferences: {
        publicProfile: boolean
        showLocation: boolean
        showPhone: boolean
        showEmail: boolean
        notifications: boolean
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

    useEffect(() => {
        const load = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                const email = session?.user?.email
                if (!email) return

                const { data: dbUser } = await supabase
                    .from('usuario')
                    .select('*')
                    .eq('email', email)
                    .single()

                if (!dbUser) return

                const { data: loc } = await supabase
                    .from('ubicacion')
                    .select('ciudad, departamento, es_principal')
                    .eq('user_id', dbUser.user_id)
                    .eq('es_principal', true)
                    .single()

                const name = [dbUser.nombre, dbUser.apellido].filter(Boolean).join(' ').trim()
                const composedLocation = loc ? `${loc.ciudad || ''}${loc.departamento ? ', ' + loc.departamento : ''}` : ''

                const user: User = {
                    id: String(dbUser.user_id),
                    name,
                    email: dbUser.email,
                    phone: dbUser.telefono || '',
                    avatar: dbUser.foto_perfil || '/api/placeholder/150/150',
                    bio: dbUser.biografia || '',
                    location: composedLocation,
                    website: '',
                    instagram: '',
                    facebook: '',
                    twitter: '',
                    rating: typeof dbUser.calificacion_promedio === 'number' ? dbUser.calificacion_promedio : 0,
                    memberSince: dbUser.fecha_registro || '',
                    totalProducts: typeof dbUser.total_productos === 'number' ? dbUser.total_productos : 0,
                    totalSales: 0,
                    preferences: {
                        publicProfile: true,
                        showLocation: true,
                        showPhone: false,
                        showEmail: false,
                        notifications: true
                    }
                }

                setFormData(user)
                setAvatarPreview(user.avatar)
            } catch (e) {
                // noop
            }
        }
        load()
    }, [])

    const handleInputChange = (field: string, value: string | boolean) => {
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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatarFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string)
            }
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

        if (!formData.name.trim()) errors.name = 'El nombre es requerido'
        if (!formData.email.trim()) errors.email = 'El email es requerido'
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'El email no es válido'
        }
        if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
            errors.phone = 'El teléfono no es válido'
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
            // Obtener usuario autenticado
            const { data: { session } } = await supabase.auth.getSession()
            const email = session?.user?.email
            if (!email) throw new Error('No hay sesión activa')

            // Buscar registro en tabla usuario
            const { data: dbUser, error: fetchErr } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', email)
                .single()
            if (fetchErr || !dbUser) throw new Error('Usuario no encontrado')

            let newAvatarUrl: string | undefined

            // Subir avatar si hay archivo
            if (avatarFile) {
                const upload = await uploadUserProfileImage({ userId: dbUser.user_id, file: avatarFile, type: 'perfil' })
                if (upload.error) throw new Error(upload.error)
                newAvatarUrl = upload.result?.publicUrl || undefined
            }

            // Actualizar datos básicos
            const updatePayload: any = {
                nombre: formData.name?.split(' ')[0] || null,
                apellido: formData.name?.split(' ').slice(1).join(' ') || null,
                telefono: formData.phone || null,
                biografia: formData.bio || null
            }
            if (newAvatarUrl) updatePayload.foto_perfil = newAvatarUrl

            const { error: updateErr } = await supabase
                .from('usuario')
                .update(updatePayload)
                .eq('user_id', dbUser.user_id)

            if (updateErr) throw new Error(updateErr.message)

            // Actualizar ubicación principal si cambió
            if (typeof formData.location === 'string') {
                const [ciudadRaw, departamentoRaw] = formData.location.split(',').map(s => s?.trim()).filter(Boolean)
                const ciudad = ciudadRaw || null
                const departamento = departamentoRaw || null

                const { data: principal } = await supabase
                    .from('ubicacion')
                    .select('ubicacion_id')
                    .eq('user_id', dbUser.user_id)
                    .eq('es_principal', true)
                    .single()

                if (principal) {
                    await supabase
                        .from('ubicacion')
                        .update({ ciudad, departamento })
                        .eq('ubicacion_id', principal.ubicacion_id)
                } else if (ciudad || departamento) {
                    await supabase
                        .from('ubicacion')
                        .insert({ user_id: dbUser.user_id, pais: 'Colombia', ciudad, departamento, es_principal: true })
                }
            }

            router.push('/')
        } catch (error) {
            console.error('Error al actualizar perfil:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validatePasswordForm()) return

        setIsLoading(true)

        try {
            // Simular cambio de contraseña
            await new Promise(resolve => setTimeout(resolve, 2000))

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setShowPasswordSection(false)
        } catch (error) {
            console.error('Error al cambiar contraseña:', error)
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
                                    Sube una nueva imagen para tu perfil. Formatos soportados: JPG, PNG, GIF.
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
                                        Nombre Completo *
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="Tu nombre completo"
                                        />
                                    </div>
                                    {formErrors.name && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
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
                                            value={formData.phone || ''}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.phone ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                            placeholder="+57 300 123 4567"
                                        />
                                    </div>
                                    {formErrors.phone && (
                                        <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Ubicación
                                    </label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={formData.location || ''}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ciudad, País"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Biografía
                                </label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Cuéntanos un poco sobre ti..."
                                />
                            </div>
                        </div>

                        {/* Enlaces y Redes Sociales */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                Enlaces y Redes Sociales
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sitio Web
                                    </label>
                                    <div className="relative">
                                        <GlobeAltIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                        <input
                                            type="url"
                                            value={formData.website || ''}
                                            onChange={(e) => handleInputChange('website', e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://mi-sitio.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Instagram
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.instagram || ''}
                                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="@usuario"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Facebook
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.facebook || ''}
                                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="usuario.facebook"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.twitter || ''}
                                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="@usuario"
                                    />
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
                                        onClick={() => handleInputChange('preferences.publicProfile', !formData.preferences.publicProfile)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.publicProfile ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.publicProfile ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Mostrar Ubicación</h4>
                                        <p className="text-sm text-gray-600">Mostrar tu ciudad en tu perfil público</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('preferences.showLocation', !formData.preferences.showLocation)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.showLocation ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.showLocation ? 'translate-x-6' : 'translate-x-1'
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
                                        onClick={() => handleInputChange('preferences.showPhone', !formData.preferences.showPhone)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.showPhone ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.showPhone ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Mostrar Email</h4>
                                        <p className="text-sm text-gray-600">Mostrar tu email en tu perfil público</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('preferences.showEmail', !formData.preferences.showEmail)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.showEmail ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.showEmail ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Notificaciones</h4>
                                        <p className="text-sm text-gray-600">Recibir notificaciones por email</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleInputChange('preferences.notifications', !formData.preferences.notifications)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.notifications ? 'bg-blue-600' : 'bg-gray-200'
                                            }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
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
                                <form onSubmit={handlePasswordChange} className="space-y-4 p-4 bg-gray-50 rounded-md">
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
                                            type="submit"
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                                        </button>
                                    </div>
                                </form>
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
