'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          console.log('🔒 [AuthGuard] Usuario no autenticado - redirigiendo')
          router.push(redirectTo)
          setIsAuthenticated(false)
          return
        }
        
        console.log('✅ [AuthGuard] Usuario autenticado:', session.user?.email)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('❌ [AuthGuard] Error verificando autenticación:', error)
        router.push(redirectTo)
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [AuthGuard] Cambio de estado de autenticación:', event)
      
      if (event === 'SIGNED_OUT' || !session?.access_token) {
        console.log('🔒 [AuthGuard] Usuario desautenticado - redirigiendo')
        router.push(redirectTo)
        setIsAuthenticated(false)
      } else if (event === 'SIGNED_IN' && session?.access_token) {
        console.log('✅ [AuthGuard] Usuario autenticado - permitiendo acceso')
        setIsAuthenticated(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, redirectTo])

  // Mostrar loading mientras verifica
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // No mostrar nada si no está autenticado (ya se redirigió)
  if (!isAuthenticated) {
    return null
  }

  // Mostrar contenido si está autenticado
  return <>{children}</>
}
