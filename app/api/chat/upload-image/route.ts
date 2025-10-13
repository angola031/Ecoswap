import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [API] Iniciando subida de imagen...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [API] Supabase client no disponible')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }
    
    const formData = await request.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string

    console.log('📋 [API] Parámetros recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      chatId,
      userId
    })

    if (!file) {
      console.error('❌ [API] No se encontró el archivo')
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
    }

    if (!chatId || !userId) {
      console.error('❌ [API] Faltan parámetros requeridos:', { chatId, userId })
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      console.error('❌ [API] Archivo no es una imagen:', file.type)
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Validar tamaño del archivo (máximo 10MB para archivos originales)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ [API] Archivo demasiado grande:', file.size)
      return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 10MB' }, { status: 400 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [API] Token de autorización requerido')
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    console.log('🔐 [API] Verificando autenticación...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ [API] Error de autenticación:', authError.message)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ [API] Usuario no encontrado en token')
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    console.log('✅ [API] Usuario autenticado:', user.id)
    

    // Generar nombre único para el archivo con carpeta específica del chat
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `chat_${chatId}_${userId}_${timestamp}_${randomString}.${fileExtension}`
    const folderPath = `mensajes/chat_${chatId}/${fileName}`

    console.log('📁 [API] Preparando subida:', {
      fileName,
      folderPath,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    console.log('🔄 [API] Subiendo a Supabase Storage...')
    
    // Subir a Supabase Storage en carpeta específica del chat
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Ecoswap')
      .upload(folderPath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // No sobrescribir archivos existentes
      })

    if (uploadError) {
      console.error('❌ [API] Error subiendo imagen:', {
        error: uploadError,
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
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: uploadError.message,
        code: uploadError.statusCode
      }, { status: 500 })
    }

    console.log('✅ [API] Imagen subida exitosamente:', uploadData)

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('Ecoswap')
      .getPublicUrl(folderPath)

    console.log('🔗 [API] URL pública generada:', publicUrl)

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

    console.log('✅ [API] Respuesta exitosa:', response)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error('❌ [API] Error inesperado en upload-image:', {
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