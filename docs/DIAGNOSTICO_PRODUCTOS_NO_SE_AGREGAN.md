# Diagnóstico: Productos No Se Agregan

## Problema Identificado

Tu bucket `Ecoswap` está público, pero los productos no se están agregando correctamente.

## Pasos de Diagnóstico

### **Paso 1: Ejecutar Diagnóstico**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/diagnostico-productos.sql
```

### **Paso 2: Verificar en el Navegador**

1. **Abrir DevTools** (F12)
2. **Ir a la pestaña Console**
3. **Intentar agregar un producto**
4. **Revisar errores en la consola**

### **Paso 3: Verificar en Network**

1. **Ir a la pestaña Network**
2. **Intentar agregar un producto**
3. **Revisar las peticiones a `/api/products`**
4. **Verificar códigos de respuesta (200, 400, 500, etc.)**

## Posibles Causas y Soluciones

### **Causa 1: Usuario no autenticado**
**Síntomas:**
- Error: "No hay sesión activa"
- Error: "No autorizado"

**Solución:**
```sql
-- Verificar que el usuario esté conectado con Auth
SELECT * FROM USUARIO WHERE email = 'tu_email@ejemplo.com';

-- Si auth_user_id es NULL, ejecutar:
\i database/add-auth-user-id-only.sql
SELECT * FROM sync_existing_auth_users();
```

### **Causa 2: API no funciona**
**Síntomas:**
- Error 500 en la consola
- Error: "Error interno del servidor"

**Solución:**
1. Verificar que la API `/api/products` existe
2. Revisar logs en Supabase Dashboard > Logs
3. Verificar que las columnas de validación existen

### **Causa 3: Problemas con Storage**
**Síntomas:**
- Error: "Bucket not found"
- Error: "Permission denied"

**Solución:**
```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'Ecoswap';

-- Si no existe, crearlo manualmente en Dashboard > Storage
```

### **Causa 4: Formulario no envía datos**
**Síntomas:**
- No hay peticiones en Network
- Botón no responde

**Solución:**
1. Verificar que el formulario tiene `onSubmit`
2. Verificar que los campos están completos
3. Verificar validaciones del formulario

### **Causa 5: Usuario no verificado**
**Síntomas:**
- Error: "Usuario no verificado"
- Producto no se crea

**Solución:**
```sql
-- Verificar y marcar usuario como verificado
UPDATE USUARIO 
SET verificado = true 
WHERE email = 'tu_email@ejemplo.com';
```

## Verificación Paso a Paso

### **1. Verificar Autenticación**
```sql
-- Debe mostrar tu usuario con auth_user_id
SELECT 
    user_id,
    email,
    nombre,
    apellido,
    verificado,
    activo,
    auth_user_id
FROM USUARIO 
WHERE email = 'tu_email@ejemplo.com';
```

### **2. Verificar Productos Existentes**
```sql
-- Debe mostrar productos si los hay
SELECT 
    producto_id,
    titulo,
    estado_validacion,
    fecha_creacion
FROM PRODUCTO 
ORDER BY fecha_creacion DESC;
```

### **3. Verificar Bucket Storage**
```sql
-- Debe mostrar el bucket Ecoswap como público
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'Ecoswap';
```

### **4. Verificar Archivos en Storage**
```sql
-- Debe mostrar archivos si los hay
SELECT 
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'Ecoswap'
ORDER BY created_at DESC;
```

## Prueba Manual

### **Proceso de Prueba:**
1. **Ir a** `/agregar-producto`
2. **Completar el formulario:**
   - Título: "Producto de Prueba"
   - Descripción: "Descripción de prueba"
   - Precio: 1000
   - Condición: "Como Nuevo"
   - Categoría: "Electrónicos"
   - Ubicación: "Bogotá"
   - **Subir al menos 1 imagen**
3. **Hacer clic en "Publicar Producto"**
4. **Revisar la consola** para errores
5. **Verificar en la base de datos** si se creó el producto

### **Resultado Esperado:**
- ✅ Producto se crea con `estado_validacion = 'pending'`
- ✅ Imágenes se suben a `Ecoswap/productos/`
- ✅ Referencias se guardan en `IMAGEN_PRODUCTO`
- ✅ Mensaje de éxito aparece

## Si Aún No Funciona

### **Debugging Avanzado:**

1. **Revisar logs de Supabase:**
   - Dashboard > Logs > API
   - Buscar errores relacionados con productos

2. **Verificar permisos:**
   - Dashboard > Settings > API
   - Verificar que las políticas RLS están configuradas

3. **Probar con curl:**
   ```bash
   curl -X POST http://localhost:3000/api/products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TU_TOKEN" \
     -d '{"titulo":"Prueba","descripcion":"Test","precio":1000}'
   ```

## Solución Rápida

Si nada funciona, ejecuta estos scripts en orden:

```sql
-- 1. Configurar Auth
\i database/add-auth-user-id-only.sql

-- 2. Sincronizar usuarios
SELECT * FROM sync_existing_auth_users();

-- 3. Verificar bucket
\i database/configure-storage-simple.sql

-- 4. Probar nuevamente
```

## Soporte

Si encuentras algún problema:
1. Ejecuta el script de diagnóstico
2. Revisa los logs en Supabase Dashboard
3. Verifica la consola del navegador
4. Confirma que todos los scripts se ejecutaron

¡Con este diagnóstico podrás identificar exactamente dónde está el problema!
