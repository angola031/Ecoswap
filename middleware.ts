import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Crear respuesta
    const response = NextResponse.next()
    
    // Configurar headers para evitar problemas con cookies de Cloudflare
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Configurar cookies seguras
    if (request.nextUrl.hostname !== 'localhost') {
        // En producción (Vercel), configurar cookies seguras
        response.headers.set('Set-Cookie', 
            response.headers.get('Set-Cookie')?.split(',').map(cookie => {
                if (cookie.includes('__cf_bm')) {
                    return cookie + '; SameSite=Lax; Secure'
                }
                return cookie
            }).join(',') || ''
        )
    }
    
    return response
}

export const config = {
    matcher: [
        // Aplicar solo a rutas específicas que necesitan middleware
        '/api/:path*',
        '/storage/:path*',
        '/admin/:path*'
    ],
}
