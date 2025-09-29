'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface ProposalModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (proposal: CreateProposalData) => Promise<void>
  isLoading?: boolean
}

interface CreateProposalData {
  type: 'precio' | 'intercambio' | 'encuentro' | 'condiciones' | 'otro'
  description: string
  proposedPrice?: number
  conditions?: string
  meetingDate?: string
  meetingPlace?: string
}

export default function ProposalModal({ isOpen, onClose, onSubmit, isLoading = false }: ProposalModalProps) {
  const [formData, setFormData] = useState<CreateProposalData>({
    type: 'precio',
    description: '',
    proposedPrice: undefined,
    conditions: '',
    meetingDate: '',
    meetingPlace: ''
  })

  const [errors, setErrors] = useState<Partial<CreateProposalData>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación
    const newErrors: Partial<CreateProposalData> = {}
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }
    
    if (formData.type === 'precio' && !formData.proposedPrice) {
      newErrors.proposedPrice = 'El precio propuesto es requerido'
    }
    
    if (formData.type === 'encuentro' && !formData.meetingDate) {
      newErrors.meetingDate = 'La fecha del encuentro es requerida'
    }
    
    if (formData.type === 'encuentro' && !formData.meetingPlace) {
      newErrors.meetingPlace = 'El lugar del encuentro es requerido'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      return
    }

    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      console.error('Error enviando propuesta:', error)
    }
  }

  const handleClose = () => {
    setFormData({
      type: 'precio',
      description: '',
      proposedPrice: undefined,
      conditions: '',
      meetingDate: '',
      meetingPlace: ''
    })
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: keyof CreateProposalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Hacer Propuesta</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Propuesta *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="precio">💰 Precio</option>
                <option value="intercambio">🔄 Intercambio</option>
                <option value="encuentro">🤝 Encuentro</option>
                <option value="condiciones">📋 Condiciones</option>
                <option value="otro">💬 Otro</option>
              </select>
            </div>

            {formData.type === 'precio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Propuesto (COP) *
                </label>
                <input
                  type="number"
                  value={formData.proposedPrice || ''}
                  onChange={(e) => handleInputChange('proposedPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.proposedPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 2500000"
                  disabled={isLoading}
                />
                {errors.proposedPrice && (
                  <p className="text-red-500 text-sm mt-1">{errors.proposedPrice}</p>
                )}
              </div>
            )}

            {formData.type === 'encuentro' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha del Encuentro *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.meetingDate}
                    onChange={(e) => handleInputChange('meetingDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.meetingDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.meetingDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.meetingDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugar del Encuentro *
                  </label>
                  <input
                    type="text"
                    value={formData.meetingPlace}
                    onChange={(e) => handleInputChange('meetingPlace', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.meetingPlace ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Centro comercial San Rafael"
                    disabled={isLoading}
                  />
                  {errors.meetingPlace && (
                    <p className="text-red-500 text-sm mt-1">{errors.meetingPlace}</p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe tu propuesta en detalle..."
                rows={4}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condiciones Adicionales (Opcional)
              </label>
              <textarea
                value={formData.conditions}
                onChange={(e) => handleInputChange('conditions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Condiciones especiales, términos, etc..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  'Enviar Propuesta'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
