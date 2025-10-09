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
    
    // Buscar cookies de Supabase específicamente
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
    supabaseCookies.forEach(c => {
    })

    // Manejar timeout en página principal
    if (req.nextUrl.pathname === '/' && req.nextUrl.searchParams.get('timeout') === 'true') {
        try {
            await supabase.auth.signOut()
        } catch (error) {
        }
        return NextResponse.redirect(new URL('/login', req.url))
    }

    // Solo proteger rutas /admin
    if (req.nextUrl.pathname.startsWith('/admin')) {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
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
                return NextResponse.redirect(new URL('/admin-access-denied', req.url))
            }

        } catch (error) {
            console.error('❌ Error verificando admin:', error)
            return NextResponse.redirect(new URL('/admin-access-denied', req.url))
        }
    }

    // Si el usuario está en /login y ya tiene sesión, redirigir según su rol
    if (req.nextUrl.pathname === '/login') {
        // Si hay parámetro logout=true, limpiar sesión y redirigir a login limpio
        if (req.nextUrl.searchParams.get('logout') === 'true') {
            try {
                // Intentar cerrar sesión del lado del servidor
                await supabase.auth.signOut()
            } catch (error) {
            }
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // Si hay parámetro timeout=true, limpiar sesión y redirigir a login limpio
        if (req.nextUrl.searchParams.get('timeout') === 'true') {
            try {
                // Intentar cerrar sesión del lado del servidor
                await supabase.auth.signOut()
            } catch (error) {
            }
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
                    return NextResponse.redirect(new URL('/admin/verificaciones', req.url))
                } else if (userData && !userData.es_admin) {
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