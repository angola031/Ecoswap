import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const jwt = authHeader.split(' ')[1]
        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
        }

        // Obtener el usuario del token
        const authClient = createClient(supabaseUrl, supabaseAnonKey)
        const { data: userRes, error: getUserErr } = await authClient.auth.getUser(jwt)
        if (getUserErr || !userRes?.user?.email) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
        }

        const email = userRes.user.email
        const userId = userRes.user.id

        // Verificar contraseña actual intentando login
        const { error: loginError } = await authClient.auth.signInWithPassword({ email, password: currentPassword })
        if (loginError) {
            return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
        }

        // Actualizar contraseña usando Service Role
        const admin = getSupabaseAdminClient() as any
        if (!admin) {
            return NextResponse.json({ error: 'Admin client no disponible' }, { status: 500 })
        }

        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
        if (updateErr) {
            return NextResponse.json({ error: updateErr.message }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Error en POST /api/users/change-password:', e)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}


