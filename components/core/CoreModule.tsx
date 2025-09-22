'use client'

import { useState, useEffect } from 'react'
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
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings' | 'help' | 'about'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalExchanges: 0,
    activeUsers: 0
  })

  // Simular carga de estadísticas
  useEffect(() => {
    const loadStats = async () => {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))

      setStats({
        totalUsers: 15420,
        totalProducts: 8930,
        totalExchanges: 5670,
        activeUsers: 2340
      })
    }

    loadStats()
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen stats={stats} currentUser={currentUser} />
      case 'settings':
        return <SettingsScreen currentUser={currentUser} onLogout={onLogout} />
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
          <h1 className="text-3xl font-bold text-gray-900">
            {currentScreen === 'home' && 'Bienvenido a EcoSwap Colombia'}
            {currentScreen === 'settings' && 'Configuración'}
            {currentScreen === 'help' && 'Ayuda y Soporte'}
            {currentScreen === 'about' && 'Acerca de EcoSwap'}
          </h1>
          <p className="text-gray-600 mt-2">
            {currentScreen === 'home' && 'Tu plataforma de intercambio sostenible'}
            {currentScreen === 'settings' && 'Personaliza tu experiencia'}
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
            onClick={() => setCurrentScreen('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${currentScreen === 'settings'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Configuración
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
  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-gray-600">Usuarios Registrados</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <HeartIcon className="w-6 h-6 text-secondary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{stats.totalProducts.toLocaleString()}</h3>
          <p className="text-gray-600">Productos Disponibles</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-accent-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{stats.totalExchanges.toLocaleString()}</h3>
          <p className="text-gray-600">Intercambios Completados</p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <GlobeAltIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{stats.activeUsers.toLocaleString()}</h3>
          <p className="text-gray-600">Usuarios Activos</p>
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
            onClick={() => window.location.href = '/agregar-producto'}
          >
            <PlusIcon className="w-5 h-5 inline mr-2" />
            Publicar Producto
          </button>
        </div>
      </div>

      {/* Características */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <SparklesIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sostenible</h3>
          <p className="text-gray-600">
            Promovemos la economía circular y reducimos el impacto ambiental.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-secondary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguro</h3>
          <p className="text-gray-600">
            Sistema de verificación y calificaciones para intercambios seguros.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-accent-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Comunitario</h3>
          <p className="text-gray-600">
            Conecta con personas que comparten tus valores de sostenibilidad.
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente de configuración
function SettingsScreen({ currentUser, onLogout }: { currentUser: User | null, onLogout: () => void }) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de la Cuenta</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              type="text"
              value={currentUser?.name || ''}
              className="input-field"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={currentUser?.email || ''}
              className="input-field"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
            <input
              type="text"
              value={currentUser?.location || ''}
              className="input-field"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones de la Cuenta</h3>
        <button
          onClick={onLogout}
          className="btn-secondary"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

// Componente de ayuda
function HelpScreen() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h3>
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">¿Cómo funciona EcoSwap?</h4>
            <p className="text-gray-600">
              EcoSwap es una plataforma donde puedes intercambiar productos en lugar de comprarlos nuevos.
              Publica lo que tienes y encuentra lo que necesitas.
            </p>
          </div>
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-900 mb-2">¿Es seguro intercambiar?</h4>
            <p className="text-gray-600">
              Sí, tenemos un sistema de verificación de usuarios y calificaciones para garantizar
              intercambios seguros y confiables.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">¿Cómo me registro?</h4>
            <p className="text-gray-600">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuestra Misión</h3>
        <p className="text-gray-600 mb-4">
          EcoSwap nació de la visión de tres estudiantes universitarios de Pereira, Colombia,
          que querían crear una plataforma que promoviera la economía circular y el consumo sostenible.
        </p>
        <p className="text-gray-600">
          Creemos que cada intercambio es un paso hacia un futuro más sostenible, donde los productos
          tengan múltiples vidas y las personas se conecten a través de valores compartidos.
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto</h3>
        <div className="space-y-2 text-gray-600">
          <p>📍 Pereira, Risaralda, Colombia</p>
          <p>📧 info@ecoswap.co</p>
          <p>📱 +57 6 123 4567</p>
          <p>🌐 https://ecoswap.co</p>
        </div>
      </div>
    </div>
  )
}
