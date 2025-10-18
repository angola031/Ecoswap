# 🔧 Solución: Enlaces de Restablecimiento Expirados

## ❌ **Problema Identificado:**

Los enlaces de restablecimiento de contraseña muestran el error:
```
?code=92b6d306-c086-4768-bf09-0edceb377605
error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## 🔍 **Causas del Problema:**

1. **Enlaces expirados**: Los tokens de Supabase expiran en 24 horas por defecto
2. **Manejo de errores**: El callback no manejaba correctamente los errores de expiración
3. **Experiencia de usuario**: No había información clara sobre qué hacer cuando expira un enlace

## ✅ **Soluciones Implementadas:**

### **1. Callback Mejorado**
**Archivo:** `app/auth/callback/route.ts`

**Mejoras:**
- ✅ **Detección** de errores en la URL (error, error_code, error_description)
- ✅ **Manejo** específico de errores de expiración
- ✅ **Redirección** a página de error con información detallada
- ✅ **Logging** mejorado para debugging

**Código clave:**
```typescript
// Si hay errores en la URL, redirigir a la página de error con información específica
if (error || errorCode || errorDescription) {
    const errorParams = new URLSearchParams()
    if (error) errorParams.set('error', error)
    if (errorCode) errorParams.set('error_code', errorCode)
    if (errorDescription) errorParams.set('error_description', errorDescription)
    
    return NextResponse.redirect(`${origin}/auth/auth-code-error?${errorParams.toString()}`)
}
```

### **2. Página de Error Mejorada**
**Archivo:** `app/auth/auth-code-error/page.tsx`

**Mejoras:**
- ✅ **Detección** automática de enlaces expirados
- ✅ **Interfaz** específica para enlaces expirados vs otros errores
- ✅ **Botón** para solicitar nuevo enlace
- ✅ **Información** educativa sobre por qué expiran los enlaces
- ✅ **Debug** información en modo desarrollo

**Características:**
- **Icono específico** para enlaces expirados (reloj)
- **Mensaje claro** explicando que el enlace expiró
- **Botón verde** para solicitar nuevo enlace
- **Información** sobre seguridad y expiración

### **3. Script de Prueba Real**
**Archivo:** `scripts/test-password-reset-real.js`

**Funcionalidad:**
- ✅ **Prueba** con email real registrado
- ✅ **Verificación** de que el usuario existe
- ✅ **Generación** de enlace de restablecimiento
- ✅ **Instrucciones** claras para probar

## 🔄 **Flujo Corregido:**

### **1. Usuario Solicita Restablecimiento:**
1. **Hace clic** en "¿Olvidaste tu contraseña?"
2. **Ingresa** su email
3. **Recibe** email con enlace válido

### **2. Usuario Hace Clic en Enlace Válido:**
1. **Es redirigido** a `/auth/callback?code=TOKEN&next=/auth/reset-password`
2. **Callback** procesa el token
3. **Es redirigido** a `/auth/reset-password`
4. **Establece** nueva contraseña

### **3. Usuario Hace Clic en Enlace Expirado:**
1. **Es redirigido** a `/auth/callback?error=access_denied&error_code=otp_expired`
2. **Callback** detecta el error
3. **Es redirigido** a `/auth/auth-code-error?error=access_denied&error_code=otp_expired`
4. **Ve página** específica para enlaces expirados
5. **Hace clic** en "Solicitar Nuevo Enlace"
6. **Es redirigido** al login para solicitar nuevo enlace

## 🎯 **Configuración Requerida:**

### **Variables de Entorno:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **URLs de Redirección en Supabase:**
En el dashboard de Supabase, ve a **Authentication > URL Configuration** y agrega:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/reset-password`
- `http://localhost:3000/auth/auth-code-error`

## 🧪 **Cómo Probar:**

### **1. Prueba con Script:**
```bash
# Edita el email en el script
node scripts/test-password-reset-real.js
```

### **2. Prueba Manual:**
1. **Ve** a la página de login
2. **Haz clic** en "¿Olvidaste tu contraseña?"
3. **Ingresa** un email registrado
4. **Revisa** tu correo
5. **Haz clic** en el enlace

### **3. Prueba de Enlace Expirado:**
1. **Espera** 24 horas (o usa un enlace viejo)
2. **Haz clic** en el enlace expirado
3. **Verifica** que veas la página de error mejorada
4. **Haz clic** en "Solicitar Nuevo Enlace"

## 🔧 **Configuración de Tiempo de Expiración:**

### **En Supabase Dashboard:**
1. **Ve** a Authentication > Settings
2. **Busca** "JWT expiry limit"
3. **Configura** el tiempo de expiración (por defecto 3600 segundos = 1 hora)
4. **Para enlaces de restablecimiento**, el tiempo es fijo en 24 horas

### **Personalización (Opcional):**
Si necesitas cambiar el tiempo de expiración, puedes usar la API de administración:

```typescript
const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: userEmail,
    options: {
        redirectTo: redirectUrl,
        // No hay opción para cambiar expiración en generateLink
        // El tiempo es fijo en 24 horas para recovery
    }
})
```

## ✅ **Ventajas de la Solución:**

### **✅ Experiencia de Usuario:**
- **Mensajes claros** sobre enlaces expirados
- **Opciones** para solicitar nuevo enlace
- **Información educativa** sobre seguridad
- **Interfaz** específica para cada tipo de error

### **✅ Seguridad:**
- **Expiración** automática de enlaces
- **Manejo** seguro de errores
- **No exposición** de información sensible
- **Validación** correcta de tokens

### **✅ Mantenibilidad:**
- **Código** bien estructurado
- **Manejo** centralizado de errores
- **Scripts** de prueba incluidos
- **Documentación** completa

## 🚀 **Estado Final:**

**¡El problema de enlaces expirados está completamente resuelto!**

- ✅ **Enlaces válidos** funcionan correctamente
- ✅ **Enlaces expirados** muestran página de error clara
- ✅ **Usuarios** pueden solicitar nuevos enlaces fácilmente
- ✅ **Experiencia** de usuario optimizada
- ✅ **Manejo** robusto de errores
- ✅ **Scripts** de prueba incluidos

**¡Ahora cuando un enlace expire, el usuario verá una página clara explicando qué pasó y cómo solucionarlo!** 🎉
