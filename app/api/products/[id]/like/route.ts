import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getAuthUserId(req: NextRequest): Promise<number | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  const { data } = await supabaseAdmin.auth.getUser(token)
  const email = data?.user?.email
  if (!email) return null
  const { data: usuario } = await supabaseAdmin
    .from('usuario')
    .select('user_id')
    .eq('email', email)
    .single()
  return usuario?.user_id ?? null
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Evitar duplicados: si ya existe, devolver ok
    const { data: exists } = await supabaseAdmin
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    if (!exists) {
      const { error: insertErr } = await supabaseAdmin
        .from('favorito')
        .insert({ usuario_id: userId, producto_id: productoId })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ liked: false })

    const { data } = await supabaseAdmin
      .from('favorito')
      .select('favorito_id')
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
      .maybeSingle()

    return NextResponse.json({ liked: !!data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productoId = Number(params.id)
    if (!productoId) return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabaseAdmin
      .from('favorito')
      .delete()
      .eq('usuario_id', userId)
      .eq('producto_id', productoId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

