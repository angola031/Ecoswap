'use client'

import { useState, useEffect } from 'react'
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
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { registerUser, loginUser, resendConfirmationEmail, checkEmailExists, requestRegistrationCode, completeRegistrationWithCode, type User, type RegisterData, type LoginData } from '@/lib/auth'
import { config } from '@/lib/config'
import { getSupabaseClient } from '@/lib/supabase-client'

interface AuthModuleProps {
  onLogin: (user: User) => void
}

export default function AuthModule({ onLogin }: AuthModuleProps) {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'forgot-password' | 'reset-sent' | 'email-verification' | 'code-verification'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState<string>('')
  const [emailValidation, setEmailValidation] = useState<{
    checking: boolean
    exists: boolean
    message: string
    isValidFormat: boolean
  }>({ checking: false, exists: false, message: '', isValidFormat: true })
  
  const [phoneValidation, setPhoneValidation] = useState<{
    checking: boolean
    exists: boolean
    message: string
    isValidFormat: boolean
  }>({ checking: false, exists: false, message: '', isValidFormat: true })
  
  // Estados para ubicaciones de Colombia
  const [departamentos, setDepartamentos] = useState<Array<{id: number, departamento: string, ciudades: string[]}>>([])
  const [ciudades, setCiudades] = useState<string[]>([])
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('')
  const [selectedCiudad, setSelectedCiudad] = useState<string>('')

  // Estados del formulario de login
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })

  // Estados del formulario de registro
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
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

  // Cargar datos de Colombia al montar el componente
  useEffect(() => {
    let isMounted = true

    const loadColombiaData = async () => {
      try {
        const response = await fetch('/data/colombia.json')
        if (response.ok) {
          const data = await response.json()
          if (isMounted) {
            setDepartamentos(data)
          }
        }
      } catch (error) {
        console.error('Error cargando datos de Colombia:', error)
      }
    }
    
    loadColombiaData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const loginData: LoginData = {
        email: loginForm.email,
        password: loginForm.password
      }

      const { user, error: loginError } = await loginUser(loginData)

      if (loginError) {
        setError(loginError)
        setIsLoading(false)
        return
      }

      if (user) {
        setSuccess('¡Inicio de sesión exitoso!')
        onLogin(user)
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError('Error interno del servidor. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validaciones del formulario
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (registerForm.password.length < config.auth.passwordMinLength) {
      setError(`La contraseña debe tener al menos ${config.auth.passwordMinLength} caracteres`)
      setIsLoading(false)
      return
    }

    // Verificar formato de email
    if (!emailValidation.isValidFormat) {
      setError('Por favor ingresa un formato de correo electrónico válido')
      setIsLoading(false)
      return
    }

    // Verificar si el email ya existe
    if (emailValidation.exists) {
      setError(emailValidation.message)
      setIsLoading(false)
      return
    }

    // Verificar formato de teléfono
    if (!phoneValidation.isValidFormat) {
      setError('Por favor ingresa un formato de teléfono válido')
      setIsLoading(false)
      return
    }

    // Verificar si el teléfono ya existe
    if (phoneValidation.exists) {
      setError(phoneValidation.message)
      setIsLoading(false)
      return
    }

    try {
      const registerData = {
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        email: registerForm.email,
        phone: registerForm.phone,
        location: registerForm.location,
        password: registerForm.password
      }

      console.log('🔍 DEBUG: Frontend - Estado de validaciones:', {
        emailValidation,
        phoneValidation
      })

      const { user, error: registerError, needsVerification } = await registerUser(registerData)
      
      console.log('🔍 DEBUG: Frontend - Resultado del registro:', {
        user,
        error: registerError,
        needsVerification
      })

      if (registerError) {
        setError(registerError)
        setIsLoading(false)
        return
      }

      if (needsVerification) {
        setPendingEmail(registerForm.email)
        setCurrentScreen('code-verification')
        setSuccess('Te enviamos un código a tu correo. Ingrésalo para continuar.')
        setIsLoading(false)
        return
      }

      if (user) {
        setSuccess('¡Cuenta creada exitosamente!')
        onLogin(user)
      }
    } catch (error) {
      console.error('Error en registro:', error)
      setError('Error interno del servidor. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingEmail) return
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const verificationData = {
        email: pendingEmail,
        code: verificationCode,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
        phone: registerForm.phone,
        location: registerForm.location,
        password: registerForm.password
      }
      
      
      const { user, error } = await completeRegistrationWithCode(verificationData)
      

      if (error) {
        setError(error)
        setIsLoading(false)
        return
      }

      if (user) {
        setSuccess('¡Cuenta verificada y creada!')
        onLogin(user)
      }
    } catch (err) {
      console.error('Error completando registro:', err)
      setError('Error interno del servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!pendingEmail) return
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await requestRegistrationCode({ email: pendingEmail })
      if (error) setError(error)
      else setSuccess('Código reenviado. Revisa tu correo.')
    } catch (e) {
      setError('No se pudo reenviar el código')
    } finally {
      setIsLoading(false)
    }
  }

  const updateLoginForm = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }))
  }

  // Función para validar formato de email
  const isValidEmailFormat = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  // Función para validar formato de teléfono colombiano
  const isValidPhoneFormat = (phone: string): boolean => {
    // Remover espacios, guiones y paréntesis
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    // Si está vacío, es válido (no mostrar error)
    if (cleanPhone.length === 0) return true
    
    // Si tiene menos de 3 dígitos, es válido (pero no completo)
    if (cleanPhone.length < 3) return true
    
    // Si empieza con 3 y tiene entre 3-10 dígitos, es válido
    if (cleanPhone.startsWith('3') && cleanPhone.length <= 10 && /^[0-9]+$/.test(cleanPhone)) {
      return true
    }
    
    // Si no empieza con 3 o tiene más de 10 dígitos, es inválido
    return false
  }

  // Función para verificar si el teléfono ya existe
  const checkPhoneExists = async (phone: string) => {
    try {
      const response = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (!response.ok) {
        throw new Error('Error al verificar teléfono')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return { exists: false, error: true }
    }
  }

  const updateRegisterForm = (field: string, value: string) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }))

    // Validar email en tiempo real cuando se cambia
    if (field === 'email') {
      // Validar formato primero
      const isValidFormat = isValidEmailFormat(value)
      setEmailValidation(prev => ({ 
        ...prev, 
        isValidFormat,
        message: isValidFormat ? prev.message : 'Formato de correo electrónico inválido'
      }))
      
      // Solo validar existencia si el formato es válido y tiene más de 5 caracteres
      if (isValidFormat && value.length > 5) {
        validateEmail(value)
      } else if (!isValidFormat && value.length > 0) {
        setEmailValidation(prev => ({ 
          ...prev, 
          checking: false, 
          exists: false, 
          message: 'Formato de correo electrónico inválido'
        }))
      } else if (value.length === 0) {
        setEmailValidation({ checking: false, exists: false, message: '', isValidFormat: true })
      }
    }

    // Validar teléfono en tiempo real cuando se cambia
    if (field === 'phone') {
      // Validar formato primero
      const isValidFormat = isValidPhoneFormat(value)
      
      setPhoneValidation(prev => ({ 
        ...prev, 
        isValidFormat,
        message: isValidFormat ? prev.message : 'Formato de teléfono inválido. Debe ser un número colombiano de 10 dígitos que empiece con 3.'
      }))
      
      // Solo validar existencia si el formato es válido y tiene exactamente 10 dígitos
      const cleanPhone = value.replace(/[\s\-\(\)]/g, '')
      
      if (isValidFormat && cleanPhone.length === 10) {
        validatePhone(value)
      } else if (!isValidFormat && value.length > 0) {
        setPhoneValidation(prev => ({ 
          ...prev, 
          checking: false, 
          exists: false, 
          message: 'Formato de teléfono inválido. Debe ser un número colombiano de 10 dígitos que empiece con 3.'
        }))
      } else if (value.length === 0) {
        setPhoneValidation({ checking: false, exists: false, message: '', isValidFormat: true })
      }
    }
  }

  // Manejar selección de departamento
  const handleDepartamentoChange = (departamento: string) => {
    setSelectedDepartamento(departamento)
    setSelectedCiudad('')
    
    // Encontrar el departamento seleccionado y cargar sus ciudades
    const dept = departamentos.find(d => d.departamento === departamento)
    if (dept) {
      setCiudades(dept.ciudades)
    } else {
      setCiudades([])
    }
    
    // Actualizar el formulario con la ubicación completa
    if (departamento) {
      updateRegisterForm('location', departamento)
    }
  }

  // Manejar selección de ciudad
  const handleCiudadChange = (ciudad: string) => {
    setSelectedCiudad(ciudad)
    
    // Actualizar el formulario con la ubicación completa
    if (ciudad && selectedDepartamento) {
      updateRegisterForm('location', `${ciudad}, ${selectedDepartamento}`)
    }
  }

  // Función para validar email en tiempo real
  const validateEmail = async (email: string) => {
    // No validar si el formato no es válido
    if (!isValidEmailFormat(email)) {
      setEmailValidation({ 
        checking: false, 
        exists: false, 
        message: 'Formato de correo electrónico inválido',
        isValidFormat: false
      })
      return
    }

    setEmailValidation(prev => ({ 
      ...prev, 
      checking: true, 
      exists: false, 
      message: '',
      isValidFormat: true
    }))

    try {
      const { exists, verified, active, error } = await checkEmailExists(email)

      if (error) {
        setEmailValidation({ 
          checking: false, 
          exists: false, 
          message: '',
          isValidFormat: true
        })
        return
      }

      if (exists) {
        if (verified && active) {
          setEmailValidation({
            checking: false,
            exists: true,
            message: 'Este correo ya está registrado y verificado. Inicia sesión en su lugar.',
            isValidFormat: true
          })
        } else if (!verified && active) {
          setEmailValidation({
            checking: false,
            exists: true,
            message: 'Este correo ya está registrado pero no verificado. Revisa tu email.',
            isValidFormat: true
          })
        } else {
          setEmailValidation({
            checking: false,
            exists: true,
            message: 'Esta cuenta está desactivada. Contacta al soporte.',
            isValidFormat: true
          })
        }
      } else {
        setEmailValidation({ 
          checking: false, 
          exists: false, 
          message: '',
          isValidFormat: true
        })
      }
    } catch (error) {
      setEmailValidation({ 
        checking: false, 
        exists: false, 
        message: '',
        isValidFormat: true
      })
    }
  }

  // Función para validar teléfono en tiempo real
  const validatePhone = async (phone: string) => {
    // No validar si el formato no es válido
    if (!isValidPhoneFormat(phone)) {
      setPhoneValidation({ 
        checking: false, 
        exists: false, 
        message: 'Formato de teléfono inválido. Debe ser un número colombiano de 10 dígitos que empiece con 3.',
        isValidFormat: false
      })
      return
    }

    setPhoneValidation(prev => ({ 
      ...prev, 
      checking: true, 
      exists: false, 
      message: '',
      isValidFormat: true
    }))

    try {
      const result = await checkPhoneExists(phone)

      if (result.error) {
        setPhoneValidation({ 
          checking: false, 
          exists: false, 
          message: '',
          isValidFormat: true
        })
        return
      }

      if (result.exists) {
        setPhoneValidation({
          checking: false,
          exists: true,
          message: result.message || 'Este número de teléfono ya está registrado.',
          isValidFormat: true
        })
      } else {
        setPhoneValidation({ 
          checking: false, 
          exists: false, 
          message: '',
          isValidFormat: true
        })
      }
    } catch (error) {
      console.error('Error en validación de teléfono:', error)
      setPhoneValidation({ 
        checking: false, 
        exists: false, 
        message: '',
        isValidFormat: true
      })
    }
  }

  const updateForgotPasswordForm = (field: string, value: string) => {
    setForgotPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('🔧 Cliente: Enviando solicitud de restablecimiento...')
      console.log('📧 Email:', forgotPasswordForm.email)
      
      // Usar API route que maneja la service role key
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordForm.email
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('❌ Cliente: Error en API:', data.error)
        setError(data.error || 'Error enviando email de restablecimiento')
        setIsLoading(false)
        return
      }
      
      console.log('✅ Cliente: Email enviado exitosamente')

      // Éxito - mostrar pantalla de confirmación
      setCurrentScreen('reset-sent')
      setSuccess('Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo electrónico.')
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error en restablecimiento de contraseña:', err)
      setError('Error interno del servidor. Inténtalo de nuevo.')
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await resendConfirmationEmail(pendingEmail)

      if (error) {
        setError(error)
      } else {
        setSuccess('Email de confirmación reenviado. Revisa tu bandeja de entrada.')
      }
    } catch (error) {
      console.error('Error al reenviar email:', error)
      setError('Error al reenviar el email de confirmación')
    } finally {
      setIsLoading(false)
    }
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
        {currentScreen !== 'forgot-password' && currentScreen !== 'reset-sent' && currentScreen !== 'email-verification' && (
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

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="register-firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre
                    </label>
                    <div className="relative">
                      <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        id="register-firstName"
                        type="text"
                        value={registerForm.firstName}
                        onChange={(e) => updateRegisterForm('firstName', e.target.value)}
                        className="input-field pl-10"
                        placeholder="Tu nombre"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="register-lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido
                    </label>
                    <div className="relative">
                      <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        id="register-lastName"
                        type="text"
                        value={registerForm.lastName}
                        onChange={(e) => updateRegisterForm('lastName', e.target.value)}
                        className="input-field pl-10"
                        placeholder="Tu apellido"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${emailValidation.checking ? 'text-blue-400' :
                      emailValidation.exists ? 'text-red-400' :
                        !emailValidation.isValidFormat && registerForm.email.length > 0 ? 'text-red-400' :
                          registerForm.email.length > 5 && !emailValidation.exists && emailValidation.isValidFormat ? 'text-green-400' : 'text-gray-400'
                      }`} />
                    <input
                      id="register-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => updateRegisterForm('email', e.target.value)}
                      className={`input-field pl-10 ${emailValidation.exists ? 'border-red-300 focus:border-red-500' :
                        !emailValidation.isValidFormat && registerForm.email.length > 0 ? 'border-red-300 focus:border-red-500' :
                          registerForm.email.length > 5 && !emailValidation.exists && emailValidation.isValidFormat ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                      placeholder="tu@email.com"
                      required
                    />
                    {emailValidation.checking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {emailValidation.message && (
                    <p className={`mt-1 text-sm ${emailValidation.exists || !emailValidation.isValidFormat ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {emailValidation.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="register-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <PhoneIcon className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${phoneValidation.checking ? 'text-blue-400' :
                      phoneValidation.exists ? 'text-red-400' :
                        !phoneValidation.isValidFormat && registerForm.phone.length > 0 ? 'text-red-400' :
                          registerForm.phone.length === 10 && !phoneValidation.exists && phoneValidation.isValidFormat ? 'text-green-400' : 'text-gray-400'
                      }`} />
                    <input
                      id="register-phone"
                      type="tel"
                      value={registerForm.phone}
                      onChange={(e) => updateRegisterForm('phone', e.target.value)}
                      className={`input-field pl-10 ${phoneValidation.exists ? 'border-red-300 focus:border-red-500' :
                        !phoneValidation.isValidFormat && registerForm.phone.length > 0 ? 'border-red-300 focus:border-red-500' :
                          registerForm.phone.length === 10 && !phoneValidation.exists && phoneValidation.isValidFormat ? 'border-green-300 focus:border-green-500' : ''
                        }`}
                      placeholder="300 123 4567"
                      required
                    />
                    {phoneValidation.checking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {phoneValidation.message && (
                    <p className={`mt-1 text-sm ${phoneValidation.exists || !phoneValidation.isValidFormat ? 'text-red-600' : 'text-green-600'
                      }`}>
                      {phoneValidation.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="register-departamento" className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <div className="relative">
                    <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      id="register-departamento"
                      value={selectedDepartamento}
                      onChange={(e) => handleDepartamentoChange(e.target.value)}
                      className="input-field pl-10"
                      required
                    >
                      <option value="">Selecciona un departamento</option>
                      {departamentos.map((dept) => (
                        <option key={dept.id} value={dept.departamento}>
                          {dept.departamento}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDepartamento && (
                  <div>
                    <label htmlFor="register-ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <div className="relative">
                      <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <select
                        id="register-ciudad"
                        value={selectedCiudad}
                        onChange={(e) => handleCiudadChange(e.target.value)}
                        className="input-field pl-10"
                        required
                      >
                        <option value="">Selecciona una ciudad</option>
                        {ciudades.map((ciudad) => (
                          <option key={ciudad} value={ciudad}>
                            {ciudad}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

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
                  disabled={isLoading || emailValidation.exists || emailValidation.checking}
                  className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creando cuenta...' :
                    emailValidation.checking ? 'Verificando email...' :
                      emailValidation.exists ? 'Email ya registrado' : 'Crear Cuenta'}
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

        {/* Pantalla de Verificación por Código */}
        {currentScreen === 'code-verification' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu Código</h2>
              <p className="text-gray-600">
                Hemos enviado un código de verificación a{' '}
                <span className="font-medium text-gray-900">{pendingEmail}</span>
              </p>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}

            {/* Formulario de código */}
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="input-field"
                  placeholder="Ingresa el código recibido"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length === 0}
                className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verificando...' : 'Verificar y crear cuenta'}
              </button>
            </form>

            {/* Acciones */}
            <div className="space-y-3 mt-4">
              <button onClick={handleResendCode} disabled={isLoading} className="btn-primary w-full py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Reenviando...' : 'Reenviar código'}</button>

              <button
                onClick={() => setCurrentScreen('login')}
                className="btn-secondary w-full py-3 text-base font-medium"
              >
                Volver al Inicio de Sesión
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
