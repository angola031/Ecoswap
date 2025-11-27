'use client'

import { useState, useEffect } from 'react'
import { useAdminManagement } from '@/hooks/useAdminQueries'
import { getSupabaseClient } from '@/lib/supabase-client'

interface Rol {
    rol_id: number
    nombre: string
    descripcion: string
    permisos?: string[]
    activo: boolean
    fecha_asignacion?: string
    asignado_por?: string
}

interface InterfazPermitida {
    nombre: string
    descripcion: string
    icono: string
    ruta: string
    color: string
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
    
    // Función auxiliar para obtener sesión
    const getSession = async () => {
        const supabase = getSupabaseClient()
        if (!supabase) return null
        const { data: { session } } = await supabase.auth.getSession()
        return session
    }

    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showReactivateModal, setShowReactivateModal] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState<Administrador | null>(null)
    const [processing, setProcessing] = useState(false)
    const [showInactiveAdmins, setShowInactiveAdmins] = useState(false)
    const [inactiveAdmins, setInactiveAdmins] = useState<Administrador[]>([])
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [successMessage, setSuccessMessage] = useState<string>('')
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false)
    const [permissionsLoading, setPermissionsLoading] = useState<boolean>(true)
    const [userCurrentRoles, setUserCurrentRoles] = useState<string[]>([])
    const [emailValidationStatus, setEmailValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
    const [emailValidationMessage, setEmailValidationMessage] = useState<string>('')

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

    // Mapeo de roles a interfaces disponibles
    const getInterfacesPorRol = (rolNombre: string): InterfazPermitida[] => {
        const mapeoInterfaces: { [key: string]: InterfazPermitida[] } = {
            'super_admin': [
                {
                    nombre: 'Dashboard Principal',
                    descripcion: 'Vista general del sistema y estadísticas',
                    icono: '📊',
                    ruta: '/admin/verificaciones',
                    color: 'blue'
                },
                {
                    nombre: 'Gestión de Administradores',
                    descripcion: 'Crear, editar y gestionar otros administradores',
                    icono: '👥',
                    ruta: '/admin/administradores',
                    color: 'purple'
                },
                {
                    nombre: 'Gestión de Usuarios',
                    descripcion: 'Ver y gestionar usuarios del sistema',
                    icono: '👤',
                    ruta: '/admin/usuarios',
                    color: 'green'
                },
                {
                    nombre: 'Verificación de Productos',
                    descripcion: 'Revisar y aprobar productos publicados',
                    icono: '📦',
                    ruta: '/admin/productos',
                    color: 'orange'
                },
                {
                    nombre: 'Gestión de Mensajes',
                    descripcion: 'Responder mensajes y consultas de usuarios',
                    icono: '💬',
                    ruta: '/admin/mensajes',
                    color: 'cyan'
                },
                {
                    nombre: 'Reportes y Quejas',
                    descripcion: 'Gestionar reportes y quejas de usuarios',
                    icono: '⚠️',
                    ruta: '/admin/reportes',
                    color: 'red'
                },
                {
                    nombre: 'Configuración del Sistema',
                    descripcion: 'Configurar parámetros del sistema',
                    icono: '⚙️',
                    ruta: '/admin/configuracion',
                    color: 'gray'
                }
            ],
            'admin': [
                {
                    nombre: 'Dashboard Principal',
                    descripcion: 'Vista general del sistema y estadísticas',
                    icono: '📊',
                    ruta: '/admin/verificaciones',
                    color: 'blue'
                },
                {
                    nombre: 'Gestión de Usuarios',
                    descripcion: 'Ver y gestionar usuarios del sistema',
                    icono: '👤',
                    ruta: '/admin/usuarios',
                    color: 'green'
                },
                {
                    nombre: 'Verificación de Productos',
                    descripcion: 'Revisar y aprobar productos publicados',
                    icono: '📦',
                    ruta: '/admin/productos',
                    color: 'orange'
                },
                {
                    nombre: 'Gestión de Mensajes',
                    descripcion: 'Responder mensajes y consultas de usuarios',
                    icono: '💬',
                    ruta: '/admin/mensajes',
                    color: 'cyan'
                },
                {
                    nombre: 'Reportes y Quejas',
                    descripcion: 'Gestionar reportes y quejas de usuarios',
                    icono: '⚠️',
                    ruta: '/admin/reportes',
                    color: 'red'
                }
            ],
            'moderador': [
                {
                    nombre: 'Dashboard Principal',
                    descripcion: 'Vista general del sistema y estadísticas',
                    icono: '📊',
                    ruta: '/admin/verificaciones',
                    color: 'blue'
                },
                {
                    nombre: 'Verificación de Productos',
                    descripcion: 'Revisar y aprobar productos publicados',
                    icono: '📦',
                    ruta: '/admin/productos',
                    color: 'orange'
                },
                {
                    nombre: 'Gestión de Mensajes',
                    descripcion: 'Responder mensajes y consultas de usuarios',
                    icono: '💬',
                    ruta: '/admin/mensajes',
                    color: 'cyan'
                }
            ]
        }

        return mapeoInterfaces[rolNombre] || []
    }

    // Función para obtener todas las interfaces de un administrador
    const getInterfacesAdministrador = (roles: Rol[]): InterfazPermitida[] => {
        const todasInterfaces: InterfazPermitida[] = []
        const interfacesUnicas = new Set<string>()

        roles.forEach(rol => {
            const interfaces = getInterfacesPorRol(rol.nombre)
            interfaces.forEach(interfaz => {
                if (!interfacesUnicas.has(interfaz.ruta)) {
                    interfacesUnicas.add(interfaz.ruta)
                    todasInterfaces.push(interfaz)
                }
            })
        })

        return todasInterfaces
    }

    // Función para obtener las interfaces del usuario actual (solo las que puede ver)
    const getUserCurrentInterfaces = (): InterfazPermitida[] => {
        return getInterfacesAdministrador(userCurrentRoles.map(roleName => ({ nombre: roleName } as Rol)))
    }

    // Función para validar email en tiempo real
    const validateEmail = async (email: string) => {
        if (!email || email.length < 5) {
            setEmailValidationStatus('idle')
            setEmailValidationMessage('')
            return
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setEmailValidationStatus('invalid')
            setEmailValidationMessage('Formato de email inválido')
            return
        }

        setEmailValidationStatus('checking')
        setEmailValidationMessage('Verificando disponibilidad...')

        try {
            // Hacer una consulta rápida a la API para verificar si el email existe
            const session = await getSession()
            const token = session?.access_token
            if (!token) return

            // Usar una consulta simple para verificar existencia
            const supabase = getSupabaseClient()
            const { data: existingUser, error } = await supabase
                .from('usuario')
                .select('email, es_admin, activo, nombre, apellido')
                .eq('email', email.toLowerCase())
                .single()

            if (error && error.code !== 'PGRST116') {
                // Error de conexión
                setEmailValidationStatus('invalid')
                setEmailValidationMessage('Error verificando email')
                return
            }

            if (existingUser) {
                if (existingUser.es_admin) {
                    if (existingUser.activo) {
                        setEmailValidationStatus('invalid')
                        setEmailValidationMessage(`Ya existe como administrador activo: ${existingUser.nombre} ${existingUser.apellido}`)
                    } else {
                        setEmailValidationStatus('invalid')
                        setEmailValidationMessage(`Ya existe como administrador inactivo: ${existingUser.nombre} ${existingUser.apellido}`)
                    }
                } else {
                    setEmailValidationStatus('invalid')
                    setEmailValidationMessage(`Ya existe como usuario regular: ${existingUser.nombre} ${existingUser.apellido}`)
                }
            } else {
                setEmailValidationStatus('valid')
                setEmailValidationMessage('Email disponible')
            }
        } catch (error) {
            console.error('Error validando email:', error)
            setEmailValidationStatus('invalid')
            setEmailValidationMessage('Error verificando email')
        }
    }

    // Debounced email validation
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (newAdmin.email) {
                validateEmail(newAdmin.email)
            }
        }, 500) // Esperar 500ms después del último cambio

        return () => clearTimeout(timeoutId)
    }, [newAdmin.email])

    // Verificar permisos del usuario actual
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                const supabase = getSupabaseClient()
                const session = await getSession()
                
                if (!session?.user?.email) {
                    setIsSuperAdmin(false)
                    setPermissionsLoading(false)
                    return
                }

                // Verificar si el usuario actual es super admin
                const { data: userData, error: userError } = await supabase
                    .from('usuario')
                    .select('user_id, es_admin, email')
                    .eq('email', session.user.email)
                    .single()

                if (userError || !userData?.es_admin) {
                    setIsSuperAdmin(false)
                    setPermissionsLoading(false)
                    return
                }

                // Verificar roles del usuario
                const { data: userRoles, error: rolesError } = await supabase
                    .from('usuario_rol')
                    .select('rol_id, activo')
                    .eq('usuario_id', userData.user_id)
                    .eq('activo', true)

                if (rolesError || !userRoles || userRoles.length === 0) {
                    setIsSuperAdmin(false)
                    setPermissionsLoading(false)
                    return
                }

                // Verificar si tiene rol de super admin
                const roleIds = userRoles.map(r => r.rol_id)
                const { data: roleNames, error: roleNamesError } = await supabase
                    .from('rol_usuario')
                    .select('rol_id, nombre, activo')
                    .in('rol_id', roleIds)
                    .eq('activo', true)

                if (roleNamesError || !roleNames) {
                    setIsSuperAdmin(false)
                    setPermissionsLoading(false)
                    return
                }

                const hasSuperAdminRole = roleNames.some(r => r.nombre === 'super_admin')
                const currentUserRoles = roleNames.map(r => r.nombre)
                
                console.log('✅ Verificación de permisos completada:', {
                    isSuperAdmin: hasSuperAdminRole,
                    userEmail: session.user.email,
                    roles: currentUserRoles
                })
                
                setIsSuperAdmin(hasSuperAdminRole)
                setUserCurrentRoles(currentUserRoles)
            } catch (error) {
                console.error('❌ Error verificando permisos:', error)
                setIsSuperAdmin(false)
            } finally {
                setPermissionsLoading(false)
            }
        }

        checkPermissions()
    }, [])

    const loadInactiveAdmins = async () => {
        try {
            const session = await getSession()
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
            setErrorMessage('Debe seleccionar al menos un rol para reactivar')
            return
        }

        setProcessing(true)
        try {
            const session = await getSession()
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
            setErrorMessage(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const createAdmin = async () => {
        if (!newAdmin.email || !newAdmin.nombre || !newAdmin.apellido || newAdmin.roles.length === 0) {
            setErrorMessage('Todos los campos son requeridos y debe seleccionar al menos un rol')
            return
        }

        // Validar que el email sea válido y disponible
        if (emailValidationStatus !== 'valid') {
            if (emailValidationStatus === 'invalid') {
                setErrorMessage(emailValidationMessage || 'El email no está disponible')
            } else if (emailValidationStatus === 'checking') {
                setErrorMessage('Espera a que termine la validación del email')
            } else {
                setErrorMessage('Por favor, ingresa un email válido')
            }
            return
        }

        setProcessing(true)
        setErrorMessage('')
        setSuccessMessage('')
        
        try {
            
            const session = await getSession()
            const token = session?.access_token
            if (!token) {
                setErrorMessage('No hay sesión activa. Por favor, inicia sesión nuevamente.')
                return
            }

            const res = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newAdmin)
            })

            const data = await res.json()

            if (!res.ok) {
                // Manejar diferentes tipos de errores
                if (res.status === 400) {
                    // Error de validación (email duplicado, campos faltantes, etc.)
                    throw new Error(data.error || 'Error de validación')
                } else if (res.status === 401) {
                    throw new Error('No tienes permisos para crear administradores')
                } else if (res.status === 403) {
                    throw new Error('Se requiere rol de Super Administrador')
                } else {
                    throw new Error(data.error || 'Error del servidor')
                }
            }

            // Mostrar mensaje de éxito con información del correo
            if (data.email_enviado) {
                setSuccessMessage(`✅ Administrador creado exitosamente!\n\n👤 ${newAdmin.nombre} ${newAdmin.apellido} (${newAdmin.email})\n📧 Se ha enviado un correo para configurar su contraseña.\n\nEl administrador podrá acceder al sistema una vez que configure su contraseña desde el enlace enviado.`)
            } else {
                setSuccessMessage(`✅ Administrador creado exitosamente!\n\n👤 ${newAdmin.nombre} ${newAdmin.apellido} (${newAdmin.email})\n⚠️ No se pudo enviar el correo de configuración de contraseña.\n\nEl administrador deberá contactar al super administrador para obtener acceso al sistema.`)
            }
            
            setShowCreateModal(false)
            setNewAdmin({ email: '', nombre: '', apellido: '', telefono: '', roles: [], enviarInvitacion: true })
            refetch() // Usar refetch del hook

        } catch (e: any) {
            console.error('❌ Error creando administrador:', e)
            setErrorMessage(e.message || 'Error desconocido al crear administrador')
        } finally {
            setProcessing(false)
        }
    }

    const updateAdmin = async () => {
        if (!selectedAdmin) return

        setProcessing(true)
        try {
            const session = await getSession()
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
            setErrorMessage(e.message)
        } finally {
            setProcessing(false)
        }
    }

    const deleteAdmin = async (adminId: number) => {
        if (!confirm('¿Estás seguro de que quieres desactivar este administrador? Esta acción puede ser revertida más tarde.')) return

        setProcessing(true)
        setErrorMessage('')
        setSuccessMessage('')
        
        try {
            const session = await getSession()
            const sessionError = session ? null : new Error('No hay sesión')
            
            if (sessionError) {
                console.error('❌ Error obteniendo sesión:', sessionError)
                setErrorMessage('Error verificando sesión: ' + sessionError.message)
                return
            }
            
            console.log('📊 Estado de sesión:', { 
                hasSession: !!session, 
                hasUser: !!session?.user, 
                userEmail: session?.user?.email,
                hasToken: !!session?.access_token 
            })
            
            if (!session) {
                console.error('❌ No hay sesión activa')
                setErrorMessage('No hay sesión activa. Por favor, inicia sesión nuevamente.')
                return
            }
            
            const token = session.access_token
            if (!token) {
                console.error('❌ No hay token de acceso')
                setErrorMessage('No hay token de acceso. Por favor, inicia sesión nuevamente.')
                return
            }
            


            const res = await fetch(`/api/admin/roles/${adminId}`, {
                method: 'DELETE',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || `Error del servidor: ${res.status}`)
            }

            setSuccessMessage(data.message || 'Administrador desactivado exitosamente')
            await refetch() // Usar refetch del hook para actualizar la lista

            // Cerrar modales si están abiertos
            setShowEditModal(false)
            setShowReactivateModal(false)
            setSelectedAdmin(null)

        } catch (e: any) {
            console.error('❌ Error eliminando administrador:', e)
            setErrorMessage(e.message || 'Error desconocido al eliminar administrador')
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

    if (loading || permissionsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                    {loading ? 'Cargando administradores...' : 'Verificando permisos...'}
                </span>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900/70 text-gray-900 dark:text-gray-100 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gestión de Administradores</h2>
                        {isSuperAdmin && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                                </svg>
                                Super Admin
                            </span>
                        )}
                        {!isSuperAdmin && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                Administrador
                            </span>
                        )}
                    </div>
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
                        {isSuperAdmin && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                title="Solo Super Administradores pueden crear nuevos administradores"
                            >
                                Nuevo Administrador
                            </button>
                        )}
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
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-200 rounded">
                        {error}
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-200 rounded flex justify-between items-center">
                        <span>{errorMessage}</span>
                        <button
                            onClick={() => setErrorMessage('')}
                            className="text-red-500 hover:text-red-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/40 dark:text-green-200 rounded flex justify-between items-center">
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage('')}
                            className="text-green-500 hover:text-green-700"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Interfaces disponibles para el usuario actual */}
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 dark:bg-gray-900/60 dark:border-gray-800 rounded-lg transition-colors">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tus Interfaces Disponibles</h3>
                    <div className="bg-white dark:bg-gray-900/40 p-3 rounded-lg border border-blue-200 dark:border-blue-500/30">
                        <div className="flex items-center mb-3">
                            <span className="text-lg mr-2">
                                {isSuperAdmin ? '⭐' : '👤'}
                            </span>
                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                {isSuperAdmin ? 'Super Administrador' : 'Administrador'}
                            </h4>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                ({userCurrentRoles.join(', ')})
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {getUserCurrentInterfaces().map((interfaz, index) => (
                                <div key={index} className="flex items-center p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <span className="text-sm mr-2">{interfaz.icono}</span>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-gray-900 dark:text-white">{interfaz.nombre}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{interfaz.descripcion}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {getUserCurrentInterfaces().length === 0 && (
                            <p className="text-xs text-gray-500 italic">No tienes interfaces asignadas</p>
                        )}
                    </div>
                </div>

                {/* Mensaje informativo para usuarios que no son super admin */}
                {!isSuperAdmin && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 rounded-lg transition-colors">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Permisos de Administrador
                                </h3>
                                <div className="mt-2 text-sm text-blue-700 dark:text-blue-100">
                                    <p>
                                        Como administrador, puedes ver y gestionar la información de otros administradores, 
                                        pero solo los <strong>Super Administradores</strong> pueden crear nuevas cuentas de administrador.
                                    </p>
                                    <p className="mt-1">
                                        Si necesitas crear un nuevo administrador, contacta a un Super Administrador.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showInactiveAdmins ? (
                    // Sección de administradores inactivos
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Administradores Inactivos</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{inactiveAdmins.length} inactivos</span>
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
                                                
                                                {/* Roles del administrador inactivo */}
                                                {admin.roles && admin.roles.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                            {admin.roles.map((role) => (
                                                                <span key={role.rol_id} className={`px-2 py-1 rounded text-xs ${getRoleColor(role.nombre)}`}>
                                                                    {role.nombre.replace('_', ' ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        
                                                        {/* Interfaces disponibles para este administrador (solo las que el usuario actual puede ver) */}
                                                        <div className="mb-3">
                                                            <p className="text-xs font-medium text-gray-700 mb-2">Interfaces Disponibles:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {getInterfacesAdministrador(admin.roles)
                                                                    .filter(interfaz => 
                                                                        getUserCurrentInterfaces().some(userInterfaz => 
                                                                            userInterfaz.ruta === interfaz.ruta
                                                                        )
                                                                    )
                                                                    .map((interfaz, index) => (
                                                                        <span 
                                                                            key={index}
                                                                            className={`px-2 py-1 rounded text-xs bg-${interfaz.color}-100 text-${interfaz.color}-800 border border-${interfaz.color}-200 opacity-75`}
                                                                            title={interfaz.descripcion}
                                                                        >
                                                                            <span className="mr-1">{interfaz.icono}</span>
                                                                            {interfaz.nombre}
                                                                        </span>
                                                                    ))}
                                                                {getInterfacesAdministrador(admin.roles)
                                                                    .filter(interfaz => 
                                                                        getUserCurrentInterfaces().some(userInterfaz => 
                                                                            userInterfaz.ruta === interfaz.ruta
                                                                        )
                                                                    ).length === 0 && (
                                                                    <span className="text-xs text-gray-500 italic opacity-75">
                                                                        No hay interfaces visibles para ti
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p>Desactivado: {formatTime((admin as any).fecha_suspension || '')}</p>
                                                    <p>Motivo: {(admin as any).motivo_suspension || 'No especificado'}</p>
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
                                        <div className="flex flex-wrap gap-1 mb-3">
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
                                        
                                        {/* Interfaces disponibles para este administrador (solo las que el usuario actual puede ver) */}
                                        <div className="mb-3">
                                            <p className="text-xs font-medium text-gray-700 mb-2">Interfaces Disponibles:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {getInterfacesAdministrador(admin.roles)
                                                    .filter(interfaz => 
                                                        getUserCurrentInterfaces().some(userInterfaz => 
                                                            userInterfaz.ruta === interfaz.ruta
                                                        )
                                                    )
                                                    .map((interfaz, index) => (
                                                        <span 
                                                            key={index}
                                                            className={`px-2 py-1 rounded text-xs bg-${interfaz.color}-100 text-${interfaz.color}-800 border border-${interfaz.color}-200`}
                                                            title={interfaz.descripcion}
                                                        >
                                                            <span className="mr-1">{interfaz.icono}</span>
                                                            {interfaz.nombre}
                                                        </span>
                                                    ))}
                                                {getInterfacesAdministrador(admin.roles)
                                                    .filter(interfaz => 
                                                        getUserCurrentInterfaces().some(userInterfaz => 
                                                            userInterfaz.ruta === interfaz.ruta
                                                        )
                                                    ).length === 0 && (
                                                    <span className="text-xs text-gray-500 italic">
                                                        No hay interfaces visibles para ti
                                                    </span>
                                                )}
                                            </div>
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

            {/* Modal para crear administrador - Solo visible para super admins */}
            {showCreateModal && isSuperAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Administrador</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className={`w-full border rounded px-3 py-2 text-sm transition-colors ${
                                        emailValidationStatus === 'valid' ? 'border-green-500 bg-green-50' :
                                        emailValidationStatus === 'invalid' ? 'border-red-500 bg-red-50' :
                                        emailValidationStatus === 'checking' ? 'border-yellow-500 bg-yellow-50' :
                                        'border-gray-300 dark:border-gray-700 dark:bg-gray-900/60'
                                    } dark:text-gray-100`}
                                    placeholder="admin@ejemplo.com"
                                />
                                {emailValidationMessage && (
                                    <div className={`mt-1 text-xs flex items-center ${
                                        emailValidationStatus === 'valid' ? 'text-green-600' :
                                        emailValidationStatus === 'invalid' ? 'text-red-600' :
                                        emailValidationStatus === 'checking' ? 'text-yellow-600' :
                                        'text-gray-600'
                                    }`}>
                                        {emailValidationStatus === 'checking' && (
                                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {emailValidationStatus === 'valid' && (
                                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {emailValidationStatus === 'invalid' && (
                                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        {emailValidationMessage}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={newAdmin.nombre}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, nombre: e.target.value })}
                                        className="input-field text-sm"
                                        placeholder="Juan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        value={newAdmin.apellido}
                                        onChange={(e) => setNewAdmin({ ...newAdmin, apellido: e.target.value })}
                                        className="input-field text-sm"
                                        placeholder="Pérez"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono (opcional)</label>
                                <input
                                    type="tel"
                                    value={newAdmin.telefono}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, telefono: e.target.value })}
                                    className="input-field text-sm"
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
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Administrador</h3>
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
                                        className="input-field text-sm resize-none"
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
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reactivar Administrador</h3>
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
                                    className="input-field text-sm resize-none"
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



