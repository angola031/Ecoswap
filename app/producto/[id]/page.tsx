'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
// Importaciones individuales de Heroicons para evitar problemas de vendor chunks
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { PhoneIcon } from '@heroicons/react/24/outline'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { CalendarIcon } from '@heroicons/react/24/outline'
import { EyeIcon } from '@heroicons/react/24/outline'
import { ShareIcon } from '@heroicons/react/24/outline'
import { FlagIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/outline'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { TagIcon } from '@heroicons/react/24/outline'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { HeartIcon } from '@heroicons/react/24/outline'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { UserIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useRouter, useParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'


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
  especificaciones?: Record<string, string>
}

// Función auxiliar para verificar si el usuario es el propietario
async function checkIfUserIsOwner(authUserId: string, productOwnerId: number): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    const { data: usuario } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    return usuario?.user_id === productOwnerId
  } catch (error) {
    console.error('Error verificando propietario:', error)
    return false
  }
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
  const [isOwner, setIsOwner] = useState(false)
  const [ownerCheckComplete, setOwnerCheckComplete] = useState(false)
  const [isInActiveExchange, setIsInActiveExchange] = useState(false)
  const [stats, setStats] = useState({
    views: 0,
    likes: 0
  })

  useEffect(() => {
    let isMounted = true

    const loadProduct = async () => {
      if (!productId || !isMounted) return

      setIsLoading(true)
      setError(null)

      try {
        // Obtener token si hay sesión para que la API identifique al viewer (y no cuente vistas si es dueño)
        const supabase = getSupabaseClient()
        if (!supabase) {
          console.log('❌ Supabase no está configurado')
          return
        }
        const { data: { session } } = await supabase.auth.getSession()
        const headers: Record<string, string> = {}
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

        // Obtener producto desde la API (ya incluye liked e isOwner)
        const response = await fetch(`/api/products/${productId}`, { headers })
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Producto no encontrado')
          }
          throw new Error('Error al cargar el producto')
        }

        const { product, liked, isOwner: ownerFlag, isInActiveExchange: exchangeFlag } = await response.json()
        
        if (!isMounted) return
        
        // Procesar las imágenes correctamente como en el perfil
        const processedProduct = {
          ...product,
          imagenes: Array.isArray(product.imagenes) 
            ? product.imagenes
                .map((img) => {
                  // Si es un objeto, extraer la URL como en el perfil
                  if (typeof img === 'object' && img !== null) {
                    return img.url_imagen || img.url || img.src
                  }
                  // Si ya es un string, usarlo directamente
                  return String(img || '')
                })
                .filter(img => img && typeof img === 'string' && img.trim() !== '' && img !== 'undefined' && img !== 'null')
            : []
        }
        
        setProduct(processedProduct)
        // Prefijar vistas y likes con los valores de BD si vienen
        if (typeof product.visualizaciones === 'number') {
          setStats(prev => ({ ...prev, views: product.visualizaciones }))
        }
        if (typeof product.total_likes === 'number') {
          setStats(prev => ({ ...prev, likes: product.total_likes }))
        }
        // Establecer liked, isOwner e isInActiveExchange directamente del API
        if (typeof liked === 'boolean') setIsLiked(liked)
        if (typeof ownerFlag === 'boolean') {
          setIsOwner(ownerFlag)
          setOwnerCheckComplete(true)
        }
        if (typeof exchangeFlag === 'boolean') {
          setIsInActiveExchange(exchangeFlag)
        }

      } catch (error) {
        console.error('Error cargando producto:', error)
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Error desconocido')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      isMounted = false
    }
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

  const handleInterest = async () => {
    // Si no hay sesión, redirigir a la interfaz de login del AuthModule
    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
        return
      }
    } catch (e) {
      router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
      return
    }

    if (isOwner) {
      if (process.env.NODE_ENV === 'development') {
      }
      await (window as any).Swal.fire({
        title: 'Acción no permitida',
        text: 'No puedes mostrar interés en tu propia publicación',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3B82F6'
      })
      return
    }

    // Verificar si el producto está en un intercambio activo
    if (isInActiveExchange) {
      await (window as any).Swal.fire({
        title: 'Producto No Disponible',
        text: 'Este producto está actualmente en proceso de intercambio y no está disponible por el momento.',
        icon: 'info',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3B82F6'
      })
      return
    }

    // Verificar si el usuario está verificado
    const { isUserVerified } = await import('@/lib/auth')
    const isVerified = await isUserVerified()
    
    if (!isVerified) {
      // Mostrar mensaje de verificación requerida
      const result = await (window as any).Swal.fire({
        title: 'Verificación Requerida',
        text: 'Por favor, primero verifica tu cuenta para poder mostrar interés en productos.',
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
    // Aquí iría la lógica para mostrar interés en el producto
  }

  const handleLike = async () => {
    if (!product) return
    
    // Si no hay sesión, redirigir a la interfaz de login del AuthModule
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('❌ Supabase no está configurado')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
        return
      }
    } catch (e) {
      router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
      return
    }

    if (isOwner) {
      if (process.env.NODE_ENV === 'development') {
      }
      await (window as any).Swal.fire({
        title: 'Acción no permitida',
        text: 'No puedes dar me gusta a tu propia publicación',
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3B82F6'
      })
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
    
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('❌ Supabase no está configurado')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        await (window as any).Swal.fire({
          title: 'Sesión requerida',
          text: 'Inicia sesión para dar me gusta',
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        })
        return
      }
      const method = isLiked ? 'DELETE' : 'POST'
      
      const res = await fetch(`/api/products/${product.id}/like`, {
        method,
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      
      
      if (res.ok) {
        const newLikedState = !isLiked
        const likesChange = isLiked ? -1 : 1
        console.log('🔍 DEBUG: handleLike - Actualizando estado:', {
          isLiked: isLiked,
          newLikedState: newLikedState,
          likesChange: likesChange,
          currentLikes: stats.likes,
          newLikes: Math.max(0, stats.likes + likesChange)
        })
        
        setIsLiked(newLikedState)
        setStats(prev => ({ ...prev, likes: Math.max(0, prev.likes + likesChange) }))
        
      } else {
        const errorText = await res.text()
      }
    } catch (error) {
      console.error('Error al dar like:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({
        title: product?.titulo,
        text: product?.descripcion,
        url: window.location.href
      })
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href)
      await (window as any).Swal.fire({
        title: 'Enlace copiado',
        text: 'El enlace del producto ha sido copiado al portapapeles',
        icon: 'success',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3B82F6'
      })
    }
  }

  const handleReport = async () => {
    // Aquí iría la lógica para reportar el producto
    await (window as any).Swal.fire({
      title: 'Función en desarrollo',
      text: 'La función de reporte estará disponible próximamente',
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3B82F6'
    })
  }

  const handleChat = async () => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error('❌ Supabase no está configurado')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        router.push(`/?returnUrl=${encodeURIComponent(window.location.pathname)}&auth=true`)
        return
      }
      if (isOwner) {
        router.push(`/chat`)
        return
      }
      
      // Verificar si el producto está en un intercambio activo
      if (isInActiveExchange) {
        await (window as any).Swal.fire({
          title: 'Producto No Disponible',
          text: 'Este producto está actualmente en proceso de intercambio y no está disponible por el momento.',
          icon: 'info',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3B82F6'
        })
        return
      }
      
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          sellerId: product.usuario.user_id,
          productId: product.id
        })
      })
      const result = await response.json()
      if (response.ok && result?.chatId) {
        router.push(`/chat/${result.chatId}`)
      } else {
        router.push('/chat')
      }
    } catch {
      router.push('/chat')
    }
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
              onClick={() => router.push('/?m=products')}
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
                  className="w-full h-96 object-cover rounded-lg"
                  onError={(e) => {
                    console.error('❌ Error cargando imagen:', product.imagenes[currentImageIndex])
                    e.currentTarget.src = '/default-product.png'
                  }}
                  onLoad={() => {
                    console.log('✅ Imagen cargada exitosamente:', product.imagenes[currentImageIndex])
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                  <img
                    src="/default-product.png"
                    alt="Sin imagen"
                    className="w-full h-full object-contain"
                  />
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
                      className="w-full h-20 object-cover rounded-lg"
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
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="w-4 h-4" />
                      <span>{stats.likes} me gusta</span>
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

              {/* Indicador de intercambio activo */}
              {isInActiveExchange && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Producto en proceso de intercambio
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        Este producto no está disponible por el momento ya que se encuentra en un intercambio activo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              
              {/* Acciones */}
              <div className="flex space-x-3">
                <button
                  onClick={handleInterest}
                  disabled={isOwner || isInActiveExchange}
                  aria-disabled={isOwner || isInActiveExchange}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${isOwner || isInActiveExchange
                      ? 'bg-gray-400 text-white cursor-not-allowed pointer-events-none'
                      : isInterested
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {isOwner ? 'Tu publicación' : 
                   isInActiveExchange ? 'No disponible' :
                   (isInterested ? 'Interesado ✓' : 'Me Interesa')}
                </button>
                <button
                  onClick={handleLike}
                  disabled={isOwner}
                  aria-disabled={isOwner}
                  className={`p-3 rounded-lg border transition-colors flex flex-col items-center space-y-1 min-w-[60px] ${isOwner
                      ? 'border-gray-400 text-gray-300 bg-gray-100 cursor-not-allowed pointer-events-none'
                      : isLiked
                        ? 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                  title={isOwner ? 'No puedes dar me gusta a tu propia publicación' : (isLiked ? 'Quitar me gusta' : 'Dar me gusta')}
                >
                  {isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                  <span className={`text-xs font-medium ${isLiked ? 'text-red-600' : 'text-gray-600'}`}>
                    {stats.likes}
                  </span>
                </button>
                <button
                  onClick={handleChat}
                  disabled={isOwner || isInActiveExchange}
                  aria-disabled={isOwner || isInActiveExchange}
                  className={`p-3 rounded-lg border transition-colors ${isOwner || isInActiveExchange
                    ? 'border-gray-400 text-gray-300 bg-gray-100 cursor-not-allowed pointer-events-none'
                    : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
                  }`}
                  title={isOwner ? 'No puedes enviarte mensajes a ti mismo' : 
                        isInActiveExchange ? 'Producto no disponible - en proceso de intercambio' : 
                        'Iniciar chat con el vendedor'}
                >
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
                      {/* Especificaciones técnicas si existen */}
                      {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
                        <div className="md:col-span-2 mt-2">
                          <h4 className="font-medium text-gray-900 mb-2">Especificaciones Técnicas</h4>
                          <div className="grid grid-cols-1 gap-0 border border-gray-200 rounded-md divide-y divide-gray-200">
                            {Object.entries(product.especificaciones).map(([k, v]) => (
                              <div key={k} className="grid grid-cols-2 gap-4 p-3 bg-white">
                                <span className="text-sm text-gray-600">{k}</span>
                                <span className="text-sm text-gray-900 font-medium">{v as string}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

