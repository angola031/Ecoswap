'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getVerificationDocumentUrls } from '@/lib/storage'

interface VerificationRequest {
    validacion_id: number
    user_id: number
    nombre: string
    apellido: string
    email: string
    telefono?: string
    cedula_frente_url?: string
    cedula_reverso_url?: string
    selfie_validacion_url?: string
    fecha_subida: string
    estado_verificacion: string
    observaciones?: string
}

interface IdentityVerificationSectionProps {
    currentUserId: number
}

export default function IdentityVerificationSection({ currentUserId }: IdentityVerificationSectionProps) {
    const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [processingRequest, setProcessingRequest] = useState(false)
    const [observations, setObservations] = useState('')
    const [showImageModal, setShowImageModal] = useState(false)
    const [selectedImage, setSelectedImage] = useState<{url: string, title: string} | null>(null)

    useEffect(() => {
        fetchVerificationRequests()
    }, [])

    const fetchVerificationRequests = async () => {
        try {
            setLoading(true)
            setError(null)

            // Buscar usuarios que tienen validación pendiente con sus documentos
            const { data, error } = await supabase
                .from('validacion_usuario')
                .select(`
                    validacion_id,
                    usuario_id,
                    tipo_validacion,
                    estado,
                    fecha_solicitud,
                    notas_admin,
                    motivo_rechazo,
                    usuario:usuario_id (
                        user_id,
                        nombre,
                        apellido,
                        email,
                        telefono,
                        verificado,
                        cedula_frente_url,
                        cedula_reverso_url,
                        selfie_validacion_url
                    )
                `)
                .eq('tipo_validacion', 'identidad')
                .in('estado', ['pendiente', 'en_revision'])
                .order('fecha_solicitud', { ascending: false })

            if (error) {
                console.error('❌ Error obteniendo solicitudes de verificación:', error)
                setError('Error cargando solicitudes de verificación')
                return
            }

            // Generar URLs públicas para los documentos
            const formattedRequests = data?.map(user => {
                const documentUrls = getVerificationDocumentUrls(user.user_id)
                
                return {
                    user_id: user.user_id,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    email: user.email,
                    telefono: user.telefono,
                    cedula_frente_url: documentUrls.cedulaFrente,
                    cedula_reverso_url: documentUrls.cedulaReverso,
                    selfie_validacion_url: documentUrls.selfieValidacion,
                    fecha_subida: user.fecha_subida_verificacion,
                    estado_verificacion: user.estado_verificacion || 'pendiente',
                    observaciones: user.observaciones_verificacion
                }
            }) || []

            setVerificationRequests(formattedRequests)

        } catch (err) {
            console.error('❌ Error en fetchVerificationRequests:', err)
            setError('Error cargando solicitudes de verificación')
        } finally {
            setLoading(false)
        }
    }

    const openImageModal = (url: string, title: string) => {
        setSelectedImage({ url, title })
        setShowImageModal(true)
    }

    const closeImageModal = () => {
        setSelectedImage(null)
        setShowImageModal(false)
    }

    const handleVerificationDecision = async (verificationId: number, userId: number, decision: 'aprobado' | 'rechazado') => {
        try {
            setProcessingRequest(true)

            // Actualizar la validación en la tabla VALIDACION_USUARIO
            const { error } = await supabase
                .from('validacion_usuario')
                .update({
                    estado: decision === 'aprobado' ? 'aprobada' : 'rechazada',
                    notas_admin: observations || null,
                    motivo_rechazo: decision === 'rechazado' ? observations : null,
                    fecha_aprobacion: decision === 'aprobado' ? new Date().toISOString() : null,
                    fecha_revision: new Date().toISOString(),
                    admin_validador_id: currentUserId
                })
                .eq('validacion_id', verificationId)

            // Si se aprueba, actualizar el campo verificado en la tabla usuario
            if (decision === 'aprobado') {
                await supabase
                    .from('usuario')
                    .update({
                        verificado: true
                    })
                    .eq('user_id', userId)
            }

            if (error) {
                console.error('❌ Error actualizando verificación:', error)
                alert('Error procesando la verificación')
                return
            }

            // Crear notificación para el usuario
            try {
                await supabase
                    .from('notificacion')
                    .insert({
                        user_id: userId,
                        titulo: decision === 'aprobado' ? 'Verificación de Identidad Aprobada' : 'Verificación de Identidad Rechazada',
                        mensaje: decision === 'aprobado' 
                            ? 'Tu verificación de identidad ha sido aprobada. Ya puedes usar todas las funciones de la plataforma.'
                            : `Tu verificación de identidad ha sido rechazada.${observations ? ` Motivo: ${observations}` : ''} Por favor, revisa y vuelve a subir los documentos.`,
                        tipo: decision === 'aprobado' ? 'success' : 'error',
                        es_admin: false,
                        url_accion: decision === 'aprobado' ? '/?m=profile' : '/verificacion-identidad',
                        fecha_creacion: new Date().toISOString(),
                        leida: false
                    })
            } catch (notificationError) {
                console.error('⚠️ Error enviando notificación al usuario:', notificationError)
            }

            // Actualizar lista local
            setVerificationRequests(prev => 
                prev.map(req => 
                    req.user_id === userId 
                        ? { 
                            ...req, 
                            estado_verificacion: decision,
                            observaciones: observations || undefined
                          }
                        : req
                )
            )

            setShowModal(false)
            setSelectedRequest(null)
            setObservations('')
            
            alert(`Verificación ${decision === 'aprobado' ? 'aprobada' : 'rechazada'} exitosamente`)

        } catch (err) {
            console.error('❌ Error procesando verificación:', err)
            alert('Error procesando la verificación')
        } finally {
            setProcessingRequest(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aprobado':
                return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Aprobado</span>
            case 'rechazado':
                return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rechazado</span>
            case 'pendiente':
            default:
                return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pendiente</span>
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Verificación de Identidad</h2>
                    <button
                        onClick={fetchVerificationRequests}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Actualizar
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {verificationRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>No hay solicitudes de verificación pendientes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha de Subida
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Documentos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {verificationRequests.map((request) => (
                                    <tr key={request.user_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {request.nombre} {request.apellido}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {request.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(request.fecha_subida)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(request.estado_verificacion)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-1">
                                                {request.cedula_frente_url && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Frente</span>
                                                )}
                                                {request.cedula_reverso_url && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Reverso</span>
                                                )}
                                                {request.selfie_validacion_url && (
                                                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Selfie</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedRequest(request)
                                                    setObservations(request.observaciones || '')
                                                    setShowModal(true)
                                                }}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Revisar
                                            </button>
                                            {request.estado_verificacion === 'pendiente' && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerificationDecision(request.user_id, 'aprobado')}
                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                    >
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerificationDecision(request.user_id, 'rechazado')}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Revisión */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Revisar Documentos - {selectedRequest.nombre} {selectedRequest.apellido}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {selectedRequest.cedula_frente_url && (
                                    <div className="text-center">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cédula - Frente</h4>
                                        <div 
                                            className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => openImageModal(selectedRequest.cedula_frente_url!, 'Cédula - Frente')}
                                        >
                                            {selectedRequest.cedula_frente_url ? (
                                                <img
                                                    src={selectedRequest.cedula_frente_url}
                                                    alt="Cédula frente"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-center">
                                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-xs">No disponible</p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Haz clic para ampliar</p>
                                    </div>
                                )}
                                {selectedRequest.cedula_reverso_url && (
                                    <div className="text-center">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cédula - Reverso</h4>
                                        <div 
                                            className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => openImageModal(selectedRequest.cedula_reverso_url!, 'Cédula - Reverso')}
                                        >
                                            {selectedRequest.cedula_reverso_url ? (
                                                <img
                                                    src={selectedRequest.cedula_reverso_url}
                                                    alt="Cédula reverso"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-center">
                                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-xs">No disponible</p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Haz clic para ampliar</p>
                                    </div>
                                )}
                                {selectedRequest.selfie_validacion_url && (
                                    <div className="text-center">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Selfie</h4>
                                        <div 
                                            className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => openImageModal(selectedRequest.selfie_validacion_url!, 'Selfie de Verificación')}
                                        >
                                            {selectedRequest.selfie_validacion_url ? (
                                                <img
                                                    src={selectedRequest.selfie_validacion_url}
                                                    alt="Selfie"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-center">
                                                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-xs">No disponible</p>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Haz clic para ampliar</p>
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Observaciones
                                </label>
                                <textarea
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                    rows={3}
                                    placeholder="Agregar observaciones sobre la verificación..."
                                />
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                {selectedRequest.estado_verificacion === 'pendiente' && (
                                    <>
                                        <button
                                            onClick={() => handleVerificationDecision(selectedRequest.user_id, 'rechazado')}
                                            disabled={processingRequest}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {processingRequest ? 'Procesando...' : 'Rechazar'}
                                        </button>
                                        <button
                                            onClick={() => handleVerificationDecision(selectedRequest.user_id, 'aprobado')}
                                            disabled={processingRequest}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {processingRequest ? 'Procesando...' : 'Aprobar'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para visualizar imágenes en tamaño grande */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-medium text-gray-900">
                                {selectedImage.title}
                            </h3>
                            <button
                                onClick={closeImageModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-center">
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.title}
                                    className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                                        if (errorDiv) errorDiv.classList.remove('hidden')
                                    }}
                                />
                                <div className="hidden text-center text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-lg font-medium">Error al cargar la imagen</p>
                                    <p className="text-sm">La imagen no se pudo cargar correctamente</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
                            <button
                                onClick={closeImageModal}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
