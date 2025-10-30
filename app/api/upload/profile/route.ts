import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase-client'
// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
    try {
        const MAX_BYTES = 10 * 1024 * 1024 // 10MB
        const ALLOWED_TYPES = ['image/webp']

        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const accessToken = authHeader.split(' ')[1]
        // Crear cliente autenticado con Authorization: Bearer <token>
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Configuración de Supabase incompleta' }, { status: 500 })
        }
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
            auth: { persistSession: false, autoRefreshToken: false }
        })

        // Validar usuario a partir del token
        const { data: userInfo, error: userErr } = await supabaseAuth.auth.getUser(accessToken)
        if (userErr || !userInfo?.user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }
        const authUid = userInfo.user.id

        const form = await req.formData()
        const file = form.get('file') as File | null
        const userId = form.get('userId') as string | null

        if (!file || !userId) {
            return NextResponse.json({ error: 'file and userId are required' }, { status: 400 })
        }

        // Validaciones de archivo
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Solo se permite formato WebP' }, { status: 400 })
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: 'Archivo demasiado grande (máx 10MB)' }, { status: 400 })
        }

        // Verificar que el userId pertenezca al auth.uid() del token (cumple RLS típica)
        const { data: dbUser, error: dbErr } = await supabaseAuth
            .from('usuario')
            .select('user_id, auth_user_id')
            .eq('user_id', userId)
            .eq('auth_user_id', authUid)
            .single()

        if (dbErr || !dbUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Usar admin client si está disponible (Vercel), sino usar cliente autenticado (localhost)
        const adminClient = getSupabaseAdminClient()
        const storageClient = adminClient || supabaseAuth
        const isUsingAdmin = !!adminClient
        
        console.log('🔧 Usando cliente:', isUsingAdmin ? 'Admin (Vercel)' : 'Autenticado (Localhost)')
        
        // Estructura solicitada: usuarios/{user_id}/perfil.webp
        const path = `usuarios/${userId}/perfil.webp`
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Subir archivo al storage
        const { error: uploadError } = await storageClient.storage
            .from('Ecoswap')
            .upload(path, buffer, { 
                upsert: true,
                contentType: 'image/webp', 
                cacheControl: '3600' 
            })

        if (uploadError) {
            console.error('Error subiendo archivo:', uploadError)
            return NextResponse.json({ 
                error: `Error subiendo archivo: ${uploadError.message}`, 
                step: 'storage.upload', 
                path 
            }, { status: 400 })
        }

        // Obtener URL pública
        const { data: urlData } = storageClient.storage
            .from('Ecoswap')
            .getPublicUrl(path)
        const publicUrl = urlData?.publicUrl || null

        // Actualizar foto_perfil en la base de datos
        const { error: updateErr } = await storageClient
            .from('usuario')
            .update({ foto_perfil: publicUrl })
            .eq('user_id', userId)
            .eq(isUsingAdmin ? 'user_id' : 'auth_user_id', isUsingAdmin ? userId : authUid)

        if (updateErr) {
            console.error('Error actualizando perfil:', updateErr)
            return NextResponse.json({ 
                error: `Error actualizando perfil: ${updateErr.message}`, 
                step: 'db.update_profile' 
            }, { status: 400 })
        }

        return NextResponse.json({ ok: true, path, publicUrl })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
    }
}


