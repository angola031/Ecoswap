# Instrucciones Sin Políticas RLS - Configuración Simple

## Problema Identificado

El error `must be owner of relation objects` indica que no tienes permisos para crear políticas RLS en la tabla `storage.objects`. Esto es común en Supabase.

## Solución Simplificada

Vamos a configurar Storage sin políticas RLS complejas, solo marcando el bucket como público.

### **Paso 1: Agregar auth_user_id a USUARIO**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/add-auth-user-id-only.sql
```

### **Paso 2: Configurar Storage Simple**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/configure-storage-simple.sql
```

### **Paso 3: Sincronizar Usuarios**
```sql
-- Ejecutar en Supabase SQL Editor
SELECT * FROM sync_existing_auth_users();
```

### **Paso 4: Configurar Bucket Manualmente**
1. Ve a Supabase Dashboard > Storage
2. Selecciona el bucket `Ecoswap`
3. Ve a la pestaña "Settings"
4. Marca la casilla "Public bucket"
5. Guarda los cambios

## ¿Qué hace cada script?

### **`add-auth-user-id-only.sql`**
- Agrega la columna `auth_user_id` a tu tabla `USUARIO`
- Crea el trigger para sincronizar usuarios nuevos
- Crea la función para sincronizar usuarios existentes

### **`configure-storage-simple.sql`**
- Solo marca el bucket `Ecoswap` como público
- No crea políticas RLS (evita el error de permisos)
- Verifica que el bucket esté configurado correctamente

## Configuración Manual del Bucket

### **En Supabase Dashboard:**
1. **Storage** → **Buckets** → **Ecoswap**
2. **Settings** → Marcar **"Public bucket"**
3. **Policies** → Si tienes permisos, puedes agregar políticas básicas:
   ```sql
   -- Política simple para lectura pública
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'Ecoswap');
   ```

## Verificación

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
-- Verificar que el bucket está público
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'Ecoswap';
```

### **Después del Paso 3:**
```sql
-- Verificar usuarios sincronizados
SELECT COUNT(*) as usuarios_conectados 
FROM USUARIO WHERE auth_user_id IS NOT NULL;
```

## Verificación Final

### **✅ Deberías poder:**
1. Crear productos con imágenes que se suban a Storage
2. Ver productos pendientes en admin dashboard
3. Aprobar/rechazar productos desde admin
4. Ver solo productos aprobados en la plataforma

### **✅ Verificar con estas consultas:**
```sql
-- Productos pendientes
SELECT COUNT(*) as productos_pendientes 
FROM PRODUCTO WHERE estado_validacion = 'pending';

-- Productos públicos
SELECT COUNT(*) as productos_publicos 
FROM PRODUCTO WHERE estado_validacion = 'approved';

-- Usuarios conectados
SELECT COUNT(*) as usuarios_conectados 
FROM USUARIO WHERE auth_user_id IS NOT NULL;

-- Bucket configurado
SELECT name, public FROM storage.buckets WHERE id = 'Ecoswap';
```

## Si Hay Problemas

### **Error: "must be owner of relation objects"**
- **Causa**: No tienes permisos para crear políticas RLS
- **Solución**: Usa el script simplificado y configura el bucket manualmente

### **Error: "Bucket not found"**
- **Causa**: El bucket `Ecoswap` no existe
- **Solución**: Crea el bucket manualmente en Storage

### **Error: "Permission denied"**
- **Causa**: El bucket no está marcado como público
- **Solución**: Marca el bucket como público en Dashboard

### **Imágenes no se suben**
- **Causa**: Problemas de autenticación o permisos
- **Solución**: Verifica que el usuario esté autenticado y el bucket sea público

## Configuración Alternativa

Si sigues teniendo problemas, puedes:

1. **Crear el bucket manualmente** en Supabase Dashboard
2. **Marcarlo como público** en Settings
3. **Usar políticas básicas** si tienes permisos:
   ```sql
   -- Solo lectura pública
   CREATE POLICY "Public Access" ON storage.objects
   FOR SELECT USING (bucket_id = 'Ecoswap');
   ```

## Soporte

Si encuentras algún problema:
1. Verifica que el bucket `Ecoswap` existe y es público
2. Revisa los logs en Supabase Dashboard > Logs
3. Confirma que las verificaciones pasaron
4. Asegúrate de estar en el proyecto correcto

¡Con esta configuración simplificada, tu sistema funcionará sin problemas de permisos!
