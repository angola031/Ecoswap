'use client'

import { useState, useEffect } from 'react'

interface User {
    user_id: number
    nombre: string
    apellido: string
    email: string
    telefono: string
    verificado: boolean
    activo: boolean
    fecha_registro: string
    es_admin: boolean
}

export default function UsersSection() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'active' | 'inactive'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                
                const { data, error } = await supabase
                    .from('usuario')
                    .select('user_id, nombre, apellido, email, telefono, verificado, activo, fecha_registro, es_admin')
                    .eq('es_admin', false)
                    .order('fecha_registro', { ascending: false })

                if (error) {
                    console.error('❌ Error obteniendo usuarios:', error)
                    return
                }

                setUsers(data || [])

            } catch (error) {
                console.error('💥 Error cargando usuarios:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [])

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase())

        switch (filter) {
            case 'verified':
                return matchesSearch && user.verificado
            case 'unverified':
                return matchesSearch && !user.verificado
            case 'active':
                return matchesSearch && user.activo
            case 'inactive':
                return matchesSearch && !user.activo
            default:
                return matchesSearch
        }
    })

    const toggleUserVerification = async (userId: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('usuario')
                .update({ verificado: !currentStatus })
                .eq('user_id', userId)

            if (error) {
                console.error('❌ Error actualizando verificación:', error)
                alert('Error al actualizar la verificación del usuario')
                return
            }

            // Actualizar estado local
            setUsers(users.map(user => 
                user.user_id === userId 
                    ? { ...user, verificado: !currentStatus }
                    : user
            ))

        } catch (error) {
            console.error('💥 Error:', error)
        }
    }

    const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('usuario')
                .update({ activo: !currentStatus })
                .eq('user_id', userId)

            if (error) {
                console.error('❌ Error actualizando estado:', error)
                alert('Error al actualizar el estado del usuario')
                return
            }

            // Actualizar estado local
            setUsers(users.map(user => 
                user.user_id === userId 
                    ? { ...user, activo: !currentStatus }
                    : user
            ))

        } catch (error) {
            console.error('💥 Error:', error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filtros y búsqueda */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Todos', count: users.length },
                            { key: 'verified', label: 'Verificados', count: users.filter(u => u.verificado).length },
                            { key: 'unverified', label: 'Sin Verificar', count: users.filter(u => !u.verificado).length },
                            { key: 'active', label: 'Activos', count: users.filter(u => u.activo).length },
                            { key: 'inactive', label: 'Inactivos', count: users.filter(u => !u.activo).length }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key as any)}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    filter === key
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Lista de usuarios */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Usuarios ({filteredUsers.length})
                    </h3>
                </div>
                <div className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                        <div key={user.user_id} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 font-medium">
                                                {user.nombre.charAt(0)}{user.apellido.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user.nombre} {user.apellido}
                                            </p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.verificado 
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {user.verificado ? 'Verificado' : 'Sin verificar'}
                                            </span>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                user.activo 
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <p className="text-xs text-gray-400">
                                            Registrado: {new Date(user.fecha_registro).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleUserVerification(user.user_id, user.verificado)}
                                        className={`px-3 py-1 rounded text-xs font-medium ${
                                            user.verificado
                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        }`}
                                    >
                                        {user.verificado ? 'Desverificar' : 'Verificar'}
                                    </button>
                                    <button
                                        onClick={() => toggleUserStatus(user.user_id, user.activo)}
                                        className={`px-3 py-1 rounded text-xs font-medium ${
                                            user.activo
                                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        }`}
                                    >
                                        {user.activo ? 'Desactivar' : 'Activar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
