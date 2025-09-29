import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { InteractionStats } from '@/lib/types/interactions'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuario de la base de datos
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const userId = usuario.user_id

    // Obtener estadísticas básicas
    const { count: totalCount } = await supabase
      .from('intercambio')
      .select('*', { count: 'exact', head: true })
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    // Obtener estadísticas por estado
    const { data: estadoStats } = await supabase
      .from('intercambio')
      .select('estado')
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    // Contar por estado
    const estadoCounts = (estadoStats || []).reduce((acc: Record<string, number>, item: any) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1
      return acc
    }, {})

    // Obtener valor total de intercambios completados
    const { data: valorData } = await supabase
      .from('intercambio')
      .select(`
        estado,
        monto_adicional,
        producto_ofrecido:producto!intercambio_producto_ofrecido_id_fkey (
          precio
        )
      `)
      .eq('estado', 'completado')
      .or(`usuario_propone_id.eq.${userId},usuario_recibe_id.eq.${userId}`)

    const totalValue = (valorData || []).reduce((total: number, item: any) => {
      const precioProducto = parseFloat(item.producto_ofrecido?.precio || '0')
      const montoAdicional = parseFloat(item.monto_adicional || '0')
      return total + precioProducto + montoAdicional
    }, 0)

    // Obtener calificación promedio del usuario
    const { data: usuarioData } = await supabase
      .from('usuario')
      .select('calificacion_promedio')
      .eq('user_id', userId)
      .single()

    const averageRating = usuarioData?.calificacion_promedio || 0

    // Calcular tasa de éxito (completados / total)
    const completedCount = estadoCounts['completado'] || 0
    const successRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    const stats: InteractionStats = {
      total: totalCount || 0,
      pending: estadoCounts['pendiente'] || 0,
      inProgress: estadoCounts['aceptado'] || 0,
      completed: completedCount,
      cancelled: (estadoCounts['rechazado'] || 0) + (estadoCounts['cancelado'] || 0),
      totalValue: totalValue,
      averageRating: averageRating,
      successRate: Math.round(successRate * 100) / 100 // Redondear a 2 decimales
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error en API de estadísticas de interacciones:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
