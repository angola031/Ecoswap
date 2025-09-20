'use client'

import { usePathname } from 'next/navigation'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import SessionTimeoutWarning from './SessionTimeoutWarning'

export default function SessionManager() {
    const pathname = usePathname()
    
    // Activar timeout solo en páginas protegidas
    const isProtectedPage = pathname.startsWith('/admin') || 
                           pathname.startsWith('/profile') || 
                           pathname.startsWith('/chat') ||
                           pathname.startsWith('/interactions')

    // Usar el mismo hook que SessionTimeoutWarning
    const { resetTimeout, getMinutesRemaining, isInWarningPeriod } = useSessionTimeout({
        timeoutMinutes: 5,
        enabled: isProtectedPage,
        onTimeout: () => {
            console.log('⏰ Sesión expirada por inactividad desde SessionManager')
        }
    })

    if (!isProtectedPage) {
        return null
    }

    return (
        <SessionTimeoutWarning
            timeoutMinutes={5}
            warningMinutes={1}
            getMinutesRemaining={getMinutesRemaining}
            resetTimeout={resetTimeout}
            isInWarningPeriod={isInWarningPeriod}
            onExtendSession={() => {
                console.log('✅ Sesión extendida por el usuario desde SessionManager')
                resetTimeout() // Asegurar que se reinicie el timeout
            }}
        />
    )
}
