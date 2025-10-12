import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Products Images: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        const productId = params.id

        if (!productId) {
            return NextResponse.json({ error: 'ID de producto requerido' }, { status: 400 })
        }

        // Obtener imágenes del producto desde la tabla IMAGEN_PRODUCTO
        const { data: images, error } = await supabase
            .from('imagen_producto')
            .select('imagen_id, url_imagen, descripcion_alt, es_principal, orden, fecha_subida')
            .eq('producto_id', productId)
            .order('orden', { ascending: true })

        if (error) {
            console.error('Error obteniendo imágenes:', error)
            return NextResponse.json({ error: 'Error al obtener imágenes' }, { status: 400 })
        }

        // Formatear las imágenes
        const imageUrls = images?.map(image => ({
            id: image.imagen_id,
            url: image.url_imagen,
            alt: image.descripcion_alt,
            is_principal: image.es_principal,
            orden: image.orden,
            fecha_subida: image.fecha_subida
        })) || []

        return NextResponse.json({ images: imageUrls })

    } catch (error: any) {
        console.error('Error en API de imágenes:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            console.error('❌ API Products Images POST: Supabase no está configurado')
            return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
        }

        const productId = params.id
        const formData = await req.formData()
        const file = formData.get('image') as File

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ 
                error: 'Tipo de archivo no permitido. Solo se permiten: JPEG, PNG, WebP, GIF' 
            }, { status: 400 })
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ 
                error: 'Archivo demasiado grande. Máximo 10MB' 
            }, { status: 400 })
        }

        // Generar nombre único para el archivo
        const timestamp = Date.now()
        const fileExtension = file.name.split('.').pop()
        const fileName = `${timestamp}.${fileExtension}`

        // Subir archivo a Supabase Storage
        const { data, error } = await supabase.storage
            .from('Ecoswap')
            .upload(`productos/${productId}/${fileName}`, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Error subiendo imagen:', error)
            return NextResponse.json({ error: 'Error al subir imagen' }, { status: 400 })
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('Ecoswap')
            .getPublicUrl(data.path)

        // Guardar referencia en la tabla IMAGEN_PRODUCTO
        const { data: imagenData, error: imagenError } = await supabase
            .from('imagen_producto')
            .insert({
                producto_id: parseInt(productId),
                url_imagen: urlData.publicUrl,
                descripcion_alt: file.name,
                es_principal: false, // Por defecto no es principal
                orden: 1
            })
            .select()
            .single()

        if (imagenError) {
            console.error('Error guardando referencia de imagen:', imagenError)
            return NextResponse.json({ error: 'Error al guardar imagen' }, { status: 400 })
        }

        return NextResponse.json({ 
            success: true, 
            image: {
                id: imagenData.imagen_id,
                url: urlData.publicUrl,
                path: data.path,
                name: fileName
            }
        })

    } catch (error: any) {
        console.error('Error subiendo imagen:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
