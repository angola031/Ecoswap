// Helper para manejar autenticación en rutas API
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export async function getAuthenticatedUser(req?: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Crear cliente de Supabase para el servidor
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
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null, error: 'No autorizado' }
    }

    // Obtener usuario de la base de datos
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id, nombre, apellido, email, verificado, activo')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      return { user: null, error: 'Usuario no encontrado en la base de datos' }
    }

    if (!usuario.activo) {
      return { user: null, error: 'Usuario inactivo' }
    }

    return { user: usuario, error: null }

  } catch (error) {
    console.error('Error en autenticación:', error)
    return { user: null, error: 'Error interno de autenticación' }
  }
}

export async function getAuthenticatedUserFromToken(authHeader: string) {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Token de autorización inválido' }
    }

    const token = authHeader.substring(7) // Remover 'Bearer '
    
    // Crear cliente temporal para verificar el token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {}
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Verificar el token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Error de autenticación:', authError)
      return { user: null, error: 'Token inválido o expirado' }
    }

    // Obtener usuario de la base de datos
    let { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select('user_id, nombre, apellido, email, verificado, activo')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuario) {
      console.error('Error obteniendo usuario de BD por auth_user_id:', usuarioError)
      
      // Intentar buscar por email y actualizar el auth_user_id
      console.log('🔄 Buscando usuario por email...')
      
      try {
        const { data: existingUser, error: emailError } = await supabase
          .from('usuario')
          .select('user_id, nombre, apellido, email, verificado, activo, auth_user_id')
          .eq('email', user.email!)
          .single()

        if (emailError || !existingUser) {
          console.log('🔄 Usuario no encontrado por email, creando nuevo...')
          
          // Crear usuario básico en la tabla usuario
          const { data: newUsuario, error: createError } = await supabase
            .from('usuario')
            .insert({
              nombre: user.user_metadata?.full_name?.split(' ')[0] || 'Usuario',
              apellido: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'EcoSwap',
              email: user.email!,
              password_hash: 'supabase_auth',
              auth_user_id: user.id,
              verificado: true,
              activo: true,
              ultima_conexion: new Date().toISOString()
            })
            .select('user_id, nombre, apellido, email, verificado, activo')
            .single()

          if (createError) {
            console.error('Error creando usuario:', createError)
            return { user: null, error: 'Error creando perfil de usuario' }
          }

          usuario = newUsuario
          console.log('✅ Usuario creado exitosamente:', usuario.user_id)
          
        } else {
          // Usuario existe pero sin auth_user_id o con uno diferente
          console.log('🔄 Usuario encontrado por email, actualizando auth_user_id...')
          console.log('  - Auth User ID actual:', existingUser.auth_user_id)
          console.log('  - Auth User ID nuevo:', user.id)
          
          // Actualizar el auth_user_id
          const { data: updatedUser, error: updateError } = await supabase
            .from('usuario')
            .update({
              auth_user_id: user.id,
              activo: true,
              ultima_conexion: new Date().toISOString()
            })
            .eq('user_id', existingUser.user_id)
            .select('user_id, nombre, apellido, email, verificado, activo')
            .single()

          if (updateError) {
            console.error('Error actualizando auth_user_id:', updateError)
            return { user: null, error: 'Error actualizando perfil de usuario' }
          }

          usuario = updatedUser
          console.log('✅ Usuario actualizado exitosamente:', usuario.user_id)
        }
        
      } catch (createError) {
        console.error('Error en catch al manejar usuario:', createError)
        return { user: null, error: 'Error interno manejando perfil de usuario' }
      }
    }

    if (!usuario.activo) {
      return { user: null, error: 'Usuario inactivo' }
    }

    return { user: usuario, error: null }

  } catch (error) {
    console.error('Error verificando token:', error)
    return { user: null, error: 'Error interno de autenticación' }
  }
}

// Función para manejar respuestas de error de autenticación
export function createAuthErrorResponse(error: string, status: number = 401) {
  return Response.json({ error }, { status })
}

// Función para manejar respuestas exitosas
export function createSuccessResponse(data: any, status: number = 200) {
  return Response.json(data, { status })
}
