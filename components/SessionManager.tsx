
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import SessionTimeoutWarning from './SessionTimeoutWarning'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function SessionManager() {
    const pathname = usePathname()
    const router = useRouter()
    
    // Activar timeout solo en páginas protegidas
    const isProtectedPage = pathname.startsWith('/admin') || 
                           pathname.startsWith('/profile') || 
                           pathname.startsWith('/chat') ||
                           pathname.startsWith('/interactions')

    // Usar el mismo hook que SessionTimeoutWarning
    const { resetTimeout, getMinutesRemaining, isInWarningPeriod } = useSessionTimeout({
        timeoutMinutes: 30, // Cambiado de 5 a 30 minutos para coincidir con useInactivity
        enabled: isProtectedPage,
        onTimeout: () => {
        }
    })

    // Sincronizar estado de autenticación en toda la app sin recargar manualmente
    useEffect(() => {
        const supabase = getSupabaseClient()
        if (!supabase) return

        const { data: sub } = supabase.auth.onAuthStateChange(() => {
            // Notificar a módulos y refrescar datos de forma suave
            try { window.dispatchEvent(new Event('auth:changed')) } catch {}
            router.refresh()
        })

        // Refrescar al volver a la pestaña
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                router.refresh()
            }
        }
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            sub?.subscription?.unsubscribe()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [router])

    if (!isProtectedPage) {
        return null
    }

    return (
        <SessionTimeoutWarning
            timeoutMinutes={30} // Cambiado de 5 a 30 minutos
            warningMinutes={5} // Advertencia 5 minutos antes del timeout
            getMinutesRemaining={getMinutesRemaining}
            resetTimeout={resetTimeout}
            isInWarningPeriod={isInWarningPeriod}
            onExtendSession={() => {
                resetTimeout() // Asegurar que se reinicie el timeout
            }}
        />
    )
}
