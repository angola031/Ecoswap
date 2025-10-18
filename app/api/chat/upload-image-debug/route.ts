import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Iniciando subida de imagen con debug...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [DEBUG] Supabase client no disponible')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }
    
    console.log('📋 [DEBUG] Procesando FormData...')
    const formData = await request.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string

    console.log('📋 [DEBUG] Parámetros recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      chatId,
      userId
    })

    if (!file) {
      console.error('❌ [DEBUG] No se encontró el archivo')
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
    }

    if (!chatId || !userId) {
      console.error('❌ [DEBUG] Faltan parámetros requeridos:', { chatId, userId })
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    let token = null
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
      console.log('🔐 [DEBUG] Token encontrado en Authorization header')
    } else {
      console.error('❌ [DEBUG] No se encontró token de autorización')
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }
    
    console.log('🔐 [DEBUG] Verificando autenticación...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ [DEBUG] Error de autenticación:', authError.message)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ [DEBUG] Usuario no encontrado en token')
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    console.log('✅ [DEBUG] Usuario autenticado:', user.id)

    // Generar nombre único para el archivo con carpeta específica del chat
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `chat_${chatId}_${userId}_${timestamp}_${randomString}.${fileExtension}`
    const folderPath = `mensajes/chat_${chatId}/${fileName}`

    console.log('📁 [DEBUG] Preparando subida:', {
      fileName,
      folderPath,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // Convertir archivo a buffer
    console.log('🔄 [DEBUG] Convirtiendo archivo a buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    console.log('✅ [DEBUG] Buffer creado, tamaño:', buffer.length)

    console.log('🔄 [DEBUG] Creando carpeta del chat...')
    
    // Crear carpeta del chat si no existe (usando un archivo dummy)
    const chatFolderPath = `mensajes/chat_${chatId}/.keep`
    const { error: folderError } = await supabase.storage
      .from('Ecoswap')
      .upload(chatFolderPath, new Uint8Array([0]), {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true // Permitir sobrescribir si ya existe
      })

    if (folderError) {
      console.warn('⚠️ [DEBUG] No se pudo crear carpeta (puede que ya exista):', folderError.message)
    } else {
      console.log('✅ [DEBUG] Carpeta del chat creada/verificada')
    }

    console.log('🔄 [DEBUG] Subiendo a Supabase Storage...')
    
    // Subir a Supabase Storage en carpeta específica del chat
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Ecoswap')
      .upload(folderPath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // No sobrescribir archivos existentes
      })

    if (uploadError) {
      console.error('❌ [DEBUG] Error subiendo imagen:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        folderPath,
        fileName,
        chatId,
        userId,
        fileSize: file.size,
        fileType: file.type
      })
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error subiendo la imagen'
      if (uploadError.message.includes('already exists')) {
        errorMessage = 'El archivo ya existe. Intenta con otro nombre.'
      } else if (uploadError.message.includes('size')) {
        errorMessage = 'El archivo es demasiado grande.'
      } else if (uploadError.message.includes('permission')) {
        errorMessage = 'No tienes permisos para subir archivos.'
      } else if (uploadError.message.includes('bucket')) {
        errorMessage = 'Error con el bucket de almacenamiento.'
      } else if (uploadError.message.includes('not found')) {
        errorMessage = 'Bucket de almacenamiento no encontrado.'
      } else if (uploadError.message.includes('row-level security')) {
        errorMessage = 'Error de permisos RLS (Row Level Security).'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: uploadError.message,
        code: uploadError.statusCode,
        debugInfo: {
          folderPath,
          fileName,
          bucketId: 'Ecoswap',
          userId: user.id,
          chatId
        }
      }, { status: 500 })
    }

    console.log('✅ [DEBUG] Imagen subida exitosamente:', uploadData)

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('Ecoswap')
      .getPublicUrl(folderPath)

    console.log('🔗 [DEBUG] URL pública generada:', publicUrl)

    const response = {
      success: true,
      data: {
        fileName,
        url: publicUrl,
        originalName: file.name,
        size: file.size,
        type: file.type,
        path: folderPath
      }
    }

    console.log('✅ [DEBUG] Respuesta exitosa:', response)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ [DEBUG] Error inesperado en upload-image-debug:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

