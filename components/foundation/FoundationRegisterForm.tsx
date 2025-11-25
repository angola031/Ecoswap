'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface FoundationRegisterFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function FoundationRegisterForm({ onSuccess, onCancel }: FoundationRegisterFormProps) {
  const [formData, setFormData] = useState({
    nombre_fundacion: '',
    nit_fundacion: '',
    tipo_fundacion: '',
    descripcion_fundacion: '',
    pagina_web_fundacion: '',
    documento_fundacion: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingFoundation, setExistingFoundation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar información de fundación si ya existe
    const loadFoundationInfo = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) return

        const response = await fetch('/api/foundation/register', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.foundation?.es_fundacion) {
            setExistingFoundation(data.foundation)
            setFormData({
              nombre_fundacion: data.foundation.nombre_fundacion || '',
              nit_fundacion: data.foundation.nit_fundacion || '',
              tipo_fundacion: data.foundation.tipo_fundacion || '',
              descripcion_fundacion: data.foundation.descripcion_fundacion || '',
              pagina_web_fundacion: data.foundation.pagina_web_fundacion || '',
              documento_fundacion: data.foundation.documento_fundacion || ''
            })
          }
        }
      } catch (err) {
        console.error('Error cargando información de fundación:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadFoundationInfo()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const supabase = getSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No estás autenticado')
      }

      const response = await fetch('/api/foundation/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar fundación')
      }

      // Éxito
      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Si ya está registrado como fundación
  if (existingFoundation) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-3xl">🏛️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Registrado como Fundación
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold">{existingFoundation.nombre_fundacion}</p>
                <p className="text-xs mt-1">NIT: {existingFoundation.nit_fundacion}</p>
              </div>
              <div className="mt-3">
                {existingFoundation.fundacion_verificada ? (
                  <div className="flex items-center text-green-700 dark:text-green-300">
                    <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Verificada</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-700 dark:text-yellow-300">
                    <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Pendiente de verificación</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {onCancel && (
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">👶</span>
          <div>
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">
              Registrar Fundación para Niños
            </h3>
            <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
              Completa este formulario para registrar tu fundación dedicada al bienestar de niños. 
              Tu solicitud será revisada por nuestro equipo de administradores.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="nombre_fundacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre de la Fundación <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nombre_fundacion"
          required
          value={formData.nombre_fundacion}
          onChange={(e) => setFormData({ ...formData, nombre_fundacion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder="Fundación Ambiental XYZ"
          minLength={3}
        />
      </div>

      <div>
        <label htmlFor="nit_fundacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          NIT o Identificación Tributaria <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nit_fundacion"
          required
          value={formData.nit_fundacion}
          onChange={(e) => setFormData({ ...formData, nit_fundacion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder="900123456-1"
          minLength={5}
        />
      </div>

      <div>
        <label htmlFor="tipo_fundacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Área de Enfoque <span className="text-red-500">*</span>
        </label>
        <select
          id="tipo_fundacion"
          required
          value={formData.tipo_fundacion}
          onChange={(e) => setFormData({ ...formData, tipo_fundacion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="">Selecciona el área de enfoque</option>
          <option value="proteccion_ninos">🛡️ Protección de Niños</option>
          <option value="educacion_ninos">📚 Educación Infantil</option>
          <option value="salud_ninos">💊 Salud Infantil</option>
          <option value="nutricion_ninos">🍎 Nutrición Infantil</option>
          <option value="derechos_ninos">⚖️ Derechos de los Niños</option>
        </select>
      </div>

      <div>
        <label htmlFor="descripcion_fundacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descripción de la Fundación <span className="text-red-500">*</span>
        </label>
        <textarea
          id="descripcion_fundacion"
          required
          value={formData.descripcion_fundacion}
          onChange={(e) => setFormData({ ...formData, descripcion_fundacion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder="Describe la misión, visión y actividades de tu fundación para niños..."
          rows={4}
          minLength={20}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Mínimo 20 caracteres. Describe cómo tu fundación ayuda a los niños y cuál es su propósito.
        </p>
      </div>

      <div>
        <label htmlFor="pagina_web_fundacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Página Web (Opcional)
        </label>
        <input
          type="url"
          id="pagina_web_fundacion"
          value={formData.pagina_web_fundacion}
          onChange={(e) => setFormData({ ...formData, pagina_web_fundacion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder="https://www.tufundacion.org"
        />
      </div>

      <div>
        <label htmlFor="documento_fundacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          URL del Documento de Registro (Opcional)
        </label>
        <input
          type="url"
          id="documento_fundacion"
          value={formData.documento_fundacion}
          onChange={(e) => setFormData({ ...formData, documento_fundacion: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
          placeholder="https://drive.google.com/..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Puedes subir tu certificado de existencia y representación legal a Google Drive o Dropbox y pegar el enlace aquí.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Registrando...' : 'Registrar Fundación'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

