import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST] Iniciando test de subida...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ [TEST] Supabase client no disponible')
      return NextResponse.json({ 
        error: 'Supabase no está configurado',
        step: 'supabase_client'
      }, { status: 500 })
    }

    console.log('✅ [TEST] Supabase client disponible')

    const formData = await request.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string

    console.log('📋 [TEST] Parámetros recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      chatId,
      userId
    })

    if (!file) {
      console.error('❌ [TEST] No se encontró el archivo')
      return NextResponse.json({ 
        error: 'No se encontró el archivo',
        step: 'file_validation'
      }, { status: 400 })
    }

    if (!chatId || !userId) {
      console.error('❌ [TEST] Faltan parámetros requeridos:', { chatId, userId })
      return NextResponse.json({ 
        error: 'Faltan parámetros requeridos',
        step: 'params_validation'
      }, { status: 400 })
    }

    // Verificar autenticación
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ [TEST] Token de autorización requerido')
      return NextResponse.json({ 
        error: 'Token de autorización requerido',
        step: 'auth_header'
      }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    console.log('🔐 [TEST] Verificando autenticación...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError) {
      console.error('❌ [TEST] Error de autenticación:', authError.message)
      return NextResponse.json({ 
        error: 'Token inválido',
        details: authError.message,
        step: 'auth_validation'
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ [TEST] Usuario no encontrado en token')
      return NextResponse.json({ 
        error: 'Token inválido',
        step: 'user_validation'
      }, { status: 401 })
    }
    
    console.log('✅ [TEST] Usuario autenticado:', user.id)

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      console.error('❌ [TEST] Archivo no es una imagen:', file.type)
      return NextResponse.json({ 
        error: 'El archivo debe ser una imagen',
        step: 'file_type'
      }, { status: 400 })
    }

    // Validar tamaño del archivo (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ [TEST] Archivo demasiado grande:', file.size)
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB',
        step: 'file_size'
      }, { status: 400 })
    }

    // Test: Solo verificar que podemos acceder al storage
    console.log('🔄 [TEST] Verificando acceso a storage...')
    
    try {
      // Intentar listar buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        console.error('❌ [TEST] Error listando buckets:', bucketsError.message)
        return NextResponse.json({ 
          error: 'Error accediendo a storage',
          details: bucketsError.message,
          step: 'storage_access'
        }, { status: 500 })
      }

      console.log('✅ [TEST] Buckets disponibles:', buckets?.map(b => b.name))

      // Verificar si existe el bucket Ecoswap
      const ecoswapBucket = buckets?.find(bucket => bucket.name === 'Ecoswap')
      
      if (!ecoswapBucket) {
        console.error('❌ [TEST] Bucket Ecoswap no encontrado')
        return NextResponse.json({ 
          error: 'Bucket Ecoswap no encontrado',
          availableBuckets: buckets?.map(b => b.name),
          step: 'bucket_check'
        }, { status: 500 })
      }

      console.log('✅ [TEST] Bucket Ecoswap encontrado:', ecoswapBucket)

      // Test: Intentar listar contenido del bucket
      const { data: bucketContent, error: contentError } = await supabase.storage
        .from('Ecoswap')
        .list('', { limit: 1 })

      if (contentError) {
        console.error('❌ [TEST] Error accediendo al contenido del bucket:', contentError.message)
        return NextResponse.json({ 
          error: 'Error accediendo al contenido del bucket',
          details: contentError.message,
          step: 'bucket_content'
        }, { status: 500 })
      }

      console.log('✅ [TEST] Acceso al bucket Ecoswap exitoso')

      // Si llegamos aquí, todo está bien configurado
      return NextResponse.json({
        success: true,
        message: 'Configuración de storage correcta',
        data: {
          user: user.id,
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          chatId,
          userId,
          buckets: buckets?.map(b => b.name),
          ecoswapBucket: ecoswapBucket.name,
          bucketContent: bucketContent?.length || 0
        },
        step: 'success'
      })

    } catch (storageError: any) {
      console.error('❌ [TEST] Error inesperado en storage:', storageError.message)
      return NextResponse.json({ 
        error: 'Error inesperado en storage',
        details: storageError.message,
        step: 'storage_error'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ [TEST] Error inesperado:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      step: 'general_error'
    }, { status: 500 })
  }
}
