'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function VerificacionIdentidadPage() {
    const router = useRouter()
    const [cedulaFrente, setCedulaFrente] = useState<File | null>(null)
    const [cedulaReverso, setCedulaReverso] = useState<File | null>(null)
    const [selfie, setSelfie] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [useCamera, setUseCamera] = useState(false)
    const [cameraStep, setCameraStep] = useState<'frente' | 'reverso' | 'selfie' | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [step, setStep] = useState<0 | 1 | 2>(0)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    // Normaliza orientación EXIF para archivos subidos desde galería/cámara
    const normalizeImageOrientation = async (file: File): Promise<File> => {
        try {
            // createImageBitmap honra la orientación EXIF con imageOrientation: 'from-image'
            // y es ampliamente soportado en navegadores móviles modernos.
            if ('createImageBitmap' in window) {
                // @ts-ignore - imageOrientation es experimental en algunos TS libs
                const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
                const canvas = document.createElement('canvas')
                canvas.width = bitmap.width
                canvas.height = bitmap.height
                const ctx = canvas.getContext('2d')
                if (!ctx) return file
                ctx.drawImage(bitmap, 0, 0)
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
                if (!blob) return file
                return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
            }
        } catch (_) {
            // fallback abajo
        }

        // Fallback: cargar en <img> y dibujar (no aplicará orientación EXIF en todos los navegadores)
        try {
            const imgUrl = URL.createObjectURL(file)
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const i = new Image()
                i.onload = () => resolve(i)
                i.onerror = reject
                i.src = imgUrl
            })
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) return file
            ctx.drawImage(img, 0, 0)
            URL.revokeObjectURL(imgUrl)
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
            if (!blob) return file
            return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
        } catch {
            return file
        }
    }

    const handleFileSelect = async (type: 'frente' | 'reverso' | 'selfie', f: File | null) => {
        if (!f) return
        const normalized = await normalizeImageOrientation(f)
        if (type === 'frente') setCedulaFrente(normalized)
        if (type === 'reverso') setCedulaReverso(normalized)
        if (type === 'selfie') setSelfie(normalized)
    }

    // Función para inicializar la cámara
    const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('user')
    const [mirrorPreview, setMirrorPreview] = useState(true)
    
    // Detectar si es dispositivo móvil
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    const initializeCamera = async (facingMode: 'user' | 'environment' = 'user') => {
        try {
            setCameraError(null)
            
            // Detener stream anterior si existe
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }

            // Solicitar acceso a la cámara con orientación horizontal preferida
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 }
                }
            })

            setStream(newStream)
            setCurrentFacingMode(facingMode)
            // Vista espejo siempre por defecto
            setMirrorPreview(true)
            
            if (videoRef.current) {
                videoRef.current.srcObject = newStream
                videoRef.current.setAttribute('playsinline', 'true')
                videoRef.current.muted = true
                await videoRef.current.play()
            }
            
        } catch (error: any) {
            console.error('❌ Error inicializando cámara:', error)
            setCameraError('No se pudo acceder a la cámara. Verifica los permisos.')
            
            if (error.name === 'NotAllowedError') {
                setCameraError('Permisos de cámara denegados. Por favor, permite el acceso a la cámara.')
            } else if (error.name === 'NotFoundError') {
                setCameraError('No se encontró ninguna cámara en el dispositivo.')
            } else if (error.name === 'NotSupportedError') {
                setCameraError('Tu navegador no soporta el acceso a la cámara.')
            }
        }
    }

    // Función para detener la cámara
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        setCameraError(null)
    }

    // Función para capturar foto
    const capturePhoto = async (type: 'frente' | 'reverso' | 'selfie') => {
        if (!videoRef.current || !stream) return

        setIsCapturing(true)
        
        try {
            const video = videoRef.current
            const canvas = canvasRef.current || document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
                throw new Error('No se pudo obtener contexto del canvas')
            }

            // Configurar dimensiones del canvas según el tipo
            if (type === 'selfie') {
                // Para selfie, usar formato cuadrado
                const side = Math.min(video.videoWidth, video.videoHeight)
                canvas.width = side
                canvas.height = side
                
                // Centrar recorte cuadrado
                const sx = (video.videoWidth - side) / 2
                const sy = (video.videoHeight - side) / 2
                ctx.save()
                if (mirrorPreview) {
                    ctx.translate(canvas.width, 0)
                    ctx.scale(-1, 1)
                }
                ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side)
                ctx.restore()
            } else {
                // Para cédula, forzar orientación horizontal (landscape)
                const isCurrentlyPortrait = video.videoHeight > video.videoWidth
                
                if (isCurrentlyPortrait) {
                    // Si está en vertical, rotar a horizontal
                    canvas.width = video.videoHeight
                    canvas.height = video.videoWidth
                    ctx.save()
                    
                    // Rotar 90 grados para convertir de vertical a horizontal
                    ctx.translate(canvas.width, 0)
                    ctx.rotate(Math.PI / 2)
                    
                    if (mirrorPreview) {
                        ctx.translate(video.videoWidth, 0)
                        ctx.scale(-1, 1)
                    }
                    
                    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
                    ctx.restore()
                } else {
                    // Si ya está en horizontal, mantener como está
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight
                    ctx.save()
                    if (mirrorPreview) {
                        ctx.translate(canvas.width, 0)
                        ctx.scale(-1, 1)
                    }
                    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
                    ctx.restore()
                }
            }

            // Convertir a blob
            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.9)
            })

            if (blob) {
                const fileName = `${type}_${Date.now()}.jpg`
                const file = new File([blob], fileName, { type: 'image/jpeg' })
                
                // Asignar el archivo según el tipo
                switch (type) {
                    case 'frente':
                        setCedulaFrente(file)
                        break
                    case 'reverso':
                        setCedulaReverso(file)
                        break
                    case 'selfie':
                        setSelfie(file)
                        break
                }

                
                // Mostrar vista previa en lugar de cerrar inmediatamente
                setUseCamera(false)
                setCameraStep(null)
                stopCamera()
                
                // Mostrar mensaje de éxito
                setSuccess(`Foto de ${type} capturada exitosamente`)
                setTimeout(() => setSuccess(null), 3000)
            }
        } catch (error) {
            console.error('❌ Error capturando foto:', error)
            setError('Error al capturar la foto. Inténtalo de nuevo.')
        } finally {
            setIsCapturing(false)
        }
    }

    // Función para cambiar entre cámara frontal y trasera
    const switchCamera = async () => {
        if (!stream) return
        
        const currentTrack = stream.getVideoTracks()[0]
        const facing = (currentTrack.getSettings().facingMode as ('user' | 'environment')) || currentFacingMode
        const newFacingMode = facing === 'user' ? 'environment' : 'user'
        
        await initializeCamera(newFacingMode)
        // Mantener vista espejo activa al alternar
        setMirrorPreview(true)
    }

    // Efecto para manejar la cámara
    useEffect(() => {
        if (useCamera && cameraStep) {
            const facingMode = cameraStep === 'selfie' ? 'user' : 'environment'
            initializeCamera(facingMode)
            
            // Forzar orientación horizontal en móviles para cédulas
            if (isMobile && (cameraStep === 'frente' || cameraStep === 'reverso')) {
                // Intentar forzar orientación horizontal
                if (typeof screen !== 'undefined' && screen.orientation && 'lock' in screen.orientation) {
                    (screen.orientation as any).lock('landscape').catch(() => {
                        // Si no se puede bloquear, mostrar mensaje
                        console.log('No se pudo forzar orientación horizontal')
                    })
                }
            }
        } else {
            stopCamera()
        }

        return () => {
            stopCamera()
        }
    }, [useCamera, cameraStep, isMobile])

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        if (!cedulaFrente || !cedulaReverso || !selfie) {
            setError('Debes cargar los tres archivos')
            return
        }
        setIsLoading(true)
        try {
            const supabase = getSupabaseClient()
            if (!supabase) {
                console.log('❌ Supabase no está configurado')
                setError('Error de configuración')
                return
            }
            
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) {
                setError('No hay sesión activa')
                setIsLoading(false)
                return
            }

            // Obtener userId desde la tabla usuario por email
            const email = session.user?.email
            const { data: dbUser } = await supabase
                .from('usuario')
                .select('user_id')
                .eq('email', email)
                .single()
            if (!dbUser) {
                setError('Usuario no encontrado')
                setIsLoading(false)
                return
            }

            const form = new FormData()
            form.append('userId', String(dbUser.user_id))
            form.append('cedula_frente', cedulaFrente)
            form.append('cedula_reverso', cedulaReverso)
            form.append('selfie_validacion', selfie)

            const resp = await fetch('/api/upload/verification', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form
            })
            const json = await resp.json()
            if (!resp.ok) {
                setError(json?.error || 'Error al subir archivos')
            } else {
                // Enviar notificación a administradores
                try {
                    const notificationResp = await fetch('/api/notifications/admin', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            userId: dbUser.user_id,
                            userName: `${session.user?.user_metadata?.name || 'Usuario'}`,
                            userEmail: email,
                            verificationType: 'identity_verification',
                            additionalData: {
                                files_uploaded: 3,
                                upload_timestamp: new Date().toISOString(),
                                verification_step: 'documents_submitted'
                            }
                        })
                    })

                    const notificationJson = await notificationResp.json()
                    
                    if (notificationResp.ok) {
                    } else {
                        console.error('⚠️ Error enviando notificación:', notificationJson)
                    }
                } catch (notificationError) {
                    console.error('⚠️ Error enviando notificación a administradores:', notificationError)
                    // No fallar el proceso principal por un error de notificación
                }

                setSuccess('Archivos enviados exitosamente. Los administradores han sido notificados y revisarán tu verificación pronto.')
                setTimeout(() => router.push('/'), 3000)
            }
        } catch (e: any) {
            setError(e?.message || 'Error del servidor')
        } finally {
            setIsLoading(false)
        }
    }

    const stepsInfo = [
        { key: 'frente', title: 'Cédula - Frente' },
        { key: 'reverso', title: 'Cédula - Reverso' },
        { key: 'selfie', title: 'Selfie de Verificación' }
    ] as const

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow p-6 w-full max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => router.push('/?m=profile')} className="px-3 py-1.5 rounded border text-gray-700 hover:bg-gray-50">← Devolver</button>
                    <h1 className="text-xl font-bold">Verificación de Identidad</h1>
                    <div className="w-24"></div>
                </div>
                <p className="text-gray-600 mb-4">Sigue los pasos. Solo verás el campo del paso actual.</p>

                <div className="flex items-center gap-2 mb-6">
                    {stepsInfo.map((s, idx) => (
                        <div key={s.key} className={`px-3 py-1 rounded-full text-sm ${idx === step ? 'bg-blue-600 text-white' : idx < step ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {idx + 1}. {s.title}
                        </div>
                    ))}
                </div>

                {error && <div className="mb-3 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}
                {success && <div className="mb-3 p-2 rounded border border-green-200 bg-green-50 text-green-700 text-sm">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Frente */}
                    <div className={`${step === 0 ? 'block' : 'hidden'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Cédula - Frente</label>
                            <button 
                                type="button" 
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                onClick={() => {
                                    setCameraStep('frente')
                                    setUseCamera(true)
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Usar cámara
                            </button>
                        </div>

                        {useCamera && cameraStep === 'frente' ? (
                            <div className="space-y-4">
                                {isMobile && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm text-center">
                                        📱 Para mejor captura, rota tu dispositivo horizontalmente
                                    </div>
                                )}
                                <div className={`rounded-xl overflow-hidden border relative mx-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'}`} style={{ 
                                    height: isMobile ? '70vh' : 'auto',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <video 
                                        ref={videoRef} 
                                        className="w-full h-auto" 
                                        style={{ 
                                            transform: isMobile 
                                                ? `rotate(90deg) ${mirrorPreview ? 'scaleX(-1)' : 'scaleX(1)'}` 
                                                : mirrorPreview ? 'scaleX(-1)' : 'none',
                                            // Forzar orientación horizontal en móviles
                                            objectFit: 'cover',
                                            maxHeight: isMobile ? '70vh' : '60vh',
                                            width: isMobile ? 'auto' : '100%',
                                            height: isMobile ? '100%' : 'auto'
                                        }} 
                                    />
                                    {/* Overlay con guías para cédula en orientación horizontal */}
                                    <div className="pointer-events-none absolute inset-0">
                                        <div className="absolute inset-4 border-2 border-blue-400/60 rounded-md aspect-[1.586]"></div>
                                        <div className="absolute left-4 top-4 h-10 w-10 rounded-full border-2 border-blue-300/60"></div>
                                        <div className="absolute right-6 top-4 h-3 w-20 bg-blue-300/20 rounded"></div>
                                        <div className="absolute right-6 top-8 h-3 w-28 bg-blue-300/20 rounded"></div>
                                        <div className="absolute bottom-4 left-4 right-4 text-center">
                                            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                {isMobile ? 'La cámara se muestra en horizontal - Centra la cédula en el marco azul' : 'Centra la cédula en el marco azul - Captura en horizontal'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {cameraError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {cameraError}
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setUseCamera(false)
                                            setCameraStep(null)
                                            stopCamera()
                                        }} 
                                        className="px-4 py-2 border rounded hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input type="checkbox" checked={mirrorPreview} onChange={(e) => setMirrorPreview(e.target.checked)} />
                                            Vista espejo
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={switchCamera}
                                            className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                        
                                        <button
                                            type="button"
                                            disabled={isCapturing || !stream}
                                            onClick={() => capturePhoto('frente')}
                                            className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isCapturing ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Capturando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Capturar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="relative w-full aspect-[1.586] bg-gray-50 rounded-lg overflow-hidden border">
                                    {/* Marco con proporción de tarjeta (CR80 ~ 1.586:1) */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-4 border-2 border-blue-400/60 rounded-md"></div>
                                        <div className="absolute left-4 top-4 h-10 w-10 rounded-full border-2 border-blue-300/60"></div>
                                        <div className="absolute right-6 top-4 h-3 w-20 bg-blue-300/20 rounded"></div>
                                        <div className="absolute right-6 top-8 h-3 w-28 bg-blue-300/20 rounded"></div>
                                    </div>
                                    {cedulaFrente ? (
                                        <img src={URL.createObjectURL(cedulaFrente)} alt="frente" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">Vista previa</div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Sube una foto nítida de la cara frontal en orientación horizontal. Evita reflejos, recorta a la tarjeta y centra los datos.</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <label htmlFor="file-frente" className="px-3 py-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 text-sm">Elegir archivo</label>
                                        <button 
                                            type="button" 
                                            className="px-3 py-2 bg-blue-100 border border-blue-300 rounded cursor-pointer hover:bg-blue-200 text-blue-700 text-sm flex items-center gap-1"
                                            onClick={() => {
                                                setCameraStep('frente')
                                                setUseCamera(true)
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Capturar otra vez
                                        </button>
                                        <span className="text-sm text-gray-500 truncate max-w-[240px]">
                                            {cedulaFrente?.name || 'No se ha seleccionado ningún archivo'}
                                        </span>
                                        <input id="file-frente" className="hidden" type="file" accept="image/*" onChange={(e) => handleFileSelect('frente', e.target.files?.[0] || null)} />
                                    </div>
                                    <div className="pt-2 flex justify-end">
                                        <button type="button" disabled={!cedulaFrente} onClick={() => setStep(1)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Siguiente</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Reverso */}
                    <div className={`${step === 1 ? 'block' : 'hidden'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Cédula - Reverso</label>
                            <button 
                                type="button" 
                                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                                onClick={() => {
                                    setCameraStep('reverso')
                                    setUseCamera(true)
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Usar cámara
                            </button>
                        </div>

                        {useCamera && cameraStep === 'reverso' ? (
                            <div className="space-y-4">
                                {isMobile && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                                        📱 Para mejor captura, rota tu dispositivo horizontalmente
                                    </div>
                                )}
                                <div className={`rounded-xl overflow-hidden border relative mx-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'}`} style={{ 
                                    height: isMobile ? '70vh' : 'auto',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <video 
                                        ref={videoRef} 
                                        className="w-full h-auto" 
                                        style={{ 
                                            transform: isMobile 
                                                ? `rotate(90deg) ${mirrorPreview ? 'scaleX(-1)' : 'scaleX(1)'}` 
                                                : mirrorPreview ? 'scaleX(-1)' : 'none',
                                            // Forzar orientación horizontal en móviles
                                            objectFit: 'cover',
                                            maxHeight: isMobile ? '70vh' : '60vh',
                                            width: isMobile ? 'auto' : '100%',
                                            height: isMobile ? '100%' : 'auto'
                                        }} 
                                    />
                                    {/* Overlay con guías para cédula en orientación horizontal */}
                                    <div className="pointer-events-none absolute inset-0">
                                        <div className="absolute inset-4 border-2 border-green-400/60 rounded-md aspect-[1.586]"></div>
                                        <div className="absolute left-4 top-4 h-3 w-24 bg-green-300/20 rounded"></div>
                                        <div className="absolute left-4 top-8 h-3 w-32 bg-green-300/20 rounded"></div>
                                        <div className="absolute bottom-4 left-4 right-4 text-center">
                                            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                                {isMobile ? 'La cámara se muestra en horizontal - Centra el reverso en el marco verde' : 'Centra el reverso de la cédula en el marco verde - Captura en horizontal'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {cameraError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {cameraError}
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setUseCamera(false)
                                            setCameraStep(null)
                                            stopCamera()
                                        }} 
                                        className="px-4 py-2 border rounded hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 text-sm text-gray-700">
                                            <input type="checkbox" checked={mirrorPreview} onChange={(e) => setMirrorPreview(e.target.checked)} />
                                            Vista espejo
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={switchCamera}
                                            className="px-3 py-2 bg-gray-100 border rounded hover:bg-gray-200 text-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                        
                                        <button
                                            type="button"
                                            disabled={isCapturing || !stream}
                                            onClick={() => capturePhoto('reverso')}
                                            className="px-6 py-2 bg-green-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isCapturing ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Capturando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Capturar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="relative w-full aspect-[1.586] bg-gray-50 rounded-lg overflow-hidden border">
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-4 border-2 border-green-400/60 rounded-md"></div>
                                        <div className="absolute left-4 top-4 h-3 w-24 bg-green-300/20 rounded"></div>
                                        <div className="absolute left-4 top-8 h-3 w-32 bg-green-300/20 rounded"></div>
                                    </div>
                                    {cedulaReverso ? (
                                        <img src={URL.createObjectURL(cedulaReverso)} alt="reverso" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">Vista previa</div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Sube la cara posterior en orientación horizontal. Asegúrate que los textos sean legibles.</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <label htmlFor="file-reverso" className="px-3 py-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 text-sm">Elegir archivo</label>
                                        <button 
                                            type="button" 
                                            className="px-3 py-2 bg-green-100 border border-green-300 rounded cursor-pointer hover:bg-green-200 text-green-700 text-sm flex items-center gap-1"
                                            onClick={() => {
                                                setCameraStep('reverso')
                                                setUseCamera(true)
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Capturar otra vez
                                        </button>
                                        <span className="text-sm text-gray-500 truncate max-w-[240px]">
                                            {cedulaReverso?.name || 'No se ha seleccionado ningún archivo'}
                                        </span>
                                        <input id="file-reverso" className="hidden" type="file" accept="image/*" onChange={(e) => handleFileSelect('reverso', e.target.files?.[0] || null)} />
                                    </div>
                                    <div className="pt-2 flex justify-between">
                                        <button type="button" onClick={() => setStep(0)} className="px-4 py-2 border rounded">← Anterior</button>
                                        <button type="button" disabled={!cedulaReverso} onClick={() => setStep(2)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Siguiente</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Selfie */}
                    <div className={`${step === 2 ? 'block' : 'hidden'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Selfie de Verificación</label>
                            <button 
                                type="button" 
                                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                onClick={() => {
                                    setCameraStep('selfie')
                                    setUseCamera(true)
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Usar cámara
                            </button>
                        </div>

                        {useCamera && cameraStep === 'selfie' ? (
                            <div className="space-y-4">
                                <div className="rounded-xl overflow-hidden border relative max-w-md mx-auto">
                                    <video ref={videoRef} className="w-full h-auto" style={{ transform: mirrorPreview ? 'scaleX(-1)' : 'none' }} />
                                    {/* Overlay ovalado para selfie */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="h-3/4 w-3/4 rounded-full border-4 border-purple-400/70"></div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-center">
                                        <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                            Centra tu rostro en el marco circular
                                        </div>
                                    </div>
                                </div>
                                
                                {cameraError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        {cameraError}
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setUseCamera(false)
                                            setCameraStep(null)
                                            stopCamera()
                                        }} 
                                        className="px-4 py-2 border rounded hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={mirrorPreview} onChange={(e) => setMirrorPreview(e.target.checked)} />
                                        Vista espejo
                                    </label>
                                    <button
                                        type="button"
                                        disabled={isCapturing || !stream}
                                        onClick={() => capturePhoto('selfie')}
                                        className="px-6 py-2 bg-purple-600 text-white rounded disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isCapturing ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Capturando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Capturar Selfie
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <div className="relative w-full aspect-square bg-gray-50 rounded-full overflow-hidden border">
                                    {/* Marco ovalado para rostro */}
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="h-3/4 w-3/4 rounded-full border-2 border-purple-400/70"></div>
                                    </div>
                                    {selfie ? (
                                        <img src={URL.createObjectURL(selfie)} alt="selfie" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">Vista previa</div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Toma una selfie con buena luz, sin gorros o gafas. Centra tu rostro en el marco.</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <label htmlFor="file-selfie" className="px-3 py-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 text-sm">Elegir archivo</label>
                                        <button 
                                            type="button" 
                                            className="px-3 py-2 bg-purple-100 border border-purple-300 rounded cursor-pointer hover:bg-purple-200 text-purple-700 text-sm flex items-center gap-1"
                                            onClick={() => {
                                                setCameraStep('selfie')
                                                setUseCamera(true)
                                            }}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Capturar otra vez
                                        </button>
                                        <span className="text-sm text-gray-500 truncate max-w-[240px]">
                                            {selfie?.name || 'No se ha seleccionado ningún archivo'}
                                        </span>
                                        <input id="file-selfie" className="hidden" type="file" accept="image/*" onChange={(e) => handleFileSelect('selfie', e.target.files?.[0] || null)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={isLoading || step !== 2} className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {isLoading ? 'Enviando...' : 'Enviar verificación'}
                    </button>
                </form>
                
                {/* Canvas oculto para procesamiento de imágenes */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    )
}


