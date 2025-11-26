'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'

interface DocumentType {
    key: string
    label: string
    required: boolean
    description: string
}

const DOCUMENT_TYPES: DocumentType[] = [
    {
        key: 'acta_constitucion',
        label: 'Acta de Constitución',
        required: true,
        description: 'Documento privado o escritura pública con lista de asociados'
    },
    {
        key: 'estatutos',
        label: 'Estatutos',
        required: true,
        description: 'Estatutos aprobados de la fundación'
    },
    {
        key: 'pre_rut',
        label: 'PRE-RUT',
        required: true,
        description: 'Expedido por la DIAN'
    },
    {
        key: 'cartas_aceptacion',
        label: 'Cartas de Aceptación',
        required: false,
        description: 'De cargos en Junta Directiva y Revisor Fiscal'
    },
    {
        key: 'formulario_rues',
        label: 'Formulario RUES',
        required: false,
        description: 'Registro Único Empresarial y Social'
    }
]

interface DocumentUploaderProps {
    currentUser: any
    documentos?: {
        acta_constitucion?: string
        estatutos?: string
        pre_rut?: string
        cartas_aceptacion?: string
        formulario_rues?: string
    }
    onUpdate: (documentos: any) => void
}

export default function DocumentUploader({ currentUser, documentos = {}, onUpdate }: DocumentUploaderProps) {
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
    const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({})
    const [inputKeys, setInputKeys] = useState<{ [key: string]: number }>({})

    const handleFileSelect = (docType: string, file: File | null) => {
        if (file) {
            setSelectedFiles(prev => ({ ...prev, [docType]: file }))
        } else {
            const newFiles = { ...selectedFiles }
            delete newFiles[docType]
            setSelectedFiles(newFiles)
        }
    }

    const handleUpload = async (docType: string) => {
        const file = selectedFiles[docType]
        if (!file || !currentUser) {
            console.log('❌ No hay archivo o usuario:', { file: !!file, currentUser: !!currentUser })
            return
        }

        console.log(`📤 Iniciando subida de ${docType}...`)

        // Validar tipo
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Tipo de archivo no válido',
                text: 'Solo se permiten archivos PDF, JPG, JPEG y PNG'
            })
            return
        }

        // Validar tamaño
        if (file.size > 5 * 1024 * 1024) {
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Archivo muy grande',
                text: `El archivo no debe superar los 5MB (Actual: ${(file.size / 1024 / 1024).toFixed(2)} MB)`
            })
            return
        }

        setUploadingDoc(docType)

        try {
            const supabase = getSupabaseClient()
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) throw new Error('No hay sesión activa')

            // Subir archivo con nombre predeterminado
            const fileExt = file.name.split('.').pop()
            
            // Obtener user_id (integer) de la base de datos usando el email
            const { data: userData } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', currentUser.email)
                .single()
            
            if (!userData?.user_id) {
                throw new Error('No se pudo obtener el ID de usuario')
            }
            
            const userId = userData.user_id
            const fileName = `${userId}_${docType}.${fileExt}`
            const filePath = `fundaciones/${userId}/${fileName}`

            // Subir al bucket Ecoswap (reemplazar si ya existe)
            const { error: uploadError } = await supabase.storage
                .from('Ecoswap')
                .upload(filePath, file, {
                    upsert: true // Reemplazar si ya existe
                })

            if (uploadError) throw uploadError

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('Ecoswap')
                .getPublicUrl(filePath)

            // Actualizar DB
            const { data: currentData } = await supabase
                .from('usuario')
                .select('documentos_fundacion')
                .eq('user_id', userId)
                .single()

            const currentDocs = currentData?.documentos_fundacion || {}
            const updatedDocs = {
                ...currentDocs,
                [docType]: publicUrl
            }

            const { error: updateError } = await supabase
                .from('usuario')
                .update({ documentos_fundacion: updatedDocs })
                .eq('user_id', userId)

            if (updateError) throw updateError

            // Actualizar UI
            onUpdate(updatedDocs)

            // Notificar a los administradores
            try {
                const notifyResponse = await fetch('/api/foundation/notify-document', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })
                
                if (notifyResponse.ok) {
                    console.log('✅ Administradores notificados sobre documento subido')
                }
            } catch (notifyError) {
                console.error('Error notificando a administradores:', notifyError)
                // No fallar si las notificaciones fallan
            }

            // Limpiar selección y resetear input
            handleFileSelect(docType, null)
            setInputKeys(prev => ({ ...prev, [docType]: Date.now() }))

            await (window as any).Swal.fire({
                icon: 'success',
                title: '✅ Documento subido',
                text: `${DOCUMENT_TYPES.find(d => d.key === docType)?.label} subido exitosamente`,
                timer: 2000,
                showConfirmButton: false
            })

            console.log(`✅ Subida de ${docType} completada exitosamente`)

        } catch (error: any) {
            console.error('Error subiendo documento:', error)
            // Resetear input también en caso de error
            setInputKeys(prev => ({ ...prev, [docType]: Date.now() }))
            await (window as any).Swal.fire({
                icon: 'error',
                title: 'Error al subir',
                text: error.message || 'No se pudo subir el documento'
            })
        } finally {
            setUploadingDoc(null)
            console.log(`🔄 Estado de subida limpiado para ${docType}`)
        }
    }

    const renderDocumentCard = (docType: DocumentType) => {
        const docUrl = documentos[docType.key as keyof typeof documentos]
        const isUploaded = !!docUrl
        const selectedFile = selectedFiles[docType.key]
        const isUploading = uploadingDoc === docType.key

        return (
            <div key={docType.key} className="card">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {docType.label}
                            </h4>
                            {docType.required ? (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium">
                                    Requerido
                                </span>
                            ) : (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                                    Opcional
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {docType.description}
                        </p>
                    </div>
                    {isUploaded && (
                        <div className="flex-shrink-0 ml-3">
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                Subido
                            </span>
                        </div>
                    )}
                </div>

                {isUploaded ? (
                    <div className="space-y-2">
                        {/* Preview miniatura responsiva */}
                        <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden bg-gray-50 dark:bg-gray-900 max-h-[60vh]">
                            {docUrl.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={docUrl}
                                    className="w-full h-48 sm:h-56 md:h-64 lg:h-72 border-0"
                                    title={docType.label}
                                />
                            ) : (
                                <img
                                    src={docUrl}
                                    alt={docType.label}
                                    className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-contain bg-gray-50 dark:bg-gray-800"
                                />
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs sm:text-sm font-medium transition-colors"
                            >
                                Ver documento
                            </a>
                            <button
                                onClick={() => handleFileSelect(docType.key, null)}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm font-medium transition-colors"
                            >
                                Reemplazar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <input
                            key={inputKeys[docType.key] || 0}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                handleFileSelect(docType.key, file || null)
                            }}
                            className="block w-full text-xs text-gray-500 dark:text-gray-400
                                file:mr-3 file:py-1.5 file:px-3
                                file:rounded file:border-0
                                file:text-xs file:font-medium
                                file:bg-primary-50 file:text-primary-700
                                hover:file:bg-primary-100
                                dark:file:bg-primary-900/30 dark:file:text-primary-400"
                        />
                        {selectedFile && (
                            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleUpload(docType.key)}
                                    disabled={isUploading}
                                    className="ml-3 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors flex items-center"
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Subiendo...
                                        </>
                                    ) : (
                                        '📤 Subir'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                    📋 Documentos para Verificación ESAL
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                    Sube cada documento por separado. Los marcados como <span className="font-semibold">"Requerido"</span> son obligatorios para la verificación.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOCUMENT_TYPES.map(docType => renderDocumentCard(docType))}
            </div>
        </div>
    )
}

