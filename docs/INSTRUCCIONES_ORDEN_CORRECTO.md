# Instrucciones en Orden Correcto - Sistema Completo

## Orden de Ejecución

**IMPORTANTE**: Ejecuta los scripts en este orden exacto para evitar errores.

### **Paso 1: Conectar Autenticación (PRIMERO)**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/connect-usuario-with-auth-fixed.sql
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

### **Paso 4: Configurar Políticas de Storage**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/configure-storage-policies.sql
```

### **Paso 5: Sincronizar Usuarios Existentes**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM sync_existing_auth_users();
```

## ¿Por qué este orden?

### **1. Conectar Auth PRIMERO**
- Agrega la columna `auth_user_id` a la tabla `USUARIO`
- Crea las funciones que usan `auth.uid()`
- Sin esto, las políticas de Storage fallan

### **2. Actualizar Producto SEGUNDO**
- Agrega columnas de validación (`estado_validacion`, etc.)
- Crea funciones de validación
- Usa las funciones de Auth creadas en el paso 1

### **3. Actualizar Imágenes TERCERO**
- Configura políticas RLS para `IMAGEN_PRODUCTO`
- Usa las funciones de Auth

### **4. Configurar Storage CUARTO**
- Configura políticas para el bucket `Ecoswap`
- Requiere que `auth_user_id` ya exista

### **5. Sincronizar Usuarios ÚLTIMO**
- Conecta usuarios existentes de Auth con tu tabla `USUARIO`

## Verificación Después de Cada Paso

### **Después del Paso 1:**
```sql
-- Verificar que auth_user_id se agregó
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'USUARIO' 
AND column_name = 'auth_user_id';
```

### **Después del Paso 2:**
```sql
-- Verificar columnas de validación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'fecha_validacion', 'validado_por');
```

### **Después del Paso 3:**
```sql
-- Verificar políticas de imágenes
SELECT policyname FROM pg_policies 
WHERE tablename = 'imagen_producto';
```

### **Después del Paso 4:**
```sql
-- Verificar políticas de Storage
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%Ecoswap%';
```

### **Después del Paso 5:**
```sql
-- Verificar usuarios sincronizados
SELECT COUNT(*) as usuarios_conectados 
FROM USUARIO WHERE auth_user_id IS NOT NULL;
```

## Si Hay Errores

### **Error: "column u.auth_user_id does not exist"**
- **Causa**: Ejecutaste políticas de Storage antes de conectar Auth
- **Solución**: Ejecuta primero `connect-usuario-with-auth-fixed.sql`

### **Error: "operator does not exist: integer = uuid"**
- **Causa**: Políticas RLS intentando comparar tipos incompatibles
- **Solución**: Los scripts corregidos ya manejan esto

### **Error: "relation auth.users does not exist"**
- **Causa**: No estás en el proyecto correcto de Supabase
- **Solución**: Verifica que estés en el proyecto correcto

## Flujo Completo Funcional

Después de ejecutar todos los scripts en orden:

1. **Usuario se registra** → Se crea en `auth.users` → Trigger crea en `USUARIO`
2. **Usuario crea producto** → Se guarda con `estado_validacion = 'pending'`
3. **Imágenes se suben** → Al bucket `Ecoswap/productos/`
4. **Referencias se guardan** → En tabla `IMAGEN_PRODUCTO`
5. **Admin revisa** → Ve productos pendientes en dashboard
6. **Admin valida** → Producto se marca como `approved` o `rejected`
7. **Usuario ve** → Solo productos `approved` son visibles públicamente

## Verificación Final

### **✅ Deberías poder:**
1. Crear productos con imágenes que se suban a Storage
2. Ver productos pendientes en admin dashboard
3. Aprobar/rechazar productos desde admin
4. Ver solo productos aprobados en la plataforma
5. Las imágenes se muestren correctamente

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

-- Imágenes en Storage
SELECT COUNT(*) as total_imagenes 
FROM IMAGEN_PRODUCTO;
```

## Soporte

Si encuentras algún problema:
1. Verifica que ejecutaste los scripts en el orden correcto
2. Revisa los logs en Supabase Dashboard > Logs
3. Confirma que todas las verificaciones pasaron
4. Asegúrate de estar en el proyecto correcto de Supabase

¡Siguiendo este orden, tu sistema funcionará perfectamente!
