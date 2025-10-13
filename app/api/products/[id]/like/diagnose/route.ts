import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('🔍 DIAGNÓSTICO COMPLETO - Verificando sistema de likes...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client no disponible',
        step: 'config'
      }, { status: 500 })
    }

    const productoId = Number(params.id)
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    
    const diagnosis: any = {
      timestamp: new Date().toISOString(),
      productoId,
      hasAuth: !!token,
      steps: [],
      alreadyLiked: false,
      insertError: null,
      success: false,
      userId: null,
      producto: null,
      finalStatus: null
    }

    // Paso 1: Verificar autenticación
    diagnosis.steps.push('1. Verificando autenticación...')
    if (!token) {
      diagnosis.steps.push('❌ No hay token de autorización')
      return NextResponse.json(diagnosis)
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authData?.user?.id) {
      diagnosis.steps.push(`❌ Error de autenticación: ${authError?.message}`)
      return NextResponse.json(diagnosis)
    }
    diagnosis.steps.push(`✅ Usuario autenticado: ${authData.user.id}`)

    // Paso 2: Buscar usuario en tabla usuario
    diagnosis.steps.push('2. Buscando usuario en tabla usuario...')
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id, nombre, email')
      .eq('auth_user_id', authData.user.id)
      .single()
    
    if (usuarioError || !usuario) {
      diagnosis.steps.push(`❌ Usuario no encontrado: ${usuarioError?.message}`)
      return NextResponse.json(diagnosis)
    }
    diagnosis.steps.push(`✅ Usuario encontrado: ${usuario.user_id} - ${usuario.nombre}`)

    // Paso 3: Verificar acceso a tabla favorito
    diagnosis.steps.push('3. Verificando acceso a tabla favorito...')
    try {
      const { data: favoritosTest, error: favoritoTestError } = await supabase
        .from('favorito')
        .select('favorito_id')
        .limit(1)
      
      if (favoritoTestError) {
        diagnosis.steps.push(`❌ Error accediendo a tabla favorito: ${favoritoTestError.message}`)
        return NextResponse.json(diagnosis)
      }
      diagnosis.steps.push('✅ Acceso a tabla favorito OK')
    } catch (error: any) {
      diagnosis.steps.push(`❌ Error crítico en tabla favorito: ${error.message}`)
      return NextResponse.json(diagnosis)
    }

    // Paso 4: Verificar si el producto existe
    diagnosis.steps.push('4. Verificando si el producto existe...')
    const { data: producto, error: productoError } = await supabase
      .from('producto')
      .select('producto_id, titulo')
      .eq('producto_id', productoId)
      .single()
    
    if (productoError || !producto) {
      diagnosis.steps.push(`❌ Producto no encontrado: ${productoError?.message}`)
      return NextResponse.json(diagnosis)
    }
    diagnosis.steps.push(`✅ Producto encontrado: ${producto.producto_id} - ${producto.titulo}`)

    // Paso 5: Verificar favoritos existentes del usuario
    diagnosis.steps.push('5. Verificando favoritos existentes del usuario...')
    const { data: favoritosExistentes, error: favoritosError } = await supabase
      .from('favorito')
      .select('favorito_id, producto_id, fecha_agregado')
      .eq('usuario_id', usuario.user_id)
      .eq('producto_id', productoId)
    
    if (favoritosError) {
      diagnosis.steps.push(`❌ Error consultando favoritos: ${favoritosError.message}`)
      return NextResponse.json(diagnosis)
    }
    
    if (favoritosExistentes && favoritosExistentes.length > 0) {
      diagnosis.steps.push(`✅ Favorito ya existe: ${favoritosExistentes[0].favorito_id}`)
      diagnosis.alreadyLiked = true
    } else {
      diagnosis.steps.push('ℹ️ No hay favorito existente para este producto')
      diagnosis.alreadyLiked = false
    }

    // Paso 6: Intentar crear un favorito de prueba
    diagnosis.steps.push('6. Intentando crear favorito de prueba...')
    const { data: nuevoFavorito, error: insertError } = await supabase
      .from('favorito')
      .insert({
        usuario_id: usuario.user_id,
        producto_id: productoId
      })
      .select('favorito_id')
      .single()
    
    if (insertError) {
      diagnosis.steps.push(`❌ Error insertando favorito: ${insertError.message}`)
      diagnosis.insertError = insertError.message
    } else {
      diagnosis.steps.push(`✅ Favorito creado exitosamente: ${nuevoFavorito.favorito_id}`)
      diagnosis.success = true
    }

    // Paso 7: Verificar total de favoritos del usuario
    diagnosis.steps.push('7. Contando favoritos totales del usuario...')
    const { count: totalFavoritos, error: countError } = await supabase
      .from('favorito')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', usuario.user_id)
    
    if (countError) {
      diagnosis.steps.push(`⚠️ Error contando favoritos: ${countError.message}`)
    } else {
      diagnosis.steps.push(`📊 Total de favoritos del usuario: ${totalFavoritos}`)
    }

    diagnosis.userId = usuario.user_id
    diagnosis.producto = producto
    diagnosis.finalStatus = insertError ? 'ERROR' : 'SUCCESS'

    return NextResponse.json(diagnosis)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      stack: e?.stack,
      step: 'general_error'
    }, { status: 500 })
  }
}
