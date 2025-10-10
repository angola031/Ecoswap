'use client'

import React from 'react'
import { AlertTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ErrorBoundaryState {
    hasError: boolean
    error?: Error
    errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Filtrar errores no críticos
        const nonCriticalErrors = [
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary',
            'cz-shortcut-listen'
        ]

        const isNonCritical = nonCriticalErrors.some(err => 
            error.message.includes(err) || 
            error.stack?.includes(err) ||
            errorInfo.componentStack.includes(err)
        )

        if (!isNonCritical) {
            console.error('Error capturado por ErrorBoundary:', error, errorInfo)
            this.setState({ error, errorInfo })
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }

    render() {
        if (this.state.hasError) {
            // Si hay un fallback personalizado, usarlo
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback
                return <FallbackComponent error={this.state.error} resetError={this.resetError} />
            }

            // Fallback por defecto
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <AlertTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Algo salió mal
                            </h2>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-4">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Detalles del error (solo en desarrollo)
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                    {this.state.error.message}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={this.resetError}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <ArrowPathIcon className="h-4 w-4 mr-2" />
                                Reintentar
                            </button>
                            
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                Recargar página
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// Hook para usar error boundary en componentes funcionales
export function useErrorHandler() {
    const [error, setError] = React.useState<Error | null>(null)

    const resetError = React.useCallback(() => {
        setError(null)
    }, [])

    const captureError = React.useCallback((error: Error) => {
        // Filtrar errores no críticos
        const nonCriticalErrors = [
            'RedirectErrorBoundary',
            'NotFoundErrorBoundary',
            'DevRootNotFoundBoundary',
            'cz-shortcut-listen'
        ]

        const isNonCritical = nonCriticalErrors.some(err => 
            error.message.includes(err)
        )

        if (!isNonCritical) {
            setError(error)
        }
    }, [])

    React.useEffect(() => {
        if (error) {
            throw error
        }
    }, [error])

    return { captureError, resetError }
}

export default ErrorBoundary
