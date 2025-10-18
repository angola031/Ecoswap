import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const reactivation = searchParams.get('reactivation')
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const errorDescription = searchParams.get('error_description')

    // Si hay errores en la URL, redirigir a la página de error con información específica
    if (error || errorCode || errorDescription) {
        const errorParams = new URLSearchParams()
        if (error) errorParams.set('error', error)
        if (errorCode) errorParams.set('error_code', errorCode)
        if (errorDescription) errorParams.set('error_description', errorDescription)
        
        return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams.toString()}`)
    }

    if (code) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return request.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: any) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name: string, options: any) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError) {
            // Si es una reactivación, redirigir a la página de reset de contraseña
            if (reactivation === 'true') {
                return NextResponse.redirect(`${origin}/auth/reset-password?reactivation=true`)
            }

            // Si hay un parámetro 'next', redirigir a esa página
            if (next && next !== '/') {
                return NextResponse.redirect(`${origin}${next}`)
            }

            // Si no es reactivación y no hay 'next', redirigir a la página principal
            return NextResponse.redirect(`${origin}/`)
        } else {
            // Si hay error en el intercambio, redirigir a la página de error con detalles
            const errorParams = new URLSearchParams()
            errorParams.set('error', exchangeError.message || 'unknown_error')
            errorParams.set('error_code', exchangeError.status?.toString() || 'exchange_failed')
            
            return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams.toString()}`)
        }
    }

    // Si no hay código ni errores, redirigir a la página de error
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code&error_code=missing_code`)
}
