'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, PhotoIcon, TrashIcon, ExclamationTriangleIcon, CheckCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { useSessionManager } from '@/hooks/useSessionManager'
import { getSupabaseClient } from '@/lib/supabase-client'

interface User {
  id: string
  name: string
  avatar: string
  rating: number
  phone?: string
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  condition: 'like-new' | 'good' | 'fair' | 'poor'
  category: string
  images: string[]
  location: string
  owner: User
  tags: string[]
  specifications?: Record<string, string>
  createdAt: string
  status: 'available' | 'pending' | 'sold'
}

export default function AgregarProductoPage() {
  const router = useRouter()
  const { user, loading: authLoading, error: authError } = useAuth()
  const { session, loading: sessionLoading, isValid: sessionValid, getAccessToken, refreshSession } = useSessionManager()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'COP',
    condition: 'like-new' as 'like-new' | 'good' | 'fair' | 'used' | 'parts',
    category: '',
    location: '',
    tags: '',
    publicationType: 'sale' as 'sale' | 'exchange' | 'donation' | 'both',
    specifications: {} as Record<string, string>
  })
  const [userLocations, setUserLocations] = useState<Array<{ ubicacion_id: number, ciudad: string, departamento: string }>>([])
  const [selectedUbicacionId, setSelectedUbicacionId] = useState<number | ''>('')
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [newLocation, setNewLocation] = useState({
    pais: 'Colombia',
    departamento: '',
    ciudad: '',
    barrio: '',
    es_principal: false,
  })
  const [deps, setDeps] = useState<Array<{ id:number, nombre:string }>>([])
  const [munis, setMunis] = useState<Array<{ id:number, nombre:string }>>([])
  const [selectedDepId, setSelectedDepId] = useState<number | ''>('')
  const [selectedMuniName, setSelectedMuniName] = useState('')
  const [localColData, setLocalColData] = useState<null | { departamentos: Array<{ nombre: string, municipios: string[] }> }>(null)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showSpecifications, setShowSpecifications] = useState(false)
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  // Manejar errores de autenticación y sesión
  useEffect(() => {
    if (authError) {
      console.error('Error de autenticación:', authError)
      router.push('/login')
    }
  }, [authError, router])

  // Verificar si Supabase está configurado
  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      (window as any).Swal.fire({
        title: 'Error de Configuración',
        text: 'La aplicación no está configurada correctamente. Contacta al administrador.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      })
    }
  }, [])

  // Redirigir si no hay sesión válida
  useEffect(() => {
    if (!sessionLoading && !sessionValid && !authLoading) {
      router.push('/login')
    }
  }, [sessionLoading, sessionValid, authLoading, router])

  const categories = [
    'Electrónicos',
    'Libros y Medios',
    'Ropa y Accesorios',
    'Hogar y Jardín',
    'Deportes y Ocio',
    'Juguetes y Juegos',
    'Vehículos',
    'Instrumentos Musicales'
  ]

  const conditions = [
    { value: 'like-new', label: 'Como Nuevo', color: 'text-blue-600' },
    { value: 'good', label: 'Bueno', color: 'text-yellow-600' },
    { value: 'fair', label: 'Aceptable', color: 'text-orange-600' },
    { value: 'used', label: 'Usado', color: 'text-red-600' },
    { value: 'parts', label: 'Para Repuestos', color: 'text-red-700' }
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

  // Cargar ubicaciones del usuario para el enfoque híbrido (ubicacion_id + snapshots)
  useEffect(() => {
    const loadLocations = async () => {
      try {
        console.log('🔍 loadLocations: Verificando sesión...')
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.log('❌ loadLocations: Supabase no está configurado')
            return
        }
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 loadLocations: Sesión obtenida:', !!session)
        
        const email = session?.user?.email
        if (!email) {
          console.log('⚠️ loadLocations: No hay email en la sesión')
          return
        }

        const { data: usuario } = await supabase
          .from('usuario')
          .select('user_id')
          .eq('email', email)
          .single()
        if (!usuario) return

        const { data: ubicaciones } = await supabase
          .from('ubicacion')
          .select('ubicacion_id, ciudad, departamento, es_principal')
          .eq('user_id', usuario.user_id)
          .order('es_principal', { ascending: false })

        const items = (ubicaciones || []).map((u: any) => ({
          ubicacion_id: u.ubicacion_id,
          ciudad: u.ciudad,
          departamento: u.departamento
        }))
        setUserLocations(items)
        // seleccionar principal si existe
        const principal = (ubicaciones || []).find((u: any) => u.es_principal)
        if (principal) setSelectedUbicacionId(principal.ubicacion_id)
      } catch {
        // ignore
      }
    }
    loadLocations()
  }, [])

  // Cargar departamentos (al abrir modal) y municipios cuando cambie el depto
  useEffect(() => {
    const loadDeps = async () => {
      if (!showLocationModal) return
      try {
        const normalizeColData = (raw: any) => {
          // Caso 1: { departamentos: [{ nombre, municipios: [...] }] }
          if (raw && Array.isArray(raw.departamentos)) {
            return {
              departamentos: raw.departamentos.map((d: any) => ({
                nombre: String(d.nombre ?? d.departamento ?? d.name ?? ''),
                municipios: Array.isArray(d.municipios)
                  ? d.municipios.map((m: any) => String(m?.nombre ?? m?.municipio ?? m))
                  : Array.isArray(d.ciudades)
                    ? d.ciudades.map((m: any) => String(m?.nombre ?? m?.ciudad ?? m))
                    : []
              }))
            }
          }
          // Caso 2: array en raíz: [{ departamento, municipios/ciudades }]
          if (Array.isArray(raw)) {
            return {
              departamentos: raw.map((d: any) => ({
                nombre: String(d.nombre ?? d.departamento ?? d.name ?? ''),
                municipios: Array.isArray(d.municipios)
                  ? d.municipios.map((m: any) => String(m?.nombre ?? m?.municipio ?? m))
                  : Array.isArray(d.ciudades)
                    ? d.ciudades.map((m: any) => String(m?.nombre ?? m?.ciudad ?? m))
                    : []
              }))
            }
          }
          return null
        }
        // 1) Intentar cargar desde JSON estático en /public/data/colombia.json
        try {
          const res = await fetch('/data/colombia.json')
          if (res.ok) {
            const raw = await res.json()
            const json = normalizeColData(raw)
            if (json && Array.isArray(json.departamentos)) {
              setLocalColData(json)
              setDeps(json.departamentos.map((d: any, idx: number) => ({ id: idx + 1, nombre: String(d.nombre) })))
              return
            }
          }
        } catch {}
        // Fallback 1: /colombia.json en la raíz pública
        try {
          const res2 = await fetch('/colombia.json')
          if (res2.ok) {
            const raw2 = await res2.json()
            const json2 = normalizeColData(raw2)
            if (json2 && Array.isArray(json2.departamentos)) {
              setLocalColData(json2)
              setDeps(json2.departamentos.map((d: any, idx: number) => ({ id: idx + 1, nombre: String(d.nombre) })))
              return
            }
          }
        } catch {}

        // 2) Fallback: cargar desde tablas Supabase si existen
        try {
          const supabase = getSupabaseClient()
          if (supabase) {
            const { data } = await supabase.from('departamento').select('departamento_id, nombre').order('nombre')
            setDeps((data || []).map((d:any)=>({ id:d.departamento_id, nombre:d.nombre })))
          }
        } catch {}
      } catch {}
    }
    loadDeps()
  }, [showLocationModal])

  useEffect(() => {
    const loadMunis = async () => {
      if (!selectedDepId) { setMunis([]); return }
      try {
        // 1) Si hay datos locales cargados, usarlos
        if (localColData) {
          const dep = localColData.departamentos[(Number(selectedDepId) - 1)]
          const list = Array.isArray(dep?.municipios) ? dep.municipios : []
          setMunis(list.map((n: string, idx: number) => ({ id: idx + 1, nombre: String(n) })))
          return
        }
        // 2) Fallback a Supabase
        try {
          const { data } = await supabase
            .from('municipio')
            .select('municipio_id, nombre')
            .eq('departamento_id', selectedDepId)
            .order('nombre')
          setMunis((data||[]).map((m:any)=>({ id:m.municipio_id, nombre:m.nombre })))
        } catch {}
      } catch {}
    }
    loadMunis()
  }, [selectedDepId])

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
    if (!selectedUbicacionId) errors.location = 'La ubicación es requerida'
    if (images.length === 0) errors.images = 'Al menos una imagen es requerida'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🚀 handleSubmit: Iniciando envío de producto...')
    console.log('🔍 handleSubmit: sessionValid:', sessionValid)
    console.log('🔍 handleSubmit: user:', !!user)
    
    const supabase = getSupabaseClient()
    console.log('🔍 handleSubmit: supabase:', !!supabase)

    // Verificar sesión antes de proceder
    if (!sessionValid || !user) {
      (window as any).Swal.fire({
        title: 'Sesión Requerida',
        text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        icon: 'warning',
        confirmButtonText: 'Ir a Login',
        confirmButtonColor: '#3B82F6'
      }).then(() => {
        router.push('/login')
      })
      return
    }

    // Verificar si el usuario está verificado
    console.log('🔍 handleSubmit: Verificando usuario...')
    const { isUserVerified } = await import('@/lib/auth')
    const isVerified = await isUserVerified()
    console.log('🔍 handleSubmit: Usuario verificado:', isVerified)
    
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

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Verificar si Supabase está configurado
      console.log('🔍 handleSubmit: Verificando configuración de Supabase...')
      if (!supabase) {
        (window as any).Swal.fire({
          title: 'Error de Configuración',
          text: 'La aplicación no está configurada correctamente. Contacta al administrador.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        })
        return
      }
      console.log('✅ handleSubmit: Supabase está configurado')

      // Obtener token de autenticación con renovación automática
      console.log('🔍 handleSubmit: Obteniendo token de acceso...')
      const accessToken = await getAccessToken()
      console.log('🔍 handleSubmit: Token obtenido:', !!accessToken)
      
      if (!accessToken) {
        // Intentar renovar la sesión una vez más
        const refreshed = await refreshSession()
        if (!refreshed) {
          (window as any).Swal.fire({
            title: 'Sesión Expirada',
            text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            icon: 'warning',
            confirmButtonText: 'Ir a Login',
            confirmButtonColor: '#3B82F6'
          }).then(() => {
            router.push('/login')
          })
          return
        }
        
        // Intentar obtener el token nuevamente después de la renovación
        const newToken = await getAccessToken()
        if (!newToken) {
          (window as any).Swal.fire({
            title: 'Error de Sesión',
            text: 'No se pudo renovar la sesión. Por favor, inicia sesión nuevamente.',
            icon: 'error',
            confirmButtonText: 'Ir a Login',
            confirmButtonColor: '#3B82F6'
          }).then(() => {
            router.push('/login')
          })
          return
        }
      }

      // Preparar datos para enviar (mapeando a valores válidos en BD)
      const estadoDb =
        formData.condition === 'parts' ? 'para_repuestos' :
        formData.condition === 'used' ? 'usado' :
        'usado'
      const tipoTransaccionDb =
        formData.publicationType === 'sale' ? 'venta' :
        formData.publicationType === 'exchange' ? 'intercambio' :
        formData.publicationType === 'donation' ? 'donacion' : 'intercambio' // 'both' -> 'intercambio'

      const productData = {
        titulo: formData.title,
        descripcion: formData.description,
        precio: formData.publicationType === 'donation' ? null : parseFloat(formData.price),
        tipo_transaccion: tipoTransaccionDb,
        estado: estadoDb,
        categoria_id: null, // prioridad al nombre si existe
        categoria_nombre: formData.category || null,
        ubicacion_id: selectedUbicacionId || null,
        precio_negociable: true,
        condiciones_intercambio: formData.publicationType.includes('exchange') ? 'Intercambio disponible' : null,
        que_busco_cambio: formData.publicationType.includes('exchange') ? 'Productos de interés' : null,
        etiquetas: formData.tags,
        especificaciones: formData.specifications
      }

      // Enviar producto a la API
      console.log('🔍 handleSubmit: Obteniendo token final para API...')
      const finalToken = await getAccessToken()
      console.log('🔍 handleSubmit: Token final:', !!finalToken)
      
      console.log('📡 handleSubmit: Enviando producto a API...')
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })
      console.log('📡 handleSubmit: Respuesta de API:', response.status, response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear el producto')
      }

      const result = await response.json()
      console.log('📦 Formulario: Estructura de respuesta:', {
        hasProduct: !!result.producto,
        productId: result.producto?.producto_id,
        fullResponse: result
      })

      // Subir imágenes al bucket de Supabase Storage
      
      if (images.length > 0 && result.producto?.producto_id) {
        const uploadedImages = []
        
        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${result.producto.producto_id}_${i + 1}.${fileExt}`
          
          // Crear estructura: productos/user_{user_id}/{id_producto}/
          const filePath = `productos/user_${result.producto.user_id}/${result.producto.producto_id}/${fileName}`


          try {
            const supabase = getSupabaseClient()
            if (!supabase) {
              console.log('❌ Subida de imagen: Supabase no está configurado')
              continue
            }
            
            // Subir imagen al bucket
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('Ecoswap')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('❌ Formulario: Error subiendo imagen:', uploadError)
              throw new Error(`Error subiendo imagen ${i + 1}: ${uploadError.message}`)
            }


            // Obtener URL pública de la imagen
            const { data: urlData } = supabase.storage
              .from('Ecoswap')
              .getPublicUrl(filePath)

            uploadedImages.push({
              producto_id: result.producto.producto_id,
              url_imagen: urlData.publicUrl,
              es_principal: i === 0, // La primera imagen es principal
              orden: i + 1
            })

          } catch (imageError) {
            console.error(`❌ Formulario: Error con imagen ${i + 1}:`, imageError)
            throw imageError
          }
        }

        // Guardar referencias de imágenes en la base de datos
        if (uploadedImages.length > 0) {
          
          const imagesResponse = await fetch('/api/products/images', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${finalToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              producto_id: result.producto.producto_id,
              imagenes: uploadedImages
            })
          })

          console.log('📡 Formulario: Respuesta de la API de imágenes:', {
            status: imagesResponse.status,
            ok: imagesResponse.ok
          })

          if (!imagesResponse.ok) {
            const errorData = await imagesResponse.json()
            console.error('❌ Formulario: Error guardando referencias de imágenes:', errorData)
            // No lanzamos error aquí porque el producto ya se creó
          } else {
            const successData = await imagesResponse.json()
          }
        }
      }

      // Mostrar mensaje de éxito
      await (window as any).Swal.fire({
        title: '¡Producto Enviado!',
        text: '¡Producto enviado exitosamente! Será revisado por nuestros administradores antes de ser publicado.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      })

      // Redirigir a productos
      router.push('/')
    } catch (error) {
      // Log error without using console.error (which gets removed in production)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error al enviar producto:', error)
      }
      (window as any).Swal.fire({
        title: 'Error',
        text: `Error al enviar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price)
    if (isNaN(numPrice)) return ''
    return numPrice.toLocaleString('es-CO')
  }

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading || sessionLoading || !sessionValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Mostrar error si Supabase no está configurado
  const supabase = getSupabaseClient()
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error de Configuración
            </h2>
            <p className="text-red-600 mb-4">
              La aplicación no está configurada correctamente. 
              Las variables de entorno de Supabase no están configuradas.
            </p>
            <div className="text-sm text-gray-600 mb-4">
              <p>Necesitas configurar:</p>
              <ul className="list-disc list-inside mt-2">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Recargar Página
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, no mostrar nada (se redirige)
  if (!user) {
    return null
  }

  return (
    <AuthGuard>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación *</label>
                <select
                  value={selectedUbicacionId}
                  onChange={(e) => setSelectedUbicacionId(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.location ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Selecciona una ubicación</option>
                  {userLocations.map(u => (
                    <option key={u.ubicacion_id} value={u.ubicacion_id}>
                      {u.ciudad}, {u.departamento}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Nueva ubicación
                  </button>
                </div>
                {formErrors.location && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.location}</p>
                )}
              </div>
            </div>

            {/* Etiquetas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: tecnología, smartphone, apple, usado"
              />
              <p className="text-sm text-gray-600 mt-1">Separa las etiquetas con comas para facilitar la búsqueda</p>
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

      {/* Modal Nueva Ubicación */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowLocationModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Nueva ubicación</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">País</label>
                  <input value={newLocation.pais} onChange={(e)=>setNewLocation({...newLocation,pais:e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Departamento</label>
                  <select
                    value={selectedDepId}
                    onChange={(e)=>{
                      const val = e.target.value? Number(e.target.value): ''
                      setSelectedDepId(val)
                      setNewLocation({...newLocation, departamento: '', ciudad: ''})
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecciona departamento</option>
                    {deps.map(d=> (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Municipio / Ciudad</label>
                  <select
                    value={newLocation.ciudad}
                    onChange={(e)=>{ setSelectedMuniName(e.target.value); setNewLocation({...newLocation, ciudad:e.target.value}) }}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={!selectedDepId}
                  >
                    <option value="">Selecciona municipio</option>
                    {munis.map(m=> (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Barrio</label>
                  <input value={newLocation.barrio} onChange={(e)=>setNewLocation({...newLocation,barrio:e.target.value})} className="w-full px-3 py-2 border rounded-md" />
                </div>
                
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={newLocation.es_principal} onChange={(e)=>setNewLocation({...newLocation,es_principal:e.target.checked})} />
                Marcar como principal
              </label>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={()=>setShowLocationModal(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
              <button
                onClick={async ()=>{
                  try{
                    console.log('🔍 Guardar ubicación: Verificando sesión...')
                    const supabase = getSupabaseClient()
                    if (!supabase) {
                      console.log('❌ Guardar ubicación: Supabase no está configurado')
                      setShowLocationModal(false)
                      return
                    }
                    
                    const { data: { session } } = await supabase.auth.getSession()
                    console.log('🔍 Guardar ubicación: Sesión obtenida:', !!session)
                    
                    if(!session?.user?.email){ 
                      console.log('⚠️ Guardar ubicación: No hay email en la sesión')
                      setShowLocationModal(false)
                      return 
                    }
                    const { data: usuario } = await supabase.from('usuario').select('user_id').eq('email', session.user.email).single()
                    if(!usuario){ setShowLocationModal(false); return }
                    const payload:any = {
                      user_id: usuario.user_id,
                      pais: newLocation.pais || 'Colombia',
                      departamento: (deps.find(d=>d.id===selectedDepId)?.nombre || newLocation.departamento || '').trim(),
                      ciudad: selectedMuniName ? selectedMuniName.trim() : newLocation.ciudad.trim(),
                      barrio: newLocation.barrio || null,
                      es_principal: newLocation.es_principal
                    }
                    // Resolver ids si existen catlogos en BD
                    let depId = null, muniId = null
                    try {
                      const currentDepName = (deps.find(d=>d.id===selectedDepId)?.nombre || '').trim()
                      if (currentDepName) {
                        const { data: drow } = await supabase.from('departamento').select('departamento_id').eq('nombre', currentDepName).single()
                        depId = drow?.departamento_id || null
                        if (depId && selectedMuniName) {
                          const { data: mrow } = await supabase.from('municipio').select('municipio_id').eq('departamento_id', depId).eq('nombre', selectedMuniName.trim()).single()
                          muniId = mrow?.municipio_id || null
                        }
                      }
                    } catch {}
                    if (depId) payload.departamento_id = depId
                    if (muniId) payload.municipio_id = muniId

                    const { data, error } = await supabase.from('ubicacion').insert(payload).select('ubicacion_id, ciudad, departamento').single()
                    if(!error && data){
                      setUserLocations(prev=>[{ ubicacion_id: data.ubicacion_id, ciudad: data.ciudad, departamento: data.departamento }, ...prev])
                      setSelectedUbicacionId(data.ubicacion_id)
                    }
                  }catch{}
                  setShowLocationModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar ubicación
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  )
}
