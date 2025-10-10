'use client'

import { useEffect, useState } from 'react'
import { initializeAuth, handleGlobalAuthError } from '@/lib/init-auth'
import RateLimitIndicator from './RateLimitIndicator'
import AuthErrorHandler from './AuthErrorHandler'

interface AuthProviderProps {
    children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false)
    const [initError, setInitError] = useState<string | null>(null)
    const [isRetrying, setIsRetrying] = useState(false)

    useEffect(() => {
        const init = async () => {
            try {
                setIsRetrying(true)
                const success = await initializeAuth()
                
                if (success) {
                    setIsInitialized(true)
                    setInitError(null)
                } else {
                    setInitError('Error inicializando la aplicación')
                }
            } catch (error: any) {
                console.error('Error en inicialización:', error)
                const errorInfo = handleGlobalAuthError(error)
                setInitError(errorInfo.message)
                
                if (errorInfo.shouldRetry && errorInfo.retryAfter > 0) {
                    // Reintentar después del tiempo especificado
                    setTimeout(() => {
                        init()
                    }, errorInfo.retryAfter)
                }
            } finally {
                setIsRetrying(false)
            }
        }

        init()
    }, [])

    // Mostrar loading mientras se inicializa
    if (!isInitialized && isRetrying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Inicializando aplicación...</p>
                    {initError && (
                        <p className="text-sm text-red-600 mt-2">{initError}</p>
                    )}
                </div>
            </div>
        )
    }

    // Mostrar error si no se pudo inicializar
    if (!isInitialized && initError && !isRetrying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-red-800 mb-2">
                            Error de Inicialización
                        </h2>
                        <p className="text-red-600 mb-4">{initError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {children}
            <RateLimitIndicator />
            <AuthErrorHandler 
                error={initError} 
                onClearError={() => setInitError(null)}
                onRetry={() => window.location.reload()}
            />
        </>
    )
}
