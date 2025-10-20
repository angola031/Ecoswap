'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import IntercambiosTable from '@/components/admin/IntercambiosTable'

interface IntercambioItem {
  intercambio_id: number
  usuario_propone_id: number
  usuario_recibe_id: number
  estado: string
  fecha_propuesta?: string
  fecha_respuesta?: string
  fecha_completado?: string
}

export default function AdminIntercambiosPage() {
  const [items, setItems] = useState<IntercambioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/intercambios')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Error cargando intercambios')
        if (mounted) setItems(json?.items || [])
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Error desconocido')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Volver
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Intercambios (Admin)</h1>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <IntercambiosTable items={items} loading={loading} />
    </div>
  )
}


