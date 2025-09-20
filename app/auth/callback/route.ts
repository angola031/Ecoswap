import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const reactivation = searchParams.get('reactivation')

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

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Si es una reactivación, redirigir a la página de reset de contraseña
            if (reactivation === 'true') {
                return NextResponse.redirect(`${origin}/auth/reset-password?reactivation=true`)
            }

            // Si no es reactivación, redirigir al dashboard o página principal
            return NextResponse.redirect(`${origin}/dashboard`)
        }
    }

    // Si hay error o no hay código, redirigir a la página de error
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
