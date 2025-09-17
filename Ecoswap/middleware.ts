import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Mantener sesión
  const resp = await updateSession(request);

  // Proteger rutas admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          }
        }
      }
    )
    const { data } = await supabase.auth.getUser()
    const user = data.user
    let isAdmin = false
    if (user?.email) {
      // Verificar en DB: USUARIO.es_admin o rol habilitado
      const { data: dbUser } = await supabase
        .from('usuario')
        .select('user_id, es_admin')
        .eq('email', user.email)
        .single()
      if (dbUser?.es_admin) {
        isAdmin = true
      } else if (dbUser?.user_id) {
        // Chequear roles
        const { data: roles } = await supabase
          .from('usuario_rol')
          .select('rol_id, activo')
          .eq('usuario_id', dbUser.user_id)
          .eq('activo', true)
        if (roles && roles.length > 0) {
          // Obtener nombres de roles
          const ids = roles.map(r => r.rol_id)
          const { data: roleNames } = await supabase
            .from('rol_usuario')
            .select('rol_id, nombre, activo')
            .in('rol_id', ids)
          isAdmin = !!(roleNames || []).find(r => r.activo && ['super_admin', 'admin_validacion', 'admin_soporte', 'moderador'].includes((r.nombre || '').toString()))
        }
      }
    }
    if (!isAdmin && request.nextUrl.pathname !== '/admin/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return resp;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
