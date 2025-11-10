import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

async function getAuthUserId(request: NextRequest): Promise<number | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseClient()
    if (!supabase) return null

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) return null

    const { data: usuarioByAuth } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioByAuth?.user_id) return usuarioByAuth.user_id

    if (user.email) {
      const { data: usuarioByEmail } = await supabase
        .from('usuario')
        .select('user_id')
        .eq('email', user.email)
        .single()

      if (usuarioByEmail?.user_id) return usuarioByEmail.user_id
    }

    return null
  } catch (error) {
    console.error('Error obteniendo usuario para donaciones:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
    }

    const { data: donations, error: donationsError } = await supabase
      .from('producto')
      .select(`
        producto_id,
        titulo,
        descripcion,
        estado,
        estado_publicacion,
        ciudad_snapshot,
        departamento_snapshot,
        fecha_publicacion,
        fecha_actualizacion,
        tipo_transaccion,
        precio,
        precio_negociable
      `)
      .eq('user_id', userId)
      .eq('tipo_transaccion', 'donacion')
      .order('fecha_publicacion', { ascending: false })

    if (donationsError) {
      console.error('❌ [API] Error obteniendo donaciones:', donationsError)
      return NextResponse.json({
        error: 'Error obteniendo donaciones',
        details: donationsError.message
      }, { status: 500 })
    }

    if (!donations || donations.length === 0) {
      return NextResponse.json({
        success: true,
        donations: [],
        totalDonations: 0
      })
    }

    const donationIds = donations.map((donation: any) => donation.producto_id)

    const { data: imagesData, error: imagesError } = await supabase
      .from('imagen_producto')
      .select('producto_id, url_imagen')
      .in('producto_id', donationIds)
      .eq('es_principal', true)

    if (imagesError) {
      console.warn('⚠️ [API] No se pudieron obtener imágenes de donaciones:', imagesError.message)
    }

    const imagesMap = new Map<number, string>()
    imagesData?.forEach((image: any) => {
      if (image.producto_id && image.url_imagen) {
        imagesMap.set(image.producto_id, image.url_imagen)
      }
    })

    const formatted = donations.map((donation: any) => ({
      id: donation.producto_id,
      title: donation.titulo,
      description: donation.descripcion,
      status: donation.estado_publicacion,
      condition: donation.estado,
      location: donation.ciudad_snapshot && donation.departamento_snapshot
        ? `${donation.ciudad_snapshot}, ${donation.departamento_snapshot}`
        : donation.ciudad_snapshot || donation.departamento_snapshot || null,
      createdAt: donation.fecha_publicacion,
      updatedAt: donation.fecha_actualizacion,
      image: imagesMap.get(donation.producto_id) || null,
      price: donation.precio,
      negotiable: donation.precio_negociable
    }))

    return NextResponse.json({
      success: true,
      donations: formatted,
      totalDonations: formatted.length
    })
  } catch (error) {
    console.error('❌ [API] Error en /api/donations/user:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

