# ✅ Checklist de Configuración de Supabase para Cloudflare Pages

## 🎯 Configuraciones CRÍTICAS que DEBES hacer en Supabase

### 1. **🌐 Configurar Dominios Permitidos (CORS)**

#### En el Dashboard de Supabase:

**Settings > API:**
```
Project URL: https://tu-dominio.pages.dev
```

**Authentication > URL Configuration:**
```
Site URL: https://tu-dominio.pages.dev

Redirect URLs:
- https://tu-dominio.pages.dev/auth/callback
- https://tu-dominio.pages.dev/auth/confirm  
- https://tu-dominio.pages.dev/auth/reset-password
```

### 2. **🔑 Variables de Entorno en Cloudflare Pages**

Ve a tu proyecto en Cloudflare Pages > Settings > Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vaqdzualcteljmivtoka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
```

### 3. **🛡️ Verificar RLS (Row Level Security)**

Asegúrate de que estas tablas tengan RLS habilitado:
- ✅ `usuario`
- ✅ `producto` 
- ✅ `intercambio`
- ✅ `calificacion`
- ✅ `ubicacion`

### 4. **⚙️ Verificar Funciones de Base de Datos**

Confirma que estas funciones existan:
- ✅ `handle_new_user()`
- ✅ Funciones de validación de intercambios

## 🚨 Errores Comunes y Soluciones

### Error: "Access blocked by CORS policy"
**Solución**: Agregar tu dominio a Project URL en Supabase

### Error: "Invalid API key" 
**Solución**: Verificar variables de entorno en Cloudflare Pages

### Error: "new row violates row-level security policy"
**Solución**: Verificar políticas RLS en las tablas

## 🔍 Verificar Configuración

Ejecuta este comando para verificar que todo esté bien:

```bash
npm run check:supabase
```

## 📋 Pasos para Configurar

### Paso 1: Dashboard de Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings > API**
4. Agrega tu dominio de Cloudflare Pages

### Paso 2: Authentication
1. Ve a **Authentication > URL Configuration**
2. Configura Site URL y Redirect URLs

### Paso 3: Cloudflare Pages
1. Ve a tu proyecto en Cloudflare Pages
2. Settings > Environment variables
3. Agrega las variables de entorno

### Paso 4: Verificar
1. Ejecuta `npm run check:supabase`
2. Confirma que no hay errores

## ✅ Lista de Verificación Final

- [ ] Dominio agregado a Project URL en Supabase
- [ ] Site URL configurada en Authentication
- [ ] Redirect URLs configuradas
- [ ] Variables de entorno en Cloudflare Pages
- [ ] RLS habilitado en todas las tablas
- [ ] Funciones de base de datos verificadas
- [ ] Script de verificación ejecutado sin errores

## 🎉 ¡Listo!

Con estas configuraciones, tu aplicación EcoSwap funcionará perfectamente en Cloudflare Pages con Supabase.
