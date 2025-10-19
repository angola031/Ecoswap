# Sistema de Actualización de Likes de Productos

Este sistema mantiene automáticamente actualizada la cantidad de "me gusta" de los productos en la tabla `producto` basándose en los registros de la tabla `favoritos`.

## 🚀 Instalación

### 1. Instalación Completa (Recomendado)
Ejecuta el script completo en Supabase Dashboard > SQL Editor:

```sql
-- Ejecutar: database/install-likes-system.sql
```

### 2. Instalación Paso a Paso
Si prefieres instalar paso a paso:

1. **Agregar campo total_likes:**
   ```sql
   -- Ejecutar: database/add-total-likes-to-producto.sql
   ```

2. **Crear triggers automáticos:**
   ```sql
   -- Ejecutar: database/create-likes-trigger.sql
   ```

3. **Sincronizar contadores existentes:**
   ```sql
   -- Ejecutar: database/sync-likes-counters.sql
   ```

## 📊 Funcionalidades

### ✅ Actualización Automática
- **Inserción de favorito:** El contador se incrementa automáticamente
- **Eliminación de favorito:** El contador se decrementa automáticamente
- **Triggers:** Se ejecutan automáticamente en la tabla `favorito`

### ✅ Sincronización Manual
- **Función de sincronización:** `sync_all_product_likes()`
- **Corrección individual:** `admin_fix_product_likes(producto_id)`
- **Corrección masiva:** `admin_fix_all_products_likes()`

### ✅ Verificación y Reportes
- **Reporte completo:** `admin_get_likes_report()`
- **Productos desincronizados:** Filtro por diferencia != 0
- **Estadísticas generales:** Totales, promedios, máximos

## 🔧 API Endpoints

### Sincronización
```http
POST /api/products/likes/sync
```
Sincroniza todos los contadores de likes.

```http
GET /api/products/likes/sync
```
Obtiene estadísticas de likes del sistema.

### Verificación
```http
GET /api/products/likes/verify
```
Verifica el estado de sincronización de los contadores.

```http
POST /api/products/likes/verify
```
Corrige productos desincronizados.

## 📋 Comandos de Administración

### 1. Verificar Estado del Sistema
```sql
SELECT * FROM admin_get_likes_report();
```

### 2. Ver Solo Productos Desincronizados
```sql
SELECT * FROM admin_get_likes_report() 
WHERE diferencia != 0 
ORDER BY ABS(diferencia) DESC;
```

### 3. Sincronizar Todos los Contadores
```sql
SELECT * FROM public.sync_all_product_likes();
```

### 4. Corregir Producto Específico
```sql
SELECT * FROM admin_fix_product_likes(1); -- Reemplaza 1 con el ID del producto
```

### 5. Estadísticas Generales
```sql
SELECT 
    COUNT(*) as total_productos,
    SUM(contador_sistema) as total_likes_sistema,
    COUNT(*) FILTER (WHERE diferencia = 0) as productos_sincronizados,
    COUNT(*) FILTER (WHERE diferencia != 0) as productos_desincronizados
FROM admin_get_likes_report();
```

## 🧪 Pruebas

### Script de Prueba
```sql
-- Ejecutar: database/test-likes-system.sql
```

### Pruebas Manuales

1. **Probar inserción de favorito:**
   ```sql
   INSERT INTO public.favorito (usuario_id, producto_id) 
   VALUES (1, 1);
   ```

2. **Verificar que el contador se actualiza:**
   ```sql
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = 1;
   ```

3. **Probar eliminación de favorito:**
   ```sql
   DELETE FROM public.favorito 
   WHERE usuario_id = 1 AND producto_id = 1;
   ```

4. **Verificar que el contador se actualiza:**
   ```sql
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = 1;
   ```

## 📁 Archivos del Sistema

### Scripts de Base de Datos
- `database/install-likes-system.sql` - Instalación completa
- `database/update-product-likes-complete.sql` - Sistema completo
- `database/test-likes-system.sql` - Pruebas del sistema
- `database/admin-likes-management.sql` - Herramientas de administración

### APIs
- `app/api/products/likes/sync/route.ts` - Sincronización
- `app/api/products/likes/verify/route.ts` - Verificación

### Scripts Existentes (Ya disponibles)
- `database/add-total-likes-to-producto.sql`
- `database/create-likes-trigger.sql`
- `database/sync-likes-counters.sql`

## 🔍 Estructura de Datos

### Tabla `producto`
```sql
ALTER TABLE public.producto ADD COLUMN total_likes INTEGER DEFAULT 0;
```

### Tabla `favorito`
```sql
-- Estructura existente:
-- favorito_id (PK)
-- usuario_id (FK)
-- producto_id (FK)
-- fecha_agregado
-- notas_privadas
```

### Triggers
- `trigger_update_product_likes` - Se ejecuta en INSERT/DELETE de `favorito`

## ⚠️ Consideraciones Importantes

1. **Backup:** Siempre haz backup antes de ejecutar scripts masivos
2. **Pruebas:** Ejecuta las pruebas antes de usar en producción
3. **Monitoreo:** Verifica regularmente el estado de sincronización
4. **RLS:** Asegúrate de que las políticas RLS permitan las operaciones necesarias

## 🚨 Solución de Problemas

### Contadores Desincronizados
```sql
-- Verificar productos desincronizados
SELECT * FROM admin_get_likes_report() WHERE diferencia != 0;

-- Corregir todos los productos
SELECT * FROM public.sync_all_product_likes();
```

### Triggers No Funcionan
```sql
-- Verificar triggers existentes
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'favorito';

-- Reinstalar triggers
-- Ejecutar: database/create-likes-trigger.sql
```

### Campo total_likes No Existe
```sql
-- Verificar si existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'producto' AND column_name = 'total_likes';

-- Agregar si no existe
-- Ejecutar: database/add-total-likes-to-producto.sql
```

## 📈 Monitoreo Recomendado

1. **Diario:** Verificar productos desincronizados
2. **Semanal:** Ejecutar sincronización completa
3. **Mensual:** Revisar estadísticas generales
4. **Después de cambios:** Verificar que los triggers funcionan

---

**¡El sistema está listo para usar!** Los contadores de likes se actualizarán automáticamente cada vez que se agreguen o eliminen favoritos.
