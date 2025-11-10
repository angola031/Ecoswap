'use client'

import { useEffect, useState, useCallback } from 'react'

type ConsentStatus = 'accepted' | 'declined'

const STORAGE_KEY = 'ecoswap_cookie_consent'
const COOKIE_NAME = 'ecoswap_cookie_consent'
const OPTIONAL_COOKIES = [
    '_ga',
    '_gid',
    '_gat',
    'ecoswap_marketing',
    'ecoswap_analytics'
]

const getStoredConsent = () => {
    if (typeof window === 'undefined') return null

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) return stored as ConsentStatus

        const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
        return (match?.[1] as ConsentStatus) ?? null
    } catch {
        return null
    }
}

const persistConsent = (status: ConsentStatus) => {
    if (typeof window === 'undefined') return

    try {
        window.localStorage.setItem(STORAGE_KEY, status)
    } catch {
        // Ignorar errores de almacenamiento (por ejemplo, modo incógnito)
    }

    const maxAge = status === 'accepted' ? 60 * 60 * 24 * 365 : 0
    document.cookie = `${COOKIE_NAME}=${status}; path=/; max-age=${maxAge}; SameSite=Lax`

    window.dispatchEvent(new CustomEvent('cookie-consent', { detail: { status } }))
}

const clearOptionalCookies = () => {
    OPTIONAL_COOKIES.forEach(cookieName => {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
    })
}

export default function CookieConsentModal() {
    const [isVisible, setIsVisible] = useState(false)
    const [decision, setDecision] = useState<ConsentStatus | null>(null)

    useEffect(() => {
        // Verificar si hay un proceso de login en curso antes de mostrar el modal
        const checkLoginInProgress = () => {
            // Verificar si hay un formulario de login activo
            const loginButton = document.querySelector('button[type="submit"]:not([disabled])')
            const isLoading = loginButton?.textContent?.includes('Iniciando sesión')
            
            // Si hay un proceso de login activo, no mostrar el modal
            if (isLoading) {
                return false
            }
            
            // Verificar si hay sesión activa
            const hasActiveSession = document.cookie.includes('sb-') || 
                                    localStorage.getItem('ecoswap_user')
            
            if (hasActiveSession) {
                return false
            }
            
            return true
        }

        // Esperar un momento antes de verificar para evitar interferir con el login
        const timer = setTimeout(() => {
            if (checkLoginInProgress()) {
                const status = getStoredConsent()
                if (!status) {
                    setIsVisible(true)
                } else {
                    setDecision(status)
                }
            }
        }, 1000) // Esperar 1 segundo antes de mostrar el modal

        return () => clearTimeout(timer)
    }, [])

    const handleAccept = useCallback(() => {
        persistConsent('accepted')
        setDecision('accepted')
        setIsVisible(false)
    }, [])

    const handleDecline = useCallback(() => {
        persistConsent('declined')
        clearOptionalCookies()
        setDecision('declined')
        setIsVisible(false)
    }, [])

    if (!isVisible || decision !== null) {
        return null
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="p-6 space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">Permiso de Cookies</h2>
                    <p className="text-gray-600">
                        Utilizamos cookies para mejorar tu experiencia, analizar el uso de la plataforma y personalizar contenidos.
                        Puedes aceptar o rechazar las cookies opcionales. Siempre respetaremos tu decisión.
                    </p>
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
                        <p className="font-semibold text-gray-800">Cookies esenciales</p>
                        <p>
                            Estas cookies son necesarias para el funcionamiento básico de EcoSwap y se activan siempre.
                        </p>
                        <p className="font-semibold text-gray-800 pt-2">Cookies opcionales</p>
                        <p>
                            Incluyen analíticas y funcionalidades adicionales. Solo se activarán si das tu consentimiento.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                            onClick={handleDecline}
                            className="w-full sm:w-auto rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                            No aceptar
                        </button>
                        <button
                            onClick={handleAccept}
                            className="w-full sm:w-auto rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                        >
                            Aceptar cookies
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

