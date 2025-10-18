'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function AuthCodeErrorPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isResending, setIsResending] = useState(false)
    
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    const isExpired = errorCode === 'otp_expired' || error?.includes('expired') || errorDescription?.includes('expired')
    const isAccessDenied = errorCode === 'access_denied' || error === 'access_denied'

    const handleResendEmail = async () => {
        setIsResending(true)
        // Aquí podrías implementar la lógica para reenviar el email
        // Por ahora, redirigimos al login donde pueden solicitar un nuevo enlace
        setTimeout(() => {
            router.push('/login')
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <div className="mx-auto h-12 w-12 text-red-500">
                        {isExpired ? (
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        )}
                    </div>
                    
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {isExpired ? 'Enlace Expirado' : 'Error de Autenticación'}
                    </h2>
                    
                    <p className="mt-2 text-sm text-gray-600">
                        {isExpired 
                            ? 'El enlace de restablecimiento de contraseña ha expirado.'
                            : 'Hubo un problema al procesar tu enlace de autenticación.'
                        }
                    </p>
                    
                    <p className="mt-1 text-sm text-gray-500">
                        {isExpired 
                            ? 'Los enlaces de seguridad expiran por tu protección. Solicita uno nuevo.'
                            : 'El enlace puede haber expirado o ser inválido.'
                        }
                    </p>

                    {/* Información de debug (solo en desarrollo) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-600">
                            <p><strong>Error:</strong> {error || 'N/A'}</p>
                            <p><strong>Código:</strong> {errorCode || 'N/A'}</p>
                            <p><strong>Descripción:</strong> {errorDescription || 'N/A'}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {isExpired && (
                        <button
                            onClick={handleResendEmail}
                            disabled={isResending}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            {isResending ? 'Redirigiendo...' : 'Solicitar Nuevo Enlace'}
                        </button>
                    )}

                    <button
                        onClick={() => router.push('/login')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Ir al Login
                    </button>

                    <button
                        onClick={() => router.push('/')}
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Ir al Inicio
                    </button>
                </div>

                {/* Información adicional para enlaces expirados */}
                {isExpired && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">¿Por qué expiran los enlaces?</h3>
                        <ul className="text-xs text-blue-800 space-y-1 text-left">
                            <li>• Los enlaces de seguridad expiran en 24 horas</li>
                            <li>• Esto protege tu cuenta de accesos no autorizados</li>
                            <li>• Puedes solicitar un nuevo enlace en cualquier momento</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
