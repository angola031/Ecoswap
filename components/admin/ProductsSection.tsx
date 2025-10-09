'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
    producto_id: number
    titulo: string
    descripcion: string
    precio: number
    categoria_nombre: string
    estado: string
    tipo_transaccion: string
    estado_validacion: 'pending' | 'approved' | 'rejected'
    fecha_creacion: string
    fecha_validacion?: string
    user_id: number
    usuario_nombre: string
    usuario_apellido: string
    usuario_email: string
    comentarios_validacion?: string
    validado_por?: number
    precio_negociable?: boolean
    imagenes: Array<{
        imagen_id: number
        url_imagen: string
        es_principal: boolean
        orden: number
    }>
}

interface ProductsSectionProps {
    user?: any
}

export default function ProductsSection({ user }: ProductsSectionProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'published' | 'pending' | 'rejected'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showImageModal, setShowImageModal] = useState(false)
    const [selectedProductImages, setSelectedProductImages] = useState<Product['imagenes']>([])
    const [selectedProductTitle, setSelectedProductTitle] = useState('')
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [selectedProductForPreview, setSelectedProductForPreview] = useState<Product | null>(null)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [selectedProductForReject, setSelectedProductForReject] = useState<Product | null>(null)
    const [rejectReason, setRejectReason] = useState('')

    useEffect(() => {
        let isMounted = true

        const fetchProducts = async () => {
            try {
                
                // Consultar directamente la base de datos como hace UsersSection
                const { data: products, error } = await supabase
                    .from('producto')
                    .select(`
                        producto_id,
                        titulo,
                        descripcion,
                        precio,
                        estado,
                        tipo_transaccion,
                        estado_validacion,
                        fecha_creacion,
                        fecha_validacion,
                        comentarios_validacion,
                        validado_por,
                        precio_negociable,
                        usuario:user_id(
                            user_id,
                            nombre,
                            apellido,
                            email
                        ),
                        categoria:categoria_id(
                            nombre
                        ),
                        imagenes:imagen_producto(
                            imagen_id,
                            url_imagen,
                            es_principal,
                            orden
                        )
                    `)
                    .order('fecha_creacion', { ascending: false })

                if (error) {
                    console.error('❌ ProductsSection: Error obteniendo productos:', error)
                    return
                }


                // Transformar los datos como lo hace la API
                const transformedProducts = products?.map(product => {
                    // Supabase devuelve arrays para las relaciones, necesitamos extraer el primer elemento
                    const categoria = Array.isArray(product.categoria) ? product.categoria[0] : product.categoria
                    const usuario = Array.isArray(product.usuario) ? product.usuario[0] : product.usuario
                    
                    return {
                        producto_id: product.producto_id,
                        titulo: product.titulo,
                        descripcion: product.descripcion,
                        precio: product.precio,
                        categoria_nombre: categoria?.nombre || 'Sin categoría',
                        estado: product.estado,
                        tipo_transaccion: product.tipo_transaccion,
                        estado_validacion: product.estado_validacion,
                        fecha_creacion: product.fecha_creacion,
                        fecha_validacion: product.fecha_validacion,
                        user_id: usuario?.user_id,
                        usuario_nombre: usuario?.nombre || 'Usuario',
                        usuario_apellido: usuario?.apellido || 'Sin apellido',
                        usuario_email: usuario?.email || '',
                        comentarios_validacion: product.comentarios_validacion,
                        validado_por: product.validado_por,
                        precio_negociable: product.precio_negociable,
                        imagenes: product.imagenes || []
                    }
                }) || []

                if (isMounted) {
                    setProducts(transformedProducts)
                }

            } catch (error) {
                console.error('💥 Error cargando productos:', error)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchProducts()

        return () => {
            isMounted = false
        }
    }, [])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase())

        switch (filter) {
            case 'published':
                return matchesSearch && product.estado_validacion === 'approved'
            case 'pending':
                return matchesSearch && product.estado_validacion === 'pending'
            case 'rejected':
                return matchesSearch && product.estado_validacion === 'rejected'
            default:
                return matchesSearch
        }
    })

    const openImageModal = (product: Product) => {
        setSelectedProductImages(product.imagenes)
        setSelectedProductTitle(product.titulo)
        setShowImageModal(true)
    }

    const closeImageModal = () => {
        setShowImageModal(false)
        setSelectedProductImages([])
        setSelectedProductTitle('')
    }

    const openPreviewModal = (product: Product) => {
        setSelectedProductForPreview(product)
        setShowPreviewModal(true)
    }

    const closePreviewModal = () => {
        setShowPreviewModal(false)
        setSelectedProductForPreview(null)
    }

    const openRejectModal = (product: Product) => {
        setSelectedProductForReject(product)
        setRejectReason('')
        setShowRejectModal(true)
    }

    const closeRejectModal = () => {
        setShowRejectModal(false)
        setSelectedProductForReject(null)
        setRejectReason('')
    }

    const validateProduct = async (productId: number, estadoValidacion: 'approved' | 'rejected', comentarios?: string) => {
        try {
            console.log('🔍 ProductsSection: Validando producto directamente en BD:', {
                productId,
                estadoValidacion,
                comentarios
            })

            // Obtener información del producto para la notificación
            const product = products.find(p => p.producto_id === productId)
            if (!product) {
                console.error('❌ ProductsSection: Producto no encontrado')
                return
            }

            // Actualizar directamente en la base de datos
            const { error } = await supabase
                .from('producto')
                .update({
                    estado_validacion: estadoValidacion,
                    fecha_validacion: new Date().toISOString(),
                    comentarios_validacion: comentarios || null,
                    validado_por: 1 // TODO: Obtener ID del admin actual
                })
                .eq('producto_id', productId)

            if (error) {
                console.error('❌ ProductsSection: Error validando producto:', error)
                alert(`Error al validar el producto: ${error.message}`)
                return
            }

            // Crear notificación para el usuario
            try {
                const notificationData = {
                    usuario_id: product.user_id,
                    titulo: estadoValidacion === 'approved' 
                        ? '¡Producto Aprobado!' 
                        : 'Producto Requiere Modificaciones',
                    mensaje: estadoValidacion === 'approved'
                        ? `Tu producto "${product.titulo}" ha sido aprobado y ya está visible en la plataforma. ¡Gracias por usar Ecoswap!`
                        : `Tu producto "${product.titulo}" necesita algunas modificaciones antes de ser publicado. ${comentarios ? `Motivo: ${comentarios}` : 'Revisa los detalles en tu panel de productos pendientes.'}`,
                    tipo: estadoValidacion === 'approved' ? 'producto_aprobado' : 'producto_rechazado',
                    datos_adicionales: {
                        producto_id: productId,
                        estado: estadoValidacion,
                        motivo_rechazo: comentarios || null,
                        fecha_validacion: new Date().toISOString(),
                        url_accion: estadoValidacion === 'approved' ? `/producto/${productId}` : '/mis-productos-pendientes'
                    },
                    leida: false,
                    fecha_creacion: new Date().toISOString(),
                    es_push: true,
                    es_email: false
                }


                const { error: notificationError } = await supabase
                    .from('notificacion')
                    .insert(notificationData)

                if (notificationError) {
                    console.error('❌ ProductsSection: Error enviando notificación:', notificationError)
                } else {
                }
            } catch (notificationError) {
                console.error('⚠️ ProductsSection: Error enviando notificación:', notificationError)
            }

            // Actualizar estado local
            setProducts(products.map(product => 
                product.producto_id === productId 
                    ? { 
                        ...product, 
                        estado_validacion: estadoValidacion,
                        fecha_validacion: new Date().toISOString(),
                        comentarios_validacion: comentarios
                    }
                    : product
            ))

            
            // Mostrar mensaje de éxito
            alert(estadoValidacion === 'approved' 
                ? 'Producto aprobado exitosamente. El usuario ha sido notificado.'
                : 'Producto rechazado exitosamente. El usuario ha sido notificado y puede hacer modificaciones.')
        } catch (error) {
            console.error('💥 ProductsSection: Error validando producto:', error)
            alert('Error al validar el producto')
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gray-300 rounded"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filtros y búsqueda */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Todos', count: products.length },
                            { key: 'pending', label: 'Pendientes', count: products.filter(p => p.estado_validacion === 'pending').length },
                            { key: 'published', label: 'Aprobados', count: products.filter(p => p.estado_validacion === 'approved').length },
                            { key: 'rejected', label: 'Rechazados', count: products.filter(p => p.estado_validacion === 'rejected').length }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key as any)}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    filter === key
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de productos */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Productos ({filteredProducts.length})
                    </h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                        <div key={product.producto_id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                                            <span className="text-gray-500 text-sm">📦</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {product.titulo}
                                            </h4>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.estado_validacion === 'approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.estado_validacion === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.estado_validacion === 'approved' ? 'Aprobado' : 
                                                 product.estado_validacion === 'pending' ? 'Pendiente' : 'Rechazado'}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {product.tipo_transaccion === 'venta' ? 'Venta' :
                                                 product.tipo_transaccion === 'intercambio' ? 'Intercambio' :
                                                 product.tipo_transaccion === 'donacion' ? 'Donación' : 'Mixto'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {product.descripcion}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            {product.precio && (
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">${product.precio.toLocaleString()}</span>
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Categoría:</span> {product.categoria_nombre}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Por:</span> {product.usuario_nombre} {product.usuario_apellido}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Creado: {new Date(product.fecha_creacion).toLocaleDateString()}
                                            {product.fecha_validacion && (
                                                <span className="ml-2">
                                                    • Validado: {new Date(product.fecha_validacion).toLocaleDateString()}
                                                </span>
                                            )}
                                        </p>
                                        {product.comentarios_validacion && (
                                            <p className="text-xs text-gray-500 mt-1 italic">
                                                Comentarios: {product.comentarios_validacion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => openPreviewModal(product)}
                                        className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium hover:bg-purple-200 flex items-center"
                                        title="Ver preview de la publicación"
                                    >
                                        👁️ Preview
                                    </button>
                                    <button
                                        onClick={() => openImageModal(product)}
                                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200 flex items-center"
                                        title="Ver imágenes del producto"
                                    >
                                        📷 Ver Fotos ({product.imagenes?.length || 0})
                                    </button>
                                    {product.estado_validacion === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => validateProduct(product.producto_id, 'approved')}
                                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => openRejectModal(product)}
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}
                                    {product.estado_validacion === 'approved' && (
                                        <span className="text-xs text-green-600 font-medium">
                                            ✓ Aprobado
                                        </span>
                                    )}
                                    {product.estado_validacion === 'rejected' && (
                                        <span className="text-xs text-red-600 font-medium">
                                            ✗ Rechazado
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Preview de la Publicación */}
            {showPreviewModal && selectedProductForPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
                    <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                            <h3 className="text-lg font-medium text-gray-900">
                                Preview de la Publicación
                            </h3>
                            <button
                                onClick={closePreviewModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Preview del Producto */}
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                                {/* Imágenes del Producto */}
                                <div className="relative">
                                    {selectedProductForPreview.imagenes && selectedProductForPreview.imagenes.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                            {selectedProductForPreview.imagenes
                                                .sort((a, b) => a.orden - b.orden)
                                                .map((imagen, index) => (
                                                    <div key={imagen.imagen_id} className="relative">
                                                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                                            <img
                                                                src={imagen.url_imagen}
                                                                alt={`Imagen ${index + 1}`}
                                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none'
                                                                    const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                                                                    if (errorDiv) errorDiv.classList.remove('hidden')
                                                                }}
                                                            />
                                                            <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                                                                <div className="text-center">
                                                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                    <p className="text-sm">Error al cargar</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                Imagen {index + 1}
                                                            </span>
                                                            {imagen.es_principal && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Principal
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                            <div className="text-center text-gray-500">
                                                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">Sin imágenes</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Información del Producto */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                                                {selectedProductForPreview.titulo}
                                            </h2>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    selectedProductForPreview.estado === 'usado'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {selectedProductForPreview.estado === 'usado' ? 'Usado' : 'Para Repuestos'}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    selectedProductForPreview.tipo_transaccion === 'venta'
                                                        ? 'bg-green-100 text-green-800'
                                                        : selectedProductForPreview.tipo_transaccion === 'intercambio'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {selectedProductForPreview.tipo_transaccion === 'venta' ? 'Venta' :
                                                     selectedProductForPreview.tipo_transaccion === 'intercambio' ? 'Intercambio' : 'Donación'}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedProductForPreview.precio && (
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-600">
                                                    ${selectedProductForPreview.precio.toLocaleString()}
                                                </p>
                                                {selectedProductForPreview.precio_negociable && (
                                                    <p className="text-sm text-gray-500">Precio negociable</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">Descripción:</h3>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {selectedProductForPreview.descripcion}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-900">Categoría:</span>
                                            <p className="text-gray-600">{selectedProductForPreview.categoria_nombre}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Publicado por:</span>
                                            <p className="text-gray-600">{selectedProductForPreview.usuario_nombre} {selectedProductForPreview.usuario_apellido}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Fecha:</span>
                                            <p className="text-gray-600">{new Date(selectedProductForPreview.fecha_creacion).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Estado:</span>
                                            <p className="text-gray-600">
                                                {selectedProductForPreview.estado_validacion === 'pending' ? 'Pendiente de validación' :
                                                 selectedProductForPreview.estado_validacion === 'approved' ? 'Aprobado' : 'Rechazado'}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedProductForPreview.comentarios_validacion && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <h4 className="text-sm font-medium text-yellow-800 mb-1">Comentarios del Admin:</h4>
                                            <p className="text-sm text-yellow-700">{selectedProductForPreview.comentarios_validacion}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                Preview de cómo se verá la publicación en la plataforma
                            </div>
                            <div className="flex space-x-2">
                                {selectedProductForPreview.estado_validacion === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                closePreviewModal()
                                                openRejectModal(selectedProductForPreview)
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            onClick={() => {
                                                closePreviewModal()
                                                validateProduct(selectedProductForPreview.producto_id, 'approved')
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Aprobar
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={closePreviewModal}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Rechazo con Explicación */}
            {showRejectModal && selectedProductForReject && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-2xl w-full bg-white rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Rechazar Producto
                            </h3>
                            <button
                                onClick={closeRejectModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">
                                    Producto a rechazar:
                                </h4>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="font-medium text-gray-900">{selectedProductForReject.titulo}</p>
                                    <p className="text-sm text-gray-600">Por: {selectedProductForReject.usuario_nombre} {selectedProductForReject.usuario_apellido}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">
                                    Motivo del rechazo <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reject-reason"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    rows={4}
                                    placeholder="Explica detalladamente por qué se rechaza este producto. Esta información será enviada al usuario para que pueda hacer las correcciones necesarias..."
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Este mensaje será enviado como notificación al usuario
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-800">
                                            ¿Qué pasará después?
                                        </h3>
                                        <div className="mt-1 text-sm text-blue-700">
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>El usuario recibirá una notificación con el motivo del rechazo</li>
                                                <li>El producto volverá a estado &quot;Pendiente&quot; para modificaciones</li>
                                                <li>El usuario podrá editar el producto y volver a enviarlo</li>
                                                <li>Las imágenes existentes se pueden sobrescribir</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
                            <button
                                onClick={closeRejectModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!rejectReason.trim()) {
                                        alert('Por favor, proporciona un motivo para el rechazo.')
                                        return
                                    }
                                    validateProduct(selectedProductForReject.producto_id, 'rejected', rejectReason)
                                    closeRejectModal()
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                                Rechazar Producto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para visualizar imágenes del producto */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-6xl max-h-full bg-white rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                Imágenes del Producto: {selectedProductTitle}
                            </h3>
                            <button
                                onClick={closeImageModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {selectedProductImages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-lg font-medium">No hay imágenes disponibles</p>
                                    <p className="text-sm">Este producto no tiene imágenes subidas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedProductImages
                                        .sort((a, b) => a.orden - b.orden)
                                        .map((imagen, index) => (
                                            <div key={imagen.imagen_id} className="relative">
                                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                                                    <img
                                                        src={imagen.url_imagen}
                                                        alt={`Imagen ${index + 1} del producto`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none'
                                                            const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                                                            if (errorDiv) errorDiv.classList.remove('hidden')
                                                        }}
                                                    />
                                                    <div className="hidden w-full h-full flex items-center justify-center text-gray-500">
                                                        <div className="text-center">
                                                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <p className="text-sm">Error al cargar</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        Imagen {index + 1}
                                                    </span>
                                                    {imagen.es_principal && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Principal
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                {selectedProductImages.length > 0 && (
                                    <span>
                                        {selectedProductImages.length} imagen{selectedProductImages.length !== 1 ? 'es' : ''} disponible{selectedProductImages.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={closeImageModal}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
