'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PhotoIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getSupabaseClient } from '@/lib/supabase-client'


interface FormState {
    titulo: string
    descripcion: string
    precio: string
    estado: 'usado' | 'para_repuestos'
    tipo_transaccion: 'venta' | 'intercambio' | 'donacion' | 'mixto'
}

export default function EditProductPage() {
    const { id } = useParams()
    const router = useRouter()
    const productId = Array.isArray(id) ? id[0] : (id as string)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState<FormState>({
        titulo: '',
        descripcion: '',
        precio: '',
        estado: 'usado',
        tipo_transaccion: 'venta'
    })
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [existingImages, setExistingImages] = useState<Array<{ id: number, url: string, es_principal: boolean, orden: number }>>([])
    const [ownerUserId, setOwnerUserId] = useState<number | null>(null)
    // Nuevos campos de edición
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
    const [category, setCategory] = useState<string>('')
    const [location, setLocation] = useState<string>('')
    const [tags, setTags] = useState<string>('')
    const [showSpecifications, setShowSpecifications] = useState(false)
    const [specifications, setSpecifications] = useState<Record<string, string>>({})
    const [specKey, setSpecKey] = useState('')
    const [specValue, setSpecValue] = useState('')
    // Estado visual detallado: como nuevo, bueno, aceptable, usado, para repuesto
    const [condition, setCondition] = useState<'like-new' | 'good' | 'fair' | 'used' | 'parts'>('used')
  // Ubicaciones (editar)
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
  const [localColData, setLocalColData] = useState<null | { departamentos: Array<{ nombre: string, municipios: string[] }> }>(null)
  const [deps, setDeps] = useState<Array<{ id:number, nombre:string }>>([])
  const [munis, setMunis] = useState<Array<{ id:number, nombre:string }>>([])
  const [selectedDepId, setSelectedDepId] = useState<number | ''>('')
  const [selectedMuniName, setSelectedMuniName] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError(null)

                // Verificar sesión
                const supabase = getSupabaseClient()
                if (!supabase) {
                    router.push('/login')
                    return
                }
                
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    router.push('/login')
                    return
                }

                // Obtener producto incluyendo campos opcionales (etiquetas/especificaciones/categoría si existen)
                const { data, error } = await supabase
                    .from('producto')
                    .select('producto_id, user_id, titulo, descripcion, precio, estado, tipo_transaccion, estado_validacion, categoria_id, etiquetas, especificaciones')
                    .eq('producto_id', productId)
                    .single()

                if (error || !data) {
                    throw new Error('Producto no encontrado')
                }

                // Asegurar que el usuario es el dueño
                const { data: userRow } = await supabase
                    .from('usuario')
                    .select('user_id')
                    .eq('email', session.user.email)
                    .single()

                if (!userRow || userRow.user_id !== data.user_id) {
                    throw new Error('No autorizado para editar este producto')
                }

                setForm({
                    titulo: data.titulo || '',
                    descripcion: data.descripcion || '',
                    precio: data.precio ? String(data.precio) : '',
                    estado: (data.estado || 'usado') as any,
                    tipo_transaccion: (data.tipo_transaccion || 'venta') as any
                })
                setCondition((data.estado === 'para_repuestos' ? 'parts' : 'used'))
                setOwnerUserId(data.user_id || null)

                // Categoría: si hay categoria_id, intenta resolver nombre; si no, queda vacío
                if ((data as any)?.categoria_id) {
                    try {
                        const { data: cat } = await supabase
                            .from('categoria')
                            .select('nombre')
                            .eq('categoria_id', (data as any).categoria_id)
                            .single()
                        setCategory(cat?.nombre || '')
                    } catch {
                        setCategory('')
                    }
                } else {
                    setCategory('')
                }

                // Etiquetas: usar columna plana si existe; si no, cargar desde tablas normalizadas
                if (typeof (data as any)?.etiquetas === 'string' && (data as any).etiquetas.trim().length > 0) {
                    setTags((data as any).etiquetas)
                } else {
                    try {
                        const { data: rels } = await supabase
                            .from('producto_tag')
                            .select('tag_id')
                            .eq('producto_id', productId)
                        const tagIds = (rels || []).map((r: any) => r.tag_id)
                        if (tagIds.length > 0) {
                            const { data: tagRows } = await supabase
                                .from('tag')
                                .select('nombre, tag_id')
                                .in('tag_id', tagIds)
                            const names = (tagRows || []).map((t: any) => String(t.nombre)).filter(Boolean)
                            if (names.length > 0) setTags(names.join(', '))
                        }
                    } catch {}
                }

                // Especificaciones: usar columna plana si existe; si no, cargar desde 'producto_especificacion'
                const espec = (data as any)?.especificaciones
                let loadedSpecs: Record<string, string> | null = null
                if (espec && typeof espec === 'object' && Object.keys(espec).length > 0) {
                    loadedSpecs = espec as Record<string, string>
                } else if (typeof espec === 'string') {
                    try {
                        const parsed = JSON.parse(espec)
                        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                            loadedSpecs = parsed as Record<string, string>
                        }
                    } catch {}
                }

                if (!loadedSpecs) {
                    try {
                        const { data: specRows } = await supabase
                            .from('producto_especificacion')
                            .select('clave, valor')
                            .eq('producto_id', Number(productId))
                        const specObj: Record<string, string> = {}
                        ;(specRows || []).forEach((row: any) => {
                            const k = String(row?.clave || '').trim()
                            const v = String(row?.valor || '').trim()
                            if (k && v) specObj[k] = v
                        })
                        if (Object.keys(specObj).length > 0) loadedSpecs = specObj
                    } catch {}
                }

                if (loadedSpecs) {
                    setSpecifications(loadedSpecs)
                    setShowSpecifications(true)
                }

                setLocation('')

                // Cargar ubicaciones del usuario
                try {
                    const { data: locs } = await supabase
                        .from('ubicacion')
                        .select('ubicacion_id, ciudad, departamento, es_principal')
                        .eq('user_id', userRow.user_id)
                        .order('es_principal', { ascending: false })
                    const items = (locs || []).map((u: any) => ({ ubicacion_id: u.ubicacion_id, ciudad: u.ciudad, departamento: u.departamento }))
                    setUserLocations(items)
                } catch {}

                // Cargar imágenes existentes
                const { data: imgs } = await supabase
                    .from('imagen_producto')
                    .select('imagen_id, url_imagen, es_principal, orden')
                    .eq('producto_id', productId)
                    .order('orden', { ascending: true })
                setExistingImages((imgs || []).map((i: any) => ({ id: i.imagen_id, url: i.url_imagen, es_principal: i.es_principal, orden: i.orden })))
            } catch (e: any) {
                setError(e.message || 'Error cargando producto')
            } finally {
                setLoading(false)
            }
        }

        if (productId) load()
    }, [productId, router])

    const handleChange = (field: keyof FormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value } as FormState))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            setError(null)

            const supabase = getSupabaseClient()
            if (!supabase) throw new Error('Supabase no está configurado')
            
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Sesión no válida')

            // Mapear condición visual a estado de BD
            const estadoDb = condition === 'parts' ? 'para_repuestos' : 'usado'

            // Si cambia ubicacion, preparar snapshots
            let ubicUpdate: any = {}
            if (selectedUbicacionId) {
                const { data: ub } = await supabase
                    .from('ubicacion')
                    .select('ciudad, departamento, latitud, longitud')
                    .eq('ubicacion_id', selectedUbicacionId)
                    .single()
                ubicUpdate = {
                    ubicacion_id: Number(selectedUbicacionId),
                    ciudad_snapshot: ub?.ciudad || null,
                    departamento_snapshot: ub?.departamento || null,
                    latitud_snapshot: (ub as any)?.latitud ?? null,
                    longitud_snapshot: (ub as any)?.longitud ?? null,
                }
            }

            const { error } = await supabase
                .from('producto')
                .update({
                    titulo: form.titulo.trim(),
                    descripcion: form.descripcion.trim(),
                    precio: form.tipo_transaccion === 'donacion' ? null : (form.precio ? parseFloat(form.precio) : null),
                    estado: estadoDb,
                    tipo_transaccion: form.tipo_transaccion,
                    // Actualizar columnas planas (si existen)
                    etiquetas: (tags || '').trim(),
                    especificaciones: specifications && Object.keys(specifications).length > 0 ? specifications : null,
                    // Reiniciar validación para revisión nuevamente
                    estado_validacion: 'pending',
                    comentarios_validacion: null,
                    fecha_validacion: null,
                    fecha_actualizacion: new Date().toISOString(),
                    ...ubicUpdate
                })
                .eq('producto_id', productId)

            if (error) throw error

            // Sincronizar tablas normalizadas: TAGS
            try {
                const rawTags = (tags || '')
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t.length > 0)
                const uniqueTags = Array.from(new Set(rawTags))
                if (uniqueTags.length > 0) {
                    // upsert catálogo de tags
                    await supabase
                        .from('tag')
                        .upsert(uniqueTags.map(nombre => ({ nombre })), { onConflict: 'nombre' })

                    // obtener ids
                    const { data: tagRows } = await supabase
                        .from('tag')
                        .select('tag_id, nombre')
                        .in('nombre', uniqueTags)

                    const tagIds = (tagRows || []).map((r: any) => r.tag_id)

                    // reemplazar relaciones
                    await supabase.from('producto_tag').delete().eq('producto_id', productId)
                    if (tagIds.length > 0) {
                        await supabase.from('producto_tag').insert(
                            tagIds.map((idNum: number) => ({ producto_id: Number(productId), tag_id: idNum }))
                        )
                    }
                } else {
                    // si no hay tags, limpiar relaciones
                    await supabase.from('producto_tag').delete().eq('producto_id', productId)
                }
            } catch {}

            // Sincronizar tablas normalizadas: ESPECIFICACIONES
            try {
                await supabase.from('producto_especificacion').delete().eq('producto_id', productId)
                const entries = Object.entries(specifications || {})
                    .filter(([k, v]) => String(k).trim().length > 0 && String(v).trim().length > 0)
                    .map(([k, v]) => ({ producto_id: Number(productId), clave: String(k).trim(), valor: String(v).trim() }))
                if (entries.length > 0) {
                    await supabase.from('producto_especificacion').insert(entries)
                }
            } catch {}

            // Si hay imágenes nuevas, subirlas a Storage y registrar en BD
            if (images.length > 0) {
                if (!supabase) throw new Error('Supabase no está configurado')
                
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) throw new Error('Sesión no válida para subir imágenes')

                const uploaded: any[] = []
                for (let i = 0; i < images.length; i++) {
                    const file = images[i]
                    const formData = new FormData()
                    formData.append('image', file)
                    formData.append('ownerUserId', String(ownerUserId || ''))
                    // índice deseado basado en imágenes existentes + posición local
                    const desiredIndex = (existingImages.length || 0) + i + 1
                    formData.append('index', String(desiredIndex))
                    const uploadResp = await fetch(`/api/products/${productId}/storage`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${session.access_token}` },
                        body: formData
                    })
                    if (!uploadResp.ok) {
                        const msg = await uploadResp.text()
                        throw new Error(msg || 'Error subiendo imagen')
                    }
                    const { url, index } = await uploadResp.json()
                    uploaded.push({
                        producto_id: Number(productId),
                        url_imagen: url,
                        es_principal: existingImages.length === 0 && i === 0,
                        orden: index
                    })
                }

                if (uploaded.length > 0) {
                    await fetch('/api/products/images', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ producto_id: Number(productId), imagenes: uploaded })
                    })
                }
            }

            try {
                await (window as any).Swal.fire({
                    title: '¡Producto actualizado!',
                    text: 'Tus cambios se guardaron y el producto fue reenviado a validación.',
                    icon: 'success',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#10B981'
                })
            } catch {}
            router.push('/')
        } catch (e: any) {
            setError(e.message || 'Error guardando cambios')
        } finally {
            setSaving(false)
        }
    }

    // Cargar departamentos desde JSON o BD cuando se abra modal
    useEffect(() => {
        const loadDeps = async () => {
            if (!showLocationModal) return
            const normalizeColData = (raw: any) => {
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
            try {
                const res = await fetch('/data/colombia.json')
                if (res.ok) {
                    const raw = await res.json()
                    const json = normalizeColData(raw)
                    if (json) {
                        setLocalColData(json)
                        setDeps(json.departamentos.map((d: any, idx: number) => ({ id: idx + 1, nombre: String(d.nombre) })))
                        return
                    }
                }
            } catch {}
            try {
                const res2 = await fetch('/colombia.json')
                if (res2.ok) {
                    const raw2 = await res2.json()
                    const json2 = normalizeColData(raw2)
                    if (json2) {
                        setLocalColData(json2)
                        setDeps(json2.departamentos.map((d: any, idx: number) => ({ id: idx + 1, nombre: String(d.nombre) })))
                        return
                    }
                }
            } catch {}
        }
        loadDeps()
    }, [showLocationModal])

    useEffect(() => {
        const loadMunis = async () => {
            if (!selectedDepId) { setMunis([]); return }
            if (localColData) {
                const dep = localColData.departamentos[(Number(selectedDepId) - 1)]
                const list = Array.isArray(dep?.municipios) ? dep.municipios : []
                setMunis(list.map((n: string, idx: number) => ({ id: idx + 1, nombre: String(n) })))
                return
            }
        }
        loadMunis()
    }, [selectedDepId, localColData])

    // Convertir imagen a WebP (máx 1600px, calidad 0.8)
    const convertToWebP = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            // Verificar si el archivo ya es WebP y es pequeño, no necesita compresión
            if (file.type === 'image/webp' && file.size < 500000) {
                console.log('ℹ️ [Editar Producto] Archivo ya es WebP y pequeño, omitiendo compresión')
                resolve(file)
                return
            }

            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) { 
                reject(new Error('Canvas no disponible')); 
                return 
            }
            
            const img = new Image()
            const objectUrl = URL.createObjectURL(file)
            
            img.onload = () => {
                try {
                    let width = img.width
                    let height = img.height
                    const maxDimension = 1600
                    
                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) { 
                            height = (height / width) * maxDimension
                            width = maxDimension 
                        } else { 
                            width = (width / height) * maxDimension
                            height = maxDimension 
                        }
                    }
                    
                    canvas.width = width
                    canvas.height = height
                    ctx.clearRect(0, 0, width, height)
                    ctx.drawImage(img, 0, 0, width, height)
                    
                    // Intentar convertir a WebP, si falla usar JPEG como fallback
                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(objectUrl)
                        if (!blob) { 
                            reject(new Error('No se pudo convertir la imagen'))
                            return 
                        }
                        const webp = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })
                        resolve(webp)
                    }, 'image/webp', 0.8)
                } catch (err) {
                    URL.revokeObjectURL(objectUrl)
                    reject(err as any)
                }
            }
            
            img.onerror = () => { 
                URL.revokeObjectURL(objectUrl)
                reject(new Error('Error al cargar la imagen'))
            }
            
            img.src = objectUrl
        })
    }

    const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        const processed: File[] = []
        for (const f of files) {
            try {
                console.log('🔄 [Editar Producto] Comprimiendo imagen:', f.name)
                const compressed = await convertToWebP(f)
                console.log('✅ [Editar Producto] Imagen comprimida:', compressed.name, 'Tamaño original:', (f.size / 1024).toFixed(2), 'KB → Comprimido:', (compressed.size / 1024).toFixed(2), 'KB')
                processed.push(compressed)
            } catch (error) {
                console.error('❌ [Editar Producto] Error comprimiendo imagen:', error, 'Usando archivo original')
                processed.push(f)
            }
        }
        setImages(prev => [...prev, ...processed])
        setImagePreviews(prev => [...prev, ...processed.map(f => URL.createObjectURL(f))])
        // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
        e.target.value = ''
    }

    const removeNewImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }

    const setAsPrimary = async (imagenId: number) => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) throw new Error('Supabase no está configurado')
            
            // Poner todas en false y la seleccionada en true
            await supabase.from('imagen_producto').update({ es_principal: false }).eq('producto_id', productId)
            const { error } = await supabase.from('imagen_producto').update({ es_principal: true }).eq('imagen_id', imagenId)
            if (error) throw error
            setExistingImages(prev => prev.map(img => ({ ...img, es_principal: img.id === imagenId })))
        } catch (e) {
            alert('No se pudo marcar como principal')
        }
    }

    const deleteExistingImage = async (imagenId: number) => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) throw new Error('Supabase no está configurado')
            
            const { error } = await supabase.from('imagen_producto').delete().eq('imagen_id', imagenId)
            if (error) throw error
            setExistingImages(prev => prev.filter(img => img.id !== imagenId))
        } catch (e) {
            alert('No se pudo eliminar la imagen')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Editar producto</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Volver</button>
                </div>
            </div>
        )
    }

    return (
        <>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar producto</h1>

            <form onSubmit={handleSave} className="space-y-5 bg-white border rounded-lg p-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input value={form.titulo} onChange={(e) => handleChange('titulo', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea value={form.descripcion} onChange={(e) => handleChange('descripcion', e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-md" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                        <input type="number" value={form.precio} onChange={(e) => handleChange('precio', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-md"
                        >
                            <option value="like-new">Como Nuevo</option>
                            <option value="good">Bueno</option>
                            <option value="fair">Aceptable</option>
                            <option value="used">Usado</option>
                            <option value="parts">Para Repuestos</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transacción</label>
                        <select value={form.tipo_transaccion} onChange={(e) => handleChange('tipo_transaccion', e.target.value)} className="w-full px-3 py-2 border rounded-md">
                            <option value="venta">Venta</option>
                            <option value="intercambio">Intercambio</option>
                            <option value="donacion">Donación</option>
                            <option value="mixto">Mixto</option>
                        </select>
                    </div>
                </div>

                {/* Categoría y Ubicación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecciona una categoría</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación *</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedUbicacionId}
                                onChange={(e) => setSelectedUbicacionId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Mantener ubicación actual</option>
                                {userLocations.map(u => (
                                    <option key={u.ubicacion_id} value={u.ubicacion_id}>
                                        {u.ciudad}, {u.departamento}
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={()=> setShowLocationModal(true)} className="px-3 border rounded-md">Nueva</button>
                        </div>
                    </div>
                </div>

                {/* Etiquetas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                    <input
                        type="text"
                        placeholder="Ej: tecnología, smartphone, apple, usado"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Separa las etiquetas con comas para facilitar la búsqueda</p>
                </div>

                {/* Especificaciones Técnicas */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Especificaciones Técnicas</label>
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
                                onClick={() => {
                                    if (specKey.trim() && specValue.trim()) {
                                        setSpecifications(prev => ({ ...prev, [specKey.trim()]: specValue.trim() }))
                                        setSpecKey('')
                                        setSpecValue('')
                                    }
                                }}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                            >
                                Agregar
                            </button>

                            {Object.keys(specifications).length > 0 && (
                                <div className="space-y-2">
                                    {Object.entries(specifications).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between p-2 bg-white rounded border">
                                            <span className="text-sm"><strong>{k}:</strong> {v}</span>
                                            <button type="button" onClick={() => {
                                                const newSpecs = { ...specifications }; delete newSpecs[k]; setSpecifications(newSpecs)
                                            }} className="text-red-600 hover:text-red-700">
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Imágenes existentes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes existentes</label>
                    {existingImages.length === 0 ? (
                        <p className="text-sm text-gray-500">Este producto aún no tiene imágenes.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {existingImages.map(img => (
                                <div key={img.id} className="relative group border rounded p-1 bg-white">
                                    <img src={img.url} alt="Imagen" className="w-full h-24 object-cover rounded" />
                                    {img.es_principal && (
                                        <span className="absolute bottom-1 left-1 text-[10px] bg-green-600 text-white px-1 rounded">Principal</span>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded"></div>
                                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!img.es_principal && (
                                            <button type="button" onClick={() => setAsPrimary(img.id)} className="px-2 py-1 text-[11px] bg-blue-600 text-white rounded">
                                                Principal
                                            </button>
                                        )}
                                        <button type="button" onClick={() => deleteExistingImage(img.id)} className="px-2 py-1 text-[11px] bg-red-600 text-white rounded">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Agregar nuevas imágenes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agregar nuevas imágenes</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input id="edit-image-upload" type="file" multiple accept="image/*" className="hidden" onChange={onPickImages} />
                        <label htmlFor="edit-image-upload" className="cursor-pointer flex flex-col items-center">
                            <PhotoIcon className="w-10 h-10 text-gray-400" />
                            <span className="text-sm text-gray-600">Haz clic para subir imágenes o arrastra aquí</span>
                        </label>
                    </div>

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative group">
                                    <img src={src} alt={`Nueva ${index + 1}`} className="w-full h-24 object-cover rounded" />
                                    <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-md">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
                        {saving ? 'Guardando…' : 'Guardar y reenviar a validación'}
                    </button>
                </div>
            </form>
        </div>
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
                                    onChange={(e)=>{ const v = e.target.value? Number(e.target.value) : ''; setSelectedDepId(v); setNewLocation({...newLocation, departamento:'', ciudad:''}); setSelectedMuniName('') }}
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
                                    value={selectedMuniName}
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
                            <input type="checkbox" checked={newLocation.es_principal} onChange={(e)=>setNewLocation({...newLocation, es_principal: e.target.checked})} />
                            Marcar como principal
                        </label>
                    </div>
                    <div className="px-6 py-4 border-t flex justify-end gap-2">
                        <button onClick={()=> setShowLocationModal(false)} className="px-4 py-2 border rounded-md">Cancelar</button>
                        <button
                            onClick={async ()=>{
                                try{
                                    const supabase = getSupabaseClient()
                                    if (!supabase) { setShowLocationModal(false); return }
                                    
                                    const { data: { session } } = await supabase.auth.getSession()
                                    if(!session?.user?.email){ setShowLocationModal(false); return }
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
                                    // Resolver ids si existen catálogos en BD
                                    try {
                                        const currentDepName = (deps.find(d=>d.id===selectedDepId)?.nombre || '').trim()
                                        if (currentDepName) {
                                            const { data: drow } = await supabase.from('departamento').select('departamento_id').eq('nombre', currentDepName).single()
                                            const depId = drow?.departamento_id || null
                                            if (depId) payload.departamento_id = depId
                                            if (depId && selectedMuniName) {
                                                const { data: mrow } = await supabase.from('municipio').select('municipio_id').eq('departamento_id', depId).eq('nombre', selectedMuniName.trim()).single()
                                                const muniId = mrow?.municipio_id || null
                                                if (muniId) payload.municipio_id = muniId
                                            }
                                        }
                                    } catch {}

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
        </>
    )
}


