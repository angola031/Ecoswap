'use client'

import { useState, useEffect } from 'react'

interface Complaint {
    id: number
    titulo: string
    descripcion: string
    fecha_creacion: string
    estado: 'abierta' | 'en_proceso' | 'cerrada'
    prioridad: 'baja' | 'media' | 'alta'
    usuario_id: number
    usuario?: {
        nombre: string
        apellido: string
        email: string
    }
    tipo: 'bug' | 'sugerencia' | 'queja' | 'spam'
}

// Datos simulados para quejas (ajustar según tu esquema real)
const mockComplaints: Complaint[] = [
    {
        id: 1,
        titulo: "Error al subir imagen de producto",
        descripcion: "Cuando intento subir una imagen de mi producto, la página se cuelga y no se carga la imagen. Esto me ha pasado varias veces.",
        fecha_creacion: "2024-01-15T10:30:00Z",
        estado: "abierta",
        prioridad: "alta",
        usuario_id: 1,
        usuario: {
            nombre: "Juan",
            apellido: "Pérez",
            email: "juan.perez@email.com"
        },
        tipo: "bug"
    },
    {
        id: 2,
        titulo: "Sugerencia: Mejorar búsqueda de productos",
        descripcion: "Sería genial poder filtrar los productos por precio y ubicación. La búsqueda actual es muy básica.",
        fecha_creacion: "2024-01-14T15:45:00Z",
        estado: "en_proceso",
        prioridad: "media",
        usuario_id: 2,
        usuario: {
            nombre: "María",
            apellido: "González",
            email: "maria.gonzalez@email.com"
        },
        tipo: "sugerencia"
    },
    {
        id: 3,
        titulo: "Usuario publicando contenido inapropiado",
        descripcion: "El usuario 'vendetodo123' está publicando productos que no están relacionados con intercambio ecológico. Deberían ser removidos.",
        fecha_creacion: "2024-01-13T09:20:00Z",
        estado: "cerrada",
        prioridad: "alta",
        usuario_id: 3,
        usuario: {
            nombre: "Carlos",
            apellido: "Rodríguez",
            email: "carlos.rodriguez@email.com"
        },
        tipo: "queja"
    }
]

export default function ComplaintsSection() {
    const [complaints, setComplaints] = useState<Complaint[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all')
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                
                // TODO: Reemplazar con consulta real a tu tabla de quejas
                // const { data, error } = await supabase
                //     .from('quejas')
                //     .select(`
                //         id,
                //         titulo,
                //         descripcion,
                //         fecha_creacion,
                //         estado,
                //         prioridad,
                //         usuario_id,
                //         tipo,
                //         usuario:usuario_id (
                //             nombre,
                //             apellido,
                //             email
                //         )
                //     `)
                //     .order('fecha_creacion', { ascending: false })

                // Simular carga de datos
                setTimeout(() => {
                    setComplaints(mockComplaints)
                    setLoading(false)
                }, 1000)

            } catch (error) {
                console.error('💥 Error cargando quejas:', error)
                setLoading(false)
            }
        }

        fetchComplaints()
    }, [])

    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            complaint.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            complaint.usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = filter === 'all' || 
                            (filter === 'open' && complaint.estado === 'abierta') ||
                            (filter === 'in_progress' && complaint.estado === 'en_proceso') ||
                            (filter === 'closed' && complaint.estado === 'cerrada')

        const matchesPriority = priorityFilter === 'all' ||
                               (priorityFilter === 'high' && complaint.prioridad === 'alta') ||
                               (priorityFilter === 'medium' && complaint.prioridad === 'media') ||
                               (priorityFilter === 'low' && complaint.prioridad === 'baja')

        return matchesSearch && matchesStatus && matchesPriority
    })

    const updateComplaintStatus = async (complaintId: number, newStatus: string) => {
        try {
            // TODO: Implementar actualización real en la base de datos
            // const { error } = await supabase
            //     .from('quejas')
            //     .update({ estado: newStatus })
            //     .eq('id', complaintId)

            // Actualizar estado local
            setComplaints(complaints.map(complaint => 
                complaint.id === complaintId 
                    ? { ...complaint, estado: newStatus as any }
                    : complaint
            ))

        } catch (error) {
            console.error('💥 Error:', error)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
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
        <div className="space-y-6 text-gray-900 dark:text-gray-100">
            {/* Filtros y búsqueda */}
            <div className="bg-white dark:bg-gray-900/60 shadow rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Todas', count: complaints.length },
                            { key: 'open', label: 'Abiertas', count: complaints.filter(c => c.estado === 'abierta').length },
                            { key: 'in_progress', label: 'En Proceso', count: complaints.filter(c => c.estado === 'en_proceso').length },
                            { key: 'closed', label: 'Cerradas', count: complaints.filter(c => c.estado === 'cerrada').length }
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key as any)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    filter === key
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Todas las Prioridades' },
                            { key: 'high', label: 'Alta' },
                            { key: 'medium', label: 'Media' },
                            { key: 'low', label: 'Baja' }
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setPriorityFilter(key as any)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    priorityFilter === key
                                        ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Buscar quejas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de quejas */}
                <div className="bg-white dark:bg-gray-900/60 shadow rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Quejas ({filteredComplaints.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-96 overflow-y-auto">
                        {filteredComplaints.map((complaint) => (
                            <div 
                                key={complaint.id} 
                                className={`px-6 py-4 cursor-pointer transition-colors ${
                                    selectedComplaint?.id === complaint.id ? 'border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'bg-white dark:bg-transparent'
                                } hover:bg-gray-50 dark:hover:bg-gray-800/60`}
                                onClick={() => setSelectedComplaint(complaint)}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 dark:text-gray-200 font-medium">
                                                {complaint.usuario?.nombre.charAt(0)}{complaint.usuario?.apellido.charAt(0)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {complaint.titulo}
                                            </h4>
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                    complaint.prioridad === 'alta'
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                                        : complaint.prioridad === 'media'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                                }`}>
                                                    {complaint.prioridad}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                                            {complaint.descripcion}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                complaint.estado === 'abierta'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                                    : complaint.estado === 'en_proceso'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                            }`}>
                                                {complaint.estado}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(complaint.fecha_creacion).toLocaleDateString('es-CO')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detalle de la queja seleccionada */}
                <div className="bg-white dark:bg-gray-900/60 shadow rounded-2xl border border-gray-200 dark:border-gray-700 transition-colors">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Detalle de la Queja
                        </h3>
                    </div>
                    <div className="p-6">
                        {selectedComplaint ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Título:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedComplaint.titulo}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">De:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {selectedComplaint.usuario?.nombre} {selectedComplaint.usuario?.apellido}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedComplaint.usuario?.email}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Fecha:</h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {new Date(selectedComplaint.fecha_creacion).toLocaleString('es-CO')}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Estado y Prioridad:</h4>
                                    <div className="flex space-x-2 mt-1">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                            selectedComplaint.estado === 'abierta'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                                : selectedComplaint.estado === 'en_proceso'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200'
                                                : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                        }`}>
                                            {selectedComplaint.estado}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                            selectedComplaint.prioridad === 'alta'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                                : selectedComplaint.prioridad === 'media'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200'
                                                : 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                                        }`}>
                                            {selectedComplaint.prioridad}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                            selectedComplaint.tipo === 'bug'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                                                : selectedComplaint.tipo === 'sugerencia'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                                                : selectedComplaint.tipo === 'queja'
                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                        }`}>
                                            {selectedComplaint.tipo}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Descripción:</h4>
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                                            {selectedComplaint.descripcion}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    {selectedComplaint.estado === 'abierta' && (
                                        <button
                                            onClick={() => updateComplaintStatus(selectedComplaint.id, 'en_proceso')}
                                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium hover:bg-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:hover:bg-yellow-500/30"
                                        >
                                            En Proceso
                                        </button>
                                    )}
                                    {selectedComplaint.estado === 'en_proceso' && (
                                        <button
                                            onClick={() => updateComplaintStatus(selectedComplaint.id, 'cerrada')}
                                            className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 dark:bg-green-500/20 dark:text-green-200 dark:hover:bg-green-500/30"
                                        >
                                            Cerrar
                                        </button>
                                    )}
                                    {selectedComplaint.estado === 'cerrada' && (
                                        <button
                                            onClick={() => updateComplaintStatus(selectedComplaint.id, 'abierta')}
                                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 dark:bg-red-500/20 dark:text-red-200 dark:hover:bg-red-500/30"
                                        >
                                            Reabrir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">Selecciona una queja para ver los detalles</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
