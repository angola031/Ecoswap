import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 [API] Iniciando subida de imagen...')
    
    const formData = await request.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string

    console.log('📋 [API] Parámetros recibidos:', {
      hasFile: !!file,
      fileSize: file?.size,
      fileType: file?.type,
      chatId,
      userId
    })

    if (!file) {
      console.log('❌ [API] No se encontró el archivo')
      return NextResponse.json({ error: 'No se encontró el archivo' }, { status: 400 })
    }

    if (!chatId || !userId) {
      console.log('❌ [API] Faltan parámetros:', { chatId, userId })
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 })
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      console.log('❌ [API] Archivo no es una imagen:', file.type)
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 })
    }

    // Validar tamaño del archivo (máximo 10MB para archivos originales)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ [API] Archivo demasiado grande:', file.size)
      return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 10MB' }, { status: 400 })
    }

    console.log('✅ [API] Archivo validado:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    console.log('🔐 [API] Verificando autenticación...')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ [API] No hay token de autorización')
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    console.log('🔑 [API] Token encontrado, verificando usuario...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.log('❌ [API] Error de autenticación:', authError.message)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    if (!user) {
      console.log('❌ [API] Usuario no encontrado')
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }
    
    console.log('✅ [API] Usuario autenticado:', user.email)

    // Generar nombre único para el archivo con carpeta específica del chat
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `chat_${chatId}_${userId}_${timestamp}_${randomString}.${fileExtension}`
    const folderPath = `mensajes/chat_${chatId}/${fileName}`

    // Convertir archivo a buffer
    console.log('🔄 [API] Convirtiendo archivo a buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    console.log('✅ [API] Buffer creado, tamaño:', buffer.length)

    // Verificar que el cliente admin esté disponible
    if (!supabaseAdmin) {
      console.error('❌ [API] Cliente admin de Supabase no disponible')
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Subir a Supabase Storage en carpeta específica del chat
    console.log('📤 [API] Subiendo a Supabase Storage...', {
      folderPath,
      fileSize: buffer.length,
      contentType: file.type
    })
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('Ecoswap')
      .upload(folderPath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // No sobrescribir archivos existentes
      })

    if (uploadError) {
      console.error('❌ Error subiendo imagen:', {
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
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: uploadError.message 
      }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('Ecoswap')
      .getPublicUrl(folderPath)

    console.log('✅ Imagen subida exitosamente:', {
      fileName,
      folderPath,
      chatId,
      userId,
      url: publicUrl
    })

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        url: publicUrl,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    })

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