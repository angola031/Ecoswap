import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: any) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // Obtener la sesión actual
    const { data: { session } } = await supabase.auth.getSession()

    // Solo proteger rutas de admin si no hay sesión
    if (!session && request.nextUrl.pathname.startsWith('/admin')) {
        console.log('🔍 Middleware: Sin sesión, redirigiendo a login desde:', request.nextUrl.pathname)
        
        // Si viene de login, dar tiempo para que se establezca la sesión
        const referer = request.headers.get('referer')
        if (referer && referer.includes('/login')) {
            console.log('🔍 Middleware: Viene de login, permitiendo acceso temporal')
            return response
        }
        
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Si no hay sesión y está intentando acceder a APIs de admin
    if (!session && request.nextUrl.pathname.startsWith('/api/admin')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Si hay sesión y está en la página de login, verificar tipo de usuario
    if (session && request.nextUrl.pathname === '/login') {
        try {
            // Obtener datos del usuario
            const { data: userData } = await supabase
                .from('usuario')
                .select('es_admin, activo')
                .eq('email', session.user.email)
                .single()

            // Si es administrador activo, redirigir al dashboard
            if (userData?.es_admin && userData?.activo) {
                return NextResponse.redirect(new URL('/admin/verificaciones', request.url))
            } else if (userData && !userData.es_admin) {
                // Si no es administrador, redirigir a la página principal
                return NextResponse.redirect(new URL('/', request.url))
            }
        } catch (error) {
            console.error('Error verificando usuario en middleware:', error)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
