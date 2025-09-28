-- Script para diagnosticar problemas con la tabla visualizacion_producto
-- Ejecutar para identificar por qué no se actualiza

-- PASO 1: Verificar que la tabla existe y tiene la estructura correcta
SELECT '=== VERIFICANDO ESTRUCTURA DE TABLA ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
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

-- PASO 3: Verificar datos de ejemplo
SELECT '=== DATOS DE EJEMPLO ===' as info;

-- Mostrar algunos usuarios
SELECT 
    user_id,
    nombre,
    apellido,
    auth_user_id,
    verificado
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 5;

-- Mostrar algunos productos
SELECT 
    producto_id,
    titulo,
    visualizaciones,
    user_id as propietario_id,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 5;

-- PASO 4: Verificar visualizaciones existentes
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

-- PASO 5: Verificar estadísticas diarias
SELECT '=== ESTADÍSTICAS DIARIAS ===' as info;

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

-- PASO 6: Prueba manual de la función (comentado para evitar errores)
SELECT '=== PRUEBA MANUAL DE FUNCIÓN ===' as info;

SELECT '
Para probar manualmente la función register_product_view:

1. Obtener un usuario_id válido:
   SELECT user_id, nombre, apellido, auth_user_id 
   FROM public.usuario 
   WHERE auth_user_id IS NOT NULL 
   LIMIT 1;

2. Obtener un producto_id válido:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE estado_publicacion = ''activo''
   LIMIT 1;

3. Probar la función:
   SELECT register_product_view([USER_ID], [PRODUCTO_ID]) as resultado;

4. Verificar que se insertó en visualizacion_producto:
   SELECT * FROM public.visualizacion_producto 
   WHERE usuario_id = [USER_ID] AND producto_id = [PRODUCTO_ID];

5. Verificar que se incrementó el contador en producto:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE producto_id = [PRODUCTO_ID];

6. Verificar que se actualizó estadistica_producto:
   SELECT * FROM public.estadistica_producto 
   WHERE producto_id = [PRODUCTO_ID] AND fecha = CURRENT_DATE;
' as instrucciones_prueba;

-- PASO 7: Verificar logs de errores (si existen)
SELECT '=== VERIFICANDO POSIBLES ERRORES ===' as info;

-- Verificar si hay restricciones que puedan estar fallando
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'visualizacion_producto'
    AND tc.table_schema = 'public';

-- PASO 8: Verificar índices
SELECT '=== VERIFICANDO ÍNDICES ===' as info;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'visualizacion_producto'
    AND schemaname = 'public';

-- PASO 9: Estadísticas de la tabla
SELECT '=== ESTADÍSTICAS DE LA TABLA ===' as info;

SELECT 
    'Total de registros en visualizacion_producto' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Usuarios únicos en visualizacion_producto' as metrica,
    COUNT(DISTINCT usuario_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Productos únicos en visualizacion_producto' as metrica,
    COUNT(DISTINCT producto_id) as valor
FROM public.visualizacion_producto

UNION ALL

SELECT 
    'Registros de hoy en visualizacion_producto' as metrica,
    COUNT(*) as valor
FROM public.visualizacion_producto
WHERE DATE(fecha_visualizacion) = CURRENT_DATE;
