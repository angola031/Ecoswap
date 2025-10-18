'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'

export default function SupabaseRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Procesando...')

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log('🔧 SupabaseRedirect: Procesando redirección...')
        
        // Obtener parámetros de la URL
        const type = searchParams.get('type')
        const next = searchParams.get('next')
        
        console.log('🔍 Parámetros:', { type, next })
        
        // Obtener el hash de la URL (donde está el token)
        const hash = window.location.hash.substring(1) // Remover el #
        const hashParams = new URLSearchParams(hash)
        
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const tokenType = hashParams.get('token_type')
        const expiresIn = hashParams.get('expires_in')
        const typeFromHash = hashParams.get('type')
        
        console.log('🔍 Hash params:', {
          accessToken: accessToken ? 'presente' : 'ausente',
          refreshToken: refreshToken ? 'presente' : 'ausente',
          tokenType,
          expiresIn,
          typeFromHash
        })
        
        if (!accessToken) {
          throw new Error('No se encontró access_token en la URL')
        }
        
        // Configurar la sesión en Supabase
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error('Error de configuración de Supabase')
        }
        
        // Establecer la sesión con los tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        })
        
        if (error) {
          console.error('❌ Error estableciendo sesión:', error)
          throw error
        }
        
        console.log('✅ Sesión establecida correctamente')
        setStatus('success')
        setMessage('¡Autenticación exitosa! Redirigiendo...')
        
        // Determinar a dónde redirigir
        let redirectPath = '/'
        
        if (type === 'recovery' || typeFromHash === 'recovery') {
          // Es un restablecimiento de contraseña
          if (next) {
            redirectPath = next
          } else {
            redirectPath = '/auth/reset-password'
          }
        } else if (next) {
          redirectPath = next
        }
        
        console.log('🔄 Redirigiendo a:', redirectPath)
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          router.push(redirectPath)
        }, 2000)
        
      } catch (error) {
        console.error('❌ Error en SupabaseRedirect:', error)
        setStatus('error')
        setMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        
        // Redirigir a página de error después de 3 segundos
        setTimeout(() => {
          router.push('/auth/auth-code-error?error=redirect_failed')
        }, 3000)
      }
    }
    
    handleRedirect()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            )}
            {status === 'success' && (
              <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {status === 'loading' && 'Procesando...'}
            {status === 'success' && '¡Éxito!'}
            {status === 'error' && 'Error'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
          
          {status === 'loading' && (
            <p className="mt-4 text-xs text-gray-500">
              Estableciendo tu sesión de usuario...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}