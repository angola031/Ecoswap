import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Middleware vacío - solo permite que todas las requests continúen
    return NextResponse.next()
}

export const config = {
    matcher: [
        // No aplicar a ninguna ruta específica
        // Esto evita cualquier interferencia
    ],
}
