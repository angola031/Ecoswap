'use client'

import { useEffect } from 'react'

export default function CookieManager() {
    // Componente simplificado - ya no se necesita limpiar cookies de Cloudflare
    // ya que solo se trabaja con Vercel
    useEffect(() => {
        // Este componente ahora solo existe para mantener compatibilidad
        // No realiza ninguna acción de limpieza de cookies
        return () => {
            // Cleanup vacío
        }
    }, [])
    
    return null // Componente invisible
}
























