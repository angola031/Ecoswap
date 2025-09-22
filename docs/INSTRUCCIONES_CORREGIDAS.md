# Instrucciones Corregidas para Actualizar el Esquema

## Problema Identificado

El script anterior intentaba usar `auth_user_id` que no existe en tu esquema. Tu tabla `USUARIO` no tiene integración con Supabase Auth.

## Solución Corregida

Ejecuta este script corregido que funciona con tu esquema actual:

### **Script Principal (Ejecutar PRIMERO)**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/update-existing-producto-table-fixed.sql
```

### **Script de Imágenes (Ejecutar SEGUNDO)**
```sql
-- Ejecutar en Supabase SQL Editor  
\i database/update-imagen-producto-table.sql
```

## Cambios en el Script Corregido

### **1. Eliminé referencias a `auth_user_id`**
- Las políticas RLS ahora funcionan con tu esquema actual
- La función `validate_product` acepta el `admin_user_id` como parámetro
- Se usa tu campo `es_admin` y sistema de roles existente

### **2. Adapté las funciones para tu esquema**
- `increment_product_views()` usa tu campo `visualizaciones` existente
- `get_product_stats()` usa tu estructura actual
- Las políticas RLS son más simples y compatibles

### **3. Mantengo tu estructura de roles**
- Usa tu tabla `ROL_USUARIO` existente
- Compatible con tus roles: `super_admin`, `admin_soporte`, `admin_validacion`
- Usa tu campo `es_admin` de la tabla `USUARIO`

## Pasos Detallados

### **Paso 1: Ejecutar Script Corregido**
1. Ve a Supabase Dashboard > SQL Editor
2. Ejecuta: `\i database/update-existing-producto-table-fixed.sql`

### **Paso 2: Verificar que Funciona**
Después de ejecutar, verifica con estas consultas:

```sql
-- Verificar que las columnas se agregaron
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'fecha_validacion', 'validado_por');

-- Verificar que la vista se creó
SELECT * FROM PRODUCTOS_PUBLICOS LIMIT 1;

-- Verificar que las funciones existen
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('validate_product', 'get_pending_products');
```

### **Paso 3: Probar el Sistema**
1. Intenta crear un producto desde `/agregar-producto`
2. Debería guardarse con `estado_validacion = 'pending'`
3. Ve al dashboard de admin para validar productos

## APIs Actualizadas

He actualizado las APIs para trabajar con tu esquema:

### **`app/api/products/validate/route.ts`**
- Ahora verifica administradores usando tu campo `es_admin`
- Compatible con tu sistema de roles existente
- Pasa el `admin_user_id` a la función de validación

### **`app/api/products/[id]/route.ts`**
- Lee imágenes desde tu tabla `IMAGEN_PRODUCTO`
- Usa tu campo `visualizaciones` para estadísticas

## Sistema de Autenticación

Como tu sistema no usa Supabase Auth completamente, las APIs están configuradas para:

1. **Verificar administradores** usando tu campo `es_admin` y roles
2. **Manejar productos** con el nuevo sistema de validación
3. **Gestionar imágenes** con tu tabla `IMAGEN_PRODUCTO` existente

## Productos Existentes

Los productos que ya tienes se marcarán automáticamente como `approved` para que sean visibles inmediatamente.

## Si Aún Hay Errores

### **Error de Políticas RLS**
Si tienes problemas con las políticas, puedes deshabilitarlas temporalmente:

```sql
-- Deshabilitar RLS temporalmente
ALTER TABLE PRODUCTO DISABLE ROW LEVEL SECURITY;
```

### **Error de Funciones**
Si hay conflictos con funciones existentes, se recrearán automáticamente con `CREATE OR REPLACE FUNCTION`.

### **Error de Vista**
Si la vista ya existe, se recreará automáticamente con `CREATE OR REPLACE VIEW`.

## Verificación Final

Después de ejecutar el script, deberías poder:

1. ✅ Crear productos que se guarden con `estado_validacion = 'pending'`
2. ✅ Ver productos pendientes en el dashboard de admin
3. ✅ Aprobar/rechazar productos desde el admin
4. ✅ Ver solo productos aprobados en la plataforma pública
5. ✅ Las imágenes se manejen correctamente con tu tabla `IMAGEN_PRODUCTO`

## Soporte

Si encuentras algún problema:
1. Revisa los logs en Supabase Dashboard
2. Verifica que todas las tablas referenciadas existen
3. Asegúrate de que los roles de administrador estén configurados correctamente

El script corregido debería funcionar perfectamente con tu esquema actual sin errores de `auth_user_id`.
