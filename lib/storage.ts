import { supabase } from './supabase'

/**
 * Genera una URL pública para un archivo en Supabase Storage
 * @param bucket - Nombre del bucket (por defecto 'Ecoswap')
 * @param path - Ruta del archivo en el bucket
 * @returns URL pública del archivo
 */
export function getPublicUrl(bucket: string = 'Ecoswap', path: string): string {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
    
    return data.publicUrl
}

/**
 * Genera URLs públicas para los documentos de verificación de un usuario
 * @param userId - ID del usuario
 * @returns Objeto con las URLs de los documentos
 */
export function getVerificationDocumentUrls(userId: number | string) {
    const basePath = `validacion/${userId}`
    
    return {
        cedulaFrente: getPublicUrl('Ecoswap', `${basePath}/cedula_frente.jpg`),
        cedulaReverso: getPublicUrl('Ecoswap', `${basePath}/cedula_reverso.jpg`),
        selfieValidacion: getPublicUrl('Ecoswap', `${basePath}/selfie_validacion.jpg`)
    }
}

/**
 * Verifica si un archivo existe en el bucket
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo
 * @returns Promise<boolean> - true si el archivo existe
 */
export async function fileExists(bucket: string = 'Ecoswap', path: string): Promise<boolean> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path.split('/').slice(0, -1).join('/'), {
                search: path.split('/').pop()
            })
        
        if (error) {
            console.error('Error verificando archivo:', error)
            return false
        }
        
        return data && data.length > 0
    } catch (error) {
        console.error('Error verificando existencia de archivo:', error)
        return false
    }
}

/**
 * Obtiene la lista de archivos en una carpeta específica
 * @param bucket - Nombre del bucket
 * @param folder - Carpeta a listar
 * @returns Promise con la lista de archivos
 */
export async function listFiles(bucket: string = 'Ecoswap', folder: string = '') {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(folder)
        
        if (error) {
            console.error('Error listando archivos:', error)
            return []
        }
        
        return data || []
    } catch (error) {
        console.error('Error listando archivos:', error)
        return []
    }
}

/**
 * Elimina un archivo del storage
 * @param bucket - Nombre del bucket
 * @param path - Ruta del archivo a eliminar
 * @returns Promise<boolean> - true si se eliminó correctamente
 */
export async function deleteFile(bucket: string = 'Ecoswap', path: string): Promise<boolean> {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path])
        
        if (error) {
            console.error('Error eliminando archivo:', error)
            return false
        }
        
        return true
    } catch (error) {
        console.error('Error eliminando archivo:', error)
        return false
    }
}