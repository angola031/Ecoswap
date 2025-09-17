'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    HomeIcon,
    UserIcon,
    ChatBubbleLeftRightIcon,
    HeartIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline'

// Componentes
import AuthModule from '@/components/auth/AuthModule'
import CoreModule from '@/components/core/CoreModule'
import ProductsModule from '@/components/products/ProductsModule'
import ChatModule from '@/components/chat/ChatModule'
import ProfileModule from '@/components/profile/ProfileModule'
import InteractionsModule from '@/components/interactions/InteractionsModule'

// Tipos
interface User {
    id: string
    name: string
    email: string
    avatar: string
    location: string
}

export default function HomePage() {
    const [currentScreen, setCurrentScreen] = useState<'auth' | 'main'>('main')
    const [currentModule, setCurrentModule] = useState<string>('products')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [currentUser, setCurrentUser] = useState<User | null>(null)


    // Simular verificación de autenticación
    useEffect(() => {
        const checkAuth = () => {
            const user = localStorage.getItem('ecoswap_user')
            if (user) {
                setCurrentUser(JSON.parse(user))
                setIsAuthenticated(true)
                setCurrentScreen('main')
                // Leer query ?m= para abrir módulo específico
                const params = new URLSearchParams(window.location.search)
                const m = params.get('m')
                if (m) {
                    setCurrentModule(m)
                }
            } else {
                // Si no hay usuario, mostrar productos por defecto
                setCurrentScreen('main')
                // Permitir navegación por query aunque no haya login para no romper el "volver"
                const params = new URLSearchParams(window.location.search)
                const m = params.get('m')
                setCurrentModule(m || 'products')
                setIsAuthenticated(false)
            }
        }

        checkAuth()
    }, [])

    const handleLogin = (userData: User) => {
        setCurrentUser(userData)
        setIsAuthenticated(true)
        setCurrentScreen('main')
        localStorage.setItem('ecoswap_user', JSON.stringify(userData))
    }

    const handleLogout = () => {
        setCurrentUser(null)
        setIsAuthenticated(false)
        setCurrentScreen('main')
        setCurrentModule('products') // Volver a productos después del logout
        localStorage.removeItem('ecoswap_user')
    }

    const renderModule = () => {
        switch (currentModule) {
            case 'home':
                return <CoreModule currentUser={currentUser} onLogout={handleLogout} />
            case 'products':
                return <ProductsModule currentUser={currentUser} />
            case 'interactions':
                return isAuthenticated ? <InteractionsModule currentUser={currentUser} /> : <AuthModule onLogin={handleLogin} />
            case 'chat':
                return isAuthenticated ? <ChatModule currentUser={currentUser} /> : <AuthModule onLogin={handleLogin} />
            case 'profile':
                return isAuthenticated ? <ProfileModule currentUser={currentUser} /> : <AuthModule onLogin={handleLogin} />
            default:
                return <ProductsModule currentUser={currentUser} />
        }
    }

    // Si no está autenticado y quiere acceder a módulos que requieren login
    if (currentScreen === 'auth') {
        return <AuthModule onLogin={handleLogin} />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl">🌱</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">EcoSwap Colombia</span>
                        </div>

                        {/* Navegación */}
                        <nav className="hidden md:flex space-x-8">
                            <button
                                onClick={() => setCurrentModule('home')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'home'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <HomeIcon className="w-5 h-5" />
                                <span>Inicio</span>
                            </button>

                            <button
                                onClick={() => setCurrentModule('products')}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'products'
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <HeartIcon className="w-5 h-5" />
                                <span>Productos</span>
                            </button>

                            {isAuthenticated && (
                                <>
                                    <button
                                        onClick={() => setCurrentModule('interactions')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'interactions'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <HeartIcon className="w-5 h-5" />
                                        <span>Interacciones</span>
                                    </button>

                                    <button
                                        onClick={() => setCurrentModule('chat')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'chat'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        <span>Chat</span>
                                    </button>

                                    <button
                                        onClick={() => setCurrentModule('profile')}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentModule === 'profile'
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <UserIcon className="w-5 h-5" />
                                        <span>Perfil</span>
                                    </button>
                                </>
                            )}
                        </nav>

                        {/* Usuario o botón de login */}
                        <div className="flex items-center space-x-4">
                            {isAuthenticated && currentUser ? (
                                <div className="flex items-center space-x-3">
                                    <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                                        {currentUser.name}
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setCurrentScreen('auth')}
                                    className="btn-primary"
                                >
                                    Iniciar Sesión
                                </button>
                            )}

                            {isAuthenticated && (
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    <Cog6ToothIcon className="w-6 h-6" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    key={currentModule}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderModule()}
                </motion.div>
            </main>

            {/* Navegación Móvil */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                <div className="flex justify-around">
                    <button
                        onClick={() => setCurrentModule('home')}
                        className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'home' ? 'text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <HomeIcon className="w-6 h-6" />
                        <span className="text-xs">Inicio</span>
                    </button>

                    <button
                        onClick={() => setCurrentModule('products')}
                        className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'products' ? 'text-primary-600' : 'text-gray-500'
                            }`}
                    >
                        <HeartIcon className="w-6 h-6" />
                        <span className="text-xs">Productos</span>
                    </button>

                    {isAuthenticated ? (
                        <>
                            <button
                                onClick={() => setCurrentModule('interactions')}
                                className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'interactions' ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                <HeartIcon className="w-6 h-6" />
                                <span className="text-xs">Interacciones</span>
                            </button>

                            <button
                                onClick={() => setCurrentModule('chat')}
                                className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'chat' ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                <span className="text-xs">Chat</span>
                            </button>

                            <button
                                onClick={() => setCurrentModule('profile')}
                                className={`flex flex-col items-center space-y-1 p-2 ${currentModule === 'profile' ? 'text-primary-600' : 'text-gray-500'
                                    }`}
                            >
                                <UserIcon className="w-6 h-6" />
                                <span className="text-xs">Perfil</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setCurrentScreen('auth')}
                            className="flex flex-col items-center space-y-1 p-2 text-gray-500"
                        >
                            <UserIcon className="w-6 h-6" />
                            <span className="text-xs">Login</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
