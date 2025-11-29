import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Manejar params que puede ser Promise (Next.js 15+) o objeto directo
    let productoId: string
    try {
      const resolvedParams = await Promise.resolve(params)
      productoId = resolvedParams.id
    } catch (paramError: any) {
      console.error('❌ Error obteniendo params:', paramError)
      // Intentar como objeto directo (Next.js < 15)
      if (typeof params === 'object' && 'id' in params && !('then' in params)) {
        productoId = (params as { id: string }).id
      } else {
        return NextResponse.json({ 
          error: 'Error procesando parámetros de ruta',
          details: paramError?.message || 'Params inválidos'
        }, { status: 400 })
      }
    }
    
    console.log('🔍 Storage endpoint - productoId:', productoId)
    
    if (!productoId) {
      return NextResponse.json({ 
        error: 'ID de producto requerido',
        details: `params: ${JSON.stringify(params)}`
      }, { status: 400 })
    }
    const supabase = getSupabaseClient()
    if (!supabase) return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.split(' ')[1] : null
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validar usuario autenticado
    const { data: userInfo, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userInfo?.user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('image') as File | null
    const ownerUserIdStr = form.get('ownerUserId') as string | null
    const indexStr = form.get('index') as string | null
    
    console.log('📋 Datos recibidos del formulario:', {
      hasFile: !!file,
      fileType: file?.type,
      fileSize: file?.size,
      ownerUserIdStr,
      indexStr,
      productoId
    })
    
    if (!file || !ownerUserIdStr) {
      console.error('❌ Faltan datos requeridos:', { hasFile: !!file, hasOwnerUserId: !!ownerUserIdStr })
      return NextResponse.json({ 
        error: 'image y ownerUserId son requeridos',
        details: `file: ${!!file}, ownerUserId: ${!!ownerUserIdStr}`
      }, { status: 400 })
    }
    
    const ownerUserId = Number(ownerUserIdStr)
    if (isNaN(ownerUserId)) {
      console.error('❌ ownerUserId no es un número válido:', ownerUserIdStr)
      return NextResponse.json({ 
        error: 'ownerUserId debe ser un número válido',
        details: `recibido: ${ownerUserIdStr}`
      }, { status: 400 })
    }

    // Verificar propiedad del producto
    console.log('🔍 Verificando producto:', productoId)
    const { data: prod, error: prodErr } = await supabase
      .from('producto')
      .select('producto_id, user_id')
      .eq('producto_id', productoId)
      .single()
    
    if (prodErr) {
      console.error('❌ Error verificando producto:', prodErr)
      return NextResponse.json({ 
        error: 'Error verificando producto',
        details: prodErr.message 
      }, { status: 500 })
    }
    
    if (!prod) {
      console.error('❌ Producto no encontrado:', productoId)
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    
    console.log('✅ Producto encontrado:', { producto_id: prod.producto_id, user_id: prod.user_id })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    
    console.log('🔍 Verificando configuración de Supabase:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceKey,
      url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing'
    })
    
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Variables de entorno faltantes:', {
        NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!serviceKey
      })
      return NextResponse.json({ 
        error: 'Variables de entorno de Supabase faltantes',
        details: `URL: ${supabaseUrl ? 'OK' : 'FALTA'}, Service Key: ${serviceKey ? 'OK' : 'FALTA'}`
      }, { status: 500 })
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Verificar que el bucket existe y es accesible
    const { data: buckets, error: bucketsError } = await admin.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError)
      return NextResponse.json({ 
        error: 'Error accediendo al storage', 
        details: bucketsError.message 
      }, { status: 500 })
    }
    
    const ecoswapBucket = buckets?.find(b => b.id === 'Ecoswap')
    if (!ecoswapBucket) {
      console.error('❌ Bucket Ecoswap no encontrado. Buckets disponibles:', buckets?.map(b => b.id))
      return NextResponse.json({ 
        error: 'Bucket Ecoswap no encontrado', 
        details: 'El bucket de storage no existe o no es accesible' 
      }, { status: 500 })
    }
    
    console.log('✅ Bucket Ecoswap encontrado:', {
      id: ecoswapBucket.id,
      name: ecoswapBucket.name,
      public: ecoswapBucket.public
    })

    if (file.type !== 'image/webp') {
      return NextResponse.json({ error: 'Solo WebP permitido' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (max 10MB)' }, { status: 400 })
    }

    // Calcular índice siguiente leyendo cantidad existente
    let nextIndex: number
    if (indexStr && !Number.isNaN(Number(indexStr))) {
      nextIndex = Number(indexStr)
    } else {
      const { count } = await admin
        .from('imagen_producto')
        .select('*', { count: 'exact', head: true })
        .eq('producto_id', Number(productoId))
      nextIndex = (count || 0) + 1
    }

    const fileName = `${productoId}_${nextIndex}.webp`
    const storagePath = `productos/user_${ownerUserId}/${productoId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    console.log('📤 Subiendo imagen a Supabase Storage:', {
      bucket: 'Ecoswap',
      path: storagePath,
      size: buffer.length,
      fileName
    })

    const { data: uploadData, error: upErr } = await admin.storage
      .from('Ecoswap')
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp',
      })
    
    if (upErr) {
      console.error('❌ Error subiendo imagen a Storage:', {
        error: upErr.message,
        name: upErr.name,
        path: storagePath,
        bucket: 'Ecoswap'
      })
      return NextResponse.json({ 
        error: 'Error subiendo imagen al storage', 
        details: upErr.message
      }, { status: 500 })
    }

    console.log('✅ Imagen subida exitosamente:', {
      path: storagePath,
      uploadData
    })

    const { data: urlData } = admin.storage.from('Ecoswap').getPublicUrl(storagePath)
    
    console.log('🔗 URL pública generada:', urlData.publicUrl)

    return NextResponse.json({ ok: true, path: storagePath, url: urlData.publicUrl, index: nextIndex, name: fileName })
  } catch (e: any) {
    console.error('❌ Error inesperado en storage endpoint:', {
      message: e?.message,
      stack: e?.stack,
      name: e?.name,
      error: e
    })
    
    // En desarrollo, devolver más detalles
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? {
          message: e?.message,
          name: e?.name,
          stack: e?.stack?.split('\n').slice(0, 5).join('\n') // Solo primeras 5 líneas
        }
      : { message: 'Error interno del servidor' }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      ...errorDetails
    }, { status: 500 })
  }
}


