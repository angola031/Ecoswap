# Configuración de Variables de Entorno en Vercel

## Variables Requeridas en Vercel

Para que la aplicación funcione correctamente en Vercel, necesitas configurar estas variables de entorno:

### 1. Variables de Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://vaqdzualcteljmivtoka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcWR6dWFsY3RlbGptaXZ0b2thIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk4MzMsImV4cCI6MjA3MjQzNTgzM30.crB_eVlezZGyqm0Iw_JCQXQKnDj2JFNdRUD16pOJoTo
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### 2. Variables de la Aplicación
```
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app
NODE_ENV=production
```

## Cómo Configurar en Vercel

1. **Ve a tu proyecto en Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Agrega cada variable:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://vaqdzualcteljmivtoka.supabase.co`
   - Environment: `Production`, `Preview`, `Development`

4. **Repite para todas las variables**

## Verificación

Después de configurar las variables:

1. **Redespliega la aplicación** en Vercel
2. **Verifica que no aparezcan errores** de configuración
3. **Prueba la subida de fotos** de perfil
4. **Verifica que el login** funcione correctamente

## Solución a Errores de Cookies

Si sigues viendo errores de cookies `__cf_bm`:

1. **Limpia el caché del navegador**
2. **Usa modo incógnito**
3. **Verifica que el dominio** esté configurado correctamente
4. **Revisa la consola** para otros errores





