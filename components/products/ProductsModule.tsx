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
import { supabase } from '@/lib/supabase'

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
        console.log('🔍 DEBUG: Verificando estado del usuario desde ProductsModule...')
        const { isUserVerified } = await import('@/lib/auth')
        const isVerified = await isUserVerified()
        console.log('🔍 DEBUG: Usuario verificado desde ProductsModule:', isVerified)
        
        if (!isVerified) {
            console.log('🔍 DEBUG: Usuario no verificado, mostrando mensaje desde ProductsModule...')
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
                
                const { products } = await response.json()
                
                // Transformar los datos de la API al formato esperado
                let transformedProducts: Product[] = products.map((p: any) => ({
                    id: p.producto_id.toString(),
                    title: p.titulo,
                    description: p.descripcion,
                    category: p.categoria_nombre || 'Sin categoría',
                    condition: p.estado || 'usado',
                    price: p.precio || 0,
                    currency: 'COP',
                    location: `${p.ciudad || ''}, ${p.departamento || ''}`.trim(),
                    images: [],
                    owner: {
                        id: p.user_id.toString(),
                        name: p.usuario_nombre || 'Usuario',
                        avatar: p.usuario_foto || '/default-avatar.png',
                        rating: p.usuario_calificacion || 0,
                        email: '',
                        memberSince: '2024-01-01',
                        totalProducts: 1,
                        totalSales: 0
                    },
                    createdAt: p.fecha_creacion,
                    views: 0,
                    likes: 0,
                    status: 'available',
                    tags: [],
                    specifications: {}
                }))

                // Cargar imagen principal por producto desde Supabase
                try {
                    const ids = transformedProducts.map(p => Number(p.id))
                    if (ids.length > 0) {
                        const { data: imgs } = await supabase
                            .from('imagen_producto')
                            .select('producto_id, url_imagen, es_principal, orden')
                            .in('producto_id', ids)
                            .order('es_principal', { ascending: false })
                            .order('orden', { ascending: true })

                        const firstByProduct = new Map<number, string>()
                        ;(imgs || []).forEach((row: any) => {
                            const pid = Number(row.producto_id)
                            if (!firstByProduct.has(pid)) {
                                firstByProduct.set(pid, row.url_imagen)
                            }
                        })

                        transformedProducts = transformedProducts.map(p => ({
                            ...p,
                            images: firstByProduct.has(Number(p.id)) ? [firstByProduct.get(Number(p.id)) as string] : []
                        }))
                    }
                } catch (_) {
                    // Si falla, seguimos con imágenes vacías y se mostrará placeholder
                }
                
                // Cargar estadísticas (vistas/likes) para cada producto en paralelo
                try {
                    const statsResults = await Promise.all(
                        transformedProducts.map(async (p) => {
                            try {
                                const res = await fetch(`/api/products/${p.id}/stats`)
                                if (!res.ok) return { id: p.id, views: 0, likes: 0 }
                                const { stats } = await res.json()
                                return { id: p.id, views: Number(stats?.views || 0), likes: Number(stats?.likes || 0) }
                            } catch {
                                return { id: p.id, views: 0, likes: 0 }
                            }
                        })
                    )
                    const idToStats = new Map(statsResults.map(s => [s.id, s]))
                    transformedProducts = transformedProducts.map(p => ({
                        ...p,
                        views: idToStats.get(p.id)?.views ?? p.views,
                        likes: idToStats.get(p.id)?.likes ?? p.likes,
                    }))
                } catch {}

                setProducts(transformedProducts)
            } catch (error) {
                console.error('Error cargando productos:', error)
                // Fallback a datos mock si hay error
                const mockProducts: Product[] = [
                    {
                    id: '1',
                    title: 'iPhone 12 Pro - Excelente Estado',
                    description: 'iPhone 12 Pro de 128GB en excelente estado. Incluye cargador original y funda de silicona. Perfecto para intercambio.',
                    category: 'electronics',
                    condition: 'excellent',
                    price: 2500000,
                    currency: 'COP',
                    location: 'Pereira, Risaralda',
                    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'],
                    owner: {
                        id: '1',
                        name: 'Carlos Rodríguez',
                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                        rating: 4.8,
                        phone: '+57 300 123 4567',
                        email: 'carlos.rodriguez@email.com',
                        memberSince: '2024',
                        totalProducts: 12,
                        totalSales: 8
                    },
                    createdAt: '2024-01-15',
                    views: 156,
                    likes: 23,
                    status: 'available',
                    tags: ['iPhone', 'Apple', 'Smartphone', 'Tecnología'],
                    specifications: {
                        'Capacidad': '128GB',
                        'Color': 'Azul',
                        'Estado de la batería': '95%',
                        'Incluye': 'Cargador original, funda'
                    }
                },
                {
                    id: '2',
                    title: 'Bicicleta de Montaña Trek',
                    description: 'Bicicleta de montaña Trek en muy buen estado. Ideal para deportes y recreación. Incluye casco y luces.',
                    category: 'sports',
                    condition: 'good',
                    price: 800000,
                    currency: 'COP',
                    location: 'Medellín, Antioquia',
                    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop'],
                    owner: {
                        id: '2',
                        name: 'Ana María López',
                        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
                        rating: 4.9,
                        phone: '+57 300 987 6543',
                        email: 'ana.maria@email.com',
                        memberSince: '2023',
                        totalProducts: 8,
                        totalSales: 5
                    },
                    createdAt: '2024-01-18',
                    views: 89,
                    likes: 15,
                    status: 'available',
                    tags: ['Bicicleta', 'Deportes', 'Trek', 'Montaña'],
                    specifications: {
                        'Marca': 'Trek',
                        'Tamaño': 'M (18")',
                        'Material': 'Aluminio',
                        'Incluye': 'Casco, luces'
                    }
                },
                {
                    id: '3',
                    title: 'Guitarra Acústica Yamaha',
                    description: 'Guitarra acústica Yamaha en excelente estado. Perfecta para principiantes y músicos intermedios.',
                    category: 'music',
                    condition: 'excellent',
                    price: 450000,
                    currency: 'COP',
                    location: 'Cali, Valle del Cauca',
                    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
                    owner: {
                        id: '3',
                        name: 'Roberto Silva',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
                        rating: 4.7,
                        phone: '+57 310 456 7890',
                        email: 'roberto.silva@email.com',
                        memberSince: '2023',
                        totalProducts: 15,
                        totalSales: 12
                    },
                    createdAt: '2024-01-20',
                    views: 67,
                    likes: 12,
                    status: 'available',
                    tags: ['Guitarra', 'Música', 'Yamaha', 'Acústica'],
                    specifications: {
                        'Marca': 'Yamaha',
                        'Modelo': 'F310',
                        'Cuerdas': '6',
                        'Incluye': 'Estuche, púas'
                    }
                },
                {
                    id: '4',
                    title: 'Libros de Literatura Colombiana',
                    description: 'Colección de libros de literatura colombiana clásica. Incluye obras de García Márquez, Álvaro Mutis y otros.',
                    category: 'books',
                    condition: 'good',
                    price: 150000,
                    currency: 'COP',
                    location: 'Bogotá D.C.',
                    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop'],
                    owner: {
                        id: '4',
                        name: 'María Fernanda',
                        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
                        rating: 4.6,
                        phone: '+57 315 123 4567',
                        email: 'maria.fernanda@email.com',
                        memberSince: '2022',
                        totalProducts: 25,
                        totalSales: 18
                    },
                    createdAt: '2024-01-22',
                    views: 45,
                    likes: 8,
                    status: 'available',
                    tags: ['Libros', 'Literatura', 'Colombia', 'García Márquez'],
                    specifications: {
                        'Género': 'Literatura',
                        'Idioma': 'Español',
                        'Estado': 'Bueno',
                        'Incluye': '5 libros'
                    }
                },
                {
                    id: '5',
                    title: 'Mesa de Centro Artesanal',
                    description: 'Mesa de centro hecha a mano con madera de pino. Diseño rústico y elegante, perfecta para sala.',
                    category: 'furniture',
                    condition: 'good',
                    price: 350000,
                    currency: 'COP',
                    location: 'Barranquilla, Atlántico',
                    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop'],
                    owner: {
                        id: '5',
                        name: 'Carlos Andrés',
                        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face',
                        rating: 4.5,
                        phone: '+57 300 555 1234',
                        email: 'carlos.andres@email.com',
                        memberSince: '2024',
                        totalProducts: 6,
                        totalSales: 3
                    },
                    createdAt: '2024-01-25',
                    views: 34,
                    likes: 6,
                    status: 'available',
                    tags: ['Mesa', 'Muebles', 'Artesanal', 'Madera'],
                    specifications: {
                        'Material': 'Pino',
                        'Dimensiones': '120x60x45 cm',
                        'Color': 'Natural',
                        'Incluye': 'Mesa sola'
                    }
                }
            ]

                setProducts(mockProducts)
                setFilteredProducts(mockProducts)
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

                            {/* Precio */}
                            <div className="text-lg font-bold text-primary-600 mb-3">
                                {formatPrice(product.price, product.currency)}
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
