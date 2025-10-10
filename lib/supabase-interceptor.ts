/**
 * Interceptor personalizado para manejar rate limiting y reintentos
 */

interface RetryConfig {
    maxRetries: number
    baseDelay: number
    maxDelay: number
}

class SupabaseInterceptor {
    private retryConfig: RetryConfig = {
        maxRetries: 3,
        baseDelay: 1000, // 1 segundo
        maxDelay: 30000  // 30 segundos
    }

    private isRateLimited = false
    private retryAfter: number | null = null

    /**
     * Calcula el delay para el próximo reintento usando backoff exponencial
     */
    private calculateDelay(attempt: number): number {
        const delay = this.retryConfig.baseDelay * Math.pow(2, attempt)
        return Math.min(delay, this.retryConfig.maxDelay)
    }

    /**
     * Verifica si estamos en rate limiting
     */
    isCurrentlyRateLimited(): boolean {
        if (!this.isRateLimited) return false
        
        if (this.retryAfter && Date.now() < this.retryAfter) {
            return true
        }
        
        // Reset rate limiting después del tiempo de espera
        this.isRateLimited = false
        this.retryAfter = null
        return false
    }

    /**
     * Obtiene el tiempo restante para el próximo reintento
     */
    getRetryAfter(): number | null {
        if (!this.isRateLimited || !this.retryAfter) return null
        return Math.max(0, this.retryAfter - Date.now())
    }

    /**
     * Maneja errores de rate limiting
     */
    handleRateLimit(error: any): boolean {
        if (error.status === 429 || error.message?.includes('rate limit')) {
            this.isRateLimited = true
            
            // Intentar extraer el tiempo de espera del header Retry-After
            const retryAfterHeader = error.headers?.get?.('retry-after')
            if (retryAfterHeader) {
                this.retryAfter = Date.now() + (parseInt(retryAfterHeader) * 1000)
            } else {
                // Si no hay header, usar un delay fijo de 30 segundos
                this.retryAfter = Date.now() + 30000
            }
            
            console.warn(`🚨 Rate limit alcanzado. Reintentando en ${Math.ceil((this.retryAfter - Date.now()) / 1000)} segundos`)
            return true
        }
        return false
    }

    /**
     * Ejecuta una función con reintentos automáticos
     */
    async executeWithRetry<T>(
        operation: () => Promise<T>,
        context: string = 'operation'
    ): Promise<T> {
        let lastError: any

        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                // Verificar si estamos en rate limiting
                if (this.isCurrentlyRateLimited()) {
                    const waitTime = this.getRetryAfter()
                    if (waitTime) {
                        console.log(`⏳ Esperando ${Math.ceil(waitTime / 1000)} segundos antes de reintentar ${context}`)
                        await new Promise(resolve => setTimeout(resolve, waitTime))
                    }
                }

                const result = await operation()
                
                // Si llegamos aquí, la operación fue exitosa
                if (attempt > 0) {
                    console.log(`✅ ${context} exitoso en intento ${attempt + 1}`)
                }
                
                return result

            } catch (error: any) {
                lastError = error

                // Manejar rate limiting
                if (this.handleRateLimit(error)) {
                    if (attempt < this.retryConfig.maxRetries) {
                        const delay = this.calculateDelay(attempt)
                        console.log(`🔄 Reintentando ${context} en ${delay / 1000} segundos (intento ${attempt + 1}/${this.retryConfig.maxRetries})`)
                        await new Promise(resolve => setTimeout(resolve, delay))
                        continue
                    }
                }

                // Si no es rate limiting o hemos agotado los reintentos, lanzar el error
                if (attempt === this.retryConfig.maxRetries) {
                    console.error(`❌ ${context} falló después de ${this.retryConfig.maxRetries + 1} intentos:`, error)
                    throw error
                }

                // Para otros errores, esperar un poco antes del siguiente intento
                const delay = this.calculateDelay(attempt)
                console.log(`🔄 Reintentando ${context} en ${delay / 1000} segundos (intento ${attempt + 1}/${this.retryConfig.maxRetries})`)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        throw lastError
    }

    /**
     * Configura los parámetros de reintento
     */
    configure(config: Partial<RetryConfig>) {
        this.retryConfig = { ...this.retryConfig, ...config }
    }

    /**
     * Resetea el estado del interceptor
     */
    reset() {
        this.isRateLimited = false
        this.retryAfter = null
    }
}

// Instancia singleton del interceptor
export const supabaseInterceptor = new SupabaseInterceptor()

// Función helper para usar el interceptor
export async function withRetry<T>(
    operation: () => Promise<T>,
    context?: string
): Promise<T> {
    return supabaseInterceptor.executeWithRetry(operation, context)
}

// Función para verificar si estamos en rate limiting
export function isRateLimited(): boolean {
    return supabaseInterceptor.isCurrentlyRateLimited()
}

// Función para obtener el tiempo de espera
export function getRetryAfter(): number | null {
    return supabaseInterceptor.getRetryAfter()
}
