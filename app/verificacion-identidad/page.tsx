'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function VerificacionIdentidadPage() {
    const router = useRouter()
    const [cedulaFrente, setCedulaFrente] = useState<File | null>(null)
    const [cedulaReverso, setCedulaReverso] = useState<File | null>(null)
    const [selfie, setSelfie] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [useCamera, setUseCamera] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [step, setStep] = useState<0 | 1 | 2>(0)

    useEffect(() => {
        let stream: MediaStream | null = null
        const start = async () => {
            if (!useCamera) return
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                }
            } catch (e) { /* ignore */ }
        }
        start()
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop())
        }
    }, [useCamera])

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
                setSuccess('Archivos enviados. Verificaremos tu identidad pronto.')
                setTimeout(() => router.push('/'), 1500)
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
                        <label className="block text-sm font-medium mb-2">Cédula - Frente</label>
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
                                <p className="text-sm text-gray-600">Sube una foto nítida de la cara frontal. Evita reflejos, recorta a la tarjeta y centra los datos.</p>
                                <div className="flex items-center gap-3">
                                    <label htmlFor="file-frente" className="px-3 py-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 text-sm">Elegir archivo</label>
                                    <span className="text-sm text-gray-500 truncate max-w-[240px]">
                                        {cedulaFrente?.name || 'No se ha seleccionado ningún archivo'}
                                    </span>
                                    <input id="file-frente" className="hidden" type="file" accept="image/*" onChange={(e) => setCedulaFrente(e.target.files?.[0] || null)} />
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <button type="button" disabled={!cedulaFrente} onClick={() => setStep(1)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Siguiente</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reverso */}
                    <div className={`${step === 1 ? 'block' : 'hidden'}`}>
                        <label className="block text-sm font-medium mb-2">Cédula - Reverso</label>
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
                                <p className="text-sm text-gray-600">Sube la cara posterior. Asegúrate que los textos sean legibles.</p>
                                <div className="flex items-center gap-3">
                                    <label htmlFor="file-reverso" className="px-3 py-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 text-sm">Elegir archivo</label>
                                    <span className="text-sm text-gray-500 truncate max-w-[240px]">
                                        {cedulaReverso?.name || 'No se ha seleccionado ningún archivo'}
                                    </span>
                                    <input id="file-reverso" className="hidden" type="file" accept="image/*" onChange={(e) => setCedulaReverso(e.target.files?.[0] || null)} />
                                </div>
                                <div className="pt-2 flex justify-between">
                                    <button type="button" onClick={() => setStep(0)} className="px-4 py-2 border rounded">← Anterior</button>
                                    <button type="button" disabled={!cedulaReverso} onClick={() => setStep(2)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Siguiente</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selfie */}
                    <div className={`${step === 2 ? 'block' : 'hidden'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium">Selfie de Verificación</label>
                            <button type="button" className="text-sm text-blue-600" onClick={() => setUseCamera(!useCamera)}>
                                {useCamera ? 'Usar archivo' : 'Usar cámara'}
                            </button>
                        </div>

                        {!useCamera && (
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
                                    <div className="flex items-center gap-3">
                                        <label htmlFor="file-selfie" className="px-3 py-2 bg-gray-100 border rounded cursor-pointer hover:bg-gray-200 text-sm">Elegir archivo</label>
                                        <span className="text-sm text-gray-500 truncate max-w-[240px]">
                                            {selfie?.name || 'No se ha seleccionado ningún archivo'}
                                        </span>
                                        <input id="file-selfie" className="hidden" type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {useCamera && (
                            <div className="rounded-xl overflow-hidden border relative max-w-md mx-auto">
                                <video ref={videoRef} className="w-full h-auto" />
                                {/* Overlay ovalado */}
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="h-3/4 w-3/4 rounded-full border-4 border-purple-400/70"></div>
                                </div>
                                <div className="p-3 flex items-center justify-between">
                                    <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border rounded">← Anterior</button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-purple-600 text-white rounded"
                                        onClick={async () => {
                                            if (!videoRef.current) return
                                            const video = videoRef.current
                                            const canvas = canvasRef.current || document.createElement('canvas')
                                            canvasRef.current = canvas
                                            const side = Math.min(video.videoWidth, video.videoHeight)
                                            canvas.width = side
                                            canvas.height = side
                                            const ctx = canvas.getContext('2d')
                                            if (!ctx) return
                                            // Centrar recorte cuadrado
                                            const sx = (video.videoWidth - side) / 2
                                            const sy = (video.videoHeight - side) / 2
                                            ctx.drawImage(video, sx, sy, side, side, 0, 0, side, side)
                                            canvas.toBlob((blob) => {
                                                if (blob) setSelfie(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }))
                                            }, 'image/jpeg', 0.9)
                                        }}
                                    >
                                        Capturar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={isLoading || step !== 2} className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {isLoading ? 'Enviando...' : 'Enviar verificación'}
                    </button>
                </form>
            </div>
        </div>
    )
}


