'use client'

import { useEffect } from 'react'

export default function CookieManager() {
    useEffect(() => {
        // Limpiar cookies problemáticas de Cloudflare
        const clearProblematicCookies = () => {
            // Lista de cookies problemáticas
            const problematicCookies = [
                '__cf_bm',
                '__cfruid',
                '__cfduid',
                'cf_clearance'
            ]
            
            problematicCookies.forEach(cookieName => {
                // Intentar eliminar la cookie
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.vercel.app`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=vercel.app`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
            })
        }
        
        // Limpiar cookies al cargar
        clearProblematicCookies()
        
        // Limpiar cookies periódicamente
        const interval = setInterval(clearProblematicCookies, 5000)
        
        // Limpiar cookies cuando se detecte el error
        const handleError = (event: ErrorEvent) => {
            if (event.message?.includes('__cf_bm') || 
                event.message?.includes('cookie') || 
                event.message?.includes('domain')) {
                clearProblematicCookies()
            }
        }
        
        window.addEventListener('error', handleError)
        
        return () => {
            clearInterval(interval)
            window.removeEventListener('error', handleError)
        }
    }, [])
    
    return null // Componente invisible
}






