'use client'

import { useState, useEffect } from 'react'
import { getVerificationDocumentUrls } from '@/lib/storage'
import { getSupabaseClient } from '@/lib/supabase-client'

interface VerificationSummaryProps {
    onViewDetails: () => void
}

interface PendingVerification {
    user_id: number
    nombre: string
    apellido: string
    email: string
    fecha_subida_verificacion: string
}

export default function VerificationSummary({ onViewDetails }: VerificationSummaryProps) {
    const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
    const [loading, setLoading] = useState(true)
    const [totalPending, setTotalPending] = useState(0)

    useEffect(() => {
        fetchPendingVerifications()
    }, [])

    const fetchPendingVerifications = async () => {
        try {
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.error('❌ Supabase no está configurado')
                return
            }
            
            setLoading(true)

            // Obtener verificaciones pendientes desde tabla VALIDACION_USUARIO
            const { data, error } = await supabase
                .from('validacion_usuario')
                .select(`
                    validacion_id,
                    usuario_id,
                    tipo_validacion,
                    estado,
                    fecha_solicitud,
                    usuario:usuario_id (
                        user_id,
                        nombre,
                        apellido,
                        email
                    )
                `)
                .in('estado', ['pendiente', 'en_revision'])
                .order('fecha_solicitud', { ascending: false })
                .limit(5) // Mostrar solo las 5 más recientes

            if (error) {
                console.error('❌ Error obteniendo verificaciones pendientes:', error)
                return
            }

            // Transformar los datos para que coincidan con la interfaz
            const transformedData = data?.map(item => {
                const usuarioData = Array.isArray(item.usuario) ? item.usuario[0] : item.usuario
                return {
                    user_id: usuarioData?.user_id || item.usuario_id,
                    nombre: usuarioData?.nombre || '',
                    apellido: usuarioData?.apellido || '',
                    email: usuarioData?.email || '',
                fecha_subida_verificacion: item.fecha_solicitud
                }
            }) || []

            setPendingVerifications(transformedData)
            setTotalPending(transformedData.length)

        } catch (err) {
            console.error('❌ Error en fetchPendingVerifications:', err)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return 'Hace menos de 1 hora'
        if (diffInHours < 24) return `Hace ${diffInHours} horas`
        return date.toLocaleDateString('es-CO', { 
            day: 'numeric', 
            month: 'short'
        })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                    Verificaciones Pendientes
                </h3>
                <button
                    onClick={onViewDetails}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Ver todas →
                </button>
            </div>

            {totalPending === 0 ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-gray-500">¡Excelente! No hay verificaciones pendientes</p>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-yellow-600">{totalPending}</span>
                            <span className="text-sm text-gray-600">solicitudes esperando revisión</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {pendingVerifications.map((verification) => (
                            <div
                                key={verification.user_id}
                                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <span className="text-yellow-600 text-sm font-medium">
                                            {verification.nombre.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {verification.nombre} {verification.apellido}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {verification.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">
                                        {formatDate(verification.fecha_subida_verificacion)}
                                    </p>
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Pendiente
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPending > 5 && (
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">
                                Y {totalPending - 5} solicitudes más...
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
