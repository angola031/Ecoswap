'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function isEmailAdmin(email: string | null | undefined): boolean {
    if (!email) return false
    const allow = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    return email.toLowerCase().endsWith('@ecoswap.local') || (allow.length > 0 && allow.includes(email.toLowerCase()))
}

export default function AdminLoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            const user = data.user
            if (!user) throw new Error('No se pudo iniciar sesión')

            // Verificar admin en la base de datos (igual que el middleware)
            let isAdmin = false
            if (user.email) {
                const { data: dbUser } = await supabase
                    .from('usuario')
                    .select('user_id, es_admin')
                    .eq('email', user.email)
                    .single()

                if (dbUser?.es_admin) {
                    isAdmin = true
                } else if (dbUser?.user_id) {
                    // Chequear roles
                    const { data: roles } = await supabase
                        .from('usuario_rol')
                        .select('rol_id, activo')
                        .eq('usuario_id', dbUser.user_id)
                        .eq('activo', true)
                    if (roles && roles.length > 0) {
                        const ids = roles.map(r => r.rol_id)
                        const { data: roleNames } = await supabase
                            .from('rol_usuario')
                            .select('rol_id, nombre, activo')
                            .in('rol_id', ids)
                        isAdmin = !!(roleNames || []).find(r => r.activo && ['super_admin', 'admin_validacion', 'admin_soporte', 'moderador'].includes((r.nombre || '').toString()))
                    }
                }
            }

            // Fallback a verificación por metadata o email (para casos especiales)
            if (!isAdmin) {
                isAdmin = user.user_metadata?.is_admin === true || isEmailAdmin(user.email)
            }

            if (!isAdmin) {
                await supabase.auth.signOut()
                throw new Error('Tu cuenta no tiene permisos de administrador')
            }

            router.push('/admin/verificaciones')
        } catch (err: any) {
            setError(err?.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm bg-white rounded-xl shadow p-6">
                <h1 className="text-xl font-bold mb-4">Panel Administrador</h1>
                {error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>
                )}
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="admin@tu-dominio.com" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">Contraseña</label>
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="••••••••" />
                    </div>
                    <button disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-3">Acceso restringido. Si necesitas permisos, contacta al administrador.</p>
            </div>
        </div>
    )
}



