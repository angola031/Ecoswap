# Instrucciones para Actualizar el Esquema de Base de Datos

## Problema Identificado

Tu tabla `PRODUCTO` no tiene las columnas de validación (`estado_validacion`, `fecha_validacion`, etc.) que necesita el sistema de validación de productos.

## Solución

Ejecuta los siguientes scripts SQL en tu Supabase Dashboard en el siguiente orden:

### 1. **Actualizar Tabla PRODUCTO**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/update-existing-producto-table.sql
```

### 2. **Actualizar Tabla IMAGEN_PRODUCTO**
```sql
-- Ejecutar en Supabase SQL Editor  
\i database/update-imagen-producto-table.sql
```

### 3. **Agregar Funciones de Estadísticas**
```sql
-- Ejecutar en Supabase SQL Editor
\i database/add-product-stats-functions.sql
```

## Cambios que se Aplicarán

### **Tabla PRODUCTO (se agregarán estas columnas):**
- `estado_validacion` VARCHAR(20) DEFAULT 'pending' 
- `fecha_validacion` TIMESTAMP WITH TIME ZONE
- `validado_por` INTEGER (FK a USUARIO)
- `comentarios_validacion` TEXT
- `fecha_creacion` TIMESTAMP WITH TIME ZONE

### **Tabla IMAGEN_PRODUCTO (se agregarán):**
- Políticas RLS
- Funciones para manejo de imágenes
- Índices para rendimiento

### **Nuevas Funciones SQL:**
- `validate_product()` - Para validar productos
- `get_pending_products()` - Para obtener productos pendientes
- `get_product_images()` - Para obtener imágenes de productos
- `add_product_image()` - Para agregar imágenes
- `increment_product_views()` - Para estadísticas
- `add_product_like()` - Para sistema de likes

### **Nueva Vista:**
- `PRODUCTOS_PUBLICOS` - Vista que muestra solo productos aprobados

## Pasos Detallados

### **Paso 1: Ejecutar Scripts**
1. Ve a tu Supabase Dashboard
2. Navega a **SQL Editor**
3. Ejecuta cada script en orden

### **Paso 2: Verificar Cambios**
Después de ejecutar los scripts, verifica que:
1. La tabla `PRODUCTO` tiene las nuevas columnas
2. La vista `PRODUCTOS_PUBLICOS` existe
3. Las funciones SQL se crearon correctamente

### **Paso 3: Configurar Storage (si no está configurado)**
1. Ve a **Storage** en Supabase Dashboard
2. Crea bucket "Ecoswap" si no existe
3. Configura políticas públicas para lectura

### **Paso 4: Probar el Sistema**
1. Intenta crear un producto desde `/agregar-producto`
2. Verifica que se guarda con `estado_validacion = 'pending'`
3. Ve al dashboard de admin para validar productos
4. Verifica que los productos aprobados aparecen públicamente

## Productos Existentes

Los productos existentes en tu base de datos se actualizarán automáticamente:
- Se les asignará `estado_validacion = 'approved'` para que sean visibles
- Se creará `fecha_creacion` basada en `fecha_publicacion`

## Verificación Post-Instalación

### **Consulta para verificar columnas:**
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'PRODUCTO' 
AND column_name IN ('estado_validacion', 'fecha_validacion', 'validado_por', 'comentarios_validacion', 'fecha_creacion');
```

### **Consulta para verificar funciones:**
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('validate_product', 'get_pending_products', 'get_product_images');
```

### **Consulta para verificar vista:**
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'PRODUCTOS_PUBLICOS';
```

## Solución de Problemas

### **Error: "Column already exists"**
Si alguna columna ya existe, el script la omitirá automáticamente gracias a `IF NOT EXISTS`.

### **Error: "Function already exists"**
Las funciones se recrearán con `CREATE OR REPLACE FUNCTION`.

### **Error: "Policy already exists"**
Las políticas se eliminarán y recrearán para evitar conflictos.

## Después de la Actualización

Una vez ejecutados los scripts:

1. **El sistema de validación funcionará** - Los administradores podrán aprobar/rechazar productos
2. **Los productos existentes serán visibles** - Se marcarán como aprobados automáticamente
3. **Las imágenes se manejarán correctamente** - Tanto desde Storage como desde la tabla IMAGEN_PRODUCTO
4. **Las estadísticas funcionarán** - Sistema de vistas y likes implementado

## Archivos Actualizados

Los siguientes archivos de la aplicación ya están actualizados para trabajar con tu esquema:
- `app/api/products/[id]/route.ts`
- `app/api/products/[id]/images/route.ts`
- `app/producto/[id]/page.tsx`

## Soporte

Si encuentras algún problema durante la actualización:
1. Revisa los logs en Supabase Dashboard
2. Verifica que todas las tablas referenciadas existen
3. Asegúrate de tener permisos de administrador en la base de datos
