# 🔧 Configuración de Variables de Entorno

## 🎯 **Problema Identificado:**
La página `/login` no funciona porque las variables de entorno de Supabase no están configuradas.

## ✅ **Solución:**

### **1. Crear Archivo `.env.local`**

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# URL del sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **2. Obtener las Variables de Supabase**

#### **Paso 1: Ir al Dashboard de Supabase**
1. **Ve** a [https://supabase.com](https://supabase.com)
2. **Inicia sesión** en tu cuenta
3. **Selecciona** tu proyecto

#### **Paso 2: Obtener la URL y Anon Key**
1. **Ve** a "Settings" > "API"
2. **Copia** la "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
3. **Copia** la "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Copia** la "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

#### **Paso 3: Configurar el Archivo**
Reemplaza los valores en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **3. Verificar la Configuración**

#### **Ejecutar el Script de Verificación:**
```bash
node debug-login.js
```

**Resultado esperado:**
```
🔍 Verificando configuración de Supabase...
📊 Variables de entorno:
NEXT_PUBLIC_SUPABASE_URL: ✅ Configurada
NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ Configurada
✅ Variables de entorno configuradas correctamente
✅ Archivo de login existe
```

### **4. Reiniciar el Servidor**

Después de configurar las variables:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

## 🔍 **Verificación del Login:**

### **1. Probar la Página de Login:**
1. **Ve** a `http://localhost:3000/login`
2. **Verifica** que la página carga correctamente
3. **Intenta** hacer login con credenciales de administrador

### **2. Verificar en la Consola:**
1. **Abre** la consola del navegador (F12)
2. **Observa** los logs de debug
3. **Verifica** que no hay errores de configuración

## 🚨 **Problemas Comunes:**

### **❌ Error: "Invalid API key"**
**Causa:** La anon key no es correcta
**Solución:** Verificar que copiaste la key correcta del dashboard

### **❌ Error: "Invalid URL"**
**Causa:** La URL de Supabase no es correcta
**Solución:** Verificar que la URL incluye `https://` y termina con `.supabase.co`

### **❌ Error: "Network error"**
**Causa:** Problemas de conectividad o configuración
**Solución:** Verificar que el proyecto de Supabase está activo

### **❌ Variables no se cargan**
**Causa:** El archivo `.env.local` no está en la raíz del proyecto
**Solución:** Asegurar que el archivo está en la raíz, no en una subcarpeta

## 📁 **Estructura del Proyecto:**

```
Ecoswap/
├── .env.local              # Variables de entorno (crear este archivo)
├── app/
│   └── login/
│       └── page.tsx        # Página de login
├── lib/
│   └──          # Configuración de Supabase
└── debug-login.js          # Script de verificación
```

## ✅ **Estado Después de la Configuración:**

**¡El login debería funcionar correctamente!**

- ✅ **Variables de entorno** configuradas
- ✅ **Conexión a Supabase** establecida
- ✅ **Página de login** funcional
- ✅ **Autenticación** operativa
- ✅ **Redirección** al dashboard funcionando

## 🔧 **Comandos Útiles:**

### **Verificar Variables:**
```bash
node debug-login.js
```

### **Reiniciar Servidor:**
```bash
npm run dev
```

### **Verificar Archivos:**
```bash
ls -la | grep env
```

**¡Configura las variables de entorno y el login funcionará correctamente!** 🎉

