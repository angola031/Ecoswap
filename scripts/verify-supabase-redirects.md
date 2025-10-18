# 🔧 Verificación de URLs de Redirección en Supabase

## ❌ **Problema Identificado:**

El restablecimiento de contraseña no redirige a `auth/reset-password` porque las URLs de redirección no están configuradas correctamente en Supabase Dashboard.

## 🔍 **URLs que DEBEN estar configuradas en Supabase:**

### **Para Desarrollo Local:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/auth-code-error
```

### **Para Producción (Vercel):**
```
https://tu-dominio.vercel.app/auth/callback
https://tu-dominio.vercel.app/auth/reset-password
https://tu-dominio.vercel.app/auth/auth-code-error
```

## 📋 **Pasos para Configurar en Supabase Dashboard:**

### **1. Acceder al Dashboard:**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** en el menú lateral
4. Haz clic en **URL Configuration**

### **2. Configurar Redirect URLs:**
1. En la sección **"Redirect URLs"**
2. Agrega cada URL una por una:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/auth-code-error`
3. Si estás en producción, agrega también las URLs de Vercel
4. Haz clic en **"Save"**

### **3. Verificar Site URL:**
1. En la sección **"Site URL"**
2. Configura:
   - **Desarrollo:** `http://localhost:3000`
   - **Producción:** `https://tu-dominio.vercel.app`

## 🧪 **Cómo Probar:**

### **1. Verificar Configuración:**
```bash
# Ejecuta este script para verificar
node scripts/check-production-config.js
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

## 🔧 **Troubleshooting:**

### **Si el enlace no funciona:**
1. **Verifica** que las URLs estén en Supabase Dashboard
2. **Confirma** que el Site URL esté configurado
3. **Revisa** los logs del servidor
4. **Prueba** con un enlace nuevo

### **Si ves error 404:**
- Las URLs de redirección no están configuradas en Supabase
- El Site URL no está configurado correctamente

### **Si ves error de callback:**
- El callback no está procesando el token correctamente
- Revisa los logs del servidor para más detalles

## ✅ **Configuración Correcta:**

Una vez configurado correctamente, el flujo será:

1. **Usuario** solicita restablecimiento
2. **Supabase** envía email con enlace a: `/auth/callback?code=TOKEN&next=/auth/reset-password`
3. **Callback** procesa el token y redirige a: `/auth/reset-password`
4. **Usuario** establece nueva contraseña

## 🚨 **Importante:**

- **Las URLs deben coincidir exactamente** con las configuradas en Supabase
- **Incluye el protocolo** (http:// o https://)
- **No incluyas barras finales** innecesarias
- **Configura tanto desarrollo como producción** si usas ambos

## 📞 **Si sigues teniendo problemas:**

1. **Revisa** los logs del servidor con el logging mejorado
2. **Verifica** que las variables de entorno estén en Vercel
3. **Confirma** que las URLs estén configuradas en Supabase
4. **Prueba** con un email registrado en tu aplicación
