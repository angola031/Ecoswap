import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Middleware simplificado para Vercel
    // Solo maneja redirecciones básicas sin dependencias externas
    
    const { pathname } = request.nextUrl
    
    // Redireccionar /admin a /admin/login si no está ya en login
    if (pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Permitir que todas las demás requests continúen
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Solo aplicar a rutas específicas que necesiten redirección
        '/admin',
        '/admin/login'
    ],
}
