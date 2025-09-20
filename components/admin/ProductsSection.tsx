'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Product {
    producto_id: number
    nombre: string
    descripcion: string
    precio: number
    categoria: string
    estado: string
    publicado: boolean
    fecha_creacion: string
    usuario_id: number
    usuario?: {
        nombre: string
        apellido: string
        email: string
    }
}

export default function ProductsSection() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'published' | 'pending' | 'rejected'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                console.log('📦 Cargando productos...')
                
                const { data, error } = await supabase
                    .from('producto')
                    .select(`
                        producto_id,
                        nombre,
                        descripcion,
                        precio,
                        categoria,
                        estado,
                        publicado,
                        fecha_creacion,
                        usuario_id,
                        usuario:usuario_id (
                            nombre,
                            apellido,
                            email
                        )
                    `)
                    .order('fecha_creacion', { ascending: false })

                if (error) {
                    console.error('❌ Error obteniendo productos:', error)
                    return
                }

                setProducts(data || [])
                console.log('✅ Productos cargados:', data?.length)

            } catch (error) {
                console.error('💥 Error cargando productos:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [])

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase())

        switch (filter) {
            case 'published':
                return matchesSearch && product.publicado
            case 'pending':
                return matchesSearch && product.estado === 'pendiente'
            case 'rejected':
                return matchesSearch && product.estado === 'rechazado'
            default:
                return matchesSearch
        }
    })

    const updateProductStatus = async (productId: number, newStatus: string, published: boolean) => {
        try {
            const { error } = await supabase
                .from('producto')
                .update({ 
                    estado: newStatus,
                    publicado: published
                })
                .eq('producto_id', productId)

            if (error) {
                console.error('❌ Error actualizando producto:', error)
                alert('Error al actualizar el producto')
                return
            }

            // Actualizar estado local
            setProducts(products.map(product => 
                product.producto_id === productId 
                    ? { ...product, estado: newStatus, publicado: published }
                    : product
            ))

            console.log('✅ Producto actualizado')
        } catch (error) {
            console.error('💥 Error:', error)
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
                            { key: 'published', label: 'Publicados', count: products.filter(p => p.publicado).length },
                            { key: 'pending', label: 'Pendientes', count: products.filter(p => p.estado === 'pendiente').length },
                            { key: 'rejected', label: 'Rechazados', count: products.filter(p => p.estado === 'rechazado').length }
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
                                                {product.nombre}
                                            </h4>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.estado === 'aprobado'
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.estado === 'pendiente'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.estado}
                                            </span>
                                            {product.publicado && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Publicado
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {product.descripcion}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">${product.precio.toLocaleString()}</span>
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Categoría:</span> {product.categoria}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Por:</span> {product.usuario?.nombre} {product.usuario?.apellido}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Creado: {new Date(product.fecha_creacion).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {product.estado === 'pendiente' && (
                                        <>
                                            <button
                                                onClick={() => updateProductStatus(product.producto_id, 'aprobado', true)}
                                                className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200"
                                            >
                                                Aprobar
                                            </button>
                                            <button
                                                onClick={() => updateProductStatus(product.producto_id, 'rechazado', false)}
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                                            >
                                                Rechazar
                                            </button>
                                        </>
                                    )}
                                    {product.estado === 'aprobado' && !product.publicado && (
                                        <button
                                            onClick={() => updateProductStatus(product.producto_id, 'aprobado', true)}
                                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                                        >
                                            Publicar
                                        </button>
                                    )}
                                    {product.publicado && (
                                        <button
                                            onClick={() => updateProductStatus(product.producto_id, 'aprobado', false)}
                                            className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium hover:bg-gray-200"
                                        >
                                            Despublicar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
