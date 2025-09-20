'use client'

import { useRouter } from 'next/navigation'

export default function AuthCodeErrorPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <div className="mx-auto h-12 w-12 text-red-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Error de Autenticación
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Hubo un problema al procesar tu enlace de autenticación.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        El enlace puede haber expirado o ser inválido.
                    </p>
                </div>

                <div className="space-y-4">
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
            </div>
        </div>
    )
}
