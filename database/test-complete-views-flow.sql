-- Script para probar el flujo completo de visualizaciones
-- Desde la función hasta el marketplace

-- PASO 1: Verificar que todo está en orden
SELECT '=== VERIFICACIÓN INICIAL ===' as info;

-- Verificar función
SELECT 
    'FUNCIÓN register_product_view' as elemento,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'register_product_view';

-- Verificar tablas
SELECT 
    'TABLA visualizacion_producto' as elemento,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'visualizacion_producto'

UNION ALL

SELECT 
    'TABLA estadistica_producto' as elemento,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'estadistica_producto';

-- PASO 2: Obtener datos para prueba
SELECT '=== OBTENIENDO DATOS PARA PRUEBA ===' as info;

-- Usuario de prueba
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 1;

-- Producto de prueba
SELECT 
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 1;

-- PASO 3: Verificar estado inicial
SELECT '=== ESTADO INICIAL ===' as info;

-- Contar visualizaciones existentes
SELECT 
    'VISUALIZACIONES EXISTENTES' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto;

-- Contar visualizaciones de hoy
SELECT 
    'VISUALIZACIONES DE HOY' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto
WHERE DATE(fecha_visualizacion) = CURRENT_DATE;

-- PASO 4: Prueba completa del flujo
SELECT '=== PRUEBA COMPLETA DEL FLUJO ===' as info;

SELECT '
PARA PROBAR EL FLUJO COMPLETO (cambiar los IDs por valores reales):

1. PROBAR LA FUNCIÓN:
   SELECT register_product_view(1, 1) as resultado;

2. VERIFICAR QUE SE INSERTÓ EN visualizacion_producto:
   SELECT * FROM public.visualizacion_producto 
   WHERE usuario_id = 1 AND producto_id = 1;

3. VERIFICAR QUE SE INCREMENTÓ EL CONTADOR EN producto:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE producto_id = 1;

4. VERIFICAR QUE SE ACTUALIZÓ estadistica_producto:
   SELECT * FROM public.estadistica_producto 
   WHERE producto_id = 1 AND fecha = CURRENT_DATE;

5. PROBAR LA API DE ESTADÍSTICAS:
   GET /api/products/1/stats
   
   Debería retornar:
   {
     "stats": {
       "views": [número_actualizado],
       "likes": [número_likes],
       "interactions": [número_likes],
       "lastActivity": null
     }
   }

6. VERIFICAR EN EL MARKETPLACE:
   - Las views deberían mostrarse correctamente
   - El contador debería incrementarse
' as prueba_completa;

-- PASO 5: Verificar estadísticas actuales
SELECT '=== ESTADÍSTICAS ACTUALES ===' as info;

-- Top productos por visualizaciones
SELECT 
    'TOP PRODUCTOS POR VISUALIZACIONES' as tipo,
    p.producto_id,
    p.titulo,
    p.visualizaciones,
    p.estado_publicacion
FROM public.producto p
WHERE p.estado_publicacion = 'activo'
ORDER BY p.visualizaciones DESC
LIMIT 5;

-- Estadísticas diarias por producto
SELECT 
    'ESTADÍSTICAS DIARIAS POR PRODUCTO' as tipo,
    ep.producto_id,
    p.titulo,
    ep.fecha,
    ep.visualizaciones_dia
FROM public.estadistica_producto ep
JOIN public.producto p ON ep.producto_id = p.producto_id
ORDER BY ep.fecha DESC, ep.visualizaciones_dia DESC
LIMIT 5;

-- PASO 6: Resumen del estado
SELECT '=== RESUMEN DEL ESTADO ===' as info;

SELECT 
    'TOTAL DE VISUALIZACIONES REGISTRADAS' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'TOTAL DE PRODUCTOS CON VISUALIZACIONES' as metrica,
    COUNT(DISTINCT producto_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'TOTAL DE USUARIOS QUE HAN VISTO PRODUCTOS' as metrica,
    COUNT(DISTINCT usuario_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'TOTAL DE REGISTROS DE ESTADÍSTICAS DIARIAS' as metrica,
    COUNT(*) as valor
FROM public.estadistica_producto;
