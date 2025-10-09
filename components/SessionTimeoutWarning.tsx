'use client'

import { useState, useEffect, useRef } from 'react'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'

interface SessionTimeoutWarningProps {
    timeoutMinutes?: number
    warningMinutes?: number
    onExtendSession?: () => void
    // Recibir las funciones del hook desde SessionManager
    getMinutesRemaining?: () => number
    resetTimeout?: () => void
    isInWarningPeriod?: (warningMinutes: number) => boolean
}

export default function SessionTimeoutWarning({
    timeoutMinutes = 5,
    warningMinutes = 1,
    onExtendSession,
    getMinutesRemaining,
    resetTimeout,
    isInWarningPeriod
}: SessionTimeoutWarningProps) {
    const [showWarning, setShowWarning] = useState(false)
    const [minutesRemaining, setMinutesRemaining] = useState(0)
    const [isExtended, setIsExtended] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    
    // Si no se proporcionan las funciones, usar el hook local como fallback
    const localHook = useSessionTimeout({
        timeoutMinutes,
        enabled: false // No activar aquí para evitar conflictos
    })
    
    const finalGetMinutesRemaining = getMinutesRemaining || localHook.getMinutesRemaining
    const finalResetTimeout = resetTimeout || localHook.resetTimeout
    const finalIsInWarningPeriod = isInWarningPeriod || localHook.isInWarningPeriod

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            const remaining = finalGetMinutesRemaining()
            setMinutesRemaining(remaining)
            
            
            // Mostrar advertencia cuando queden menos de warningMinutes y no se haya extendido recientemente
            if (finalIsInWarningPeriod(warningMinutes) && !isExtended) {
                setShowWarning(true)
            } else if (remaining === 0 || remaining > warningMinutes) {
                setShowWarning(false)
                setIsExtended(false) // Reset del estado de extensión
            }
        }, 1000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [finalGetMinutesRemaining, finalIsInWarningPeriod, warningMinutes, isExtended])

    const handleExtendSession = () => {
        
        // Marcar como extendido para evitar que vuelva a aparecer inmediatamente
        setIsExtended(true)
        setShowWarning(false)
        
        // Reiniciar el timeout usando la función final
        finalResetTimeout()
        
        // Ejecutar callback si existe
        if (onExtendSession) {
            onExtendSession()
        }
        
    }

    const handleLogout = () => {
        setShowWarning(false)
        setIsExtended(false)
        // El timeout se encargará del logout automático
    }

    if (!showWarning || minutesRemaining <= 0) {
        return null
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Sesión por expirar
                        </h3>
                        <p className="text-sm text-gray-600">
                            Tu sesión expirará en {minutesRemaining} minuto{minutesRemaining !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                            style={{ 
                                width: `${(minutesRemaining / warningMinutes) * 100}%` 
                            }}
                        ></div>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handleExtendSession}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Extender Sesión
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-3 text-center">
                    Por seguridad, tu sesión se cerrará automáticamente después de {timeoutMinutes} minutos de inactividad
                </p>
            </div>
        </div>
    )
}
