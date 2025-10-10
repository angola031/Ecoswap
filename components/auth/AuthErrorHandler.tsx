'use client'

import { useEffect, useState } from 'react'
import { AlertTriangleIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface AuthErrorHandlerProps {
    error: string | null
    onClearError: () => void
    onRetry?: () => void
}

export default function AuthErrorHandler({ error, onClearError, onRetry }: AuthErrorHandlerProps) {
    const [showError, setShowError] = useState(false)

    useEffect(() => {
        if (error) {
            setShowError(true)
            
            // Auto-ocultar errores no críticos después de 10 segundos
            if (!error.includes('rate limit')) {
                const timer = setTimeout(() => {
                    setShowError(false)
                    onClearError()
                }, 10000)
                
                return () => clearTimeout(timer)
            }
        } else {
            setShowError(false)
        }
    }, [error, onClearError])

    if (!showError || !error) {
        return null
    }

    const isRateLimitError = error.includes('rate limit')
    const isCookieError = error.includes('cookie') || error.includes('dominio')

    return (
        <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className={`p-4 rounded-lg shadow-lg border-l-4 ${
                isRateLimitError 
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800' 
                    : isCookieError
                    ? 'bg-blue-50 border-blue-400 text-blue-800'
                    : 'bg-red-50 border-red-400 text-red-800'
            }`}>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <AlertTriangleIcon className="h-5 w-5" />
                    </div>
                    <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium">
                            {isRateLimitError ? 'Demasiadas solicitudes' : 
                             isCookieError ? 'Problema de cookies' : 
                             'Error de autenticación'}
                        </h3>
                        <div className="mt-1 text-sm">
                            <p>{error}</p>
                        </div>
                        {isRateLimitError && (
                            <div className="mt-2">
                                <p className="text-xs">
                                    Espera unos momentos antes de intentar de nuevo. 
                                    Esto ayuda a proteger el sistema.
                                </p>
                            </div>
                        )}
                        {isCookieError && (
                            <div className="mt-2">
                                <p className="text-xs">
                                    Intenta limpiar las cookies del navegador o usar una ventana de incógnito.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                        {onRetry && isRateLimitError && (
                            <button
                                onClick={onRetry}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            >
                                <ArrowPathIcon className="h-3 w-3 mr-1" />
                                Reintentar
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setShowError(false)
                                onClearError()
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200"
                        >
                            <XMarkIcon className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
