# 🔧 Solución: Error 303 en Supabase Auth

## ❌ **Error Identificado:**

```
GET/auth/v1/verify 303
```

Este error indica que Supabase está intentando verificar el token de autenticación pero está siendo redirigido incorrectamente.

## 🔍 **Causa del Problema:**

El error 303 (See Other) ocurre cuando:
1. **URLs de redirección no configuradas** en Supabase Dashboard
2. **Site URL incorrecta** en la configuración de Supabase
3. **Mismatch** entre las URLs configuradas y las que se están usando

## ✅ **Solución Paso a Paso:**

### **1. Configurar URLs de Redirección en Supabase Dashboard**

#### **Acceder al Dashboard:**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** en el menú lateral
4. Haz clic en **URL Configuration**

#### **Configurar Redirect URLs:**
En la sección **"Redirect URLs"**, agrega estas URLs exactas:

**Para Desarrollo Local:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/auth-code-error
```

**Para Producción (Vercel):**
```
https://tu-dominio.vercel.app/auth/callback
https://tu-dominio.vercel.app/auth/reset-password
https://tu-dominio.vercel.app/auth/auth-code-error
```

#### **Configurar Site URL:**
En la sección **"Site URL"**:
- **Desarrollo:** `http://localhost:3000`
- **Producción:** `https://tu-dominio.vercel.app`

### **2. Verificar Variables de Entorno**

Asegúrate de que estas variables estén configuradas en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY=tu-clave-de-servicio
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

### **3. Verificar Configuración del Callback**

El callback debe estar configurado correctamente en `app/auth/callback/route.ts`:

```typescript
// Debe manejar el parámetro 'next' correctamente
if (next && next !== '/') {
    return NextResponse.redirect(`${origin}${next}`)
}
```

## 🧪 **Cómo Probar la Solución:**

### **1. Verificar Configuración:**
```bash
# Ejecuta este script para verificar
node scripts/test-local-redirect.js
```

### **2. Probar Restablecimiento:**
1. Ve a tu aplicación
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email registrado
4. Revisa tu correo
5. Haz clic en el enlace
6. Deberías ser redirigido a `/auth/reset-password`

### **3. Verificar Logs:**
Con el logging mejorado, verás en la consola:
```
🔗 URL de redirección configurada: http://localhost:3000/auth/callback?next=/auth/reset-password
🔍 Callback recibido: { origin: 'http://localhost:3000', code: 'presente', next: '/auth/reset-password' }
🔄 Redirigiendo a página específica: http://localhost:3000/auth/reset-password
```

## 🔧 **Troubleshooting del Error 303:**

### **Si sigues viendo el error 303:**

1. **Verifica** que las URLs estén configuradas exactamente como se muestra arriba
2. **Confirma** que no haya espacios extra o caracteres especiales
3. **Asegúrate** de que el protocolo sea correcto (http:// o https://)
4. **Verifica** que el Site URL esté configurado correctamente

### **Verificación Adicional:**

1. **Revisa** los logs de Vercel para ver el error completo
2. **Confirma** que las variables de entorno estén configuradas
3. **Prueba** con un enlace nuevo (los enlaces viejos pueden estar corruptos)

## 📊 **Flujo Correcto Después de la Configuración:**

1. **Usuario** solicita restablecimiento de contraseña
2. **Supabase** envía email con enlace a: `/auth/callback?code=TOKEN&next=/auth/reset-password`
3. **Supabase** verifica el token (sin error 303)
4. **Callback** procesa el token y redirige a: `/auth/reset-password`
5. **Usuario** establece nueva contraseña

## ⚠️ **Errores Comunes:**

### **URLs Incorrectas:**
❌ `localhost:3000/auth/callback` (sin protocolo)
❌ `http://localhost:3000/auth/callback/` (con barra final)
❌ `http://localhost:3000/auth/callback ` (con espacio)

✅ `http://localhost:3000/auth/callback` (correcto)

### **Site URL Incorrecta:**
❌ `localhost:3000` (sin protocolo)
❌ `http://localhost:3000/` (con barra final)

✅ `http://localhost:3000` (correcto)

## 🚨 **Importante:**

- **Las URLs deben coincidir exactamente** con las configuradas en Supabase
- **Incluye el protocolo** (http:// o https://)
- **No incluyas barras finales** innecesarias
- **Configura tanto desarrollo como producción** si usas ambos
- **Guarda los cambios** en Supabase Dashboard después de configurar

## ✅ **Estado Después de la Configuración:**

Una vez configurado correctamente:
- ✅ **Error 303** desaparecerá
- ✅ **Redirección** funcionará correctamente
- ✅ **Restablecimiento** de contraseña funcionará
- ✅ **Logs** mostrarán el flujo correcto

## 📞 **Si sigues teniendo problemas:**

1. **Revisa** los logs de Vercel para el error completo
2. **Verifica** que las URLs estén configuradas exactamente
3. **Confirma** que las variables de entorno estén en Vercel
4. **Prueba** con un email registrado en tu aplicación
5. **Genera** un nuevo enlace de restablecimiento
