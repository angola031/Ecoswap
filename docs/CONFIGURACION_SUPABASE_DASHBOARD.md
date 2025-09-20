# 🔧 Configuración del Dashboard de Supabase

## 🎯 Configuración Requerida para Cookies

### 1. **Acceder al Dashboard**

1. Ve a: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: **vaqdzualcteljmivtoka**
3. Ve a **Settings** → **Authentication**

### 2. **Configurar Site URL**

```
Site URL: http://localhost:3000
```

### 3. **Configurar Redirect URLs**

Agrega estas URLs en **Redirect URLs**:

```
http://localhost:3000/auth/callback
http://localhost:3000/auth/supabase-redirect
http://localhost:3000/admin/verificaciones
http://localhost:3000/login
```

### 4. **Configurar Cookie Settings**

En la sección **Cookie Settings**:

```
SameSite: lax
Secure: false
HttpOnly: false
```

### 5. **Configurar JWT Settings**

```
JWT expiry limit: 3600
Refresh token rotation: Enabled
```

## 🧪 Verificación Paso a Paso

### **Paso 1: Configurar Supabase**
- ✅ Site URL: `http://localhost:3000`
- ✅ Redirect URLs: Todas las URLs listadas arriba
- ✅ Cookie Settings: `SameSite: lax`, `Secure: false`, `HttpOnly: false`

### **Paso 2: Reiniciar Servidor**
```bash
# Presiona Ctrl+C en la terminal
# Luego ejecuta:
npm run dev
```

### **Paso 3: Probar en el Navegador**
1. Ve a: `http://localhost:3000/login`
2. Abre herramientas de desarrollador (F12)
3. Ve a **Application** → **Cookies** → `http://localhost:3000`
4. Haz login con:
   ```
   Email: c.angola@utp.edu.co
   Contraseña: admin123
   ```

### **Paso 4: Verificar Cookies**
Después del login, deberías ver:
```
sb-vaqdzualcteljmivtoka-auth-token
sb-vaqdzualcteljmivtoka-auth-token.0
sb-vaqdzualcteljmivtoka-auth-token.1
```

### **Paso 5: Verificar Logs del Servidor**
En la terminal donde corre `npm run dev`, deberías ver:
```
🍪 Cookies recibidas: 3
🔑 Cookies de Supabase: 3
✅ Admin autorizado: c.angola@utp.edu.co
```

## 🚨 Solución de Problemas

### **Problema: No aparecen cookies**

**Causas posibles:**
1. **Site URL incorrecta**: Debe ser exactamente `http://localhost:3000`
2. **SameSite incorrecto**: Debe ser `lax`, no `strict`
3. **Secure habilitado**: Debe ser `false` para desarrollo
4. **Modo incógnito**: Las cookies no funcionan en modo incógnito
5. **Extensiones del navegador**: Bloquean cookies

**Solución:**
1. Verifica la configuración en Supabase Dashboard
2. Usa navegador normal (no incógnito)
3. Deshabilita extensiones de privacidad temporalmente
4. Limpia cookies del navegador y vuelve a intentar

### **Problema: Cookies aparecen pero middleware no las detecta**

**Causa:** Configuración incorrecta del middleware

**Solución:** Ya está corregida en el código actual

### **Problema: Login funciona pero no redirige**

**Causa:** Cookies no se establecen correctamente

**Solución:** Verificar configuración de Supabase Dashboard

## 📋 Checklist Final

- [ ] Site URL configurada como `http://localhost:3000`
- [ ] Redirect URLs incluyen todas las rutas necesarias
- [ ] Cookie Settings: `SameSite: lax`, `Secure: false`, `HttpOnly: false`
- [ ] JWT expiry limit configurado
- [ ] Servidor reiniciado después de cambios
- [ ] Navegador normal (no incógnito)
- [ ] Extensiones de privacidad deshabilitadas
- [ ] Cookies limpias del navegador

## 🎯 Resultado Esperado

Después de aplicar esta configuración:

1. ✅ Login exitoso
2. ✅ Cookies establecidas en el navegador
3. ✅ Middleware detecta la sesión
4. ✅ Redirección automática al dashboard
5. ✅ Sesión persistente entre recargas

---

**Importante**: La configuración del Dashboard de Supabase es **crítica** para que las cookies funcionen correctamente.
