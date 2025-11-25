'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DashboardNavigationProps {
    activeSection: string
    onSectionChange: (section: string) => void
}

export default function DashboardNavigation({ activeSection, onSectionChange }: DashboardNavigationProps) {
    const sections = [
        { id: 'overview', name: 'Resumen', icon: '📊', description: 'Estadísticas generales' },
        { id: 'users', name: 'Usuarios', icon: '👥', description: 'Gestión de usuarios' },
        { id: 'products', name: 'Productos', icon: '📦', description: 'Verificación de productos' },
        { id: 'foundations', name: 'Fundaciones', icon: '🏛️', description: 'Gestión de fundaciones', href: '/admin/fundaciones' },
        { id: 'messages', name: 'Mensajes', icon: '💬', description: 'Mensajes de clientes' },
        { id: 'complaints', name: 'Quejas', icon: '⚠️', description: 'Reportes y quejas' },
        { id: 'admins', name: 'Administradores', icon: '👨‍💼', description: 'Gestión de admins' }
    ]

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {sections.map((section) => {
                        const className = `${
                            activeSection === section.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`
                        
                        const content = (
                            <>
                                <span className="text-lg">{section.icon}</span>
                                <div className="flex flex-col items-start">
                                    <span>{section.name}</span>
                                    <span className="text-xs text-gray-400 hidden sm:block">
                                        {section.description}
                                    </span>
                                </div>
                            </>
                        )
                        
                        return (section as any).href ? (
                            <Link
                                key={section.id}
                                href={(section as any).href}
                                className={className}
                            >
                                {content}
                            </Link>
                        ) : (
                            <button
                                key={section.id}
                                onClick={() => onSectionChange(section.id)}
                                className={className}
                            >
                                {content}
                            </button>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
