# Instrucciones Corregidas - Error integer = uuid

## Problema Identificado

El error `operator does not exist: integer = uuid` ocurre porque estás intentando comparar `user_id` (INTEGER) con `auth.uid()` (UUID). Esto sucede en las políticas RLS.

## Solución Corregida

### **Paso 1: Ejecutar Script de Conexión Auth (CORREGIDO)**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/connect-usuario-with-auth-fixed.sql
```

### **Paso 2: Ejecutar Script de Producto (ACTUALIZADO)**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/update-existing-producto-table-fixed.sql
```

### **Paso 3: Ejecutar Script de Imágenes**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/update-imagen-producto-table.sql
```

### **Paso 4: Sincronizar Usuarios**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM sync_existing_auth_users();
```

## ¿Qué se corrigió?

### **1. Políticas RLS Corregidas**
**ANTES (causaba error):**
```sql
-- ❌ ERROR: integer = uuid
WHERE user_id = auth.uid()
```

**DESPUÉS (corregido):**
```sql
-- ✅ CORRECTO: usa subquery para evitar comparación directa
WHERE EXISTS (
    SELECT 1 FROM USUARIO u 
    WHERE u.user_id = PRODUCTO.user_id 
    AND u.auth_user_id = auth.uid()
)
```

### **2. Políticas Temporales**
- Las políticas de administrador son temporales (`USING (true)`)
- Se actualizarán automáticamente cuando se conecte Auth
- Esto evita errores durante la transición

### **3. Funciones Corregidas**
- `validate_product()` usa subqueries en lugar de comparaciones directas
- `get_current_user()` maneja correctamente los tipos UUID e INTEGER

## Pasos Detallados

### **1. Ejecutar Scripts en Orden**
```sql
-- 1. Conectar Auth (CORREGIDO)
\i database/connect-usuario-with-auth-fixed.sql

-- 2. Actualizar Producto (ACTUALIZADO)
\i database/update-existing-producto-table-fixed.sql

-- 3. Actualizar Imágenes
\i database/update-imagen-producto-table.sql
```

### **2. Verificar que No Hay Errores**
```sql
-- Verificar que las columnas se agregaron
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'fecha_validacion', 'validado_por');

-- Verificar que auth_user_id se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'USUARIO' 
AND column_name = 'auth_user_id';
```

### **3. Sincronizar Usuarios**
```sql
-- Ver qué usuarios se van a sincronizar
SELECT * FROM sync_existing_auth_users();

-- Sincronizar manualmente si es necesario
UPDATE USUARIO 
SET auth_user_id = au.id
FROM auth.users au
WHERE USUARIO.email = au.email 
AND USUARIO.auth_user_id IS NULL;
```

### **4. Probar Sistema**
```sql
-- Ver productos pendientes
SELECT * FROM get_pending_products();

-- Ver productos públicos
SELECT * FROM PRODUCTOS_PUBLICOS LIMIT 5;
```

## Verificación Final

### **✅ Deberías poder:**
1. Ejecutar todos los scripts sin errores de tipo
2. Crear productos que se guarden como `pending`
3. Ver productos pendientes en admin dashboard
4. Aprobar/rechazar productos desde admin
5. Ver solo productos aprobados en la plataforma

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

## Si Aún Hay Problemas

### **Error: "permission denied for table auth.users"**
- Ejecuta los scripts desde el SQL Editor de Supabase
- Los scripts usan `SECURITY DEFINER` para funcionar correctamente

### **Error: "relation auth.users does not exist"**
- Asegúrate de estar en el proyecto correcto de Supabase
- Verifica que Auth esté habilitado en tu proyecto

### **Usuarios no se sincronizan**
- Ejecuta manualmente el UPDATE de sincronización
- Verifica que los emails coincidan exactamente

## Flujo Completo Corregido

1. **Ejecutar scripts** → Sin errores de tipo integer = uuid
2. **Sincronizar usuarios** → Auth conectado con tabla USUARIO
3. **Crear producto** → Se guarda como `pending`
4. **Admin valida** → Producto se marca como `approved` o `rejected`
5. **Usuario ve** → Solo productos `approved` son visibles

## Soporte

Si encuentras algún problema:
1. Revisa los logs en Supabase Dashboard > Logs
2. Verifica que todos los scripts se ejecutaron sin errores
3. Confirma que los usuarios están conectados correctamente

¡Con estos scripts corregidos, el error de `integer = uuid` desaparecerá y tu sistema funcionará perfectamente!
