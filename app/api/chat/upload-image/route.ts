import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  
  try {
    const { data } = await supabaseAdmin.auth.getUser(token)
    const authUserId = data?.user?.id
    if (!authUserId) return null
    
    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', authUserId)
      .single()
    
    return usuario?.user_id ?? null
  } catch (error) {
    console.error('Error obteniendo user_id:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!chatId) {
      return NextResponse.json({ error: 'ID de chat es requerido' }, { status: 400 })
    }

    // Verificar que el usuario tiene acceso al chat
    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chat')
      .select(`
        chat_id,
        intercambio_id,
        intercambio (
          usuario_propone_id,
          usuario_recibe_id
        )
      `)
      .eq('chat_id', chatId)
      .eq('activo', true)
      .single()

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 })
    }

    const intercambio = chat.intercambio as any
    if (!intercambio || (intercambio.usuario_propone_id !== userId && intercambio.usuario_recibe_id !== userId)) {
      return NextResponse.json({ error: 'No tienes acceso a este chat' }, { status: 403 })
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)' 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 5MB' 
      }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `mensaje_${userId}_${timestamp}_${randomString}.${fileExtension}`
    
    // Crear carpeta específica para esta conversación
    const conversationFolder = `chat_${chatId}`
    const filePath = `mensajes/${conversationFolder}/${fileName}`

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('ecoswap')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError)
      return NextResponse.json({ error: 'Error subiendo archivo' }, { status: 500 })
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabaseAdmin.storage
      .from('ecoswap')
      .getPublicUrl(filePath)

    return NextResponse.json({
      message: 'Imagen subida exitosamente',
      data: {
        fileName: fileName,
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileSize: file.size,
        fileType: file.type
      }
    })

  } catch (error: any) {
    console.error('Error en API de subir imagen:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}
