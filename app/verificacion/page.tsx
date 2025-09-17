'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircleIcon, ExclamationTriangleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

// Componente de confeti
const Confetti = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: -10,
                        rotate: 0,
                    }}
                    animate={{
                        y: window.innerHeight + 10,
                        rotate: 360,
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        delay: Math.random() * 2,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 5,
                    }}
                />
            ))}
        </div>
    )
}
import { verifyEmailAndCreateProfile } from '@/lib/auth'

export default function VerificacionPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const [countdown, setCountdown] = useState(5)

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const token = searchParams.get('token')
                const type = searchParams.get('type')
                const errorParam = searchParams.get('error')
                const errorCode = searchParams.get('error_code')

                // Verificar si hay errores en la URL
                if (errorParam) {
                    setStatus('error')
                    if (errorCode === 'otp_expired') {
                        setMessage('El enlace de verificación ha expirado. Los enlaces son válidos por 1 hora.')
                    } else if (errorCode === 'access_denied') {
                        setMessage('Enlace de verificación inválido o expirado.')
                    } else {
                        setMessage('Error de verificación. El enlace puede ser inválido o haber expirado.')
                    }
                    return
                }

                if (!token || type !== 'signup') {
                    setStatus('error')
                    setMessage('Enlace de verificación inválido')
                    return
                }

                // Verificar el email y crear perfil automáticamente
                const { user, error } = await verifyEmailAndCreateProfile(token)

                if (error) {
                    console.error('Error en verificación:', error)
                    setStatus('error')
                    if (error.includes('expired') || error.includes('expirado')) {
                        setMessage('El enlace de verificación ha expirado. Los enlaces son válidos por 1 hora.')
                    } else {
                        setMessage('Error al verificar el email. El enlace puede haber expirado.')
                    }
                    return
                }

                if (user) {
                    setStatus('success')
                    setMessage(`¡Bienvenido ${user.name || 'Usuario'}! Tu cuenta ha sido verificada exitosamente.`)

                    // Iniciar contador regresivo
                    const countdownInterval = setInterval(() => {
                        setCountdown((prev) => {
                            if (prev <= 1) {
                                clearInterval(countdownInterval)
                                router.push('/?m=products')
                                return 0
                            }
                            return prev - 1
                        })
                    }, 1000)
                }
            } catch (error) {
                console.error('Error inesperado:', error)
                setStatus('error')
                setMessage('Error inesperado al verificar el email')
            }
        }

        verifyEmail()
    }, [searchParams, router])

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <EnvelopeIcon className="w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificando Email</h2>
                        <p className="text-gray-600">Por favor espera mientras verificamos tu email...</p>
                    </div>
                )

            case 'success':
                return (
                    <div className="text-center">
                        {/* Animación de éxito */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                                delay: 0.2
                            }}
                            className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                        >
                            <CheckCircleIcon className="w-10 h-10 text-white" />
                        </motion.div>

                        {/* Título con animación */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-bold text-gray-900 mb-3"
                        >
                            ¡Autenticación Exitosa! 🎉
                        </motion.h2>

                        {/* Mensaje con animación */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-gray-600 mb-8 text-lg"
                        >
                            Tu cuenta ha sido verificada correctamente. ¡Bienvenido a EcoSwap!
                        </motion.p>

                        {/* Información adicional */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
                        >
                            <div className="flex items-center justify-center space-x-2 text-green-700">
                                <CheckCircleIcon className="w-5 h-5" />
                                <span className="font-medium">Cuenta activada</span>
                            </div>
                            <p className="text-green-600 text-sm mt-1">
                                Ya puedes iniciar sesión y comenzar a intercambiar
                            </p>
                        </motion.div>

                        {/* Botones con animación */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="space-y-3"
                        >
                            <button
                                onClick={() => router.push('/?m=products')}
                                className="btn-primary w-full py-4 text-base font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                🚀 Comenzar en EcoSwap
                            </button>

                            <button
                                onClick={() => router.push('/?m=products&auth=login')}
                                className="btn-secondary w-full py-3 text-base font-medium"
                            >
                                Iniciar Sesión
                            </button>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                className="text-sm text-gray-500 mt-4"
                            >
                                Serás redirigido automáticamente en{' '}
                                <motion.span
                                    key={countdown}
                                    initial={{ scale: 1.2, color: '#059669' }}
                                    animate={{ scale: 1, color: '#059669' }}
                                    className="font-semibold text-primary-600"
                                >
                                    {countdown} segundos
                                </motion.span>
                                ...
                            </motion.p>
                        </motion.div>
                    </div>
                )

            case 'error':
                return (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error de Verificación</h2>
                        <p className="text-gray-600 mb-4">{message}</p>

                        {/* Información adicional sobre el error */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center space-x-2 text-yellow-700 mb-2">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                <span className="font-medium">Enlace Expirado</span>
                            </div>
                            <p className="text-yellow-600 text-sm">
                                El enlace de verificación ha expirado. Los enlaces son válidos por 1 hora.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/?m=products&auth=register')}
                                className="btn-primary w-full py-3 text-base font-medium"
                            >
                                🔄 Reenviar Email de Verificación
                            </button>
                            <button
                                onClick={() => router.push('/?m=products')}
                                className="btn-secondary w-full py-3 text-base font-medium"
                            >
                                Volver a EcoSwap
                            </button>
                        </div>
                    </div>
                )
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
            {/* Confeti solo en caso de éxito */}
            {status === 'success' && <Confetti />}

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

                {/* Contenido */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl p-8"
                >
                    {renderContent()}
                </motion.div>
            </div>
        </div>
    )
}