import { supabase } from './supabase'
import { config } from './config'

export interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
    phone?: string
    isAdmin?: boolean
    roles?: string[]
    adminSince?: string | undefined
}

export interface RegisterData {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    password: string
}

export interface LoginData {
    email: string
    password: string
}

export interface RequestCodeData {
    email: string
}

export interface CompleteRegistrationData {
    email: string
    code: string
    firstName: string
    lastName: string
    phone: string
    location: string
    password: string
}

export interface AdminUser extends User {
    isAdmin: true
    roles: string[]
    adminSince?: string
}

// Función para registrar un nuevo usuario con Supabase Auth
export async function registerUser(data: RegisterData): Promise<{ user: User | null; error: string | null; needsVerification?: boolean }> {
    try {
        // 1. Verificar si el usuario ya existe en la tabla USUARIO
        
        const { data: existingUser, error: checkError } = await supabase
            .from('usuario')
            .select('email, verificado, activo')
            .eq('email', data.email)
            .maybeSingle() // Usar maybeSingle para evitar error 406 cuando no hay resultados

        if (checkError) {
            console.error('❌ ERROR: registerUser - Error verificando usuario existente:', checkError)
            console.error('❌ ERROR: registerUser - Código:', checkError.code)
            console.error('❌ ERROR: registerUser - Mensaje:', checkError.message)
            return { user: null, error: 'Error interno del servidor' }
        }


        if (existingUser) {
            if (existingUser.activo) {
                if (existingUser.verificado) {
                    return { user: null, error: 'Este correo electrónico ya está registrado y verificado. Inicia sesión en su lugar.' }
                } else {
                    // Usuario existe pero no está verificado - permitir reenvío de código
                }
            } else {
                return { user: null, error: 'Esta cuenta está desactivada. Contacta al soporte para reactivarla.' }
            }
        }

        // 2. La verificación de Supabase Auth se maneja automáticamente
        // No necesitamos verificar manualmente ya que Supabase Auth maneja duplicados

        // 3. NUEVO FLUJO: Enviar código OTP al correo (no crear usuario todavía)
        
        const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
            email: data.email,
            options: {
                shouldCreateUser: true
            }
        })

        if (otpError) {
            console.error('❌ ERROR: registerUser - Error enviando código OTP:', otpError)
            console.error('❌ ERROR: registerUser - Código de error OTP:', otpError.status)
            console.error('❌ ERROR: registerUser - Mensaje OTP:', otpError.message)
            console.error('❌ ERROR: registerUser - Detalles OTP:', otpError)

            // Manejar errores específicos de Supabase
            if (otpError.message.includes('already registered')) {
                return { user: null, error: 'Este correo electrónico ya está registrado. Inicia sesión en su lugar.' }
            } else if (otpError.message.includes('Invalid email')) {
                return { user: null, error: 'El formato del correo electrónico no es válido.' }
            } else {
                return { user: null, error: otpError.message }
            }
        }

        
        // 4. Indicar al frontend que debe mostrar la pantalla para ingresar el código
        return {
            user: null,
            error: null,
            needsVerification: true
        }

    } catch (error) {
        console.error('Error en registerUser:', error)
        return { user: null, error: 'Error interno del servidor' }
    }
}

// NUEVO: Solicitar código de verificación por email (puede usarse independiente del formulario completo)
export async function requestRegistrationCode(data: RequestCodeData): Promise<{ error: string | null }> {
    try {
        
        const { data: otpData, error } = await supabase.auth.signInWithOtp({
            email: data.email,
            options: {
                shouldCreateUser: true
            }
        })
        
        if (error) {
            console.error('❌ ERROR: requestRegistrationCode - Error enviando OTP:', error)
            console.error('❌ ERROR: requestRegistrationCode - Código:', error.status)
            console.error('❌ ERROR: requestRegistrationCode - Mensaje:', error.message)
            return { error: error.message }
        }
        
        return { error: null }
    } catch (e) {
        console.error('❌ ERROR: requestRegistrationCode - Excepción:', e)
        return { error: 'Error al enviar el código. Intenta nuevamente.' }
    }
}

// NUEVO: Completar registro verificando código y creando el perfil + estableciendo contraseña
export async function completeRegistrationWithCode(data: CompleteRegistrationData): Promise<{ user: User | null; error: string | null }> {
    try {
        // 1) Verificar el código (OTP) recibido por email
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            email: data.email,
            token: data.code,
            type: 'email'
        })

        if (verifyError) {
            return { user: null, error: verifyError.message }
        }

        const authUser = verifyData.user
        if (!authUser) {
            return { user: null, error: 'No se pudo validar el código' }
        }

        // 2) Establecer contraseña y metadata del usuario ya verificado
        const { data: updateRes, error: updateError } = await supabase.auth.updateUser({
            password: data.password,
            data: {
                first_name: data.firstName.trim(),
                last_name: data.lastName.trim(),
                phone: data.phone,
                location: data.location,
                full_name: `${data.firstName} ${data.lastName}`.trim()
            }
        })

        if (updateError) {
            console.error('Error actualizando datos de usuario:', updateError)
            return { user: null, error: updateError.message }
        }

        const effectiveAuthUser = updateRes?.user || authUser

        // 3) Crear/actualizar el perfil en la tabla USUARIO con los datos correctos
        
        // Verificar si ya existe un usuario con este email
        const { data: existingUser, error: checkError } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', data.email)
            .maybeSingle()
        
        let userData
        
        if (existingUser) {
            // Usuario ya existe, actualizar con los datos del formulario
            
            const { data: updatedUser, error: updateError } = await supabase
                .from('usuario')
                .update({
                    nombre: data.firstName.trim(),
                    apellido: data.lastName.trim(),
                    telefono: data.phone || null,
                    auth_user_id: effectiveAuthUser.id,
                    verificado: true,
                    ultima_conexion: new Date().toISOString()
                })
                .eq('email', data.email)
                .select()
                .single()
            
            if (updateError) {
                console.error('❌ ERROR: completeRegistrationWithCode - Error actualizando usuario:', updateError)
                return { user: null, error: 'Error al actualizar datos del usuario' }
            }
            
            userData = updatedUser
        } else {
            // Usuario no existe, crear nuevo
            
            const { data: newUser, error: createError } = await supabase
                .from('usuario')
                .insert({
                    nombre: data.firstName.trim(),
                    apellido: data.lastName.trim(),
                    email: data.email,
                    telefono: data.phone || null,
                    password_hash: 'supabase_auth',
                    auth_user_id: effectiveAuthUser.id,
                    verificado: false,
                    activo: true,
                    ultima_conexion: new Date().toISOString()
                })
                .select()
                .single()
            
            if (createError) {
                console.error('❌ ERROR: completeRegistrationWithCode - Error creando usuario:', createError)
                return { user: null, error: 'Error al crear usuario' }
            }
            
            userData = newUser
        }
        
        // Actualizar datos adicionales si es necesario
        if (data.location) {
            const locationParts = data.location.split(', ')
            const ciudad = locationParts[0] || ''
            const departamento = locationParts[1] || ''

            await supabase
                .from('ubicacion')
                .insert({
                    user_id: userData.user_id,
                    pais: 'Colombia',
                    departamento,
                    ciudad,
                    barrio: null,
                    latitud: null,
                    longitud: null,
                    es_principal: true
                })
        }
        
        
        // Crear objeto User para el frontend
        const user: User = {
            id: userData.user_id.toString(),
            name: `${userData.nombre} ${userData.apellido}`.trim(),
            email: userData.email,
            avatar: userData.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            location: data.location || 'Colombia',
            phone: userData.telefono,
            isAdmin: false,
            roles: [],
            adminSince: null
        }
        
        return { user, error: null }

    } catch (e) {
        console.error('Error en completeRegistrationWithCode:', e)
        return { user: null, error: 'Error interno del servidor' }
    }
}

// Función auxiliar para separar nombre completo en nombre y apellido
function splitFullName(fullName: string): { nombre: string, apellido: string } {
    if (!fullName || typeof fullName !== 'string') {
        return { nombre: 'Usuario', apellido: 'EcoSwap' }
    }
    
    const trimmedName = fullName.trim()
    if (!trimmedName) {
        return { nombre: 'Usuario', apellido: 'EcoSwap' }
    }
    
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0)
    
    if (nameParts.length === 0) {
        return { nombre: 'Usuario', apellido: 'EcoSwap' }
    } else if (nameParts.length === 1) {
        return { nombre: nameParts[0], apellido: 'EcoSwap' }
    } else {
        // Tomar el primer elemento como nombre y el resto como apellido
        const nombre = nameParts[0]
        const apellido = nameParts.slice(1).join(' ')
        return { nombre, apellido }
    }
}

// Función auxiliar para crear el perfil del usuario en la tabla USUARIO
async function createUserProfile(authUser: any, registerData: RegisterData): Promise<User> {
    // Usar directamente los campos separados
    const nombre = registerData.firstName.trim()
    const apellido = registerData.lastName.trim()
    

    // Crear el usuario en la tabla USUARIO (usando la estructura existente)
    // Campos mínimos requeridos según el esquema
    const userData: any = {
        nombre: nombre || 'Usuario',
        apellido: apellido || 'Sin Apellido',
        email: authUser.email,
        password_hash: 'supabase_auth',
        telefono: registerData.phone || null,
        verificado: true,
        activo: true,
        auth_user_id: authUser.id
    }
    
    // Campos opcionales que pueden no existir en la tabla
    try {
        userData.fecha_nacimiento = null
        userData.biografia = null
        userData.foto_perfil = null
        userData.calificacion_promedio = 0.00
        userData.total_intercambios = 0
        userData.eco_puntos = 0
        userData.ultima_conexion = new Date().toISOString()
    } catch (e) {
        // Algunos campos opcionales no se pudieron agregar
    }
    
    try {
      
      const { data: newUser, error: insertError } = await supabase
        .from('usuario')
        .insert(userData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ ERROR: Error al crear perfil de usuario:', insertError)
        console.error('❌ ERROR: Código de error:', insertError.code)
        console.error('❌ ERROR: Mensaje:', insertError.message)
        console.error('❌ ERROR: Detalles:', insertError.details)
        console.error('❌ ERROR: Hint:', insertError.hint)
        
        // Intentar inserción con campos mínimos
        const minimalUserData = {
          nombre: nombre || 'Usuario',
          apellido: apellido || 'Sin Apellido',
          email: authUser.email,
          password_hash: 'supabase_auth',
          telefono: registerData.phone || null,
          verificado: true,
          activo: true,
          auth_user_id: authUser.id
        }
        
        
        const { data: newUserMinimal, error: insertErrorMinimal } = await supabase
          .from('usuario')
          .insert(minimalUserData)
          .select()
          .single()
          
        if (insertErrorMinimal) {
          console.error('❌ ERROR: Error también con campos mínimos:', insertErrorMinimal)
          console.error('❌ ERROR: Código de error mínimo:', insertErrorMinimal.code)
          console.error('❌ ERROR: Mensaje mínimo:', insertErrorMinimal.message)
          console.error('❌ ERROR: Detalles mínimo:', insertErrorMinimal.details)
          throw insertErrorMinimal
        }
        
        // Crear ubicación y configuración para usuario con campos mínimos
        const locationParts = registerData.location.split(', ')
        const ciudad = locationParts[0] || ''
        const departamento = locationParts[1] || ''
        
        const ubicacionData = {
            user_id: newUserMinimal.user_id,
            pais: 'Colombia',
            departamento,
            ciudad,
            barrio: null,
            latitud: null,
            longitud: null,
            es_principal: true
        }
        
        await supabase.from('ubicacion').insert(ubicacionData)
        await supabase.from('configuracion_usuario').insert({
            usuario_id: newUserMinimal.user_id,
            notif_nuevas_propuestas: true,
            notif_mensajes: true,
            notif_actualizaciones: false,
            notif_newsletter: true,
            perfil_publico: true,
            mostrar_ubicacion_exacta: false,
            mostrar_telefono: false
        })

        return {
            id: newUserMinimal.user_id.toString(),
            name: `${newUserMinimal.nombre} ${newUserMinimal.apellido}`.trim(),
            email: newUserMinimal.email,
            avatar: newUserMinimal.foto_perfil || '/default-avatar.png',
            location: registerData.location,
            phone: newUserMinimal.telefono || undefined,
            isAdmin: newUserMinimal.es_admin,
            adminSince: newUserMinimal.admin_desde?.toISOString()
        }
      }
      
      // Crear ubicación principal del usuario
      const locationParts = registerData.location.split(', ')
      const ciudad = locationParts[0] || ''
      const departamento = locationParts[1] || ''
      
      const ubicacionData = {
          user_id: newUser.user_id,
          pais: 'Colombia',
          departamento,
          ciudad,
          barrio: null,
          latitud: null,
          longitud: null,
          es_principal: true
      }
      
      const { error: ubicacionError } = await supabase
        .from('ubicacion')
        .insert(ubicacionData)
      
      if (ubicacionError) {
        console.error('Error al crear ubicación:', ubicacionError)
        // No lanzar error aquí, solo loggear, ya que el usuario ya se creó
      }

      // Crear configuración por defecto del usuario
      await supabase
          .from('configuracion_usuario')
          .insert({
              usuario_id: newUser.user_id,
              notif_nuevas_propuestas: true,
              notif_mensajes: true,
              notif_actualizaciones: false,
              notif_newsletter: true,
              perfil_publico: true,
              mostrar_ubicacion_exacta: false,
              mostrar_telefono: false
          })

      return {
          id: newUser.user_id.toString(),
          name: `${newUser.nombre} ${newUser.apellido}`.trim(),
          email: newUser.email,
          avatar: newUser.foto_perfil || '/default-avatar.png',
          location: registerData.location,
          phone: newUser.telefono || undefined,
          isAdmin: newUser.es_admin,
          adminSince: newUser.admin_desde?.toISOString()
      }
      
    } catch (error) {
      console.error('Error completo en creación de usuario:', error)
      throw error
    }
}

// Función para autenticar un usuario con Supabase Auth
export async function loginUser(data: LoginData): Promise<{ user: User | null; error: string | null }> {
    try {
        // Autenticar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        })

        if (authError) {
            console.error('Error en login:', authError)
            return { user: null, error: authError.message }
        }

        if (!authData.user) {
            return { user: null, error: 'Error al iniciar sesión' }
        }

        // Verificar que el email esté confirmado
        if (!authData.user.email_confirmed_at) {
            return { user: null, error: 'Por favor, verifica tu email antes de iniciar sesión' }
        }

        // Obtener el perfil del usuario de la tabla USUARIO por email (sin filtrar por activo)
        const { data: user, error: fetchError } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', authData.user.email)
            .single()

        if (fetchError || !user) {
            // Si no existe el perfil, intentar crearlo con los datos de auth
            try {
                const userData = await createUserProfileFromAuth(authData.user)
                return { user: userData, error: null }
            } catch (createError: any) {
                // Si falla por duplicado, intentar obtener el usuario existente
                if (createError.code === '23505') {
                    const { data: existingUser, error: existingError } = await supabase
                        .from('usuario')
                        .select('*')
                        .eq('email', authData.user.email)
                        .single()
                    
                    if (existingError || !existingUser) {
                        return { user: null, error: 'Error al obtener perfil de usuario' }
                    }
                    
                    // Reactivar el usuario existente
                    await supabase
                        .from('usuario')
                        .update({ 
                            activo: true,
                            ultima_conexion: new Date().toISOString()
                        })
                        .eq('user_id', existingUser.user_id)
                    
                    // Continuar con el flujo normal usando el usuario existente
                    const userDataExisting = existingUser
                    // Obtener ubicación principal del usuario
                    const { data: location } = await supabase
                        .from('ubicacion')
                        .select('ciudad, departamento')
                        .eq('user_id', userDataExisting.user_id)
                        .eq('es_principal', true)
                        .single()

                    const userLocation = location
                        ? `${location.ciudad}, ${location.departamento}`
                        : 'Colombia'

                    const { isAdmin, roles, adminSince } = await isUserAdmin(userDataExisting.email)

                    const userData: User = {
                        id: userDataExisting.user_id.toString(),
                        name: `${userDataExisting.nombre} ${userDataExisting.apellido}`.trim(),
                        email: userDataExisting.email,
                        avatar: userDataExisting.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                        location: userLocation,
                        phone: userDataExisting.telefono,
                        isAdmin,
                        roles,
                        adminSince
                    }
                    return { user: userData, error: null }
                } else {
                    throw createError
                }
            }
        }

        // Actualizar última conexión y marcar como activo (solo si no está ya activo)
        if (!user.activo) {
        }
        await supabase
            .from('usuario')
            .update({ 
                ultima_conexion: new Date().toISOString(),
                activo: true
            })
            .eq('user_id', user.user_id)

        // Obtener ubicación principal del usuario
        const { data: location } = await supabase
            .from('ubicacion')
            .select('ciudad, departamento')
            .eq('user_id', user.user_id)
            .eq('es_principal', true)
            .single()

        const userLocation = location
            ? `${location.ciudad}, ${location.departamento}`
            : 'Colombia'

        // Verificar si es administrador
        const { isAdmin, roles, adminSince } = await isUserAdmin(user.email)

        // Retornar datos del usuario para el frontend
        const userData: User = {
            id: user.user_id.toString(),
            name: `${user.nombre} ${user.apellido}`.trim(),
            email: user.email,
            avatar: user.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            location: userLocation,
            phone: user.telefono,
            isAdmin,
            roles,
            adminSince
        }

        return { user: userData, error: null }

    } catch (error) {
        console.error('Error en loginUser:', error)
        return { user: null, error: 'Error interno del servidor' }
    }
}

// Función auxiliar para crear perfil con datos específicos del formulario
async function createUserProfileWithData(authUser: any, formData: CompleteRegistrationData): Promise<User> {
    const nombre = formData.firstName.trim()
    const apellido = formData.lastName.trim()
    

    // Crear el usuario en la tabla USUARIO (usando la estructura existente)
    const userDataToInsert = {
        nombre,
        apellido,
        email: authUser.email,
        telefono: formData.phone || null,
        password_hash: 'supabase_auth', // Marcador para indicar que usa Supabase Auth
        fecha_nacimiento: null,
        biografia: null,
        foto_perfil: null,
        calificacion_promedio: 0.00,
        total_intercambios: 0,
        eco_puntos: 0,
        verificado: true,
        activo: true,
        ultima_conexion: new Date().toISOString(),
        auth_user_id: authUser.id // Agregar el auth_user_id requerido
    }
    
    console.log('🔍 DEBUG: createUserProfileFromAuth - AuthUser:', {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata
    })
    
    const { data: newUser, error: insertError } = await supabase
        .from('usuario')
        .insert(userDataToInsert)
        .select()
        .single()

    if (insertError) {
        console.error('❌ ERROR: createUserProfileFromAuth - Error al crear perfil desde auth:', insertError)
        console.error('❌ ERROR: createUserProfileFromAuth - Código:', insertError.code)
        console.error('❌ ERROR: createUserProfileFromAuth - Mensaje:', insertError.message)
        console.error('❌ ERROR: createUserProfileFromAuth - Detalles:', insertError.details)
        console.error('❌ ERROR: createUserProfileFromAuth - Hint:', insertError.hint)
        console.error('❌ ERROR: createUserProfileFromAuth - Datos que se intentaron insertar:', {
            nombre,
            apellido,
            email: authUser.email,
            telefono: authUser.user_metadata?.phone || null,
            auth_user_id: authUser.id
        })
        throw insertError
    }
    

    // Crear ubicación principal usando datos del formulario
    if (formData.location) {
        const locationParts = formData.location.split(', ')
        const ciudad = locationParts[0] || ''
        const departamento = locationParts[1] || ''

        const { error: ubicacionError } = await supabase
            .from('ubicacion')
            .insert({
                user_id: newUser.user_id,
                pais: 'Colombia',
                departamento,
                ciudad,
                barrio: null,
                latitud: null,
                longitud: null,
                es_principal: true
            })
        
        if (ubicacionError) {
            console.error('Error al crear ubicación:', ubicacionError)
        }
    }

    // Crear configuración por defecto
    const { error: configError } = await supabase
        .from('configuracion_usuario')
        .insert({
            usuario_id: newUser.user_id,
            notif_nuevas_propuestas: true,
            notif_mensajes: true,
            notif_actualizaciones: false,
            notif_newsletter: true,
            perfil_publico: true,
            mostrar_ubicacion_exacta: false,
            mostrar_telefono: false,
            recibir_mensajes_desconocidos: true,
            distancia_maxima_km: 50,
            categorias_interes: null
        })
    
    if (configError) {
        console.error('Error al crear configuración:', configError)
    }

    return {
        id: newUser.user_id.toString(),
        name: `${nombre} ${apellido}`.trim(),
        email: newUser.email,
        avatar: newUser.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        location: formData.location || 'Colombia',
        phone: newUser.telefono
    }
}

// Función para verificar si el usuario actual está verificado
export async function isUserVerified(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user?.id) {
            return false
        }

        // Buscar el usuario por auth_user_id en lugar de email
        const { data: usuario, error } = await supabase
            .from('usuario')
            .select('verificado')
            .eq('auth_user_id', user.id)
            .single()


        if (error || !usuario) {
            return false
        }
        
        const isVerified = usuario.verificado === true
        return isVerified
    } catch (error) {
        console.error('❌ ERROR: isUserVerified - Error verificando estado del usuario:', error)
        return false
    }
}

// Función auxiliar para crear perfil desde datos de auth (para login)
async function createUserProfileFromAuth(authUser: any): Promise<User> {
    const name = authUser.user_metadata?.name || 'Usuario'
    const { nombre, apellido } = splitFullName(name)
    

    // Crear el usuario en la tabla USUARIO (usando la estructura existente)
    const userDataToInsert = {
        nombre,
        apellido,
        email: authUser.email,
        telefono: authUser.user_metadata?.phone || null,
        password_hash: 'supabase_auth', // Marcador para indicar que usa Supabase Auth
        fecha_nacimiento: null,
        biografia: null,
        foto_perfil: null,
        calificacion_promedio: 0.00,
        total_intercambios: 0,
        eco_puntos: 0,
        verificado: true,
        activo: true,
        ultima_conexion: new Date().toISOString(),
        auth_user_id: authUser.id // Agregar el auth_user_id requerido
    }
    
    console.log('🔍 DEBUG: createUserProfileFromAuth - AuthUser:', {
        id: authUser.id,
        email: authUser.email,
        user_metadata: authUser.user_metadata
    })
    
    const { data: newUser, error: insertError } = await supabase
        .from('usuario')
        .insert(userDataToInsert)
        .select()
        .single()

    if (insertError) {
        console.error('❌ ERROR: createUserProfileFromAuth - Error al crear perfil desde auth:', insertError)
        console.error('❌ ERROR: createUserProfileFromAuth - Código:', insertError.code)
        console.error('❌ ERROR: createUserProfileFromAuth - Mensaje:', insertError.message)
        console.error('❌ ERROR: createUserProfileFromAuth - Detalles:', insertError.details)
        console.error('❌ ERROR: createUserProfileFromAuth - Hint:', insertError.hint)
        throw insertError
    }
    

    // Crear ubicación principal si se proporciona
    if (authUser.user_metadata?.location) {
        const locationParts = authUser.user_metadata.location.split(', ')
        const ciudad = locationParts[0] || ''
        const departamento = locationParts[1] || ''

        const { error: ubicacionError } = await supabase
            .from('ubicacion')
            .insert({
                user_id: newUser.user_id,
                pais: 'Colombia',
                departamento,
                ciudad,
                barrio: null,
                latitud: null,
                longitud: null,
                es_principal: true
            })
        
        if (ubicacionError) {
            console.error('Error al crear ubicación:', ubicacionError)
        }
    }

    // Crear configuración por defecto
    const { error: configError } = await supabase
        .from('configuracion_usuario')
        .insert({
            usuario_id: newUser.user_id,
            notif_nuevas_propuestas: true,
            notif_mensajes: true,
            notif_actualizaciones: false,
            notif_newsletter: true,
            perfil_publico: true,
            mostrar_ubicacion_exacta: false,
            mostrar_telefono: false,
            recibir_mensajes_desconocidos: true,
            distancia_maxima_km: 50,
            categorias_interes: null
        })
    
    if (configError) {
        console.error('Error al crear configuración:', configError)
    }

    return {
        id: newUser.user_id.toString(),
        name: `${nombre} ${apellido}`.trim(),
        email: newUser.email,
        avatar: newUser.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        location: authUser.user_metadata?.location || 'Colombia',
        phone: newUser.telefono
    }
}

// Función para verificar si un usuario está autenticado
export async function getCurrentUser(): Promise<User | null> {
    try {
        // Obtener la sesión actual de Supabase Auth
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session?.user) {
            localStorage.removeItem(config.auth.sessionKey)
            return null
        }

        // Verificar que el usuario aún existe en la base de datos
        const { data: dbUser, error: dbError } = await supabase
            .from('usuario')
            .select('user_id, activo')
            .eq('email', session.user.email)
            .eq('activo', true)
            .single()

        if (dbError || !dbUser) {
            localStorage.removeItem(config.auth.sessionKey)
            return null
        }

        // Obtener datos completos del usuario
        const { data: user, error: userError } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', session.user.email)
            .single()

        if (userError || !user) {
            return null
        }

        // Obtener ubicación
        const { data: location } = await supabase
            .from('ubicacion')
            .select('ciudad, departamento')
            .eq('user_id', user.user_id)
            .eq('es_principal', true)
            .single()

        const userLocation = location
            ? `${location.ciudad}, ${location.departamento}`
            : 'Colombia'

        // Verificar si es administrador
        const { isAdmin, roles, adminSince } = await isUserAdmin(user.email)

        const userData: User = {
            id: user.user_id.toString(),
            name: `${user.nombre} ${user.apellido}`.trim(),
            email: user.email,
            avatar: user.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            location: userLocation,
            phone: user.telefono,
            isAdmin,
            roles,
            adminSince
        }

        // Guardar en localStorage para compatibilidad
        localStorage.setItem(config.auth.sessionKey, JSON.stringify(userData))

        return userData
    } catch (error) {
        console.error('Error en getCurrentUser:', error)
        localStorage.removeItem(config.auth.sessionKey)
        return null
    }
}

// Función para cerrar sesión
export async function logoutUser(): Promise<void> {
    try {
        // Obtener el usuario actual antes de cerrar sesión
        const { data: { session } } = await supabase.auth.getSession()
        const userEmail = session?.user?.email
        
        // Cerrar sesión en Supabase Auth
        await supabase.auth.signOut()
        
        // Actualizar estado del usuario en la base de datos
        if (userEmail) {
            try {
                const { error: updateError } = await supabase
                    .from('usuario')
                    .update({ 
                        activo: false,
                        ultima_conexion: new Date().toISOString()
                    })
                    .eq('email', userEmail)
                
                if (updateError) {
                    console.error('Error actualizando estado del usuario:', updateError)
                } else {
                }
            } catch (dbError) {
                console.error('Error en actualización de base de datos:', dbError)
            }
        }
        
        // Limpiar localStorage
        localStorage.removeItem(config.auth.sessionKey)
        
    } catch (error) {
        console.error('Error en logout:', error)
        localStorage.removeItem(config.auth.sessionKey)
    }
}

// Función para verificar si un email ya está registrado
export async function checkEmailExists(email: string): Promise<{ exists: boolean; verified: boolean; active: boolean; error: string | null }> {
    try {
        // Verificar en la tabla USUARIO
        const { data: user, error } = await supabase
            .from('usuario')
            .select('email, verificado, activo')
            .eq('email', email)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error verificando email:', error)
            return { exists: false, verified: false, active: false, error: 'Error al verificar el email' }
        }

        if (user) {
            return {
                exists: true,
                verified: user.verificado,
                active: user.activo,
                error: null
            }
        }

        return { exists: false, verified: false, active: false, error: null }

    } catch (error) {
        console.error('Error en checkEmailExists:', error)
        return { exists: false, verified: false, active: false, error: 'Error interno del servidor' }
    }
}

// Función para verificar email y crear perfil automáticamente
export async function verifyEmailAndCreateProfile(token: string): Promise<{ user: User | null; error: string | null }> {
    try {
        // Verificar el email con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
        })

        if (authError) {
            console.error('Error en verificación de email:', authError)
            return { user: null, error: authError.message }
        }

        if (!authData.user) {
            return { user: null, error: 'Error al verificar el email' }
        }

        // Verificar si el perfil ya existe en la tabla USUARIO
        const { data: existingUser, error: checkError } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', authData.user.email)
            .single()

        if (existingUser) {
            // El perfil ya existe, actualizar el estado de verificación
            const { data: updatedUser, error: updateError } = await supabase
                .from('usuario')
                .update({
                    verificado: true,
                    activo: true,
                    ultima_conexion: new Date().toISOString()
                })
                .eq('email', authData.user.email)
                .select()
                .single()

            if (updateError) {
                console.error('Error actualizando usuario:', updateError)
                return { user: null, error: 'Error al actualizar el perfil' }
            }

            // Convertir a formato User
            const userData: User = {
                id: updatedUser.user_id.toString(),
                name: `${updatedUser.nombre} ${updatedUser.apellido}`.trim(),
                email: updatedUser.email,
                avatar: updatedUser.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                location: 'Colombia',
                phone: updatedUser.telefono
            }
            return { user: userData, error: null }
        }

        // El perfil no existe, crear uno nuevo con los datos de Supabase Auth
        const userMetadata = authData.user.user_metadata || {}

        // Separar nombre y apellido
        const fullName = userMetadata.name || (authData.user.email ? authData.user.email.split('@')[0] : 'Usuario')
        const { nombre, apellido } = splitFullName(fullName)
        

        // Crear el perfil del usuario
        const { data: newUser, error: insertError } = await supabase
            .from('usuario')
            .insert({
                nombre,
                apellido,
                email: authData.user.email,
                telefono: userMetadata.phone || null,
                password_hash: 'supabase_auth',
                verificado: true,
                activo: true,
                fecha_registro: new Date().toISOString(),
                ultima_conexion: new Date().toISOString()
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error creando perfil de usuario:', insertError)
            return { user: null, error: 'Error al crear el perfil' }
        }

        // Crear ubicación por defecto si se proporcionó
        if (userMetadata.location) {
            const locationParts = userMetadata.location.split(', ')
            const { error: locationError } = await supabase
                .from('ubicacion')
                .insert({
                    user_id: newUser.user_id,
                    pais: 'Colombia',
                    departamento: locationParts[1] || 'Risaralda',
                    ciudad: locationParts[0] || 'Pereira',
                    es_principal: true
                })

            if (locationError) {
                console.error('Error creando ubicación:', locationError)
            }
        }

        // Crear configuración por defecto
        const { error: configError } = await supabase
            .from('configuracion_usuario')
            .insert({
                usuario_id: newUser.user_id,
                notif_nuevas_propuestas: true,
                notif_mensajes: true,
                notif_actualizaciones: false,
                notif_newsletter: true,
                perfil_publico: true,
                mostrar_ubicacion_exacta: false,
                mostrar_telefono: false,
                recibir_mensajes_desconocidos: true,
                distancia_maxima_km: 50
            })

        if (configError) {
            console.error('Error creando configuración:', configError)
        }

        // Convertir a formato User
        const userData: User = {
            id: newUser.user_id.toString(),
            name: `${nombre} ${apellido}`.trim(),
            email: newUser.email,
            avatar: newUser.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            location: userMetadata.location || 'Colombia',
            phone: newUser.telefono
        }
        return { user: userData, error: null }

    } catch (error) {
        console.error('Error en verifyEmailAndCreateProfile:', error)
        return { user: null, error: 'Error interno del servidor' }
    }
}

// Función para reenviar email de confirmación
export async function resendConfirmationEmail(email: string): Promise<{ error: string | null }> {
    try {
        // Primero verificar si el usuario existe
        const { exists, verified, active } = await checkEmailExists(email)

        if (!exists) {
            return { error: 'Este correo electrónico no está registrado.' }
        }

        if (verified) {
            return { error: 'Este correo electrónico ya está verificado. Inicia sesión en su lugar.' }
        }

        if (!active) {
            return { error: 'Esta cuenta está desactivada. Contacta al soporte.' }
        }

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email
        })

        if (error) {
            return { error: error.message }
        }

        return { error: null }
    } catch (error) {
        console.error('Error al reenviar email:', error)
        return { error: 'Error al reenviar el email de confirmación' }
    }
}

// =============================================
// FUNCIONES DE ADMINISTRACIÓN
// =============================================

// Función para verificar si un usuario es administrador
export async function isUserAdmin(email: string): Promise<{ isAdmin: boolean; roles: string[]; adminSince?: string }> {
    try {
        // Verificar si es admin por la columna es_admin
        const { data: dbUser } = await supabase
            .from('usuario')
            .select('user_id, es_admin, admin_desde')
            .eq('email', email)
            .single()

        if (dbUser?.es_admin) {
            // Obtener roles del usuario
            const { data: roles } = await supabase
                .from('usuario_rol')
                .select('rol_id, activo')
                .eq('usuario_id', dbUser.user_id)
                .eq('activo', true)

            if (roles && roles.length > 0) {
                const roleIds = roles.map(r => r.rol_id)
                const { data: roleNames } = await supabase
                    .from('rol_usuario')
                    .select('rol_id, nombre, activo')
                    .in('rol_id', roleIds)
                    .eq('activo', true)

                const adminRoles = (roleNames || [])
                    .filter(r => ['super_admin', 'admin_validacion', 'admin_soporte', 'moderador'].includes(r.nombre))
                    .map(r => r.nombre)

                return {
                    isAdmin: true,
                    roles: adminRoles,
                    adminSince: dbUser.admin_desde || undefined
                }
            }

            return {
                isAdmin: true,
                roles: ['admin'], // Rol genérico si no tiene roles específicos
                adminSince: dbUser.admin_desde || undefined
            }
        }

        return { isAdmin: false, roles: [] }
    } catch (error) {
        console.error('Error verificando admin:', error)
        return { isAdmin: false, roles: [] }
    }
}

// Función para verificar si un usuario es super admin
export async function isUserSuperAdmin(email: string): Promise<boolean> {
    try {
        const { data: dbUser } = await supabase
            .from('usuario')
            .select('user_id, es_admin')
            .eq('email', email)
            .single()

        if (!dbUser?.es_admin) return false

        // Verificar si tiene rol de super_admin
        const { data: roles } = await supabase
            .from('usuario_rol')
            .select('rol_id, activo')
            .eq('usuario_id', dbUser.user_id)
            .eq('activo', true)

        if (roles && roles.length > 0) {
            const roleIds = roles.map(r => r.rol_id)
            const { data: roleNames } = await supabase
                .from('rol_usuario')
                .select('nombre, activo')
                .in('rol_id', roleIds)
                .eq('activo', true)

            return !!(roleNames || []).find(r => r.nombre === 'super_admin')
        }

        return false
    } catch (error) {
        console.error('Error verificando super admin:', error)
        return false
    }
}

// Función para obtener información completa de administrador
export async function getAdminUser(email: string): Promise<AdminUser | null> {
    try {
        const { data: dbUser } = await supabase
            .from('usuario')
            .select('*')
            .eq('email', email)
            .eq('es_admin', true)
            .single()

        if (!dbUser) return null

        // Obtener roles del usuario
        const { data: roles } = await supabase
            .from('usuario_rol')
            .select('rol_id, activo')
            .eq('usuario_id', dbUser.user_id)
            .eq('activo', true)

        let adminRoles: string[] = []
        if (roles && roles.length > 0) {
            const roleIds = roles.map(r => r.rol_id)
            const { data: roleNames } = await supabase
                .from('rol_usuario')
                .select('nombre, activo')
                .in('rol_id', roleIds)
                .eq('activo', true)

            adminRoles = (roleNames || [])
                .filter(r => ['super_admin', 'admin_validacion', 'admin_soporte', 'moderador'].includes(r.nombre))
                .map(r => r.nombre)
        }

        // Obtener ubicación
        const { data: location } = await supabase
            .from('ubicacion')
            .select('ciudad, departamento')
            .eq('user_id', dbUser.user_id)
            .eq('es_principal', true)
            .single()

        const userLocation = location
            ? `${location.ciudad}, ${location.departamento}`
            : 'Colombia'

        return {
            id: dbUser.user_id.toString(),
            name: `${dbUser.nombre} ${dbUser.apellido}`.trim(),
            email: dbUser.email,
            avatar: dbUser.foto_perfil || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            location: userLocation,
            phone: dbUser.telefono,
            isAdmin: true,
            roles: adminRoles,
            adminSince: dbUser.admin_desde || undefined
        }
    } catch (error) {
        console.error('Error obteniendo admin user:', error)
        return null
    }
}

// Función para verificar permisos de administrador
export async function hasAdminPermission(email: string, permission: string): Promise<boolean> {
    try {
        const { isAdmin, roles } = await isUserAdmin(email)

        if (!isAdmin) return false

        // Super admin tiene todos los permisos
        if (roles.includes('super_admin')) return true

        // Verificar permisos específicos por rol
        const permissionMap: Record<string, string[]> = {
            'gestionar_usuarios': ['super_admin', 'admin_validacion'],
            'gestionar_admins': ['super_admin'],
            'gestionar_reportes': ['super_admin', 'admin_soporte', 'moderador'],
            'gestionar_verificaciones': ['super_admin', 'admin_validacion'],
            'responder_chats': ['super_admin', 'admin_soporte', 'moderador'],
            'acceso_total': ['super_admin']
        }

        const allowedRoles = permissionMap[permission] || []
        return roles.some(role => allowedRoles.includes(role))
    } catch (error) {
        console.error('Error verificando permisos:', error)
        return false
    }
}

// Función para login de administrador (con verificación de roles)
export async function loginAdmin(data: LoginData): Promise<{ user: AdminUser | null; error: string | null }> {
    try {
        // Primero hacer login normal
        const { user, error } = await loginUser(data)

        if (error || !user) {
            return { user: null, error: error || 'Error al iniciar sesión' }
        }

        // Verificar si es administrador
        const { isAdmin, roles, adminSince } = await isUserAdmin(user.email)

        if (!isAdmin) {
            return { user: null, error: 'No tienes permisos de administrador' }
        }

        // Retornar como AdminUser
        const adminUser: AdminUser = {
            ...user,
            isAdmin: true,
            roles,
            adminSince
        }

        return { user: adminUser, error: null }
    } catch (error) {
        console.error('Error en loginAdmin:', error)
        return { user: null, error: 'Error interno del servidor' }
    }
}

// Función para obtener el usuario actual con información de admin
export async function getCurrentUserWithAdmin(): Promise<User | null> {
    try {
        const user = await getCurrentUser()
        if (!user) return null

        // Verificar si es admin
        const { isAdmin, roles, adminSince } = await isUserAdmin(user.email)

        return {
            ...user,
            isAdmin,
            roles,
            adminSince
        }
    } catch (error) {
        console.error('Error obteniendo usuario con admin:', error)
        return null
    }
}


