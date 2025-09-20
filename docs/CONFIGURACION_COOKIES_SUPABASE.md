# 🍪 Configuración de Cookies en Supabase

## 🔍 Problema Identificado

Las cookies de Supabase no se están estableciendo correctamente en el navegador, aunque la autenticación funciona en el servidor.

## 🔧 Solución: Configurar Supabase Dashboard

### 1. **Acceder al Dashboard de Supabase**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `vaqdzualcteljmivtoka`
3. Ve a **Settings** → **Authentication**

### 2. **Configurar Site URL**

```
Site URL: http://localhost:3000
```

### 3. **Configurar Redirect URLs**

Agrega estas URLs en la sección **Redirect URLs**:

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/supabase-redirect
http://localhost:3000/admin/verificaciones
```

### 4. **Configurar Cookie Settings**

En la sección **Cookie Settings**:

```
SameSite: lax
Secure: false (para desarrollo)
HttpOnly: false
```

### 5. **Configurar JWT Settings**

```
JWT expiry limit: 3600 (1 hora)
Refresh token rotation: Enabled
```

## 🧪 Verificación en el Navegador

### 1. **Abrir Herramientas de Desarrollador**

1. Presiona `F12` en el navegador
2. Ve a la pestaña **Application**
3. En el lado izquierdo, busca **Cookies**
4. Selecciona `http://localhost:3000`

### 2. **Hacer Login**

1. Ve a `http://localhost:3000/login`
2. Ingresa las credenciales:
   ```
   Email: c.angola@utp.edu.co
   Contraseña: admin123
   ```
3. Haz clic en "Iniciar Sesión"

### 3. **Verificar Cookies**

Después del login exitoso, deberías ver estas cookies:

```
sb-vaqdzualcteljmivtoka-auth-token
sb-vaqdzualcteljmivtoka-auth-token.0
sb-vaqdzualcteljmivtoka-auth-token.1
```

## 🔧 Configuración Adicional del Cliente

### 1. **Verificar lib/supabase.ts**

Asegúrate de que tu cliente de Supabase tenga esta configuración:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
```

### 2. **Verificar Middleware**

El middleware ya está configurado correctamente con:

```typescript
cookies: {
  getAll() {
    return req.cookies.getAll()
  },
  setAll(cookiesToSet) {
    cookiesToSet.forEach(({ name, value, options }) => {
      req.cookies.set(name, value)
      response.cookies.set(name, value, options)
    })
    response = NextResponse.next({
      request: {
        headers: req.headers,
      },
    })
  },
}
```

## 🚨 Solución de Problemas

### **Problema 1: Cookies no se establecen**

**Solución:**
1. Verificar que `Site URL` sea `http://localhost:3000`
2. Verificar que `Redirect URLs` incluya las URLs correctas
3. Verificar que `SameSite` sea `lax`

### **Problema 2: Cookies se establecen pero no persisten**

**Solución:**
1. Verificar que `HttpOnly` sea `false`
2. Verificar que `Secure` sea `false` para desarrollo
3. Limpiar cookies del navegador y volver a hacer login

### **Problema 3: Middleware no detecta cookies**

**Solución:**
1. Verificar que el middleware esté usando `getAll()` y `setAll()`
2. Verificar que el `matcher` incluya las rutas correctas
3. Reiniciar el servidor de desarrollo

## 📋 Checklist de Configuración

- [ ] Site URL configurada como `http://localhost:3000`
- [ ] Redirect URLs incluyen todas las rutas necesarias
- [ ] Cookie Settings: `SameSite: lax`, `Secure: false`, `HttpOnly: false`
- [ ] JWT expiry limit configurado
- [ ] Cliente de Supabase configurado con `persistSession: true`
- [ ] Middleware configurado correctamente
- [ ] Servidor reiniciado después de cambios

## 🎯 Resultado Esperado

Después de aplicar esta configuración:

1. ✅ Login funciona correctamente
2. ✅ Cookies se establecen en el navegador
3. ✅ Sesión persiste entre recargas de página
4. ✅ Middleware detecta la sesión activa
5. ✅ Redirección al dashboard funciona automáticamente

---

**Nota**: Si sigues teniendo problemas, verifica que no haya extensiones del navegador bloqueando cookies o que el navegador no esté en modo incógnito.
