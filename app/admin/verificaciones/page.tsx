'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Item {
    user_id: number
    email: string
    nombre: string
    apellido: string
    verificado: boolean
    files: { cedula_frente: string | null; cedula_reverso: string | null; selfie_validacion: string | null }
}

export default function AdminVerificacionesPage() {
    const [items, setItems] = useState<Item[]>([])
    const [filter, setFilter] = useState<'todos' | 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada'>('pendiente')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) { setError('No hay sesión'); setLoading(false); return }
            const res = await fetch('/api/admin/verificaciones', { headers: { Authorization: `Bearer ${token}` } })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Error cargando')
            setItems(json.items || [])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const act = async (userId: number, action: 'aprobar' | 'rechazar' | 'en_revision') => {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        const res = await fetch('/api/admin/verificaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ userId, action })
        })
        const json = await res.json()
        if (!res.ok) {
            alert(json?.error || 'Error')
        } else {
            await load()
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Verificaciones de Identidad</h1>
                    <div className="flex items-center gap-2">
                        <select className="border rounded px-2 py-1" value={filter} onChange={(e) => setFilter(e.target.value as any)}>
                            <option value="todos">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_revision">En revisión</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="rechazada">Rechazada</option>
                        </select>
                        <button onClick={load} className="px-3 py-1.5 border rounded">Recargar</button>
                    </div>
                </div>
                {error && <div className="p-2 bg-red-50 border border-red-200 text-red-700 mb-3">{error}</div>}
                {loading ? (
                    <div>Cargando...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {items.filter((it: any) => filter === 'todos' ? true : (it.estado || (it.verificado ? 'aprobada' : 'pendiente')) === filter).map((it: any) => (
                            <div key={it.user_id} className="bg-white rounded shadow p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="font-semibold">{it.nombre} {it.apellido}</div>
                                        <div className="text-sm text-gray-600">{it.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-sm ${it.estado === 'aprobada' ? 'bg-green-100 text-green-700' : it.estado === 'rechazada' ? 'bg-red-100 text-red-700' : it.estado === 'en_revision' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{it.estado || (it.verificado ? 'aprobada' : 'pendiente')}</span>
                                        <span className={`px-2 py-1 rounded text-xs ${it.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{it.activo ? 'Activa' : 'Suspendida'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cedula_frente', 'cedula_reverso', 'selfie_validacion'].map((k) => (
                                        <div key={k} className="border rounded overflow-hidden bg-gray-50">
                                            {it.files?.[k as keyof Item['files']] ? (
                                                <img src={it.files[k as keyof Item['files']] as string} className="w-full h-40 object-cover" />
                                            ) : (
                                                <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm">Sin archivo</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex flex-col gap-2">
                                    <textarea id={`motivo-${it.user_id}`} placeholder="Motivo de rechazo (opcional)" className="w-full border rounded px-2 py-1 text-sm" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={async () => {
                                            const { data: { session } } = await supabase.auth.getSession()
                                            const token = session?.access_token
                                            const res = await fetch('/api/admin/users/status', {
                                                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                body: JSON.stringify({ userId: it.user_id, action: it.activo ? 'suspender' : 'reactivar' })
                                            })
                                            if (res.ok) load(); else alert('Error al cambiar estado')
                                        }} className={`px-3 py-1.5 rounded ${it.activo ? 'border' : 'bg-green-600 text-white'}`}>{it.activo ? 'Suspender cuenta' : 'Reactivar cuenta'}</button>
                                        <button onClick={() => act(it.user_id, 'en_revision')} className="px-3 py-1.5 border rounded">En revisión</button>
                                        <button onClick={async () => {
                                            const el = document.getElementById(`motivo-${it.user_id}`) as HTMLTextAreaElement | null
                                            const motivo = el?.value || ''
                                            const { data: { session } } = await supabase.auth.getSession()
                                            const token = session?.access_token
                                            const res = await fetch('/api/admin/verificaciones', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                body: JSON.stringify({ userId: it.user_id, action: 'rechazar', motivo })
                                            })
                                            if (res.ok) load(); else alert('Error al rechazar')
                                        }} className="px-3 py-1.5 border rounded">Rechazar</button>
                                        <button onClick={() => act(it.user_id, 'aprobar')} className="px-3 py-1.5 bg-green-600 text-white rounded">Aprobar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}



