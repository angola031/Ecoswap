# 🔐 Configuración de Logins Separados

## 🎯 **Objetivo:**

Mantener dos sistemas de login separados: uno para administradores y otro para clientes, con redirección automática de administradores al dashboard.

## ✅ **Configuración Implementada:**

### **1. Login de Administradores** (`/login`)

**Características:**
- ✅ **Página dedicada** para administradores
- ✅ **Verificación de permisos** de administrador
- ✅ **Redirección automática** a `/admin/verificaciones`
- ✅ **Protección** de rutas sensibles
- ✅ **Manejo de errores** específico para administradores

**Flujo:**
1. **Usuario accede** a `/login`
2. **Ingresa** credenciales de administrador
3. **Sistema verifica** permisos en base de datos
4. **Si es admin activo:** Redirige a `/admin/verificaciones`
5. **Si no es admin:** Muestra error de permisos

### **2. Login de Clientes** (AuthModule en página principal)

**Características:**
- ✅ **Integrado** en la página principal
- ✅ **Para usuarios regulares** (no administradores)
- ✅ **Funcionalidades completas** (login, registro, recuperación)
- ✅ **Experiencia** de usuario optimizada
- ✅ **Sin redirección** automática

**Flujo:**
1. **Usuario accede** a la página principal
2. **Hace clic** en "Iniciar Sesión"
3. **Se abre** el AuthModule
4. **Ingresa** credenciales de cliente
5. **Continúa** en la página principal

### **3. Separación de Accesos**

**Rutas de Administradores:**
- `/login` - Login específico de administradores
- `/admin/*` - Panel de administración
- `/api/admin/*` - APIs de administración
- **Protección:** Redirige a `/login` si no hay sesión

**Rutas de Clientes:**
- `/` - Página principal con login integrado
- **AuthModule** - Sistema de login para clientes
- **Sin protección** especial (acceso público)

## 🔧 **Configuración Técnica:**

### **Login de Administradores** (`app/login/page.tsx`)

```typescript
const handleLogin = async (e: React.FormEvent) => {
  // Autenticación con Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email, password,
  })

  if (data.user) {
    // Verificar tipo de usuario
    const { data: userData } = await supabase
      .from('usuario')
      .select('es_admin, activo, nombre, apellido')
      .eq('email', data.user.email)
      .single()

    if (userData?.es_admin && userData?.activo) {
      // Administrador → Dashboard
      router.push('/admin/verificaciones')
    } else {
      // No es administrador → Error
      setError('No tienes permisos de administrador')
    }
  }
}
```

### **Login de Clientes** (`components/auth/AuthModule.tsx`)

```typescript
const handleLogin = async (e: React.FormEvent) => {
  // Usar sistema de auth existente
  const { user, error: loginError } = await loginUser(loginData)

  if (user) {
    // Cliente → Continuar en página principal
    onLogin(user)
  }
}
```

### **Middleware** (`middleware.ts`)

```typescript
// Protección de rutas de administración
if (!session && req.nextUrl.pathname.startsWith('/admin')) {
  return NextResponse.redirect(new URL('/login', req.url))
}

// Redirección de administradores desde login
if (session && req.nextUrl.pathname === '/login') {
  if (userData?.es_admin && userData?.activo) {
    return NextResponse.redirect(new URL('/admin/verificaciones', req.url))
  }
}
```

## 🔄 **Flujo de Usuarios:**

### **1. Administrador:**
1. **Accede** a `/login`
2. **Ingresa** credenciales
3. **Sistema verifica** permisos de administrador
4. **Es redirigido** a `/admin/verificaciones`
5. **Ve** panel de administración

### **2. Cliente:**
1. **Accede** a la página principal
2. **Hace clic** en "Iniciar Sesión"
3. **Se abre** AuthModule
4. **Ingresa** credenciales
5. **Continúa** en la página principal

### **3. Usuario No Autenticado:**
1. **Intenta acceder** a `/admin/*`
2. **Es redirigido** a `/login`
3. **Ve** página de login de administradores
4. **Puede** hacer login o ir a página principal

## 🎯 **Rutas y Comportamientos:**

### **Rutas de Administradores:**
- `/login` - Login específico de administradores
- `/admin/verificaciones` - Dashboard de administradores
- `/api/admin/*` - APIs de administración
- **Protección:** Redirige a `/login` si no hay sesión

### **Rutas de Clientes:**
- `/` - Página principal con login integrado
- **AuthModule** - Sistema de login para clientes
- **Sin protección** especial

### **Rutas Públicas:**
- `/` - Acceso para todos los usuarios
- **Botones separados** para cada tipo de login

## 🚀 **Ventajas de la Separación:**

### **✅ Seguridad:**
- **Acceso controlado** a funciones de administración
- **Verificación específica** de permisos
- **Protección** de rutas sensibles
- **Separación clara** de responsabilidades

### **✅ Experiencia de Usuario:**
- **Interfaces específicas** para cada tipo de usuario
- **Funcionalidades adaptadas** a cada rol
- **Navegación intuitiva** según el tipo de usuario
- **Mensajes de error** específicos

### **✅ Mantenimiento:**
- **Código separado** por funcionalidad
- **Fácil modificación** de cada sistema
- **Escalabilidad** independiente
- **Debugging** más sencillo

### **✅ Flexibilidad:**
- **Configuración independiente** de cada sistema
- **Funcionalidades específicas** por tipo de usuario
- **Actualizaciones** sin afectar el otro sistema
- **Personalización** según necesidades

## 🔍 **Verificación:**

### **Probar Login de Administrador:**
1. **Acceder** a `/login`
2. **Ingresar** credenciales de administrador
3. **Verificar** redirección a `/admin/verificaciones`
4. **Confirmar** acceso al panel de administración

### **Probar Login de Cliente:**
1. **Acceder** a la página principal
2. **Hacer clic** en "Iniciar Sesión"
3. **Ingresar** credenciales de cliente
4. **Verificar** que permanece en la página principal

### **Probar Protección de Rutas:**
1. **Cerrar sesión**
2. **Intentar acceder** a `/admin/verificaciones`
3. **Verificar** redirección a `/login`
4. **Confirmar** protección de rutas

### **Probar Separación de Accesos:**
1. **Hacer login** como administrador
2. **Acceder** a la página principal
3. **Verificar** que puede ver ambos botones
4. **Confirmar** separación de funcionalidades

## 📁 **Estructura de Archivos:**

```
app/
├── login/
│   └── page.tsx              # Login de administradores
├── admin/
│   └── verificaciones/
│       └── page.tsx          # Dashboard de administradores
├── page.tsx                  # Página principal con login de clientes
└── middleware.ts             # Protección de rutas

components/
└── auth/
    └── AuthModule.tsx        # Login de clientes
```

## ✅ **Estado Final:**

**¡Los sistemas de login están completamente separados!**

- ✅ **Login de administradores** en `/login`
- ✅ **Login de clientes** en AuthModule
- ✅ **Redirección automática** de administradores al dashboard
- ✅ **Protección de rutas** mantenida
- ✅ **Separación clara** de funcionalidades
- ✅ **Experiencia optimizada** para cada tipo de usuario
- ✅ **Mantenimiento independiente** de cada sistema

**¡Ahora tienes dos sistemas de login completamente separados con redirección automática de administradores al dashboard!** 🎉

