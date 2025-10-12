import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ API Images: Supabase no está configurado')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }
    
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    
    if (!token) {
      console.error('❌ API Images: No hay token de autorización')
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      console.error('❌ API Images: Usuario no autenticado')
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }


    const { producto_id, imagenes } = await req.json()

    if (!producto_id || !imagenes || !Array.isArray(imagenes)) {
      return NextResponse.json({ 
        error: 'producto_id e imagenes son requeridos' 
      }, { status: 400 })
    }

    // Verificar que el producto existe
    const { data: productData, error: productError } = await supabase
      .from('producto')
      .select('producto_id, user_id')
      .eq('producto_id', producto_id)
      .single()

    if (productError || !productData) {
      console.error('Producto no encontrado:', productError)
      return NextResponse.json({ 
        error: 'Producto no encontrado' 
      }, { status: 404 })
    }

    // Verificar que el usuario autenticado sea el propietario (versión simplificada)
    const { data: userData } = await supabase
      .from('usuario')
      .select('user_id, email')
      .eq('email', user.email)
      .single()

    if (!userData) {
      console.error('Usuario no encontrado en la base de datos')
      return NextResponse.json({ 
        error: 'Usuario no encontrado' 
      }, { status: 404 })
    }

    // Verificar que el usuario sea el propietario del producto
    if (userData.user_id !== productData.user_id) {
      console.error('Usuario no es propietario del producto:', {
        user_id: userData.user_id,
        product_user_id: productData.user_id
      })
      return NextResponse.json({ 
        error: 'No tienes permisos para modificar este producto' 
      }, { status: 403 })
    }

    // Insertar imágenes en la base de datos
    
    const { data: insertedImages, error: insertError } = await supabase
      .from('imagen_producto')
      .insert(imagenes)
      .select()

    if (insertError) {
      console.error('❌ API Images: Error insertando imágenes:', insertError)
      return NextResponse.json({ 
        error: 'Error al guardar las imágenes en la base de datos',
        details: insertError.message 
      }, { status: 500 })
    }


    return NextResponse.json({
      success: true,
      imagenes: insertedImages,
      message: `${imagenes.length} imagen(es) guardada(s) correctamente`
    })

  } catch (error) {
    console.error('Error en API de imágenes:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error('❌ API Images: Supabase no está configurado')
      return NextResponse.json({ error: 'Supabase no está configurado' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const productoId = searchParams.get('producto_id')

    if (!productoId) {
      return NextResponse.json({ 
        error: 'producto_id es requerido' 
      }, { status: 400 })
    }

    // Obtener imágenes del producto
    const { data: imagenes, error } = await supabase
      .from('imagen_producto')
      .select('*')
      .eq('producto_id', productoId)
      .order('orden', { ascending: true })

    if (error) {
      console.error('Error obteniendo imágenes:', error)
      return NextResponse.json({ 
        error: 'Error al obtener las imágenes' 
      }, { status: 500 })
    }

    return NextResponse.json({
      imagenes: imagenes || []
    })

  } catch (error) {
    console.error('Error en API de imágenes:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
