import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { currentPassword, newPassword } = body || {}
        
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ 
                error: 'Contraseña actual y nueva contraseña son requeridas' 
            }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ 
                error: 'La nueva contraseña debe tener al menos 6 caracteres' 
            }, { status: 400 })
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
            return NextResponse.json({ 
                error: 'Error de configuración del servidor' 
            }, { status: 500 })
        }

        // Verificar que el usuario esté autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return NextResponse.json({ 
                error: 'Usuario no autenticado' 
            }, { status: 401 })
        }

        // Cambiar la contraseña usando Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) {
            console.error('❌ Error actualizando contraseña:', updateError)
            
            // Manejar errores específicos de Supabase
            if (updateError.message.includes('Invalid login credentials')) {
                return NextResponse.json({ 
                    error: 'La contraseña actual es incorrecta' 
                }, { status: 400 })
            }
            
            if (updateError.message.includes('Password should be at least')) {
                return NextResponse.json({ 
                    error: 'La nueva contraseña debe tener al menos 6 caracteres' 
                }, { status: 400 })
            }

            return NextResponse.json({ 
                error: 'Error al cambiar la contraseña. Inténtalo de nuevo.' 
            }, { status: 500 })
        }

        console.log('✅ Contraseña actualizada exitosamente para usuario:', user.email)

        return NextResponse.json({ 
            success: true, 
            message: 'Contraseña actualizada exitosamente' 
        })

    } catch (error) {
        console.error('❌ Error en cambio de contraseña:', error)
        return NextResponse.json({ 
            error: 'Error interno del servidor' 
        }, { status: 500 })
    }
}
