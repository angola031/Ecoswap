# 🔧 Configuración de Supabase para Cloudflare Pages

Esta guía te explica qué configuraciones necesitas hacer en Supabase para que funcione correctamente con Cloudflare Pages.

## 🌐 Configuraciones Necesarias en Supabase

### 1. **Configurar Dominios Permitidos (CORS)**

#### En el Dashboard de Supabase:

1. Ve a **Settings** > **API**
2. En la sección **Project URL**, agrega tu dominio de Cloudflare:
   ```
   https://tu-dominio.pages.dev
   https://tu-dominio.com (si tienes dominio personalizado)
   ```

3. En **Additional URLs**, agrega:
   ```
   https://tu-dominio.pages.dev/*
   https://tu-dominio.com/*
   ```

### 2. **Configurar Site URL**

En **Authentication** > **URL Configuration**:

- **Site URL**: `https://tu-dominio.pages.dev`
- **Redirect URLs**: Agrega las siguientes:
  ```
  https://tu-dominio.pages.dev/auth/callback
  https://tu-dominio.pages.dev/auth/confirm
  https://tu-dominio.pages.dev/auth/reset-password
  ```

### 3. **Configurar RLS (Row Level Security)**

Asegúrate de que las políticas RLS estén configuradas correctamente:

```sql
-- Ejemplo para la tabla 'usuario'
CREATE POLICY "Users can view their own data" ON usuario
FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own data" ON usuario
FOR UPDATE USING (auth.uid()::text = user_id::text);
```

### 4. **Configurar Variables de Entorno**

En tu proyecto de Cloudflare Pages, configura estas variables:

```bash
# Variables públicas (visibles en el cliente)
NEXT_PUBLIC_SUPABASE_URL=https://vaqdzualcteljmivtoka.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui

# Variables privadas (solo en el servidor)
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

## 🔐 Configuraciones de Seguridad

### 1. **API Keys**

- **Anon Key**: Pública, segura para usar en el cliente
- **Service Role Key**: Privada, solo para operaciones del servidor

### 2. **JWT Secret**

No necesitas configurar nada especial, Supabase maneja esto automáticamente.

### 3. **Database Password**

Asegúrate de tener una contraseña segura para tu base de datos.

## 📊 Configuraciones de Monitoreo

### 1. **Logs de API**

En **Logs** > **API**, puedes monitorear:
- Requests exitosos
- Errores de autenticación
- Rate limiting

### 2. **Logs de Auth**

En **Logs** > **Auth**, puedes ver:
- Logins exitosos
- Registros de usuarios
- Errores de autenticación

## 🚨 Configuraciones Importantes

### 1. **Rate Limiting**

Supabase tiene límites por defecto:
- **API requests**: 500 requests/minuto para usuarios anónimos
- **Auth requests**: 30 requests/minuto por IP

Si necesitas más, contacta soporte.

### 2. **Storage**

Si usas Supabase Storage:
- Configura políticas RLS para buckets
- Configura CORS para archivos

### 3. **Realtime**

Para Realtime en producción:
- Asegúrate de que esté habilitado en tu plan
- Configura políticas de suscripción

## 🔧 Configuraciones Específicas para EcoSwap

### 1. **Tablas Principales**

Asegúrate de que estas tablas tengan RLS configurado:
- `usuario`
- `producto`
- `intercambio`
- `calificacion`
- `ubicacion`

### 2. **Funciones de Base de Datos**

Verifica que las funciones personalizadas estén creadas:
- `handle_new_user()`
- Funciones de validación de intercambios

### 3. **Triggers**

Asegúrate de que los triggers estén activos:
- Triggers de actualización de contadores
- Triggers de validación

## 📝 Checklist de Configuración

### ✅ Configuraciones Básicas
- [ ] Dominio agregado a Project URL
- [ ] Redirect URLs configuradas
- [ ] Variables de entorno en Cloudflare Pages
- [ ] RLS configurado en todas las tablas

### ✅ Configuraciones de Seguridad
- [ ] API Keys configuradas correctamente
- [ ] Políticas de seguridad implementadas
- [ ] Rate limiting configurado

### ✅ Configuraciones de Monitoreo
- [ ] Logs habilitados
- [ ] Alertas configuradas (opcional)
- [ ] Métricas monitoreadas

## 🆘 Problemas Comunes

### 1. **Error de CORS**
```
Access to fetch at 'https://supabase.co' from origin 'https://tu-dominio.pages.dev' has been blocked by CORS policy
```
**Solución**: Agregar tu dominio a la lista de dominios permitidos en Supabase.

### 2. **Error de Autenticación**
```
Invalid API key
```
**Solución**: Verificar que las variables de entorno estén configuradas correctamente.

### 3. **Error de RLS**
```
new row violates row-level security policy
```
**Solución**: Verificar y ajustar las políticas RLS en las tablas.

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Supabase Dashboard
2. Verifica la configuración de CORS
3. Confirma que las variables de entorno estén correctas
4. Contacta soporte de Supabase si es necesario

---

¡Con estas configuraciones, tu aplicación EcoSwap funcionará perfectamente en Cloudflare Pages con Supabase! 🚀
