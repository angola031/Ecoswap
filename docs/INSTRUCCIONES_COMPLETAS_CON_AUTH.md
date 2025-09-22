# Instrucciones Completas - Conectar Supabase Auth

## Problema Identificado

Tienes Supabase Auth configurado (veo 4 usuarios en tu dashboard), pero tu tabla `USUARIO` no está conectada con `auth.users`. Necesitamos vincular ambos sistemas.

## Solución Completa

### **Paso 1: Conectar Autenticación (EJECUTAR PRIMERO)**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/connect-usuario-with-auth.sql
```

### **Paso 2: Actualizar Tabla Producto**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/update-existing-producto-table-fixed.sql
```

### **Paso 3: Actualizar Tabla Imágenes**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/update-imagen-producto-table.sql
```

### **Paso 4: Sincronizar Usuarios Existentes**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM sync_existing_auth_users();
```

## ¿Qué hace cada script?

### **`connect-usuario-with-auth.sql`**
1. **Agrega columna `auth_user_id`** a tu tabla `USUARIO`
2. **Crea trigger automático** que sincroniza usuarios nuevos de Auth con tu tabla
3. **Actualiza políticas RLS** para usar `auth.uid()` correctamente
4. **Crea función `get_current_user()`** para obtener datos del usuario autenticado
5. **Actualiza función `validate_product()`** para trabajar con Auth

### **`update-existing-producto-table-fixed.sql`**
1. **Agrega columnas de validación** (`estado_validacion`, `fecha_validacion`, etc.)
2. **Crea políticas RLS** que funcionan con Auth
3. **Crea funciones** para validación y estadísticas
4. **Crea vista `PRODUCTOS_PUBLICOS`** para mostrar solo productos aprobados

### **`update-imagen-producto-table.sql`**
1. **Configura políticas RLS** para imágenes
2. **Crea funciones** para manejo de imágenes
3. **Optimiza consultas** de imágenes

## Pasos Detallados

### **1. Ejecutar Scripts en Orden**
```sql
-- 1. Conectar Auth (PRIMERO)
\i database/connect-usuario-with-auth.sql

-- 2. Actualizar Producto
\i database/update-existing-producto-table-fixed.sql

-- 3. Actualizar Imágenes
\i database/update-imagen-producto-table.sql
```

### **2. Sincronizar Usuarios Existentes**
```sql
-- Ver qué usuarios se van a sincronizar
SELECT * FROM sync_existing_auth_users();

-- Si todo se ve bien, ejecutar la sincronización manual
UPDATE USUARIO 
SET auth_user_id = au.id
FROM auth.users au
WHERE USUARIO.email = au.email 
AND USUARIO.auth_user_id IS NULL;
```

### **3. Verificar Conexión**
```sql
-- Verificar que los usuarios están conectados
SELECT 
    u.user_id,
    u.email,
    u.auth_user_id,
    au.email as auth_email
FROM USUARIO u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.auth_user_id IS NOT NULL;
```

### **4. Probar Sistema de Validación**
```sql
-- Ver productos pendientes
SELECT * FROM get_pending_products();

-- Ver productos públicos
SELECT * FROM PRODUCTOS_PUBLICOS LIMIT 5;
```

## APIs Actualizadas

Las APIs ahora funcionan correctamente con Supabase Auth:

### **Autenticación de Administradores**
- Usa `auth.uid()` para identificar usuarios
- Verifica roles usando tu sistema existente
- Compatible con `es_admin` y roles específicos

### **Creación de Productos**
- Los productos se crean con `estado_validacion = 'pending'`
- Solo usuarios autenticados pueden crear productos
- Se vincula automáticamente con el usuario Auth

### **Validación de Productos**
- Solo administradores pueden aprobar/rechazar
- Se registra quién validó y cuándo
- Se envían notificaciones automáticas

## Configuración de Roles

Para que un usuario sea administrador, puede ser:

1. **Admin directo**: `es_admin = true` en la tabla `USUARIO`
2. **Admin por rol**: Tener uno de estos roles activos:
   - `super_admin`
   - `admin_soporte` 
   - `admin_validacion`

## Flujo Completo

1. **Usuario se registra** → Se crea en `auth.users` → Trigger crea en `USUARIO`
2. **Usuario crea producto** → Se guarda con `estado_validacion = 'pending'`
3. **Admin revisa** → Ve productos pendientes en dashboard
4. **Admin valida** → Producto se marca como `approved` o `rejected`
5. **Usuario ve** → Solo productos `approved` son visibles públicamente

## Verificación Final

Después de ejecutar todos los scripts:

### **✅ Deberías poder:**
1. Crear productos que se guarden como `pending`
2. Ver productos pendientes en admin dashboard
3. Aprobar/rechazar productos desde admin
4. Ver solo productos aprobados en la plataforma
5. Las imágenes se manejen correctamente

### **✅ Verificar con estas consultas:**
```sql
-- Usuarios conectados
SELECT COUNT(*) as usuarios_conectados 
FROM USUARIO WHERE auth_user_id IS NOT NULL;

-- Productos pendientes
SELECT COUNT(*) as productos_pendientes 
FROM PRODUCTO WHERE estado_validacion = 'pending';

-- Productos públicos
SELECT COUNT(*) as productos_publicos 
FROM PRODUCTOS_PUBLICOS;
```

## Si Hay Problemas

### **Error: "relation auth.users does not exist"**
- Asegúrate de estar en el proyecto correcto de Supabase
- Verifica que Auth esté habilitado en tu proyecto

### **Error: "permission denied for table auth.users"**
- Ejecuta los scripts como superuser o desde el SQL Editor de Supabase
- Los scripts usan `SECURITY DEFINER` para funcionar correctamente

### **Usuarios no se sincronizan**
- Ejecuta manualmente el UPDATE de sincronización
- Verifica que los emails coincidan exactamente

## Soporte

Si encuentras algún problema:
1. Revisa los logs en Supabase Dashboard > Logs
2. Verifica que todos los scripts se ejecutaron sin errores
3. Confirma que los usuarios están conectados correctamente

¡Con estos scripts, tu sistema de validación de productos funcionará perfectamente con Supabase Auth!
