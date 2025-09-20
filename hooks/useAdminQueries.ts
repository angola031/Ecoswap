// =============================================
// 🚀 HOOK PERSONALIZADO PARA CONSULTAS DE ADMINISTRADORES
// =============================================

import { useState, useEffect, useCallback } from 'react'
import {
    getAllAdmins,
    getSuperAdmins,
    isUserAdmin,
    getAdminsWithPermission,
    getAvailableRoles,
    getRoleAssignmentHistory,
    getAdminStats,
    AdminUser,
    AdminRole
} from '@/lib/admin-queries'

// =============================================
// HOOK PRINCIPAL PARA ADMINISTRADORES
// =============================================

export function useAdmins() {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadAdmins = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await getAllAdmins()

        if (error) {
            setError(error)
            setAdmins([])
        } else {
            setAdmins(data || [])
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        loadAdmins()
    }, [loadAdmins])

    return {
        admins,
        loading,
        error,
        refetch: loadAdmins
    }
}

// =============================================
// HOOK PARA SUPER ADMINISTRADORES
// =============================================

export function useSuperAdmins() {
    const [superAdmins, setSuperAdmins] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadSuperAdmins = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await getSuperAdmins()

        if (error) {
            setError(error)
            setSuperAdmins([])
        } else {
            setSuperAdmins(data || [])
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        loadSuperAdmins()
    }, [loadSuperAdmins])

    return {
        superAdmins,
        loading,
        error,
        refetch: loadSuperAdmins
    }
}

// =============================================
// HOOK PARA VERIFICAR SI UN USUARIO ES ADMIN
// =============================================

export function useIsUserAdmin(email: string) {
    const [isAdmin, setIsAdmin] = useState(false)
    const [roles, setRoles] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const checkAdmin = useCallback(async () => {
        if (!email) return

        setLoading(true)
        setError(null)

        const { isAdmin: adminStatus, roles: userRoles, error } = await isUserAdmin(email)

        if (error) {
            setError(error)
            setIsAdmin(false)
            setRoles([])
        } else {
            setIsAdmin(adminStatus)
            setRoles(userRoles)
        }

        setLoading(false)
    }, [email])

    useEffect(() => {
        checkAdmin()
    }, [checkAdmin])

    return {
        isAdmin,
        roles,
        loading,
        error,
        refetch: checkAdmin
    }
}

// =============================================
// HOOK PARA ADMINISTRADORES CON PERMISOS
// =============================================

export function useAdminsWithPermission(permission: string) {
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadAdminsWithPermission = useCallback(async () => {
        if (!permission) return

        setLoading(true)
        setError(null)

        const { data, error } = await getAdminsWithPermission(permission)

        if (error) {
            setError(error)
            setAdmins([])
        } else {
            setAdmins(data || [])
        }

        setLoading(false)
    }, [permission])

    useEffect(() => {
        loadAdminsWithPermission()
    }, [loadAdminsWithPermission])

    return {
        admins,
        loading,
        error,
        refetch: loadAdminsWithPermission
    }
}

// =============================================
// HOOK PARA ROLES DISPONIBLES
// =============================================

export function useAvailableRoles() {
    const [roles, setRoles] = useState<AdminRole[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadRoles = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await getAvailableRoles()

        if (error) {
            setError(error)
            setRoles([])
        } else {
            setRoles(data || [])
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        loadRoles()
    }, [loadRoles])

    return {
        roles,
        loading,
        error,
        refetch: loadRoles
    }
}

// =============================================
// HOOK PARA HISTORIAL DE ASIGNACIONES
// =============================================

export function useRoleAssignmentHistory() {
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadHistory = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await getRoleAssignmentHistory()

        if (error) {
            setError(error)
            setHistory([])
        } else {
            setHistory(data || [])
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    return {
        history,
        loading,
        error,
        refetch: loadHistory
    }
}

// =============================================
// HOOK PARA ESTADÍSTICAS DE ADMINISTRADORES
// =============================================

export function useAdminStats() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadStats = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { data, error } = await getAdminStats()

        if (error) {
            setError(error)
            setStats(null)
        } else {
            setStats(data)
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    return {
        stats,
        loading,
        error,
        refetch: loadStats
    }
}

// =============================================
// HOOK COMBINADO PARA GESTIÓN COMPLETA
// =============================================

export function useAdminManagement() {
    const admins = useAdmins()
    const roles = useAvailableRoles()
    const stats = useAdminStats()

    return {
        admins: admins.admins,
        roles: roles.roles,
        stats: stats.stats,
        loading: admins.loading || roles.loading || stats.loading,
        error: admins.error || roles.error || stats.error,
        refetch: () => {
            admins.refetch()
            roles.refetch()
            stats.refetch()
        }
    }
}
