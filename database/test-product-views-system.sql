-- Script para probar el sistema de visualizaciones de productos
-- Verifica que las funciones y APIs funcionen correctamente

-- PASO 1: Verificar estructura de las tablas
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLA VISUALIZACION_PRODUCTO ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY column_name;

SELECT '=== VERIFICANDO ESTRUCTURA DE TABLA ESTADISTICA_PRODUCTO ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'estadistica_producto' 
    AND table_schema = 'public'
ORDER BY column_name;

-- PASO 2: Verificar que las funciones existen
SELECT '=== VERIFICANDO FUNCIONES ===' as info;

SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'register_product_view',
        'get_unique_views_count', 
        'has_user_viewed_product'
    )
ORDER BY routine_name;

-- PASO 3: Mostrar datos de ejemplo
SELECT '=== DATOS DE EJEMPLO ===' as info;

-- Mostrar algunos usuarios
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 5;

-- Mostrar algunos productos
SELECT 
    producto_id,
    titulo,
    visualizaciones,
    user_id as propietario_id
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 5;

-- PASO 4: Mostrar visualizaciones existentes
SELECT '=== VISUALIZACIONES EXISTENTES ===' as info;

SELECT 
    v.visualizacion_id,
    v.usuario_id,
    v.producto_id,
    v.fecha_visualizacion,
    u.nombre || ' ' || u.apellido as usuario_nombre,
    p.titulo as producto_titulo
FROM public.visualizacion_producto v
JOIN public.usuario u ON v.usuario_id = u.user_id
JOIN public.producto p ON v.producto_id = p.producto_id
ORDER BY v.fecha_visualizacion DESC
LIMIT 10;

-- PASO 4.1: Mostrar estadísticas diarias existentes
SELECT '=== ESTADÍSTICAS DIARIAS EXISTENTES ===' as info;

SELECT 
    ep.producto_id,
    p.titulo as producto_titulo,
    ep.fecha,
    ep.visualizaciones_dia,
    ep.contactos_dia,
    ep.veces_guardado_dia,
    ep.propuestas_recibidas_dia
FROM public.estadistica_producto ep
JOIN public.producto p ON ep.producto_id = p.producto_id
ORDER BY ep.fecha DESC, ep.visualizaciones_dia DESC
LIMIT 10;

-- PASO 5: Verificar sincronización de contadores
SELECT '=== VERIFICANDO SINCRONIZACIÓN DE CONTADORES ===' as info;

SELECT 
    p.producto_id,
    p.titulo,
    p.visualizaciones as contador_producto,
    COUNT(DISTINCT v.usuario_id) as visualizaciones_reales,
    CASE 
        WHEN p.visualizaciones = COUNT(DISTINCT v.usuario_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado_sincronizacion
FROM public.producto p
LEFT JOIN public.visualizacion_producto v ON p.producto_id = v.producto_id
GROUP BY p.producto_id, p.titulo, p.visualizaciones
ORDER BY p.visualizaciones DESC
LIMIT 10;

-- PASO 6: Prueba de funciones (comentado para evitar errores)
SELECT '=== PRUEBA DE FUNCIONES ===' as info;

SELECT '
Para probar las funciones manualmente:

1. Probar registro de visualización:
   SELECT register_product_view(1, 1) as nueva_visualizacion;

2. Probar verificación de visualización:
   SELECT has_user_viewed_product(1, 1) as ya_vio_producto;

3. Probar contador de visualizaciones únicas:
   SELECT get_unique_views_count(1) as total_visualizaciones_unicas;

4. Verificar que el contador se actualizó:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE producto_id = 1;
' as instrucciones_prueba;

-- PASO 7: Estadísticas del sistema
SELECT '=== ESTADÍSTICAS DEL SISTEMA ===' as info;

SELECT 
    'Total de visualizaciones registradas' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Usuarios únicos que han visto productos' as metrica,
    COUNT(DISTINCT usuario_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Productos con visualizaciones' as metrica,
    COUNT(DISTINCT producto_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Productos sin visualizaciones' as metrica,
    (SELECT COUNT(*) FROM public.producto WHERE estado_publicacion = 'activo') - 
    COUNT(DISTINCT producto_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Promedio de visualizaciones por producto' as metrica,
    ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT producto_id), 0), 2) as valor
FROM public.visualizacion_producto;

-- PASO 8: Instrucciones para prueba de API
SELECT '=== INSTRUCCIONES PARA PRUEBA DE API ===' as info;

SELECT '
Para probar la API de visualizaciones:

1. Obtener un JWT token de autenticación
2. Probar registro de visualización:
   POST /api/products/[PRODUCTO_ID]/view
   Headers: Authorization: Bearer [JWT_TOKEN]

3. Probar obtención de estadísticas:
   GET /api/products/[PRODUCTO_ID]/view
   Headers: Authorization: Bearer [JWT_TOKEN]

4. Verificar en el frontend:
   - Abrir DevTools Console
   - Navegar a un producto
   - Verificar logs de debug
   - Confirmar que se registra la visualización
   - Verificar que el contador se actualiza

5. Probar casos edge:
   - Usuario no autenticado (no debe registrar visualización)
   - Usuario que ya vio el producto (no debe incrementar contador)
   - Usuario propietario (debe registrar visualización)
' as instrucciones_api;
