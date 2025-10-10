/**
 * Cloudflare Pages Middleware
 * Maneja la configuración específica para Cloudflare Pages
 */

export async function onRequest(context: any) {
    const { request, next } = context;
    
    // Agregar headers específicos para Cloudflare
    const response = await next();
    
    // Clonar la respuesta para poder modificar headers
    const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
    
    // Headers específicos para Cloudflare
    newResponse.headers.set('CF-Cache-Status', 'HIT');
    newResponse.headers.set('CF-Ray', context.request.headers.get('CF-Ray') || '');
    
    // Headers de seguridad
    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Headers CORS para Supabase
    if (request.method === 'OPTIONS') {
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
        newResponse.headers.set('Access-Control-Max-Age', '86400');
    }
    
    // Configuración de cache según el tipo de contenido
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/_next/static/')) {
        // Archivos estáticos de Next.js - cache largo
        newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/')) {
        // Imágenes - cache medio
        newResponse.headers.set('Cache-Control', 'public, max-age=86400');
    } else if (url.pathname.startsWith('/api/')) {
        // API routes - no cache
        newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
        // Páginas HTML - cache corto
        newResponse.headers.set('Cache-Control', 'public, max-age=3600');
    }
    
    return newResponse;
}
