// =============================================
// 🚀 UTILIDADES DE CONSULTAS PARA ADMINISTRADORES - ECOSWAP
// =============================================

import { supabase } from './supabase'

// Interfaces para tipado
export interface AdminUser {
    user_id: number
    nombre: string
    apellido: string
    email: string
    telefono?: string
    es_admin: boolean
    admin_desde: string
    verificado: boolean
    activo: boolean
    ultima_conexion?: string
    roles: AdminRole[]
}

export interface AdminRole {
    rol_id: number
    nombre: string
    descripcion: string
    permisos?: string[]
    activo: boolean
    fecha_asignacion?: string
    asignado_por?: string
}

// =============================================
// CONSULTAS PRINCIPALES
// =============================================

/**
 * Obtiene todos los administradores con información completa
 */
export async function getAllAdmins(): Promise<{ data: AdminUser[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                telefono,
                es_admin,
                admin_desde,
                verificado,
                activo,
                ultima_conexion,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_id,
                    activo,
                    fecha_asignacion,
                    rol_usuario (
                        nombre,
                        descripcion,
                        permisos
                    ),
                    asignado_por:usuario!usuario_rol_asignado_por_fkey (
                        nombre,
                        email
                    )
                )
            `)
            .eq('es_admin', true)
            .eq('usuario_rol.activo', true)
            .order('admin_desde', { ascending: false })

        if (error) {
            console.error('Error obteniendo administradores:', error)
            return { data: null, error: error.message }
        }

        // Procesar los datos
        const processedAdmins = (data || []).map(admin => ({
            ...admin,
            roles: admin.usuario_rol
                ?.filter(ur => ur.activo)
                .map(ur => ({
                    rol_id: ur.rol_id,
                    nombre: (ur.rol_usuario as any)?.nombre || '',
                    descripcion: (ur.rol_usuario as any)?.descripcion || '',
                    permisos: (ur.rol_usuario as any)?.permisos || [],
                    activo: ur.activo,
                    fecha_asignacion: ur.fecha_asignacion,
                    asignado_por: (ur.asignado_por as any)?.nombre || 'Sistema'
                }))
                .filter(ur => ur.nombre) || []
        })) as AdminUser[]

        return { data: processedAdmins, error: null }

    } catch (error) {
        console.error('Error en getAllAdmins:', error)
        return { data: null, error: 'Error interno del servidor' }
    }
}

/**
 * Obtiene solo super administradores
 */
export async function getSuperAdmins(): Promise<{ data: AdminUser[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                telefono,
                es_admin,
                admin_desde,
                verificado,
                activo,
                ultima_conexion,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_usuario!inner (
                        nombre
                    )
                )
            `)
            .eq('es_admin', true)
            .eq('usuario_rol.activo', true)
            .eq('usuario_rol.rol_usuario.nombre', 'super_admin')

        if (error) {
            console.error('Error obteniendo super admins:', error)
            return { data: null, error: error.message }
        }

        return { data: (data || []) as unknown as AdminUser[], error: null }

    } catch (error) {
        console.error('Error en getSuperAdmins:', error)
        return { data: null, error: 'Error interno del servidor' }
    }
}

/**
 * Verifica si un usuario es administrador
 */
export async function isUserAdmin(email: string): Promise<{ isAdmin: boolean; roles: string[]; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('usuario')
            .select(`
                user_id,
                es_admin,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_usuario (
                        nombre
                    )
                )
            `)
            .eq('email', email)
            .eq('usuario_rol.activo', true)
            .single()

        if (error) {
            console.error('Error verificando admin:', error)
            return { isAdmin: false, roles: [], error: error.message }
        }

        const roles = data.usuario_rol?.map(ur => (ur.rol_usuario as any)?.nombre).filter(Boolean) || []
        return {
            isAdmin: data.es_admin || roles.length > 0,
            roles,
            error: null
        }

    } catch (error) {
        console.error('Error en isUserAdmin:', error)
        return { isAdmin: false, roles: [], error: 'Error interno del servidor' }
    }
}

/**
 * Obtiene administradores con un permiso específico
 */
export async function getAdminsWithPermission(permission: string): Promise<{ data: AdminUser[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('usuario')
            .select(`
                user_id,
                nombre,
                apellido,
                email,
                es_admin,
                admin_desde,
                usuario_rol!usuario_rol_usuario_id_fkey (
                    rol_usuario (
                        nombre,
                        permisos
                    )
                )
            `)
            .eq('es_admin', true)
            .eq('usuario_rol.activo', true)
            .contains('usuario_rol.rol_usuario.permisos', [permission])

        if (error) {
            console.error('Error obteniendo admins con permiso:', error)
            return { data: null, error: error.message }
        }

        return { data: (data || []) as unknown as AdminUser[], error: null }

    } catch (error) {
        console.error('Error en getAdminsWithPermission:', error)
        return { data: null, error: 'Error interno del servidor' }
    }
}

/**
 * Obtiene roles disponibles
 */
export async function getAvailableRoles(): Promise<{ data: any[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('rol_usuario')
            .select(`
                rol_id,
                nombre,
                descripcion,
                permisos,
                activo
            `)
            .eq('activo', true)
            .order('nombre')

        if (error) {
            console.error('Error obteniendo roles:', error)
            return { data: null, error: error.message }
        }

        return { data: data || [], error: null }

    } catch (error) {
        console.error('Error en getAvailableRoles:', error)
        return { data: null, error: 'Error interno del servidor' }
    }
}

/**
 * Obtiene historial de asignaciones de roles
 */
export async function getRoleAssignmentHistory(): Promise<{ data: any[] | null; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('usuario_rol')
            .select(`
                fecha_asignacion,
                activo,
                usuario!usuario_rol_usuario_id_fkey (
                    nombre,
                    email
                ),
                rol_usuario (
                    nombre,
                    descripcion
                ),
                asignado_por:usuario!usuario_rol_asignado_por_fkey (
                    nombre,
                    email
                )
            `)
            .order('fecha_asignacion', { ascending: false })

        if (error) {
            console.error('Error obteniendo historial:', error)
            return { data: null, error: error.message }
        }

        return { data: data || [], error: null }

    } catch (error) {
        console.error('Error en getRoleAssignmentHistory:', error)
        return { data: null, error: 'Error interno del servidor' }
    }
}

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

/**
 * Procesa los datos de usuario con roles
 */
export function processUserWithRoles(userData: any): AdminUser | null {
    if (!userData) return null

    const roles = userData.usuario_rol?.map((ur: any) => ({
        rol_id: ur.rol_id,
        nombre: ur.rol_usuario?.nombre || '',
        descripcion: ur.rol_usuario?.descripcion || '',
        permisos: ur.rol_usuario?.permisos || [],
        activo: ur.activo,
        fecha_asignacion: ur.fecha_asignacion,
        asignado_por: ur.asignado_por?.nombre || 'Sistema'
    })) || []

    return {
        ...userData,
        roles,
        hasRole: (roleName: string) => roles.some((r: AdminRole) => r.nombre === roleName),
        hasPermission: (permission: string) => roles.some((r: AdminRole) =>
            r.permisos?.includes(permission) || r.permisos?.includes('all')
        )
    } as AdminUser & { hasRole: (roleName: string) => boolean; hasPermission: (permission: string) => boolean }
}

/**
 * Obtiene el color para un rol específico
 */
export function getRoleColor(roleName: string): string {
    switch (roleName) {
        case 'super_admin': return 'bg-red-100 text-red-800'
        case 'admin_validacion': return 'bg-blue-100 text-blue-800'
        case 'admin_soporte': return 'bg-green-100 text-green-800'
        case 'moderador': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

/**
 * Formatea una fecha para mostrar
 */
export function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString('es-CO')
}

// =============================================
// CONSULTAS ESPECÍFICAS PARA DASHBOARD
// =============================================

/**
 * Obtiene estadísticas de administradores
 */
export async function getAdminStats(): Promise<{ data: any | null; error: string | null }> {
    try {
        const { data: admins, error: adminsError } = await getAllAdmins()
        if (adminsError) return { data: null, error: adminsError }

        const stats = {
            total: admins?.length || 0,
            activos: admins?.filter(a => a.activo).length || 0,
            inactivos: admins?.filter(a => !a.activo).length || 0,
            superAdmins: admins?.filter(a => a.roles.some(r => r.nombre === 'super_admin')).length || 0,
            verificados: admins?.filter(a => a.verificado).length || 0,
            porRol: {
                super_admin: admins?.filter(a => a.roles.some(r => r.nombre === 'super_admin')).length || 0,
                admin_validacion: admins?.filter(a => a.roles.some(r => r.nombre === 'admin_validacion')).length || 0,
                admin_soporte: admins?.filter(a => a.roles.some(r => r.nombre === 'admin_soporte')).length || 0,
                moderador: admins?.filter(a => a.roles.some(r => r.nombre === 'moderador')).length || 0
            }
        }

        return { data: stats, error: null }

    } catch (error) {
        console.error('Error en getAdminStats:', error)
        return { data: null, error: 'Error interno del servidor' }
    }
}
