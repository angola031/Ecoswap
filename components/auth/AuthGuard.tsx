'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (isMounted) {
          if (user) {
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error)
        if (isMounted) {
          setIsAuthenticated(false)
          router.push('/login')
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  // Mostrar loading mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return fallback || (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Mostrar contenido si está autenticado
  if (isAuthenticated) {
    return <>{children}</>
  }

  // No mostrar nada si no está autenticado (se redirige)
  return null
}