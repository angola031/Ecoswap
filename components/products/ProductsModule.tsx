'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    HeartIcon,
    MapPinIcon,
    StarIcon,
    EyeIcon,
    PlusIcon,
    FunnelIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

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
    tipoTransaccion?: string
    precioNegociable?: boolean
    condicionesIntercambio?: string
    queBuscoCambio?: string
}

interface ProductsModuleProps {
    currentUser: User | null
}

export default function ProductsModule({ currentUser }: ProductsModuleProps) {
    const router = useRouter()
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'popular'>('newest')

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

    // Cargar productos desde la API
    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true)

            try {
                // Llamar a la API de productos públicos
                const response = await fetch('/api/products/public?limit=20')
                
                if (!response.ok) {
                    throw new Error('Error al cargar productos')
                }
                
                const data = await response.json()
                const productos = data.productos || []
                
                // Transformar los datos de la API al formato esperado
                const transformedProducts: Product[] = productos.map((p: any) => {
                    // Procesar las imágenes como en el perfil
                    const images = Array.isArray(p.imagenes) 
                        ? p.imagenes
                            .map((img: any) => {
                                // Si es un objeto, extraer la URL
                                if (typeof img === 'object' && img !== null) {
                                    return img.url_imagen || img.url || img.src
                                }
                                // Si ya es un string, usarlo directamente
                                return String(img || '')
                            })
                            .filter((url: string) => url && typeof url === 'string' && url.trim() !== '' && url !== 'undefined' && url !== 'null')
                        : []

                    return {
                        id: p.producto_id.toString(),
                        title: p.titulo,
                        description: p.descripcion,
                        category: p.categoria?.nombre || 'Sin categoría',
                        condition: p.estado || 'usado',
                        price: p.precio || 0,
                        currency: 'COP',
                        location: `${p.ciudad_snapshot || ''}, ${p.departamento_snapshot || ''}`.trim(),
                        images: images,
                    owner: {
                        id: p.user_id.toString(),
                        name: `${p.usuario?.nombre || ''} ${p.usuario?.apellido || ''}`.trim() || 'Usuario',
                        avatar: p.usuario?.foto_perfil || '/default-avatar.png',
                        rating: p.usuario?.calificacion_promedio || 0,
                        email: p.usuario?.email || '',
                        memberSince: '2024-01-01',
                        totalProducts: 1,
                        totalSales: p.usuario?.total_intercambios || 0
                    },
                    createdAt: p.fecha_creacion,
                    views: p.visualizaciones || 0,
                    likes: 0, // TODO: Implementar likes
                    status: 'available',
                    tags: [],
                    specifications: {},
                    tipoTransaccion: p.tipo_transaccion,
                    precioNegociable: p.precio_negociable,
                    condicionesIntercambio: p.condiciones_intercambio,
                    queBuscoCambio: p.que_busco_cambio
                }))

                // Las imágenes ya vienen incluidas en la respuesta de la API
                // No necesitamos cargarlas por separado
                
                // Las estadísticas ya vienen incluidas en la respuesta de la API
                // No necesitamos cargarlas por separado

                setProducts(transformedProducts)
            } catch (error) {
                console.error('Error cargando productos:', error)
                // Mostrar estado vacío si hay error
                setProducts([])
                setFilteredProducts([])
            }
            
            setIsLoading(false)
        }

        loadProducts()
    }, [])

    // Filtrar y ordenar productos
    useEffect(() => {
        let filtered = products

        // Filtro por categoría
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory)
        }

        // Filtro por búsqueda
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.location.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Ordenamiento
        switch (sortBy) {
            case 'price-low':
                filtered = [...filtered].sort((a, b) => a.price - b.price)
                break
            case 'price-high':
                filtered = [...filtered].sort((a, b) => b.price - a.price)
                break
            case 'popular':
                filtered = [...filtered].sort((a, b) => b.likes - a.likes)
                break
            case 'newest':
            default:
                filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                break
        }

        setFilteredProducts(filtered)
    }, [products, selectedCategory, searchQuery, sortBy])

    // Funciones para navegación
    const openProductDetail = (product: Product) => {
        router.push(`/producto/${product.id}`)
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                    <p className="text-gray-600 mt-2">Encuentra y publica productos para intercambiar</p>
                </div>

                <button
                    onClick={handlePublishProduct}
                    className="btn-primary flex items-center space-x-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Publicar Producto</span>
                </button>
            </div>

            {/* Filtros y búsqueda */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Búsqueda */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field w-full pl-10"
                            />
                            <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    {/* Categoría */}
                    <div className="w-full lg:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="input-field w-full"
                        >
                            <option value="all">Todas las categorías</option>
                            <option value="electronics">Electrónicos</option>
                            <option value="sports">Deportes</option>
                            <option value="music">Música</option>
                            <option value="books">Libros</option>
                            <option value="furniture">Muebles</option>
                            <option value="clothing">Ropa</option>
                            <option value="home">Hogar</option>
                            <option value="other">Otros</option>
                        </select>
                    </div>

                    {/* Ordenamiento */}
                    <div className="w-full lg:w-48">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="input-field w-full"
                        >
                            <option value="newest">Más recientes</option>
                            <option value="price-low">Precio: menor a mayor</option>
                            <option value="price-high">Precio: mayor a menor</option>
                            <option value="popular">Más populares</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => openProductDetail(product)}
                        title={currentUser && product.owner?.id === currentUser.id ? 'Tu publicación (interacciones deshabilitadas en el detalle)' : undefined}
                    >
                        {/* Imagen del producto */}
                        <div className="relative h-48 bg-gray-100">
                            {product.images && product.images[0] ? (
                                <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                    Sin imagen
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(product.condition)}`}>
                                    {getConditionLabel(product.condition)}
                                </span>
                            </div>
                            {currentUser && product.owner?.id === currentUser.id && (
                                <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[11px] font-medium bg-gray-900/80 text-white">
                                    Tu publicación
                                </span>
                            )}
                        </div>

                        {/* Información del producto */}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                {product.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {product.description}
                            </p>

                            {/* Precio y tipo de transacción */}
                            <div className="text-lg font-bold text-primary-600 mb-2">
                                {product.tipoTransaccion === 'donacion' ? (
                                    <span className="text-green-600">Gratis</span>
                                ) : product.tipoTransaccion === 'intercambio' ? (
                                    <span className="text-blue-600">Intercambio</span>
                                ) : (
                                    formatPrice(product.price, product.currency)
                                )}
                            </div>
                            
                            {/* Indicadores adicionales */}
                            <div className="flex items-center space-x-2 mb-3">
                                {product.precioNegociable && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        Negociable
                                    </span>
                                )}
                                {product.tipoTransaccion === 'intercambio' && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Intercambio
                                    </span>
                                )}
                                {product.tipoTransaccion === 'donacion' && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        Donación
                                    </span>
                                )}
                            </div>

                            {/* Ubicación */}
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                                <MapPinIcon className="w-4 h-4 mr-1" />
                                <span>{product.location}</span>
                            </div>

                            {/* Propietario */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <img
                                        src={product.owner.avatar}
                                        alt={product.owner.name}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-sm text-gray-700">{product.owner.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <StarIcon className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-gray-600">{product.owner.rating}</span>
                                </div>
                            </div>

                            {/* Estadísticas */}
                            <div className={`flex items-center justify-between text-sm ${currentUser && product.owner?.id === currentUser.id ? 'text-gray-400' : 'text-gray-500'}`}>
                                <div className="flex items-center space-x-1">
                                    <EyeIcon className="w-4 h-4" />
                                    <span>{product.views}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <HeartIcon className="w-4 h-4" />
                                    <span>{product.likes}</span>
                                </div>
                            </div>
                            {currentUser && product.owner?.id === currentUser.id && (
                                <div className="mt-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); router.push(`/editar-producto/${product.id}`) }}
                                        className="w-full px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
                                    >
                                        Editar publicación
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Sin productos */}
            {filteredProducts.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HeartIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
                    <p className="text-gray-600">
                        {searchQuery || selectedCategory !== 'all'
                            ? 'Intenta ajustar los filtros de búsqueda'
                            : 'Sé el primero en publicar un producto'
                        }
                    </p>
                </div>
            )}

        </div>
    )
}
