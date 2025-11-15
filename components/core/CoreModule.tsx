'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  location: string
}

interface CoreModuleProps {
  currentUser: User | null
  onLogout: () => void
}

export default function CoreModule({ currentUser, onLogout }: CoreModuleProps) {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'help' | 'about'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalExchanges: 0,
    activeUsers: 0
  })

  // Cargar estadísticas reales de la base de datos
  useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      try {
        const res = await fetch('/api/home/stats')
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json?.error || 'Error cargando estadísticas')
        }

        if (isMounted && json.stats) {
          setStats({
            totalUsers: json.stats.totalUsers || 0,
            totalProducts: json.stats.totalProducts || 0,
            totalExchanges: json.stats.totalExchanges || 0,
            activeUsers: json.stats.activeUsers || 0
          })
        }
      } catch (error) {
        console.error('❌ [CoreModule] Error cargando estadísticas:', error)
        // En caso de error, mantener los valores en 0
        if (isMounted) {
          setStats({
            totalUsers: 0,
            totalProducts: 0,
            totalExchanges: 0,
            activeUsers: 0
          })
        }
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen stats={stats} currentUser={currentUser} />
      case 'help':
        return <HelpScreen />
      case 'about':
        return <AboutScreen />
      default:
        return <HomeScreen stats={stats} currentUser={currentUser} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header del módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentScreen === 'home' && 'Bienvenido a EcoSwap Colombia'}
            {currentScreen === 'help' && 'Ayuda y Soporte'}
            {currentScreen === 'about' && 'Acerca de EcoSwap'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {currentScreen === 'home' && 'Tu plataforma de intercambio sostenible'}
            {currentScreen === 'help' && 'Encuentra respuestas a tus preguntas'}
            {currentScreen === 'about' && 'Conoce más sobre nuestra misión'}
          </p>
        </div>

        {/* Barra de búsqueda */}
        {currentScreen === 'home' && (
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        )}
      </div>

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${currentScreen === 'home'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Inicio
          </button>
          <button
            onClick={() => setCurrentScreen('help')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${currentScreen === 'help'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Ayuda
          </button>
          <button
            onClick={() => setCurrentScreen('about')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${currentScreen === 'about'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Acerca de
          </button>
        </nav>
      </div>

      {/* Contenido de la pantalla */}
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderScreen()}
      </motion.div>
    </div>
  )
}

// Componente de la pantalla de inicio
function HomeScreen({ stats, currentUser }: { stats: any, currentUser: User | null }) {
  const router = useRouter()

  const handlePublishProduct = async () => {
    // Verificar si el usuario está autenticado
    const { getCurrentUser } = await import('@/lib/auth')
    const user = await getCurrentUser()
    
    if (!user) {
      // Si no está autenticado, redirigir a la interfaz de login del AuthModule
      router.push(`/?returnUrl=${encodeURIComponent('/agregar-producto')}&auth=true`)
      return
    }

    // Si está autenticado, verificar si está verificado
    const { isUserVerified } = await import('@/lib/auth')
    const isVerified = await isUserVerified()
    
    if (!isVerified) {
      // Mostrar mensaje de verificación requerida
      const result = await (window as any).Swal.fire({
        title: 'Verificación Requerida',
        text: 'Por favor, primero verifica tu cuenta para poder publicar productos.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ir a Verificación',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280'
      })
      
      if (result.isConfirmed) {
        router.push('/verificacion-identidad')
      }
      return
    }

    // Si está verificado, redirigir a agregar producto
    router.push('/agregar-producto')
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-gray-600 dark:text-gray-400">Usuarios Registrados</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <HeartIcon className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stats.totalProducts.toLocaleString()}</h3>
          <p className="text-gray-600 dark:text-gray-400">Productos Disponibles</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stats.totalExchanges.toLocaleString()}</h3>
          <p className="text-gray-600 dark:text-gray-400">Intercambios Completados</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
            <GlobeAltIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stats.activeUsers.toLocaleString()}</h3>
          <p className="text-gray-600 dark:text-gray-400">Usuarios Activos</p>
        </div>
      </div>

      {/* Sección Hero */}
      <div className="card bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">¡Únete a la Revolución Sostenible!</h2>
          <p className="text-xl mb-6 text-primary-100">
            Intercambia productos en lugar de comprar nuevos. Reduce tu huella de carbono y ahorra dinero.
          </p>
          <button 
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            onClick={handlePublishProduct}
          >
            <PlusIcon className="w-5 h-5 inline mr-2" />
            Publicar Producto
          </button>
        </div>
      </div>

      {/* Características */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sostenible</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Promovemos la economía circular y reducimos el impacto ambiental.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Seguro</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de verificación y calificaciones para intercambios seguros.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Comunitario</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Conecta con personas que comparten tus valores de sostenibilidad.
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente de ayuda
function HelpScreen() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preguntas Frecuentes</h3>
        <div className="space-y-4">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">¿Cómo funciona EcoSwap?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              EcoSwap es una plataforma donde puedes intercambiar productos en lugar de comprarlos nuevos.
              Publica lo que tienes y encuentra lo que necesitas.
            </p>
          </div>
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">¿Es seguro intercambiar?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Sí, tenemos un sistema de verificación de usuarios y calificaciones para garantizar
              intercambios seguros y confiables.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">¿Cómo me registro?</h4>
            <p className="text-gray-600 dark:text-gray-400">
              El registro es gratuito y rápido. Solo necesitas tu email, nombre y ubicación para comenzar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente acerca de
function AboutScreen() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nuestra Misión</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          EcoSwap nació de la visión de tres estudiantes universitarios de Pereira, Colombia,
          que querían crear una plataforma que promoviera la economía circular y el consumo sostenible.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Creemos que cada intercambio es un paso hacia un futuro más sostenible, donde los productos
          tengan múltiples vidas y las personas se conecten a través de valores compartidos.
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contacto</h3>
        <div className="space-y-2 text-gray-600 dark:text-gray-400">
          <p>📍 Pereira, Risaralda, Colombia</p>
          <p>📧 ecoswap03@gmail.com</p>
          <p>📱 3239163129</p>
        </div>
      </div>
    </div>
  )
}
