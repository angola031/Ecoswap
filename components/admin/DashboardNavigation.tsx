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
        // Fundaciones funciona ahora como pestaña interna, sin navegar a otra página
        { id: 'foundations', name: 'Fundaciones', icon: '🏛️', description: 'Gestión de fundaciones' },
        { id: 'messages', name: 'Mensajes', icon: '💬', description: 'Mensajes de clientes' },
        { id: 'complaints', name: 'Quejas', icon: '⚠️', description: 'Reportes y quejas' },
        { id: 'admins', name: 'Administradores', icon: '👨‍💼', description: 'Gestión de admins' }
    ]

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    {sections.map((section) => {
                        const className = `${
                            activeSection === section.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`
                        
                        const content = (
                            <>
                                <span className="text-lg">{section.icon}</span>
                                <div className="flex flex-col items-start">
                                    <span className={`font-semibold ${activeSection === section.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {section.name}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                                        {section.description}
                                    </span>
                                </div>
                            </>
                        )
                        
                        return (
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
