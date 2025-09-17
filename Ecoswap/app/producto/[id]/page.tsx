'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, EyeIcon, ShareIcon, FlagIcon, StarIcon, MapPinIcon, TagIcon, CurrencyDollarIcon, HeartIcon, ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useRouter, useParams } from 'next/navigation'

interface User {
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

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
  category: string
  images: string[]
  location: string
  owner: User
  tags: string[]
  specifications?: Record<string, string>
  createdAt: string
  status: 'available' | 'pending' | 'sold'
  views: number
  likes: number
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isInterested, setIsInterested] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'specifications' | 'seller'>('details')

  // Mock product data - en una app real esto vendría de una API
  const mockProduct: Product = {
    id: '1',
    title: 'iPhone 12 Pro - Excelente Estado',
    description: 'iPhone 12 Pro de 128GB en excelente estado. Incluye cargador original y funda de silicona. Perfecto para intercambio. El dispositivo funciona perfectamente, sin rayones ni daños. Incluye todos los accesorios originales y está desbloqueado para cualquier operador.',
    price: 2500000,
    currency: 'COP',
    condition: 'good',
    category: 'Electrónicos',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=800&h=600&fit=crop'
    ],
    location: 'Pereira, Risaralda',
    owner: {
      id: '1',
      name: 'Carlos Rodríguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      rating: 4.8,
      phone: '+57 300 123 4567',
      email: 'carlos.rodriguez@email.com',
      memberSince: '2024',
      totalProducts: 12,
      totalSales: 8
    },
    tags: ['tecnología', 'smartphone', 'apple', 'usado', 'intercambio'],
    specifications: {
      'Marca': 'Apple',
      'Modelo': 'iPhone 12 Pro',
      'Almacenamiento': '128GB',
      'Color': 'Gris Espacial',
      'Estado': 'Excelente',
      'Incluye': 'Cargador, Funda, Caja Original'
    },
    createdAt: '2024-01-15',
    status: 'available',
    views: 156,
    likes: 23
  }

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))

      // En una app real, aquí harías fetch del producto por ID
      setProduct(mockProduct)
      setIsLoading(false)
    }

    if (productId) {
      loadProduct()
    }
  }, [productId, mockProduct])

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  const handleInterest = () => {
    setIsInterested(!isInterested)
    // Aquí iría la lógica para mostrar interés en el producto
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    // Aquí iría la lógica para dar like al producto
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href
      })
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert('Enlace copiado al portapapeles')
    }
  }

  const handleReport = () => {
    // Aquí iría la lógica para reportar el producto
    alert('Función de reporte en desarrollo')
  }

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'COP') {
      return `COP$ ${price.toLocaleString('es-CO')}`
    }
    return `${currency} ${price.toLocaleString()}`
  }

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      new: 'Nuevo',
      'like-new': 'Como Nuevo',
      good: 'Bueno',
      fair: 'Aceptable',
      poor: 'Usado'
    }
    return labels[condition] || condition
  }

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      new: 'bg-green-100 text-green-800',
      'like-new': 'bg-blue-100 text-blue-800',
      good: 'bg-yellow-100 text-yellow-800',
      fair: 'bg-orange-100 text-orange-800',
      poor: 'bg-red-100 text-red-800'
    }
    return colors[condition] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'Electrónicos': 'Electrónicos',
      'Ropa y Accesorios': 'Ropa y Accesorios',
      'Hogar y Jardín': 'Hogar y Jardín',
      'Deportes': 'Deportes',
      'Libros y Música': 'Libros y Música',
      'Juguetes y Juegos': 'Juguetes y Juegos',
      'Automotriz': 'Automotriz',
      'Salud y Belleza': 'Salud y Belleza',
      'Arte y Artesanías': 'Arte y Artesanías',
      'Otros': 'Otros'
    }
    return labels[category] || category
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Producto no encontrado</h1>
          <p className="text-gray-600 mb-6">El producto que buscas no existe o ha sido removido.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Volver
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                title="Compartir"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleReport}
                className="p-2 text-gray-600 hover:text-red-600 rounded-full hover:bg-gray-100"
                title="Reportar"
              >
                <FlagIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galería de Imágenes */}
          <div className="space-y-4">
            {/* Imagen Principal */}
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="w-full h-96 object-cover"
              />

              {/* Indicador de imagen */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-2">
                  {product.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Botones de navegación */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative overflow-hidden rounded-lg border-2 ${index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del Producto */}
          <div className="space-y-6">
            {/* Header del producto */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(product.condition)}`}>
                      {getConditionLabel(product.condition)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {getCategoryLabel(product.category)}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Publicado el {new Date(product.createdAt).toLocaleDateString('es-CO')}</span>
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{product.views} vistas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precio */}
              <div className="text-3xl font-bold text-blue-600 mb-4">
                {formatPrice(product.price, product.currency)}
              </div>

              {/* Ubicación */}
              <div className="flex items-center text-gray-600 mb-4">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span>{product.location}</span>
              </div>

              {/* Acciones */}
              <div className="flex space-x-3">
                <button
                  onClick={handleInterest}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${isInterested
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isInterested ? 'Interesado ✓' : 'Me Interesa'}
                </button>
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-lg border transition-colors ${isLiked
                      ? 'border-red-500 text-red-600 bg-red-50'
                      : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600'
                    }`}
                >
                  {isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                </button>
                <button className="p-3 rounded-lg border border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs de información */}
            <div className="bg-white rounded-lg shadow-sm">
              {/* Navegación de tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'details', label: 'Detalles', icon: EyeIcon },
                    { id: 'specifications', label: 'Especificaciones', icon: TagIcon },
                    { id: 'seller', label: 'Vendedor', icon: UserIcon }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Contenido de los tabs */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Descripción</h3>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>

                    {product.tags.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Etiquetas</h4>
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
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Especificaciones Técnicas</h3>
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(product.specifications).map(([key, value]) => (
                          <div key={key} className="border-b border-gray-100 pb-2">
                            <dt className="text-sm font-medium text-gray-500">{key}</dt>
                            <dd className="text-sm text-gray-900">{value}</dd>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No hay especificaciones disponibles para este producto.</p>
                    )}
                  </div>
                )}

                {activeTab === 'seller' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información del Vendedor</h3>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={product.owner.avatar}
                        alt={product.owner.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{product.owner.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <StarIcon className="w-4 h-4 text-yellow-400" />
                          <span>{product.owner.rating}</span>
                          <span>•</span>
                          <span>Miembro desde {product.owner.memberSince}</span>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>{product.owner.totalProducts} productos</span>
                          <span>{product.owner.totalSales} ventas</span>
                        </div>
                      </div>
                    </div>

                    {/* Información de contacto */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Información de Contacto</h5>

                      {!showContactInfo ? (
                        <button
                          onClick={() => setShowContactInfo(true)}
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          Mostrar información de contacto
                        </button>
                      ) : (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                          {product.owner.phone && (
                            <div className="flex items-center space-x-3">
                              <PhoneIcon className="w-5 h-5 text-blue-600" />
                              <span className="text-gray-900">{product.owner.phone}</span>
                            </div>
                          )}
                          {product.owner.email && (
                            <div className="flex items-center space-x-3">
                              <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                              <span className="text-gray-900">{product.owner.email}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <MapPinIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-900">{product.location}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
