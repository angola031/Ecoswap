'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    XMarkIcon,
    HeartIcon,
    ChatBubbleLeftRightIcon,
    MapPinIcon,
    StarIcon,
    PhoneIcon,
    EnvelopeIcon,
    CalendarIcon,
    EyeIcon,
    ShareIcon,
    FlagIcon
} from '@heroicons/react/24/outline'
import Avatar from '@/components/ui/Avatar'

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
}

interface Product {
    id: string
    title: string
    description: string
    category: string
    condition: string
    price: number
    currency: string
    location: string
    images: string[]
    owner: {
        id: string
        name: string
        avatar: string
        rating: number
        phone?: string
        email?: string
        memberSince: string
        totalProducts: number
        totalSales: number
    }
    createdAt: string
    views: number
    likes: number
    status: string
    tags: string[]
    specifications?: Record<string, string>
}

interface ProductDetailModalProps {
    product: Product | null
    isOpen: boolean
    onClose: () => void
    currentUser: User | null
}

export default function ProductDetailModal({ product, isOpen, onClose, currentUser }: ProductDetailModalProps) {
    const router = useRouter()
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isInterested, setIsInterested] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const [showContactInfo, setShowContactInfo] = useState(false)
    const [activeTab, setActiveTab] = useState<'details' | 'specifications' | 'seller'>('details')

    if (!isOpen || !product) return null

    const nextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === product.images.length - 1 ? 0 : prev + 1
        )
    }

    const prevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? product.images.length - 1 : prev - 1
        )
    }

    const handleInterest = async () => {
        // Si no hay sesión, redirigir a la interfaz de login del AuthModule
        try {
            const { getCurrentUser } = await import('@/lib/auth')
            const user = await getCurrentUser()
            if (!user) {
                router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
                return
            }
        } catch (e) {
            router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
            return
        }

        // Verificar si el usuario está verificado
        const { isUserVerified } = await import('@/lib/auth')
        const isVerified = await isUserVerified()
        
        if (!isVerified) {
            // Mostrar mensaje de verificación requerida
            const result = await (window as any).Swal.fire({
                title: 'Verificación Requerida',
                text: 'Por favor, primero verifica tu cuenta para poder dar "Me interesa" a productos.',
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

        setIsInterested(!isInterested)
        // Aquí se podría implementar la lógica para contactar al vendedor
    }

    const handleLike = async () => {
        // Si no hay sesión, redirigir a la interfaz de login del AuthModule
        try {
            const { getCurrentUser } = await import('@/lib/auth')
            const user = await getCurrentUser()
            if (!user) {
                router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
                return
            }
        } catch (e) {
            router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
            return
        }

        // Verificar si el usuario está verificado
        const { isUserVerified } = await import('@/lib/auth')
        const isVerified = await isUserVerified()
        
        if (!isVerified) {
            // Mostrar mensaje de verificación requerida
            const result = await (window as any).Swal.fire({
                title: 'Verificación Requerida',
                text: 'Por favor, primero verifica tu cuenta para poder dar like a productos.',
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

        setIsLiked(!isLiked)
        // Aquí se podría implementar la lógica para dar like al producto
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.title,
                text: product.description,
                url: window.location.href
            })
        } else {
            // Fallback para navegadores que no soportan Web Share API
            navigator.clipboard.writeText(window.location.href);
            (window as any).Swal.fire({
                title: 'Enlace Copiado',
                text: 'El enlace se ha copiado al portapapeles',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            })
        }
    }

    const handleReport = async () => {
        const result = await (window as any).Swal.fire({
            title: 'Reportar Producto',
            text: '¿Estás seguro de que quieres reportar este producto?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, Reportar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280'
        })
        
        if (result.isConfirmed) {
            // Aquí se implementaría la lógica para reportar el producto
            (window as any).Swal.fire({
                title: 'Producto Reportado',
                text: 'Producto reportado. Revisaremos el contenido.',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            })
        }
    }

    // Funciones de utilidad
    const formatPrice = (price: number, currency: string) => {
        if (currency === 'COP') {
            return `COP$ ${price.toLocaleString('es-CO')}`
        }
        return `${currency} ${price.toLocaleString()}`
    }

    const getConditionLabel = (condition: string) => {
        const labels: Record<string, string> = {
            new: 'Nuevo',
            excellent: 'Excelente',
            good: 'Bueno',
            fair: 'Regular',
            poor: 'Malo'
        }
        return labels[condition] || condition
    }

    const getConditionColor = (condition: string) => {
        const colors: Record<string, string> = {
            new: 'bg-green-100 text-green-800',
            excellent: 'bg-blue-100 text-blue-800',
            good: 'bg-yellow-100 text-yellow-800',
            fair: 'bg-orange-100 text-orange-800',
            poor: 'bg-red-100 text-red-800'
        }
        return colors[condition] || 'bg-gray-100 text-gray-800'
    }

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            electronics: 'Electrónicos',
            sports: 'Deportes',
            music: 'Música',
            books: 'Libros',
            furniture: 'Muebles',
            clothing: 'Ropa',
            home: 'Hogar',
            other: 'Otros'
        }
        return labels[category] || category
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
                className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del modal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getConditionColor(product.condition)}`}>
                            <span className="text-sm font-medium">{getConditionLabel(product.condition)}</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-500">
                                    Publicado el {new Date(product.createdAt).toLocaleDateString('es-CO')}
                                </span>
                                <span className="text-sm text-gray-500">•</span>
                                <span className="text-sm text-gray-500 capitalize">{getCategoryLabel(product.category)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Compartir"
                        >
                            <ShareIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleReport}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reportar"
                        >
                            <FlagIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
                    {/* Galería de imágenes */}
                    <div className="lg:w-1/2 p-6">
                        <div className="space-y-4">
                            {/* Imagen principal */}
                            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={product.title}
                                    className="w-full h-80 object-cover"
                                />

                                {/* Navegación de imágenes */}
                                {product.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </>
                                )}

                                {/* Indicador de imagen */}
                                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                    <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded-full">
                                        {currentImageIndex + 1} de {product.images.length}
                                    </span>
                                </div>
                            </div>

                            {/* Miniaturas */}
                            {product.images.length > 1 && (
                                <div className="flex space-x-2 overflow-x-auto">
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                                                ? 'border-primary-500'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`Imagen ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información del producto */}
                    <div className="lg:w-1/2 p-6 border-l border-gray-200">
                        <div className="h-full flex flex-col">
                            {/* Navegación de pestañas */}
                            <div className="border-b border-gray-200 mb-6">
                                <nav className="flex space-x-8">
                                    {[
                                        { id: 'details', name: 'Detalles', icon: EyeIcon },
                                        { id: 'specifications', name: 'Especificaciones', icon: StarIcon },
                                        { id: 'seller', name: 'Vendedor', icon: MapPinIcon }
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
                            <div className="flex-1 overflow-y-auto">
                                {/* Pestaña Detalles */}
                                {activeTab === 'details' && (
                                    <div className="space-y-6">
                                        {/* Precio */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="text-3xl font-bold text-primary-600 mb-2">
                                                {formatPrice(product.price, product.currency)}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Precio fijo • No negociable
                                            </p>
                                        </div>

                                        {/* Descripción */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                {product.description}
                                            </p>
                                        </div>

                                        {/* Tags */}
                                        {product.tags && product.tags.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Etiquetas</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Estadísticas */}
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                                                <div className="text-2xl font-bold text-gray-900">{product.views}</div>
                                                <div className="text-sm text-gray-600">Visualizaciones</div>
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                                                <div className="text-2xl font-bold text-gray-900">{product.likes}</div>
                                                <div className="text-sm text-gray-600">Me gusta</div>
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                                                <div className="text-2xl font-bold text-gray-900">0</div>
                                                <div className="text-sm text-gray-600">Interesados</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Pestaña Especificaciones */}
                                {activeTab === 'specifications' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Especificaciones Técnicas</h3>

                                        {product.specifications ? (
                                            <div className="space-y-4">
                                                {Object.entries(product.specifications).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                                                        <span className="font-medium text-gray-700 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </span>
                                                        <span className="text-gray-600">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500 py-8">
                                                <StarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                <p>No hay especificaciones técnicas disponibles</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Pestaña Vendedor */}
                                {activeTab === 'seller' && (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Información del Vendedor</h3>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center space-x-4 mb-4">
                                                <Avatar
                                                    src={product.owner.avatar}
                                                    alt={product.owner.name}
                                                    size="xl"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 text-lg">{product.owner.name}</h4>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
                                                        <StarIcon className="w-4 h-4 text-yellow-400" />
                                                        <span>{product.owner.rating}</span>
                                                        <span>• Miembro desde {product.owner.memberSince}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                                                        <MapPinIcon className="w-4 h-4" />
                                                        <span>{product.location}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-gray-900">{product.owner.totalProducts}</div>
                                                    <div className="text-sm text-gray-600">Productos</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-gray-900">{product.owner.totalSales}</div>
                                                    <div className="text-sm text-gray-600">Ventas</div>
                                                </div>
                                            </div>

                                            {/* Información de contacto */}
                                            {showContactInfo ? (
                                                <div className="space-y-3 pt-4 border-t border-gray-200">
                                                    {product.owner.phone && (
                                                        <div className="flex items-center space-x-2">
                                                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-600">{product.owner.phone}</span>
                                                        </div>
                                                    )}
                                                    {product.owner.email && (
                                                        <div className="flex items-center space-x-2">
                                                            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm text-gray-600">{product.owner.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setShowContactInfo(true)}
                                                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                                                >
                                                    Mostrar Información de Contacto
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Acciones */}
                            <div className="pt-6 border-t border-gray-200">
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleInterest}
                                        className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${isInterested
                                            ? 'bg-green-600 text-white'
                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                            }`}
                                    >
                                        {isInterested ? '✓ Interesado' : 'Me Interesa'}
                                    </button>
                                    <button
                                        onClick={handleLike}
                                        className={`p-3 rounded-lg border-2 transition-colors ${isLiked
                                            ? 'border-red-500 text-red-500 bg-red-50'
                                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                                            }`}
                                    >
                                        <HeartIcon className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                    </button>
                                    <button className="p-3 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-gray-400 transition-colors">
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 border-t border-blue-200 p-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para un intercambio seguro</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Revisa el perfil y calificaciones del vendedor</li>
                        <li>• Acuerda el lugar de encuentro en un lugar público</li>
                        <li>• Verifica el producto antes de completar el intercambio</li>
                        <li>• Usa el chat integrado para coordinar detalles</li>
                    </ul>
                </div>
            </motion.div>
        </motion.div>
    )
}
