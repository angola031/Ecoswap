'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhotoIcon, TrashIcon, CheckCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  avatar: string
  rating: number
  phone?: string
}

export default function AgregarProductoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'COP',
    condition: 'good' as const,
    category: '',
    location: '',
    tags: '',
    publicationType: 'sale' as 'sale' | 'exchange' | 'donation' | 'both',
    specifications: {} as Record<string, string>
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showSpecifications, setShowSpecifications] = useState(false)
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  const categories = [
    'Electrónicos', 'Ropa y Accesorios', 'Hogar y Jardín', 'Deportes',
    'Libros y Música', 'Juguetes y Juegos', 'Automotriz', 'Salud y Belleza',
    'Arte y Artesanías', 'Otros'
  ]

  const conditions = [
    { value: 'new', label: 'Nuevo', color: 'text-green-600' },
    { value: 'like-new', label: 'Como Nuevo', color: 'text-blue-600' },
    { value: 'good', label: 'Bueno', color: 'text-yellow-600' },
    { value: 'fair', label: 'Aceptable', color: 'text-orange-600' },
    { value: 'poor', label: 'Usado', color: 'text-red-600' }
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages = [...images, ...files]
    setImages(newImages)

    // Crear previews
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }))
      setSpecKey('')
      setSpecValue('')
    }
  }

  const removeSpecification = (key: string) => {
    const newSpecs = { ...formData.specifications }
    delete newSpecs[key]
    setFormData(prev => ({ ...prev, specifications: newSpecs }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) errors.title = 'El título es requerido'
    if (!formData.description.trim()) errors.description = 'La descripción es requerida'
    if (formData.publicationType !== 'donation') {
      if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'El precio debe ser mayor a 0'
    }
    if (!formData.category) errors.category = 'Selecciona una categoría'
    if (!formData.location.trim()) errors.location = 'La ubicación es requerida'
    if (images.length === 0) errors.images = 'Al menos una imagen es requerida'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Aquí iría la lógica real de envío
      console.log('Producto enviado:', { ...formData, images })

      // Redirigir a productos
      router.push('/')
    } catch (error) {
      console.error('Error al enviar producto:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return ''
    return numPrice.toLocaleString('es-CO')
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
            <h1 className="text-xl font-semibold text-gray-900">
              Publicar Producto
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Información del Producto
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Completa todos los campos para publicar tu producto
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Tipo de Publicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Publicación
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'sale', label: 'Vender', icon: '💰' },
                  { value: 'exchange', label: 'Intercambiar', icon: '🔄' },
                  { value: 'donation', label: 'Donar', icon: '🎁' },
                  { value: 'both', label: 'Venta + Intercambio', icon: '💱' }
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${formData.publicationType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="publicationType"
                      value={option.value}
                      checked={formData.publicationType === option.value}
                      onChange={(e) => handleInputChange('publicationType', e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-2">{option.icon}</span>
                    <span className="text-sm font-medium text-gray-700 text-center">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Título y Descripción */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título del Producto *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Ej: iPhone 12 Pro en excelente estado"
                />
                {formErrors.title && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Describe detalladamente tu producto, incluyendo características, estado, y cualquier información relevante..."
                />
                {formErrors.description && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>
            </div>

            {/* Precio, Moneda y Condición */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.price ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="0"
                    min="0"
                    step="1000"
                    disabled={formData.publicationType === 'donation'}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
                    $
                  </span>
                </div>
                {(formData.price && formData.publicationType !== 'donation') && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(formData.price)} {formData.currency}
                  </p>
                )}
                {formErrors.price && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>
                )}
                {formData.publicationType === 'donation' && (
                  <p className="text-sm text-gray-600 mt-1">Donación (precio no requerido)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  disabled={formData.publicationType === 'donation'}
                >
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condición *
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {conditions.map(condition => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categoría y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.category ? 'border-red-300' : 'border-gray-300'
                    }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.location ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Ej: Bogotá, Colombia"
                />
                {formErrors.location && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.location}</p>
                )}
              </div>
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Etiquetas
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: tecnología, smartphone, apple, usado"
              />
              <p className="text-sm text-gray-600 mt-1">
                Separa las etiquetas con comas para facilitar la búsqueda
              </p>
            </div>

            {/* Especificaciones */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Especificaciones Técnicas
                </label>
                <button
                  type="button"
                  onClick={() => setShowSpecifications(!showSpecifications)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showSpecifications ? 'Ocultar' : 'Agregar'}
                </button>
              </div>

              {showSpecifications && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      placeholder="Ej: Marca, Modelo, Color..."
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      placeholder="Ej: Apple, iPhone 12, Negro..."
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar Especificación
                  </button>

                  {Object.keys(formData.specifications).length > 0 && (
                    <div className="space-y-2">
                      {Object.entries(formData.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm">
                            <strong>{key}:</strong> {value}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSpecification(key)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Imágenes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imágenes del Producto *
              </label>

              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Haz clic para subir imágenes o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 10MB cada una
                    </p>
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formErrors.images && (
                  <p className="text-red-600 text-sm">{formErrors.images}</p>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Publicar Producto
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
