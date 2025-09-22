'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface Product {
    producto_id: number
    titulo: string
    descripcion: string
    precio: number
    categoria_nombre: string
    estado: string
    tipo_transaccion: string
    fecha_creacion: string
    usuario_nombre: string
    usuario_apellido: string
    usuario_email: string
}

interface ProductValidationModalProps {
    product: Product | null
    isOpen: boolean
    onClose: () => void
    onValidate: (productId: number, status: 'approved' | 'rejected', comments?: string) => void
}

export default function ProductValidationModal({ 
    product, 
    isOpen, 
    onClose, 
    onValidate 
}: ProductValidationModalProps) {
    const [comments, setComments] = useState('')
    const [isValidating, setIsValidating] = useState(false)

    const handleValidate = async (status: 'approved' | 'rejected') => {
        if (!product) return

        setIsValidating(true)
        try {
            await onValidate(product.producto_id, status, comments || undefined)
            onClose()
            setComments('')
        } catch (error) {
            console.error('Error validando producto:', error)
        } finally {
            setIsValidating(false)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price)
    }

    const getTransactionTypeLabel = (type: string) => {
        switch (type) {
            case 'venta': return 'Venta'
            case 'intercambio': return 'Intercambio'
            case 'donacion': return 'Donación'
            case 'mixto': return 'Venta + Intercambio'
            default: return type
        }
    }

    if (!product) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50"
                            onClick={onClose}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Validar Producto
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Product Info */}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xl font-medium text-gray-900 mb-2">
                                            {product.titulo}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {getTransactionTypeLabel(product.tipo_transaccion)}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {product.categoria_nombre}
                                            </span>
                                            {product.precio && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {formatPrice(product.precio)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Descripción</h5>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {product.descripcion}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">Vendedor</h5>
                                            <p className="text-sm text-gray-600">
                                                {product.usuario_nombre} {product.usuario_apellido}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {product.usuario_email}
                                            </p>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-1">Fecha de Creación</h5>
                                            <p className="text-sm text-gray-600">
                                                {new Date(product.fecha_creacion).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments */}
                                <div>
                                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                                        Comentarios (opcional)
                                    </label>
                                    <textarea
                                        id="comments"
                                        rows={3}
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Agrega comentarios sobre la validación..."
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isValidating}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleValidate('rejected')}
                                        disabled={isValidating}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isValidating ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        ) : (
                                            <XCircleIcon className="h-4 w-4 mr-2" />
                                        )}
                                        Rechazar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleValidate('approved')}
                                        disabled={isValidating}
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isValidating ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        ) : (
                                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        )}
                                        Aprobar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}
