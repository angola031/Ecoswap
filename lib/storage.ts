import { supabase } from './supabase'

export type PublicUploadResult = { path: string; publicUrl: string | null }

function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

const TWO_MB = 2 * 1024 * 1024

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob)
        const img = new Image()
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve(img)
        }
        img.onerror = (e) => {
            URL.revokeObjectURL(url)
            reject(e)
        }
        img.src = url
    })
}

async function compressImage(blob: File | Blob, options?: { maxBytes?: number; maxWidth?: number; maxHeight?: number; initialQuality?: number }): Promise<Blob> {
    const maxBytes = options?.maxBytes ?? TWO_MB
    const maxWidth = options?.maxWidth ?? 1280
    const maxHeight = options?.maxHeight ?? 1280
    let quality = options?.initialQuality ?? 0.85

    // Si ya está por debajo del límite y es JPEG, devolver tal cual
    if (blob.size <= maxBytes && (('type' in blob && (blob as File).type?.includes('image/jpeg')) || (blob as any)?.type === 'image/jpeg')) {
        return blob
    }

    const img = await blobToImage(blob)

    // Calcular dimensiones destino
    let targetWidth = img.width
    let targetHeight = img.height
    const scale = Math.min(1, maxWidth / targetWidth, maxHeight / targetHeight)
    if (scale < 1) {
        targetWidth = Math.floor(targetWidth * scale)
        targetHeight = Math.floor(targetHeight * scale)
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return blob

    canvas.width = targetWidth
    canvas.height = targetHeight
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    // Estrategia: bajar calidad y, si es necesario, reducir dimensiones incrementalmente
    let result: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!result) return blob

    while (result.size > maxBytes && (quality > 0.5 || targetWidth > 640 || targetHeight > 640)) {
        if (quality > 0.5) {
            quality = Math.max(0.5, quality - 0.1)
        } else {
            targetWidth = Math.floor(targetWidth * 0.85)
            targetHeight = Math.floor(targetHeight * 0.85)
            canvas.width = targetWidth
            canvas.height = targetHeight
            ctx.clearRect(0, 0, targetWidth, targetHeight)
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        }
        result = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
        if (!result) break
    }

    return result || blob
}

export async function uploadUserProfileImage(params: {
    userId: number | string
    file: File | Blob
    type: 'perfil' | 'portada'
}): Promise<{ error: string | null; result?: PublicUploadResult }> {
    const ext = 'jpg'
    const filename = `${params.type}.${ext}`
    const path = `usuarios/${params.userId}/${sanitizeFilename(filename)}`

    if (!(params.file as File).type?.startsWith('image')) {
        return { error: 'El archivo debe ser una imagen' }
    }

    const processed = await compressImage(params.file, { maxBytes: TWO_MB })

    const { error: uploadError } = await supabase.storage
        .from('Ecoswap')
        .upload(path, processed, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) return { error: uploadError.message }

    const { data } = supabase.storage.from('Ecoswap').getPublicUrl(path)
    return { error: null, result: { path, publicUrl: data?.publicUrl || null } }
}

export async function uploadUserValidationImage(params: {
    userId: number | string
    file: File | Blob
    type: 'cedula_frente' | 'cedula_reverso' | 'selfie_validacion'
}): Promise<{ error: string | null; path?: string }> {
    const ext = 'jpg'
    const filename = `${params.type}.${ext}`
    const path = `validacion/${params.userId}/${sanitizeFilename(filename)}`

    if (!(params.file as File).type?.startsWith('image')) {
        return { error: 'El archivo debe ser una imagen' }
    }

    const processed = await compressImage(params.file, { maxBytes: TWO_MB })

    const { error: uploadError } = await supabase.storage
        .from('Ecoswap')
        .upload(path, processed, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) return { error: uploadError.message }
    return { error: null, path }
}

export async function uploadProductImage(params: {
    productId: number | string
    file: File | Blob
    filename?: string
}): Promise<{ error: string | null; result?: PublicUploadResult }> {
    const base = sanitizeFilename(params.filename || `foto_${Date.now()}.jpg`)
    const path = `productos/${params.productId}/${base}`

    if (!(params.file as File).type?.startsWith('image')) {
        return { error: 'El archivo debe ser una imagen' }
    }

    const processed = await compressImage(params.file, { maxBytes: TWO_MB })

    const { error: uploadError } = await supabase.storage
        .from('Ecoswap')
        .upload(path, processed, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) return { error: uploadError.message }

    const { data } = supabase.storage.from('public').getPublicUrl(path)
    return { error: null, result: { path, publicUrl: data?.publicUrl || null } }
}

export async function uploadMessageAttachment(params: {
    chatId: number | string
    file: File | Blob
    filename?: string
    isPublic?: boolean
}): Promise<{ error: string | null; path?: string; publicUrl?: string | null }> {
    const base = sanitizeFilename(params.filename || `adj_${Date.now()}`)
    const path = `mensajes/${params.chatId}/${base}`
    const bucket = 'Ecoswap'

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, params.file, { upsert: true })

    if (uploadError) return { error: uploadError.message }

    if (params.isPublic) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)
        return { error: null, path, publicUrl: data?.publicUrl || null }
    }

    return { error: null, path, publicUrl: null }
}

// Ayuda: crear rutas esperadas por adelantado (opcional, Supabase crea directorios al subir)
export function buildPaths() {
    return {
        userFolder: (userId: number | string) => `usuarios/${userId}`,
        userProfile: (userId: number | string) => `usuarios/${userId}/perfil.jpg`,
        userCover: (userId: number | string) => `usuarios/${userId}/portada.jpg`,
        validationFolder: (userId: number | string) => `validacion/${userId}`,
        productFolder: (productId: number | string) => `productos/${productId}`,
        messageFolder: (chatId: number | string) => `mensajes/${chatId}`
    }
}


