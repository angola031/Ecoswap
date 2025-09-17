'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    XMarkIcon,
    PhotoIcon,
    TrashIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
    phone?: string
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

interface AddProductFormProps {
    currentUser: User | null
    isOpen: boolean
    onClose: () => void
    onProductAdded: (product: Product) => void
}

export default function AddProductForm({ currentUser, isOpen, onClose, onProductAdded }: AddProductFormProps) {
    const [publishForm, setPublishForm] = useState({
        title: '',
        description: '',
        category: '',
        condition: '',
        price: '',
        currency: 'COP',
        location: '',
        images: [] as File[],
        exchangeType: 'sale' // 'sale', 'exchange', 'donation', 'both'
    })
    const [isPublishing, setIsPublishing] = useState(false)
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const handlePublishProduct = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validar formulario
        const errors: Record<string, string> = {}
        if (!publishForm.title.trim()) errors.title = 'El título es requerido'
        if (!publishForm.description.trim()) errors.description = 'La descripción es requerida'
        if (!publishForm.category) errors.category = 'Selecciona una categoría'
        if (!publishForm.condition) errors.condition = 'Selecciona el estado del producto'
        if (publishForm.exchangeType !== 'donation' && !publishForm.price) errors.price = 'El precio es requerido'
        if (!publishForm.location) errors.location = 'La ubicación es requerida'
        if (publishForm.images.length === 0) errors.images = 'Al menos una imagen es requerida'

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        setIsPublishing(true)

        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Crear nuevo producto
        const newProduct: Product = {
            id: Date.now().toString(),
            title: publishForm.title,
            description: publishForm.description,
            category: publishForm.category,
            condition: publishForm.condition,
            price: publishForm.exchangeType === 'donation' ? 0 : parseFloat(publishForm.price),
            currency: publishForm.currency,
            location: publishForm.location,
            images: publishForm.images.map(file => URL.createObjectURL(file)),
            owner: {
                id: currentUser?.id || '1',
                name: currentUser?.name || 'Usuario',
                avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
                rating: 5.0,
                phone: currentUser?.phone || '',
                email: currentUser?.email || '',
                memberSince: '2024',
                totalProducts: 1,
                totalSales: 0
            },
            createdAt: new Date().toISOString().split('T')[0],
            views: 0,
            likes: 0,
            status: 'available',
            // Añadir tipo de publicación como etiqueta para visibilidad en listados
            tags: [publishForm.category, publishForm.condition, publishForm.exchangeType],
            specifications: {}
        }

        // Notificar al componente padre
        onProductAdded(newProduct)

        // Cerrar modal y resetear formulario
        onClose()
        resetPublishForm()
        setIsPublishing(false)
    }

    const resetPublishForm = () => {
        setPublishForm({
            title: '',
            description: '',
            category: '',
            condition: '',
            price: '',
            currency: 'COP',
            location: '',
            images: [],
            exchangeType: 'sale'
        })
        setFormErrors({})
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length + publishForm.images.length > 5) {
            alert('Máximo 5 imágenes permitidas')
            return
        }
        setPublishForm(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }))
    }

    const removeImage = (index: number) => {
        setPublishForm(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const updatePublishForm = (field: string, value: string | File[]) => {
        setPublishForm(prev => ({ ...prev, [field]: value }))
        // Limpiar error del campo cuando se actualiza
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    if (!isOpen) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del modal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Publicar Producto</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handlePublishProduct} className="p-6 space-y-6">
                    {/* Tipo de intercambio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Tipo de Publicación
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { value: 'sale', label: 'Vender', icon: '💰' },
                                { value: 'exchange', label: 'Intercambiar', icon: '🔄' },
                                { value: 'donation', label: 'Donar', icon: '🎁' },
                                { value: 'both', label: 'Venta + Intercambio', icon: '💱' }
                            ].map((option) => (
                                <label
                                    key={option.value}
                                    className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${publishForm.exchangeType === option.value
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="exchangeType"
                                        value={option.value}
                                        checked={publishForm.exchangeType === option.value}
                                        onChange={(e) => updatePublishForm('exchangeType', e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className="text-2xl mb-2">{option.icon}</span>
                                    <span className="text-sm font-medium text-gray-700 text-center">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Título */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Título del Producto *
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={publishForm.title}
                            onChange={(e) => updatePublishForm('title', e.target.value)}
                            className={`input-field ${formErrors.title ? 'border-red-500' : ''}`}
                            placeholder="Ej: iPhone 12 Pro en excelente estado"
                            maxLength={100}
                        />
                        {formErrors.title && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                {formErrors.title}
                            </p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción *
                        </label>
                        <textarea
                            id="description"
                            value={publishForm.description}
                            onChange={(e) => updatePublishForm('description', e.target.value)}
                            className={`input-field resize-none ${formErrors.description ? 'border-red-500' : ''}`}
                            placeholder="Describe tu producto en detalle..."
                            rows={4}
                            maxLength={500}
                        />
                        <div className="flex justify-between items-center mt-1">
                            {formErrors.description && (
                                <p className="text-red-500 text-sm flex items-center">
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                    {formErrors.description}
                                </p>
                            )}
                            <span className="text-sm text-gray-500 ml-auto">
                                {publishForm.description.length}/500
                            </span>
                        </div>
                    </div>

                    {/* Categoría y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                Categoría *
                            </label>
                            <select
                                id="category"
                                value={publishForm.category}
                                onChange={(e) => updatePublishForm('category', e.target.value)}
                                className={`input-field ${formErrors.category ? 'border-red-500' : ''}`}
                            >
                                <option value="">Selecciona una categoría</option>
                                <option value="electronics">Electrónicos</option>
                                <option value="sports">Deportes</option>
                                <option value="music">Música</option>
                                <option value="books">Libros</option>
                                <option value="furniture">Muebles</option>
                                <option value="clothing">Ropa</option>
                                <option value="home">Hogar</option>
                                <option value="other">Otros</option>
                            </select>
                            {formErrors.category && (
                                <p className="text-red-500 text-sm mt-1 flex items-center">
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                    {formErrors.category}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                                Estado *
                            </label>
                            <select
                                id="condition"
                                value={publishForm.condition}
                                onChange={(e) => updatePublishForm('condition', e.target.value)}
                                className={`input-field ${formErrors.condition ? 'border-red-500' : ''}`}
                            >
                                <option value="">Selecciona el estado</option>
                                <option value="new">Nuevo</option>
                                <option value="excellent">Excelente</option>
                                <option value="good">Bueno</option>
                                <option value="fair">Regular</option>
                                <option value="poor">Malo</option>
                            </select>
                            {formErrors.condition && (
                                <p className="text-red-500 text-sm mt-1 flex items-center">
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                    {formErrors.condition}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Precio y Moneda (se oculta si es donación) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                Precio *
                            </label>
                            <input
                                id="price"
                                type="number"
                                value={publishForm.price}
                                onChange={(e) => updatePublishForm('price', e.target.value)}
                                className={`input-field ${formErrors.price ? 'border-red-500' : ''} ${publishForm.exchangeType === 'donation' ? 'opacity-50' : ''}`}
                                placeholder="0"
                                min="0"
                                step="1000"
                                disabled={publishForm.exchangeType === 'donation'}
                            />
                            {formErrors.price && (
                                <p className="text-red-500 text-sm mt-1 flex items-center">
                                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                    {formErrors.price}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                                Moneda
                            </label>
                            <select
                                id="currency"
                                value={publishForm.currency}
                                onChange={(e) => updatePublishForm('currency', e.target.value)}
                                className={`input-field ${publishForm.exchangeType === 'donation' ? 'opacity-50' : ''}`}
                                disabled={publishForm.exchangeType === 'donation'}
                            >
                                <option value="COP">COP (Pesos Colombianos)</option>
                                <option value="USD">USD (Dólares)</option>
                                <option value="EUR">EUR (Euros)</option>
                            </select>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                            Ubicación *
                        </label>
                        <select
                            id="location"
                            value={publishForm.location}
                            onChange={(e) => updatePublishForm('location', e.target.value)}
                            className={`input-field ${formErrors.location ? 'border-red-500' : ''}`}
                        >
                            <option value="">Selecciona tu ciudad</option>
                            <option value="Pereira, Risaralda">Pereira, Risaralda</option>
                            <option value="Bogotá D.C.">Bogotá D.C.</option>
                            <option value="Medellín, Antioquia">Medellín, Antioquia</option>
                            <option value="Cali, Valle del Cauca">Cali, Valle del Cauca</option>
                            <option value="Barranquilla, Atlántico">Barranquilla, Atlántico</option>
                            <option value="Cartagena, Bolívar">Cartagena, Bolívar</option>
                        </select>
                        {formErrors.location && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                {formErrors.location}
                            </p>
                        )}
                    </div>

                    {/* Imágenes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imágenes * (Máximo 5)
                        </label>

                        {/* Área de subida */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                            />
                            <label
                                htmlFor="image-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">
                                    Haz clic para subir imágenes o arrastra aquí
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                    PNG, JPG hasta 5MB cada una
                                </span>
                            </label>
                        </div>

                        {/* Imágenes subidas */}
                        {publishForm.images.length > 0 && (
                            <div className="mt-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {publishForm.images.map((file, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Imagen ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formErrors.images && (
                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                {formErrors.images}
                            </p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPublishing}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPublishing ? 'Publicando...' : 'Publicar Producto'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}
