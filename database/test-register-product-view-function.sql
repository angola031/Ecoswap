-- Script para probar específicamente la función register_product_view
-- Ejecutar paso a paso para identificar el problema

-- PASO 1: Verificar que la función existe y está correcta
SELECT '=== VERIFICANDO FUNCIÓN register_product_view ===' as info;

SELECT 
    routine_name, 
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'register_product_view';

-- PASO 2: Obtener datos de prueba
SELECT '=== OBTENIENDO DATOS DE PRUEBA ===' as info;

-- Obtener un usuario válido
SELECT 
    'Usuario de prueba' as tipo,
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
LIMIT 1;

-- Obtener un producto válido
SELECT 
    'Producto de prueba' as tipo,
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
LIMIT 1;

-- PASO 3: Verificar estado antes de la prueba
SELECT '=== ESTADO ANTES DE LA PRUEBA ===' as info;

-- Verificar visualizaciones en producto (usar un ID específico)
SELECT 
    'Estado inicial del producto' as descripcion,
    producto_id,
    titulo,
    visualizaciones
FROM public.producto 
WHERE producto_id = 1; -- Cambiar por un ID real

-- Verificar si ya existe visualización (usar IDs específicos)
SELECT 
    'Visualizaciones existentes' as descripcion,
    visualizacion_id,
    usuario_id,
    producto_id,
    fecha_visualizacion
FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1; -- Cambiar por IDs reales

-- Verificar estadísticas diarias
SELECT 
    'Estadísticas diarias existentes' as descripcion,
    producto_id,
    fecha,
    visualizaciones_dia
FROM public.estadistica_producto 
WHERE producto_id = 1 AND fecha = CURRENT_DATE; -- Cambiar por ID real

-- PASO 4: Prueba manual de la función (DESCOMENTAR Y EJECUTAR MANUALMENTE)
SELECT '=== PRUEBA MANUAL DE LA FUNCIÓN ===' as info;

/*
-- IMPORTANTE: Descomentar estas líneas y cambiar los IDs por valores reales
-- antes de ejecutar

-- Probar la función
SELECT register_product_view(1, 1) as resultado_prueba;

-- Verificar que se insertó en visualizacion_producto
SELECT 
    'Después de la función - visualizacion_producto' as descripcion,
    visualizacion_id,
    usuario_id,
    producto_id,
    fecha_visualizacion
FROM public.visualizacion_producto 
WHERE usuario_id = 1 AND producto_id = 1;

-- Verificar que se incrementó el contador en producto
SELECT 
    'Después de la función - producto' as descripcion,
    producto_id,
    titulo,
    visualizaciones
FROM public.producto 
WHERE producto_id = 1;

-- Verificar que se actualizó estadistica_producto
SELECT 
    'Después de la función - estadistica_producto' as descripcion,
    producto_id,
    fecha,
    visualizaciones_dia
FROM public.estadistica_producto 
WHERE producto_id = 1 AND fecha = CURRENT_DATE;
*/

-- PASO 5: Verificar permisos de la función
SELECT '=== VERIFICANDO PERMISOS ===' as info;

SELECT 
    routine_name,
    security_type,
    definer_rights
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'register_product_view';

-- PASO 6: Verificar que las tablas tienen los permisos correctos
SELECT '=== VERIFICANDO PERMISOS DE TABLAS ===' as info;

SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('visualizacion_producto', 'producto', 'estadistica_producto')
    AND grantee = 'public'
ORDER BY table_name, privilege_type;

-- PASO 7: Instrucciones para debugging
SELECT '=== INSTRUCCIONES PARA DEBUGGING ===' as info;

SELECT '
Para debuggear el problema:

1. Ejecutar este script completo
2. Descomentar la sección de prueba manual (PASO 4)
3. Cambiar los IDs (1, 1) por IDs reales de usuario y producto
4. Ejecutar la prueba manual
5. Verificar los resultados

Si la función falla:
- Revisar los logs de PostgreSQL
- Verificar que las tablas existen
- Verificar que los IDs son válidos
- Verificar permisos de la función

Si la función funciona pero la API no:
- Revisar logs de la API
- Verificar que la API está llamando a la función
- Verificar autenticación del usuario
- Verificar que el usuario_id se obtiene correctamente
' as instrucciones_debugging;
