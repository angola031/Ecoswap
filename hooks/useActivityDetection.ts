import { useEffect, useRef, useCallback } from 'react'

interface UseActivityDetectionProps {
  onActivity: () => void
  onInactive?: () => void
  inactivityTimeout?: number // en milisegundos
  throttleDelay?: number // delay para throttle de eventos
}

/**
 * Hook para detectar actividad del usuario en la interfaz
 * Detecta clicks, movimientos de mouse, scroll, teclas presionadas, etc.
 */
export function useActivityDetection({
  onActivity,
  onInactive,
  inactivityTimeout = 5 * 60 * 1000, // 5 minutos por defecto
  throttleDelay = 1000 // 1 segundo por defecto
}: UseActivityDetectionProps) {
  const lastActivityRef = useRef<number>(Date.now())
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isThrottlingRef = useRef<boolean>(false)

  // Función para manejar la actividad del usuario
  const handleActivity = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now

    // Throttle: solo ejecutar onActivity una vez cada throttleDelay
    if (!isThrottlingRef.current) {
      isThrottlingRef.current = true
      onActivity()

      throttleTimerRef.current = setTimeout(() => {
        isThrottlingRef.current = false
      }, throttleDelay)
    }

    // Reiniciar timer de inactividad
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    if (onInactive) {
      inactivityTimerRef.current = setTimeout(() => {
        onInactive()
      }, inactivityTimeout)
    }
  }, [onActivity, onInactive, inactivityTimeout, throttleDelay])

  useEffect(() => {
    // Lista de eventos que indican actividad del usuario
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'blur'
    ]

    // Agregar listeners para todos los eventos de actividad
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Iniciar timer de inactividad
    if (onInactive) {
      inactivityTimerRef.current = setTimeout(() => {
        onInactive()
      }, inactivityTimeout)
    }

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })

      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current)
      }

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [handleActivity, onInactive, inactivityTimeout])

  // Verificar si el usuario ha estado inactivo
  const isInactive = useCallback(() => {
    const now = Date.now()
    return now - lastActivityRef.current > inactivityTimeout
  }, [inactivityTimeout])

  return {
    lastActivity: lastActivityRef.current,
    isInactive
  }
}

