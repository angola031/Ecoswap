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
    views: number
    likes: number
    createdAt: string
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

    // Cargar datos del perfil mockup
    useEffect(() => {
        const loadProfileData = async () => {
            setIsLoading(true)

            // Simular delay de API
            await new Promise(resolve => setTimeout(resolve, 1000))

            const mockProfileData: ProfileData = {
                id: '1',
                name: 'Carlos Rodríguez',
                email: 'carlos.rodriguez@email.com',
                phone: '+57 300 123 4567',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                location: 'Pereira, Risaralda',
                bio: 'Apasionado por la sostenibilidad y la economía circular. Me encanta intercambiar productos y conocer gente con valores similares. Siempre busco darle una segunda vida a las cosas.',
                joinDate: 'Enero 2023',
                rating: 4.8,
                totalReviews: 23,
                totalProducts: 8,
                totalExchanges: 15,
                totalViews: 1247,
                badges: ['Verificado', 'Vendedor Confiable', 'Eco-Friendly', 'Comunidad Activa'],
                socialLinks: {
                    website: 'https://carlosrodriguez.co',
                    instagram: '@carlos_eco',
                    facebook: 'Carlos Rodríguez Eco'
                }
            }

            const mockUserProducts: UserProduct[] = [
                {
                    id: '1',
                    title: 'iPhone 12 Pro - Excelente Estado',
                    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
                    price: 2500000,
                    currency: 'COP',
                    status: 'available',
                    views: 156,
                    likes: 23,
                    createdAt: '2024-01-15'
                },
                {
                    id: '2',
                    title: 'Guitarra Acústica Yamaha',
                    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                    price: 450000,
                    currency: 'COP',
                    status: 'exchanged',
                    views: 134,
                    likes: 28,
                    createdAt: '2024-01-10'
                },
                {
                    id: '3',
                    title: 'Libros de Literatura Colombiana',
                    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
                    price: 150000,
                    currency: 'COP',
                    status: 'available',
                    views: 67,
                    likes: 12,
                    createdAt: '2024-01-08'
                }
            ]

            const mockUserReviews: UserReview[] = [
                {
                    id: '1',
                    reviewerName: 'Ana María López',
                    reviewerAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
                    rating: 5,
                    comment: 'Excelente vendedor, el iPhone estaba en perfecto estado como lo describió. Muy puntual y amable.',
                    date: '2024-01-20',
                    productTitle: 'iPhone 12 Pro'
                },
                {
                    id: '2',
                    reviewerName: 'Roberto Silva',
                    reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
                    rating: 5,
                    comment: 'Carlos es muy confiable. Los libros llegaron en excelente estado y la entrega fue muy rápida.',
                    date: '2024-01-18',
                    productTitle: 'Libros de Literatura Colombiana'
                },
                {
                    id: '3',
                    reviewerName: 'María Fernanda',
                    reviewerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
                    rating: 4,
                    comment: 'Buen intercambio, la guitarra estaba en buen estado. Recomendado.',
                    date: '2024-01-15',
                    productTitle: 'Guitarra Acústica Yamaha'
                }
            ]

            const mockUserActivities: UserActivity[] = [
                {
                    id: '1',
                    type: 'exchange',
                    title: 'Intercambio Completado',
                    description: 'Intercambiaste tu guitarra acústica por un amplificador',
                    date: 'Hace 2 días',
                    icon: '🤝'
                },
                {
                    id: '2',
                    type: 'product',
                    title: 'Producto Publicado',
                    description: 'Publicaste "iPhone 12 Pro - Excelente Estado"',
                    date: 'Hace 5 días',
                    icon: '📱'
                },
                {
                    id: '3',
                    type: 'review',
                    title: 'Nueva Reseña',
                    description: 'Ana María te dejó una reseña de 5 estrellas',
                    date: 'Hace 1 semana',
                    icon: '⭐'
                },
                {
                    id: '4',
                    type: 'login',
                    title: 'Inicio de Sesión',
                    description: 'Iniciaste sesión desde Pereira, Risaralda',
                    date: 'Hace 2 horas',
                    icon: '🔐'
                }
            ]

            setProfileData(mockProfileData)
            setUserProducts(mockUserProducts)
            setUserReviews(mockUserReviews)
            setUserActivities(mockUserActivities)
            setIsLoading(false)
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
                            src={profileData.avatar}
                            alt={profileData.name}
                            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover"
                        />
                        <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors">
                            <CameraIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Información básica */}
                    <div className="flex-1">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                    {profileData.name}
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

                            <div className="flex space-x-2">
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
                        </div>

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
                    {profileData.badges.map((badge, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full"
                        >
                            {badge}
                        </span>
                    ))}
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
                            <button className="btn-primary">
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                                            {getStatusLabel(product.status)}
                                        </span>
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
