# 🔧 Configuración de Redirección en Vercel

## ❌ **Problema Identificado:**

- ✅ **Localhost**: Funciona correctamente
- ❌ **Vercel**: No redirige correctamente
- ✅ **Variables de entorno**: Configuradas en Vercel

## 🔍 **Causa del Problema:**

El problema más probable es que la variable `NEXT_PUBLIC_SITE_URL` no está configurada correctamente en Vercel o que no se ha hecho redeploy después de configurarla.

## ✅ **Solución Paso a Paso:**

### **1. Configurar Variables de Entorno en Vercel**

#### **Acceder a Vercel Dashboard:**
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "Ecoswap"
3. Ve a **Settings** > **Environment Variables**

#### **Configurar NEXT_PUBLIC_SITE_URL:**
1. **Busca** la variable `NEXT_PUBLIC_SITE_URL`
2. **Si existe**, edítala
3. **Si no existe**, créala
4. **Configura el valor** como: `https://ecoswap-lilac.vercel.app`
5. **Asegúrate** de que esté marcada para **Production**, **Preview**, y **Development**
6. **Haz clic** en "Save"

#### **Verificar Otras Variables:**
Asegúrate de que estas variables estén configuradas:
```
NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY = tu-clave-de-servicio
NEXT_PUBLIC_SITE_URL = https://ecoswap-lilac.vercel.app
```

### **2. Redeploy en Vercel**

#### **Método 1: Redeploy Manual**
1. Ve a **Deployments** en Vercel
2. Haz clic en los **tres puntos** del último deployment
3. Selecciona **"Redeploy"**
4. Confirma el redeploy

#### **Método 2: Push a GitHub**
1. Haz un pequeño cambio en tu código
2. Haz commit y push a GitHub
3. Vercel automáticamente hará un nuevo deployment

### **3. Verificar Supabase Dashboard**

#### **Configurar Site URL:**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** > **URL Configuration**
4. En **"Site URL"**, configura: `https://ecoswap-lilac.vercel.app`
5. **Haz clic** en "Save"

#### **Verificar Redirect URLs:**
Asegúrate de que estas URLs estén en la lista:
```
https://ecoswap-lilac.vercel.app/auth/callback
https://ecoswap-lilac.vercel.app/auth/reset-password
https://ecoswap-lilac.vercel.app/auth/auth-code-error
```

## 🧪 **Cómo Probar la Solución:**

### **1. Verificar Variables:**
1. Ve a Vercel Dashboard > Settings > Environment Variables
2. Confirma que `NEXT_PUBLIC_SITE_URL` sea `https://ecoswap-lilac.vercel.app`

### **2. Verificar Deployment:**
1. Ve a Deployments en Vercel
2. Confirma que el último deployment sea reciente
3. Verifica que no haya errores en el deployment

### **3. Probar Restablecimiento:**
1. Ve a https://ecoswap-lilac.vercel.app
2. Haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un email registrado
4. Revisa tu correo
5. Haz clic en el enlace
6. Deberías ser redirigido a `/auth/reset-password`

### **4. Revisar Logs:**
1. Ve a Vercel Dashboard > Functions
2. Revisa los logs para ver si hay errores
3. Busca los logs del callback para ver el flujo

## 📊 **Flujo Correcto en Vercel:**

1. **Usuario** en https://ecoswap-lilac.vercel.app solicita restablecimiento
2. **Supabase** envía email con enlace a:
   ```
   https://ecoswap-lilac.vercel.app/auth/callback?code=TOKEN&next=/auth/reset-password
   ```
3. **Supabase** verifica el token (sin error 303)
4. **Callback** redirige a: `https://ecoswap-lilac.vercel.app/auth/reset-password`
5. **Usuario** establece nueva contraseña

## ⚠️ **Errores Comunes:**

### **❌ NEXT_PUBLIC_SITE_URL Incorrecta:**
- `http://localhost:3000` (debe ser https://ecoswap-lilac.vercel.app)
- `https://ecoswap-lilac.vercel.app/` (con barra final)
- Variable no configurada

### **❌ Site URL en Supabase Incorrecta:**
- `http://localhost:3000` (debe ser https://ecoswap-lilac.vercel.app)
- `https://ecoswap-lilac.vercel.app/` (con barra final)

### **❌ No Redeploy Después de Cambiar Variables:**
- Las variables de entorno no se aplican hasta el próximo deployment
- **Solución**: Siempre haz redeploy después de cambiar variables

## ✅ **Configuración Correcta:**

### **Vercel Environment Variables:**
```
NEXT_PUBLIC_SITE_URL = https://ecoswap-lilac.vercel.app
NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = tu-clave-anonima
SUPABASE_SERVICE_ROLE_KEY = tu-clave-de-servicio
```

### **Supabase Dashboard:**
```
Site URL = https://ecoswap-lilac.vercel.app
Redirect URLs = Todas las URLs de Vercel configuradas
```

## 🔧 **Troubleshooting:**

### **Si sigues teniendo problemas:**

1. **Revisa** los logs de Vercel para errores específicos
2. **Confirma** que las variables estén configuradas correctamente
3. **Verifica** que se haya hecho redeploy después de cambiar variables
4. **Prueba** con un email registrado en tu aplicación
5. **Genera** un nuevo enlace de restablecimiento

### **Verificación Adicional:**

1. **Abre** las herramientas de desarrollador en tu navegador
2. **Ve** a la pestaña Network
3. **Prueba** el restablecimiento de contraseña
4. **Revisa** las peticiones para ver dónde falla la redirección

## 🎯 **Resumen:**

El problema más probable es que `NEXT_PUBLIC_SITE_URL` no está configurada correctamente en Vercel o que no se ha hecho redeploy después de configurarla. También verifica que Site URL en Supabase Dashboard sea la URL de Vercel.

**¡Una vez que configures correctamente las variables y hagas redeploy, el restablecimiento de contraseña funcionará en Vercel!** 🎉
