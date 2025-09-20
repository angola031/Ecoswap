import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    })
                },
            },
        }
    )

    // Debug de cookies para todas las rutas
    const allCookies = req.cookies.getAll()
    console.log('🍪 Cookies recibidas:', allCookies.length)
    console.log('🍪 Nombres:', allCookies.map(c => c.name))
    
    // Buscar cookies de Supabase específicamente
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
    console.log('🔑 Cookies de Supabase:', supabaseCookies.length)
    supabaseCookies.forEach(c => {
        console.log(`   ${c.name}: ${c.value?.substring(0, 30)}...`)
    })

    // Manejar timeout en página principal
    if (req.nextUrl.pathname === '/' && req.nextUrl.searchParams.get('timeout') === 'true') {
        console.log('⏰ Timeout detectado en página principal, limpiando sesión del servidor...')
        try {
            await supabase.auth.signOut()
            console.log('✅ Sesión del servidor cerrada por timeout en página principal')
        } catch (error) {
            console.log('⚠️ Error cerrando sesión del servidor por timeout:', error)
        }
        console.log('⏰ Redirigiendo a login limpio desde página principal')
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Solo proteger rutas /admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            console.log('🚫 No hay sesión para ruta admin, redirigiendo a login')
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // Verificar que sea admin
        try {
            const { data: userData } = await supabase
                .from('usuario')
                .select('es_admin, activo')
                .eq('email', session.user.email)
                .single()

            if (!userData?.es_admin || !userData?.activo) {
                console.log('⚠️ Usuario no es admin, bloqueando acceso')
                return NextResponse.redirect(new URL('/admin-access-denied', req.url))
            }

            console.log('✅ Admin autorizado:', session.user.email)
        } catch (error) {
            console.error('❌ Error verificando admin:', error)
            return NextResponse.redirect(new URL('/admin-access-denied', req.url))
        }
    }

    // Si el usuario está en /login y ya tiene sesión, redirigir según su rol
    if (req.nextUrl.pathname === '/login') {
        // Si hay parámetro logout=true, limpiar sesión y redirigir a login limpio
        if (req.nextUrl.searchParams.get('logout') === 'true') {
            console.log('🚪 Logout detectado, limpiando sesión del servidor...')
            try {
                // Intentar cerrar sesión del lado del servidor
                await supabase.auth.signOut()
                console.log('✅ Sesión del servidor cerrada')
            } catch (error) {
                console.log('⚠️ Error cerrando sesión del servidor:', error)
            }
            console.log('🚪 Redirigiendo a login limpio después del logout')
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // Si hay parámetro timeout=true, limpiar sesión y redirigir a login limpio
        if (req.nextUrl.searchParams.get('timeout') === 'true') {
            console.log('⏰ Timeout detectado, limpiando sesión del servidor...')
            try {
                // Intentar cerrar sesión del lado del servidor
                await supabase.auth.signOut()
                console.log('✅ Sesión del servidor cerrada por timeout')
            } catch (error) {
                console.log('⚠️ Error cerrando sesión del servidor por timeout:', error)
            }
            console.log('⏰ Redirigiendo a login limpio después del timeout')
            return NextResponse.redirect(new URL('/login', req.url))
        }

        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
            try {
                const { data: userData } = await supabase
                    .from('usuario')
                    .select('es_admin, activo')
                    .eq('email', session.user.email)
                    .single()

                if (userData?.es_admin && userData?.activo) {
                    console.log('🔄 Admin ya autenticado, redirigiendo al dashboard')
                    return NextResponse.redirect(new URL('/admin/verificaciones', req.url))
                } else if (userData && !userData.es_admin) {
                    console.log('🔄 Usuario ya autenticado, redirigiendo a página principal')
                    return NextResponse.redirect(new URL('/', req.url))
                }
            } catch (error) {
                console.error('❌ Error verificando usuario en login:', error)
            }
        }
    }

    return response
}

export const config = {
    matcher: ['/admin/:path*', '/login', '/'],
}