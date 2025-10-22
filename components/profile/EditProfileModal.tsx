'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    XMarkIcon,
    PhotoIcon,
    TrashIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    GlobeAltIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Avatar from '@/components/ui/Avatar'

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
    phone?: string
    bio?: string
    website?: string
    socialMedia?: {
        instagram?: string
        facebook?: string
        twitter?: string
    }
    preferences?: {
        notifications: boolean
        publicProfile: boolean
        showLocation: boolean
        showPhone: boolean
        showEmail: boolean
    }
}

interface EditProfileModalProps {
    user: User | null
    isOpen: boolean
    onClose: () => void
    onProfileUpdated: (updatedUser: User) => void
}

export default function EditProfileModal({ user, isOpen, onClose, onProfileUpdated }: EditProfileModalProps) {
    const [formData, setFormData] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [showPasswordSection, setShowPasswordSection] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string>('')

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                preferences: {
                    notifications: true,
                    publicProfile: true,
                    showLocation: true,
                    showPhone: false,
                    showEmail: false,
                    ...user.preferences
                }
            })
            setAvatarPreview(user.avatar)
        }
    }, [user])

    // Limpiar mensajes cuando se abre/cierra la sección de contraseña
    useEffect(() => {
        if (showPasswordSection) {
            setPasswordError(null)
            setPasswordSuccess(null)
        }
    }, [showPasswordSection])

    if (!isOpen || !user || !formData) return null

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            if (!prev) return prev
            
            if (field.includes('.')) {
                const [section, key] = field.split('.')
                return {
                    ...prev,
                    [section]: {
                        ...(prev[section as keyof User] as any),
                        [key]: value
                    }
                }
            }
            
            return { ...prev, [field]: value }
        })

        // Limpiar error del campo cuando se actualiza
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const removeAvatar = () => {
        setAvatarFile(null)
        setAvatarPreview(user.avatar)
    }

    const validateForm = () => {
        const errors: Record<string, string> = {}

        if (!formData.name.trim()) errors.name = 'El nombre es requerido'
        if (!formData.email.trim()) errors.email = 'El email es requerido'
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'El email no es válido'
        }
        if (!formData.location.trim()) errors.location = 'La ubicación es requerida'
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

        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsLoading(true)

        try {
            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Aquí se procesaría la imagen del avatar si se cambió
            let finalAvatar = formData.avatar
            if (avatarFile) {
                // Simular subida de imagen
                finalAvatar = URL.createObjectURL(avatarFile)
            }

            const updatedUser = {
                ...formData,
                avatar: finalAvatar
            }

            onProfileUpdated(updatedUser)
            onClose()
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
        setPasswordError(null)
        setPasswordSuccess(null)

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Error al cambiar la contraseña')
            }

            // Éxito
            setPasswordSuccess('Contraseña cambiada exitosamente')
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
            
            // Cerrar la sección de contraseña después de 2 segundos
            setTimeout(() => {
                setShowPasswordSection(false)
                setPasswordSuccess(null)
            }, 2000)

        } catch (error) {
            console.error('Error al cambiar contraseña:', error)
            setPasswordError(error instanceof Error ? error.message : 'Error al cambiar la contraseña')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Editar Perfil</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar */}
                        <div className="text-center">
                            <div className="relative inline-block">
                                <Avatar
                                    src={avatarPreview}
                                    alt="Avatar"
                                    size="xl"
                                    className="border-4 border-gray-200"
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('avatar-input')?.click()}
                                    className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                                >
                                    <PhotoIcon className="w-4 h-4" />
                                </button>
                                {avatarFile && (
                                    <button
                                        type="button"
                                        onClick={removeAvatar}
                                        className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <TrashIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <input
                                id="avatar-input"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Haz clic en el ícono de cámara para cambiar tu foto
                            </p>
                        </div>

                        {/* Información Personal */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <UserIcon className="w-5 h-5 mr-2" />
                                Información Personal
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre Completo *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                                        placeholder="Tu nombre completo"
                                    />
                                    {formErrors.name && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                            {formErrors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
                                        placeholder="tu@email.com"
                                    />
                                    {formErrors.email && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                            {formErrors.email}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Teléfono
                                    </label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`input-field ${formErrors.phone ? 'border-red-500' : ''}`}
                                        placeholder="+57 300 123 4567"
                                    />
                                    {formErrors.phone && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                            {formErrors.phone}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                        Ubicación *
                                    </label>
                                    <select
                                        id="location"
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className={`input-field ${formErrors.location ? 'border-red-500' : ''}`}
                                    >
                                        <option value="">Selecciona tu ciudad</option>
                                        <option value="Pereira, Risaralda">Pereira, Risaralda</option>
                                        <option value="Bogotá D.C.">Bogotá D.C.</option>
                                        <option value="Medellín, Antioquia">Medellín, Antioquia</option>
                                        <option value="Cali, Valle del Cauca">Cali, Valle del Cauca</option>
                                        <option value="Barranquilla, Atlántico">Barranquilla, Atlántico</option>
                                        <option value="Cartagena, Bolívar">Cartagena, Bolívar</option>
                                    </select>
                                    {formErrors.location && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                            {formErrors.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                                    Biografía
                                </label>
                                <textarea
                                    id="bio"
                                    value={formData.bio || ''}
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    className="input-field resize-none"
                                    rows={3}
                                    placeholder="Cuéntanos un poco sobre ti..."
                                    maxLength={200}
                                />
                                <div className="text-right">
                                    <span className="text-sm text-gray-500">
                                        {(formData.bio || '').length}/200
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Enlaces y Redes Sociales */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <GlobeAltIcon className="w-5 h-5 mr-2" />
                                Enlaces y Redes Sociales
                            </h3>

                            <div>
                                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                                    Sitio Web
                                </label>
                                <input
                                    id="website"
                                    type="url"
                                    value={formData.website || ''}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    className="input-field"
                                    placeholder="https://tusitio.com"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                                        Instagram
                                    </label>
                                    <input
                                        id="instagram"
                                        type="text"
                                        value={formData.socialMedia?.instagram || ''}
                                        onChange={(e) => handleInputChange('socialMedia.instagram', e.target.value)}
                                        className="input-field"
                                        placeholder="@usuario"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                                        Facebook
                                    </label>
                                    <input
                                        id="facebook"
                                        type="text"
                                        value={formData.socialMedia?.facebook || ''}
                                        onChange={(e) => handleInputChange('socialMedia.facebook', e.target.value)}
                                        className="input-field"
                                        placeholder="usuario.facebook"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                                        Twitter
                                    </label>
                                    <input
                                        id="twitter"
                                        type="text"
                                        value={formData.socialMedia?.twitter || ''}
                                        onChange={(e) => handleInputChange('socialMedia.twitter', e.target.value)}
                                        className="input-field"
                                        placeholder="@usuario"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preferencias de Privacidad */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                                Preferencias de Privacidad
                            </h3>

                            <div className="space-y-3">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferences?.publicProfile || false}
                                        onChange={(e) => handleInputChange('preferences.publicProfile', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Perfil público</span>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferences?.showLocation || false}
                                        onChange={(e) => handleInputChange('preferences.showLocation', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Mostrar ubicación</span>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferences?.showPhone || false}
                                        onChange={(e) => handleInputChange('preferences.showPhone', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Mostrar teléfono</span>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferences?.showEmail || false}
                                        onChange={(e) => handleInputChange('preferences.showEmail', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Mostrar email</span>
                                </label>

                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.preferences?.notifications || false}
                                        onChange={(e) => handleInputChange('preferences.notifications', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Recibir notificaciones</span>
                                </label>
                            </div>
                        </div>

                        {/* Cambiar Contraseña */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Contraseña</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                >
                                    {showPasswordSection ? 'Ocultar' : 'Cambiar contraseña'}
                                </button>
                            </div>

                            {showPasswordSection && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    {/* Mensajes de éxito y error */}
                                    {passwordSuccess && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                            <div className="flex items-center">
                                                <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                                                <p className="text-sm text-green-700">{passwordSuccess}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {passwordError && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                            <div className="flex items-center">
                                                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                                                <p className="text-sm text-red-700">{passwordError}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                            Contraseña Actual
                                        </label>
                                        <input
                                            id="currentPassword"
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                            className="input-field"
                                            placeholder="Tu contraseña actual"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                Nueva Contraseña
                                            </label>
                                            <input
                                                id="newPassword"
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                                className="input-field"
                                                placeholder="Mínimo 8 caracteres"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirmar Contraseña
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                className="input-field"
                                                placeholder="Repite la nueva contraseña"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handlePasswordChange}
                                        disabled={isLoading}
                                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                                    >
                                        {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Botones */}
                        <div className="flex space-x-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </motion.div>
    )
}
