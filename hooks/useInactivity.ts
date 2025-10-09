import { useEffect, useRef } from 'react'
import { logoutUser } from '@/lib/auth'

interface UseInactivityOptions {
  timeout?: number // tiempo en milisegundos (default: 30 minutos)
  onInactive?: () => void // callback cuando se detecta inactividad
  onActive?: () => void // callback cuando se detecta actividad
}

export function useInactivity({
  timeout = 30 * 60 * 1000, // 30 minutos por defecto
  onInactive,
  onActive
}: UseInactivityOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isActiveRef = useRef(true)

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        isActiveRef.current = false
        
        // Ejecutar callback personalizado si existe
        if (onInactive) {
          onInactive()
        } else {
          // Comportamiento por defecto: cerrar sesión
          handleInactivityLogout()
        }
      }
    }, timeout)
  }

  const handleInactivityLogout = async () => {
    try {
      
      // Actualizar estado del usuario a inactivo
      await logoutUser()
      
      // Limpiar localStorage
      localStorage.removeItem('ecoswap_user')
      
      // Redirigir a la página principal
      window.location.href = '/'
      
    } catch (error) {
      console.error('❌ [Inactivity] Error al cerrar sesión por inactividad:', error)
    }
  }

  const handleActivity = () => {
    if (!isActiveRef.current) {
      isActiveRef.current = true
      if (onActive) {
        onActive()
      }
    }
    resetTimeout()
  }

  useEffect(() => {
    // Eventos que indican actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    // Agregar listeners de eventos
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Inicializar el timeout
    resetTimeout()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [timeout])

  return {
    isActive: isActiveRef.current,
    resetTimeout
  }
}
