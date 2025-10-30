import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productoId = params.id
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
    if (!file || !ownerUserIdStr) {
      return NextResponse.json({ error: 'image y ownerUserId son requeridos' }, { status: 400 })
    }
    const ownerUserId = Number(ownerUserIdStr)

    // Verificar propiedad del producto
    const { data: prod, error: prodErr } = await supabase
      .from('producto')
      .select('producto_id, user_id')
      .eq('producto_id', productoId)
      .single()
    if (prodErr || !prod) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    // Opcional: verificar que el usuario es dueño por email/tabla usuario si aplica

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Variables de entorno de Supabase faltantes' }, { status: 500 })
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    if (file.type !== 'image/webp') {
      return NextResponse.json({ error: 'Solo WebP permitido' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (max 10MB)' }, { status: 400 })
    }

    // Calcular índice siguiente leyendo cantidad existente
    const { count } = await admin
      .from('imagen_producto')
      .select('*', { count: 'exact', head: true })
      .eq('producto_id', Number(productoId))
    const nextIndex = (count || 0) + 1

    const fileName = `${productoId}_${nextIndex}.webp`
    const storagePath = `productos/user_${ownerUserId}/${productoId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: upErr } = await admin.storage
      .from('Ecoswap')
      .upload(storagePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp',
      })
    if (upErr) {
      return NextResponse.json({ error: 'Error subiendo', details: upErr.message }, { status: 400 })
    }

    const { data: urlData } = admin.storage.from('Ecoswap').getPublicUrl(storagePath)

    return NextResponse.json({ ok: true, path: storagePath, url: urlData.publicUrl, index: nextIndex, name: fileName })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}


