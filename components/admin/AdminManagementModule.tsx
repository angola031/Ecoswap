'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminManagement } from '@/hooks/useAdminQueries'

interface Rol {
    rol_id: number
    nombre: string
    descripcion: string
    permisos?: string[]
    activo: boolean
    fecha_asignacion?: string
    asignado_por?: string
}

interface Administrador {
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
    creado_por?: number
    roles: Rol[]
}

interface AdminManagementModuleProps {
    onClose?: () => void
}

export default function AdminManagementModule({ onClose }: AdminManagementModuleProps) {
    // Usar el hook personalizado para obtener datos
    const { admins: administradores, roles, loading, error, refetch } = useAdminManagement()

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showReactivateModal, setShowReactivateModal] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState<Administrador | null>(null)
    const [processing, setProcessing] = useState(false)
    const [showInactiveAdmins, setShowInactiveAdmins] = useState(false)
    const [inactiveAdmins, setInactiveAdmins] = useState<Administrador[]>([])

    // Formulario para crear admin
    const [newAdmin, setNewAdmin] = useState({
        email: '',
        nombre: '',
        apellido: '',
        telefono: '',
        roles: [] as number[],
        enviarInvitacion: true
    })

    // Formulario para editar admin
    const [editAdmin, setEditAdmin] = useState({
        roles: [] as number[],
        activo: true,
        motivo: ''
    })

    // Ya no necesitamos loadData, el hook se encarga de cargar los datos

    const loadInactiveAdmins = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch('/api/admin/roles/inactive', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error cargando administradores inactivos')

            setInactiveAdmins(data.administradores_inactivos || [])
        } catch (e: any) {
            console.error('Error cargando administradores inactivos:', e)
        }
    }

    const reactivateAdmin = async () => {
        if (!selectedAdmin || !editAdmin.roles.length) {
            setError('Debe seleccionar al menos un rol para reactivar')
            return
        }

        setProcessing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch(`/api/admin/roles/${selectedAdmin.user_id}/reactivate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    roles: editAdmin.roles,
                    motivo: editAdmin.motivo
                })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error reactivando administrador')

            // Mostrar mensaje de éxito con información del correo
            if (data.email_enviado) {
                alert(`✅ Administrador reactivado exitosamente!\n\n📧 Se ha enviado un correo a ${selectedAdmin.email} para establecer una nueva contraseña.\n\nEl administrador podrá acceder al sistema una vez que configure su contraseña.`)
            } else {
                alert('✅ Administrador reactivado exitosamente!')
            }

            setShowReactivateModal(false)
            setSelectedAdmin(null)
            await loadInactiveAdmins()
            refetch() // Recargar administradores activos

        } catch (e: any) {
            setError(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const createAdmin = async () => {
        if (!newAdmin.email || !newAdmin.nombre || !newAdmin.apellido || newAdmin.roles.length === 0) {
            setError('Todos los campos son requeridos y debe seleccionar al menos un rol')
            return
        }

        setProcessing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error creando administrador')

            setShowCreateModal(false)
            setNewAdmin({ email: '', nombre: '', apellido: '', telefono: '', roles: [], enviarInvitacion: true })
            refetch() // Usar refetch del hook

        } catch (e: any) {
            setError(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const updateAdmin = async () => {
        if (!selectedAdmin) return

        setProcessing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch(`/api/admin/roles/${selectedAdmin.user_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(editAdmin)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error actualizando administrador')

            setShowEditModal(false)
            setSelectedAdmin(null)
            refetch() // Usar refetch del hook

        } catch (e: any) {
            setError(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const deleteAdmin = async (adminId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este administrador?')) return

        setProcessing(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return

            const res = await fetch(`/api/admin/roles/${adminId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Error eliminando administrador')

            refetch() // Usar refetch del hook

        } catch (e: any) {
            setError(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const openEditModal = (admin: Administrador) => {
        setSelectedAdmin(admin)
        setEditAdmin({
            roles: admin.roles.map(r => r.rol_id),
            activo: admin.activo,
            motivo: ''
        })
        setShowEditModal(true)
    }

    const openReactivateModal = (admin: Administrador) => {
        setSelectedAdmin(admin)
        setEditAdmin({
            roles: admin.roles.map(r => r.rol_id),
            activo: true,
            motivo: ''
        })
        setShowReactivateModal(true)
    }

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('es-CO')
    }

    const getRoleColor = (roleName: string) => {
        switch (roleName) {
            case 'super_admin': return 'bg-red-100 text-red-800'
            case 'admin_validacion': return 'bg-blue-100 text-blue-800'
            case 'admin_soporte': return 'bg-green-100 text-green-800'
            case 'moderador': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    // El hook se encarga de cargar los datos automáticamente

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Cargando administradores...</span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Gestión de Administradores</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setShowInactiveAdmins(!showInactiveAdmins)
                                if (!showInactiveAdmins) {
                                    loadInactiveAdmins()
                                }
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                        >
                            {showInactiveAdmins ? 'Ocultar Inactivos' : 'Ver Inactivos'}
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                            Nuevo Administrador
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de administradores */}
            <div className="flex-1 overflow-y-auto p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {showInactiveAdmins ? (
                    // Sección de administradores inactivos
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Administradores Inactivos</h3>
                            <span className="text-sm text-gray-500">{inactiveAdmins.length} inactivos</span>
                        </div>

                        {inactiveAdmins.length === 0 ? (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-500">No hay administradores inactivos</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {inactiveAdmins.map((admin) => (
                                    <div key={admin.user_id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium text-gray-900">
                                                        {admin.nombre} {admin.apellido}
                                                    </h4>
                                                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                                                        Inactivo
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{admin.email}</p>
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p>Desactivado: {formatTime(admin.fecha_suspension || '')}</p>
                                                    <p>Motivo: {admin.motivo_suspension || 'No especificado'}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => openReactivateModal(admin)}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                >
                                                    Reactivar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : administradores.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <p className="text-gray-500">No hay administradores registrados</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {administradores.map((admin) => (
                            <div key={admin.user_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {admin.nombre} {admin.apellido}
                                            </h3>
                                            <span className={`px-2 py-1 rounded text-xs ${admin.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {admin.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{admin.email}</p>
                                        {admin.telefono && (
                                            <p className="text-xs text-gray-500 mb-2">📞 {admin.telefono}</p>
                                        )}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {admin.roles.map((role) => (
                                                <span key={role.rol_id} className={`px-2 py-1 rounded text-xs ${getRoleColor(role.nombre)}`}>
                                                    {role.nombre.replace('_', ' ')}
                                                    {role.asignado_por && (
                                                        <span className="ml-1 text-xs opacity-75">
                                                            (por {role.asignado_por})
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p>Administrador desde: {formatTime(admin.admin_desde)}</p>
                                            {admin.ultima_conexion && (
                                                <p>Última conexión: {formatTime(admin.ultima_conexion)}</p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs ${admin.verificado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {admin.verificado ? 'Verificado' : 'No verificado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => openEditModal(admin)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteAdmin(admin.user_id)}
                                            disabled={processing}
                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal para crear administrador */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Nuevo Administrador</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="admin@ejemplo.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={newAdmin.nombre}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, nombre: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                        placeholder="Juan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        value={newAdmin.apellido}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, apellido: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                        placeholder="Pérez"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                                <input
                                    type="tel"
                                    value={newAdmin.telefono}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, telefono: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="+57 300 123 4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <label key={role.rol_id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={newAdmin.roles.includes(role.rol_id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewAdmin({ ...newAdmin, roles: [...newAdmin.roles, role.rol_id] })
                                                    } else {
                                                        setNewAdmin({ ...newAdmin, roles: newAdmin.roles.filter(id => id !== role.rol_id) })
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">
                                                {role.nombre.replace('_', ' ')} - {role.descripcion}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={newAdmin.enviarInvitacion}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, enviarInvitacion: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Enviar invitación por email</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createAdmin}
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para editar administrador */}
            {showEditModal && selectedAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Editar Administrador</h3>
                            <p className="text-sm text-gray-600">{selectedAdmin.nombre} {selectedAdmin.apellido}</p>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <label key={role.rol_id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editAdmin.roles.includes(role.rol_id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditAdmin({ ...editAdmin, roles: [...editAdmin.roles, role.rol_id] })
                                                    } else {
                                                        setEditAdmin({ ...editAdmin, roles: editAdmin.roles.filter(id => id !== role.rol_id) })
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">
                                                {role.nombre.replace('_', ' ')} - {role.descripcion}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editAdmin.activo}
                                        onChange={(e) => setEditAdmin({ ...editAdmin, activo: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">Cuenta activa</span>
                                </label>
                            </div>
                            {!editAdmin.activo && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de suspensión</label>
                                    <textarea
                                        value={editAdmin.motivo}
                                        onChange={(e) => setEditAdmin({ ...editAdmin, motivo: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                                        rows={2}
                                        placeholder="Motivo de la suspensión..."
                                    />
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={updateAdmin}
                                disabled={processing}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? 'Actualizando...' : 'Actualizar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para reactivar administrador */}
            {showReactivateModal && selectedAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">Reactivar Administrador</h3>
                            <p className="text-sm text-gray-600">{selectedAdmin.nombre} {selectedAdmin.apellido}</p>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Roles a Asignar</label>
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <label key={role.rol_id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={editAdmin.roles.includes(role.rol_id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEditAdmin({ ...editAdmin, roles: [...editAdmin.roles, role.rol_id] })
                                                    } else {
                                                        setEditAdmin({ ...editAdmin, roles: editAdmin.roles.filter(id => id !== role.rol_id) })
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">
                                                {role.nombre.replace('_', ' ')} - {role.descripcion}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Reactivación (opcional)</label>
                                <textarea
                                    value={editAdmin.motivo}
                                    onChange={(e) => setEditAdmin({ ...editAdmin, motivo: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                                    rows={2}
                                    placeholder="Motivo de la reactivación..."
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => setShowReactivateModal(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={reactivateAdmin}
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                                {processing ? 'Reactivando...' : 'Reactivar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}



