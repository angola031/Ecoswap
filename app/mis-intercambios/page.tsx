'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import IntercambiosModule from '@/components/intercambios/IntercambiosModule'

export default function MisIntercambiosPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [mostrarIntercambios, setMostrarIntercambios] = useState(false)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!user) {
        router.push('/auth')
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Mis Intercambios
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Gestiona tus propuestas de intercambio y las que has recibido
                    </p>

                    <button
                        onClick={() => setMostrarIntercambios(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ver Mis Intercambios
                    </button>
                </div>

                {/* Información adicional */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span className="text-yellow-600 text-sm font-medium">⏳</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Pendientes</h3>
                                <p className="text-sm text-gray-500">Intercambios esperando respuesta</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 text-sm font-medium">✅</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Aceptados</h3>
                                <p className="text-sm text-gray-500">Intercambios confirmados</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-sm font-medium">🎉</span>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Completados</h3>
                                <p className="text-sm text-gray-500">Intercambios finalizados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guía de uso */}
                <div className="mt-12 bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">¿Cómo funcionan los intercambios?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">1. Proponer intercambio</h3>
                            <p className="text-gray-600 text-sm">
                                Cuando encuentres un producto que te interese, puedes proponer un intercambio con uno de tus productos.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">2. Responder propuestas</h3>
                            <p className="text-gray-600 text-sm">
                                Si recibes una propuesta, puedes aceptarla, rechazarla o negociar las condiciones.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">3. Coordinar encuentro</h3>
                            <p className="text-gray-600 text-sm">
                                Una vez aceptado, coordinen el lugar y fecha para realizar el intercambio.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">4. Completar intercambio</h3>
                            <p className="text-gray-600 text-sm">
                                Después del encuentro, marquen el intercambio como completado para finalizar el proceso.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {mostrarIntercambios && (
                <IntercambiosModule onClose={() => setMostrarIntercambios(false)} />
            )}
        </div>
    )
}

