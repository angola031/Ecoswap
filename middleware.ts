import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Middleware simplificado para evitar conflictos
    const response = NextResponse.next()
    
    // Solo configurar headers básicos si es necesario
    if (request.nextUrl.pathname.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*')
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    }
    
    return response
}

export const config = {
    matcher: [
        // Solo aplicar a APIs
        '/api/:path*'
    ],
}
