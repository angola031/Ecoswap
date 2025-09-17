'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  location: string
}

interface AuthModuleProps {
  onLogin: (user: User) => void
}

export default function AuthModule({ onLogin }: AuthModuleProps) {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'forgot-password' | 'reset-sent'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Estados del formulario de login
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  // Estados del formulario de registro
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: ''
  })

  // Estado del formulario de olvidar contraseña
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Usuario mockup para demo
    const mockUser: User = {
      id: '1',
      name: 'Carlos Rodríguez',
      email: loginForm.email,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      location: 'Pereira, Risaralda'
    }

    onLogin(mockUser)
    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Usuario mockup para demo
    const mockUser: User = {
      id: '1',
      name: registerForm.name,
      email: registerForm.email,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      location: registerForm.location
    }

    onLogin(mockUser)
    setIsLoading(false)
  }

  const updateLoginForm = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }))
  }

  const updateRegisterForm = (field: string, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }))
  }

  const updateForgotPasswordForm = (field: string, value: string) => {
    setForgotPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simular envío de email
    setCurrentScreen('reset-sent')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">🌱</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EcoSwap Colombia</h1>
          <p className="text-gray-600">Plataforma de Intercambio Sostenible</p>
        </motion.div>

        {/* Tabs - Solo mostrar en login y register */}
        {currentScreen !== 'forgot-password' && currentScreen !== 'reset-sent' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentScreen('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${currentScreen === 'login'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setCurrentScreen('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${currentScreen === 'register'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Registrarse
              </button>
            </div>

            {/* Formulario de Login */}
            {currentScreen === 'login' && (
              <motion.form
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => updateLoginForm('email', e.target.value)}
                      className="input-field pl-10"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => updateLoginForm('password', e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentScreen('forgot-password')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </motion.form>
            )}

            {/* Formulario de Registro */}
            {currentScreen === 'register' && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="register-name"
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => updateRegisterForm('name', e.target.value)}
                      className="input-field pl-10"
                      placeholder="Tu nombre completo"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => updateRegisterForm('email', e.target.value)}
                      className="input-field pl-10"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <PhoneIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="register-phone"
                      type="tel"
                      value={registerForm.phone}
                      onChange={(e) => updateRegisterForm('phone', e.target.value)}
                      className="input-field pl-10"
                      placeholder="+57 300 123 4567"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-location" className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <div className="relative">
                    <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      id="register-location"
                      value={registerForm.location}
                      onChange={(e) => updateRegisterForm('location', e.target.value)}
                      className="input-field pl-10"
                      required
                    >
                      <option value="">Selecciona una ciudad</option>
                      <option value="Pereira, Risaralda">Pereira, Risaralda</option>
                      <option value="Bogotá D.C.">Bogotá D.C.</option>
                      <option value="Medellín, Antioquia">Medellín, Antioquia</option>
                      <option value="Cali, Valle del Cauca">Cali, Valle del Cauca</option>
                      <option value="Barranquilla, Atlántico">Barranquilla, Atlántico</option>
                      <option value="Cartagena, Bolívar">Cartagena, Bolívar</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => updateRegisterForm('password', e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={(e) => updateRegisterForm('confirmPassword', e.target.value)}
                      className="input-field pl-10"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              </motion.form>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Al continuar, aceptas nuestros{' '}
                <a href="/terminos" className="text-primary-600 hover:text-primary-700 font-medium">
                  Términos de Servicio
                </a>{' '}
                y{' '}
                <a href="/politicas" className="text-primary-600 hover:text-primary-700 font-medium">
                  Política de Privacidad
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Pantalla de Olvidar Contraseña */}
        {currentScreen === 'forgot-password' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <button
                onClick={() => setCurrentScreen('login')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-4"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Recuperar Contraseña</h2>
              <p className="text-gray-600">
                Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordForm.email}
                    onChange={(e) => updateForgotPasswordForm('email', e.target.value)}
                    className="input-field pl-10"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setCurrentScreen('login')}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Pantalla de Confirmación de Envío */}
        {currentScreen === 'reset-sent' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Email Enviado!</h2>
              <p className="text-gray-600">
                Hemos enviado las instrucciones para restablecer tu contraseña a{' '}
                <span className="font-medium text-gray-900">{forgotPasswordForm.email}</span>
              </p>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">¿Qué sigue?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Revisa tu bandeja de entrada</li>
                <li>• Busca en la carpeta de spam si no lo encuentras</li>
                <li>• Haz clic en el enlace del email para restablecer tu contraseña</li>
                <li>• El enlace expira en 24 horas por seguridad</li>
              </ul>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <button
                onClick={() => setCurrentScreen('login')}
                className="btn-primary w-full py-3 text-base font-medium"
              >
                Volver al Inicio de Sesión
              </button>

              <button
                onClick={() => setCurrentScreen('forgot-password')}
                className="btn-secondary w-full py-3 text-base font-medium"
              >
                Enviar Nuevamente
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
