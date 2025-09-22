'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhoneIcon, EnvelopeIcon, CalendarIcon, EyeIcon, ShareIcon, FlagIcon, StarIcon, MapPinIcon, TagIcon, CurrencyDollarIcon, HeartIcon, ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
  titulo: string
  descripcion: string
  precio: number
  estado: string
  tipo_transaccion: string
  precio_negociable: boolean
  condiciones_intercambio?: string
  que_busco_cambio?: string
  fecha_creacion: string
  categoria_nombre: string
  usuario: {
    user_id: number
    nombre: string
    apellido: string
    email: string
    foto_perfil?: string
    calificacion_promedio: number
    total_intercambios: number
  }
  ubicacion: {
    ciudad: string
    departamento: string
  }
  imagenes: string[]
  total_productos_usuario: number
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isInterested, setIsInterested] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'specifications' | 'seller'>('details')
  const [stats, setStats] = useState({
    views: 0,
    likes: 0
  })

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return

      setIsLoading(true)
      setError(null)

      try {
        // Obtener producto desde la API
        const response = await fetch(`/api/products/${productId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Producto no encontrado')
          }
          throw new Error('Error al cargar el producto')
        }

        const { product } = await response.json()
        setProduct(product)

        // Obtener estadísticas del producto
        try {
          const statsResponse = await fetch(`/api/products/${productId}/stats`)
          if (statsResponse.ok) {
            const { stats: productStats } = await statsResponse.json()
            setStats(productStats)
          }
        } catch (statsError) {
          console.warn('No se pudieron cargar las estadísticas:', statsError)
        }

      } catch (error) {
        console.error('Error cargando producto:', error)
        setError(error instanceof Error ? error.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const nextImage = () => {
    if (product && product.imagenes.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.imagenes.length)
    }
  }

  const prevImage = () => {
    if (product && product.imagenes.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + product.imagenes.length) % product.imagenes.length)
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
        title: product?.titulo,
        text: product?.descripcion,
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

  const formatPrice = (price: number) => {
    return `COP$ ${price.toLocaleString('es-CO')}`
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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
              {product.imagenes.length > 0 ? (
                <img
                  src={product.imagenes[currentImageIndex]}
                  alt={product.titulo}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-lg">Sin imágenes</span>
                </div>
              )}

              {/* Indicador de imagen */}
              {product.imagenes.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-2">
                    {product.imagenes.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de navegación */}
              {product.imagenes.length > 1 && (
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
            {product.imagenes.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.imagenes.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative overflow-hidden rounded-lg border-2 ${index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.titulo} ${index + 1}`}
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
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(product.estado)}`}>
                      {getConditionLabel(product.estado)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.categoria_nombre}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      {product.tipo_transaccion === 'venta' ? 'Venta' :
                       product.tipo_transaccion === 'intercambio' ? 'Intercambio' :
                       product.tipo_transaccion === 'donacion' ? 'Donación' : 'Mixto'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.titulo}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Publicado el {new Date(product.fecha_creacion).toLocaleDateString('es-CO')}</span>
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="w-4 h-4" />
                      <span>{stats.views} vistas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Precio */}
              {product.precio && (
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  {formatPrice(product.precio)}
                </div>
              )}

              {/* Ubicación */}
              <div className="flex items-center text-gray-600 mb-4">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span>{product.ubicacion.ciudad}, {product.ubicacion.departamento}</span>
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
                    <p className="text-gray-700 leading-relaxed">{product.descripcion}</p>

                    {/* Información de intercambio */}
                    {product.condiciones_intercambio && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Condiciones de Intercambio</h4>
                        <p className="text-gray-700">{product.condiciones_intercambio}</p>
                      </div>
                    )}

                    {product.que_busco_cambio && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Qué busco a cambio</h4>
                        <p className="text-gray-700">{product.que_busco_cambio}</p>
                      </div>
                    )}

                    {product.precio_negociable && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          💡 El precio es negociable. ¡Ponte en contacto para acordar!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información del Producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">Estado</dt>
                        <dd className="text-sm text-gray-900">{getConditionLabel(product.estado)}</dd>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">Tipo de Transacción</dt>
                        <dd className="text-sm text-gray-900">
                          {product.tipo_transaccion === 'venta' ? 'Venta' :
                           product.tipo_transaccion === 'intercambio' ? 'Intercambio' :
                           product.tipo_transaccion === 'donacion' ? 'Donación' : 'Mixto'}
                        </dd>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">Categoría</dt>
                        <dd className="text-sm text-gray-900">{product.categoria_nombre}</dd>
                      </div>
                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                        <dd className="text-sm text-gray-900">{product.ubicacion.ciudad}, {product.ubicacion.departamento}</dd>
                      </div>
                      {product.precio && (
                        <div className="border-b border-gray-100 pb-2">
                          <dt className="text-sm font-medium text-gray-500">Precio</dt>
                          <dd className="text-sm text-gray-900">{formatPrice(product.precio)}</dd>
                        </div>
                      )}
                      <div className="border-b border-gray-100 pb-2">
                        <dt className="text-sm font-medium text-gray-500">Precio Negociable</dt>
                        <dd className="text-sm text-gray-900">{product.precio_negociable ? 'Sí' : 'No'}</dd>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'seller' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Información del Vendedor</h3>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={product.usuario.foto_perfil || '/default-avatar.png'}
                        alt={`${product.usuario.nombre} ${product.usuario.apellido}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {product.usuario.nombre} {product.usuario.apellido}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <StarIcon className="w-4 h-4 text-yellow-400" />
                          <span>{product.usuario.calificacion_promedio.toFixed(1)}</span>
                          <span>•</span>
                          <span>{product.usuario.total_intercambios} intercambios</span>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-600">
                          <span>{product.total_productos_usuario} productos</span>
                          <span>Miembro verificado</span>
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
                          <div className="flex items-center space-x-3">
                            <EnvelopeIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-900">{product.usuario.email}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <MapPinIcon className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-900">{product.ubicacion.ciudad}, {product.ubicacion.departamento}</span>
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
