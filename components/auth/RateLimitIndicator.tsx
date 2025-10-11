'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { isRateLimited, getRetryAfter } from '../../lib/supabase-interceptor'

export default function RateLimitIndicator() {
    const [isLimited, setIsLimited] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(0)

    useEffect(() => {
        const checkRateLimit = () => {
            const limited = isRateLimited()
            const retryAfter = getRetryAfter()
            
            setIsLimited(limited)
            
            if (limited && retryAfter) {
                setTimeRemaining(Math.ceil(retryAfter / 1000))
            }
        }

        // Verificar inicialmente
        checkRateLimit()

        // Verificar cada segundo
        const interval = setInterval(checkRateLimit, 1000)

        return () => clearInterval(interval)
    }, [])

    if (!isLimited) {
        return null
    }

    return (
        <div className="fixed top-4 left-4 z-50 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <div>
                    <p className="font-medium text-sm">Demasiadas solicitudes</p>
                    <p className="text-xs">
                        Espera <span className="font-mono">{timeRemaining}s</span> antes de continuar
                    </p>
                </div>
                <ClockIcon className="h-4 w-4" />
            </div>
        </div>
    )
}
