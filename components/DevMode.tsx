'use client'

import { useState, useEffect } from 'react'

interface DevModeProps {
  children: React.ReactNode
}

export default function DevMode({ children }: DevModeProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando EcoSwap...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
