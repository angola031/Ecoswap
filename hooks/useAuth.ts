'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
    user_id: number
    nombre: string
    apellido: string
    email: string
    telefono?: string
    foto_perfil?: string
    verificado: boolean
    activo: boolean
    isAdmin: boolean
    roles: string[]
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (session?.user) {
                    // Obtener datos del usuario desde la base de datos
                    const { data: userData, error } = await supabase
                        .from('usuario')
                        .select(`
                            user_id,
                            nombre,
                            apellido,
                            email,
                            telefono,
                            foto_perfil,
                            verificado,
                            activo,
                            usuario_rol!inner(
                                rol:rol_id(
                                    nombre,
                                    activo
                                )
                            )
                        `)
                        .eq('email', session.user.email)
                        .single()

                    if (userData && !error) {
                        const roles = userData.usuario_rol?.map((ur: any) => ur.rol.nombre) || []
                        const isAdmin = roles.some((role: string) => 
                            ['Administrador', 'Super Administrador'].includes(role)
                        )

                        setUser({
                            user_id: userData.user_id,
                            nombre: userData.nombre,
                            apellido: userData.apellido,
                            email: userData.email,
                            telefono: userData.telefono,
                            foto_perfil: userData.foto_perfil,
                            verificado: userData.verificado,
                            activo: userData.activo,
                            isAdmin,
                            roles
                        })
                    }
                }
            } catch (error) {
                console.error('Error checking auth:', error)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    await checkAuth()
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setLoading(false)
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        try {
            await supabase.auth.signOut()
            setUser(null)
        } catch (error) {
            console.error('Error signing out:', error)
        }
    }

    return {
        user,
        loading,
        signOut,
        isAuthenticated: !!user,
        isVerified: user?.verificado || false,
        isAdmin: user?.isAdmin || false
    }
}
