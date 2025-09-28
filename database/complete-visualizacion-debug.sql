-- Script completo para diagnosticar problemas con visualizaciones
-- Ejecutar paso a paso para identificar el problema exacto

-- ========================================
-- PASO 1: VERIFICAR ESTRUCTURA BÁSICA
-- ========================================

SELECT '=== VERIFICANDO ESTRUCTURA BÁSICA ===' as info;

-- Verificar que las tablas existen
SELECT 
    'TABLA visualizacion_producto' as tabla,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'visualizacion_producto'

UNION ALL

SELECT 
    'TABLA estadistica_producto' as tabla,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'estadistica_producto'

UNION ALL

SELECT 
    'FUNCIÓN register_product_view' as tabla,
    CASE WHEN COUNT(*) > 0 THEN 'EXISTE' ELSE 'NO EXISTE' END as estado
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'register_product_view';

-- ========================================
-- PASO 2: VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================

SELECT '=== ESTRUCTURA DE visualizacion_producto ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY column_name;

SELECT '=== ESTRUCTURA DE estadistica_producto ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'estadistica_producto' 
    AND table_schema = 'public'
ORDER BY column_name;

-- ========================================
-- PASO 3: VERIFICAR DATOS DE PRUEBA
-- ========================================

SELECT '=== DATOS DE PRUEBA DISPONIBLES ===' as info;

-- Usuarios disponibles
SELECT 
    'USUARIOS' as tipo,
    COUNT(*) as cantidad,
    'Usuarios con auth_user_id' as descripcion
FROM public.usuario 
WHERE auth_user_id IS NOT NULL

UNION ALL

-- Productos disponibles
SELECT 
    'PRODUCTOS' as tipo,
    COUNT(*) as cantidad,
    'Productos activos' as descripcion
FROM public.producto 
WHERE estado_publicacion = 'activo'

UNION ALL

-- Visualizaciones existentes
SELECT 
    'VISUALIZACIONES' as tipo,
    COUNT(*) as cantidad,
    'Visualizaciones registradas' as descripcion
FROM public.visualizacion_producto

UNION ALL

-- Estadísticas diarias existentes
SELECT 
    'ESTADÍSTICAS' as tipo,
    COUNT(*) as cantidad,
    'Registros de estadísticas diarias' as descripcion
FROM public.estadistica_producto;

-- ========================================
-- PASO 4: OBTENER DATOS ESPECÍFICOS PARA PRUEBA
-- ========================================

SELECT '=== DATOS ESPECÍFICOS PARA PRUEBA ===' as info;

-- Primer usuario disponible
SELECT 
    'USUARIO DE PRUEBA' as tipo,
    user_id,
    nombre,
    apellido,
    auth_user_id,
    verificado
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 1;

-- Primer producto disponible
SELECT 
    'PRODUCTO DE PRUEBA' as tipo,
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion,
    user_id as propietario_id
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 1;

-- ========================================
-- PASO 5: VERIFICAR ESTADO ACTUAL
-- ========================================

SELECT '=== ESTADO ACTUAL DE VISUALIZACIONES ===' as info;

-- Visualizaciones recientes
SELECT 
    'VISUALIZACIONES RECIENTES' as tipo,
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
LIMIT 5;

-- Estadísticas diarias recientes
SELECT 
    'ESTADÍSTICAS DIARIAS RECIENTES' as tipo,
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
LIMIT 5;

-- ========================================
-- PASO 6: VERIFICAR PERMISOS Y RESTRICCIONES
-- ========================================

SELECT '=== VERIFICANDO PERMISOS Y RESTRICCIONES ===' as info;

-- Restricciones de visualizacion_producto
SELECT 
    'RESTRICCIONES visualizacion_producto' as tipo,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'visualizacion_producto'
    AND tc.table_schema = 'public';

-- Restricciones de estadistica_producto
SELECT 
    'RESTRICCIONES estadistica_producto' as tipo,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'estadistica_producto'
    AND tc.table_schema = 'public';

-- ========================================
-- PASO 7: INSTRUCCIONES PARA PRUEBA MANUAL
-- ========================================

SELECT '=== INSTRUCCIONES PARA PRUEBA MANUAL ===' as info;

SELECT '
PARA PROBAR MANUALMENTE:

1. Copiar los IDs del usuario y producto obtenidos arriba
2. Ejecutar esta consulta (reemplazar USER_ID y PRODUCTO_ID):

   SELECT register_product_view(USER_ID, PRODUCTO_ID) as resultado;

3. Verificar que se insertó en visualizacion_producto:
   SELECT * FROM public.visualizacion_producto 
   WHERE usuario_id = USER_ID AND producto_id = PRODUCTO_ID;

4. Verificar que se incrementó el contador en producto:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE producto_id = PRODUCTO_ID;

5. Verificar que se actualizó estadistica_producto:
   SELECT * FROM public.estadistica_producto 
   WHERE producto_id = PRODUCTO_ID AND fecha = CURRENT_DATE;

SI LA FUNCIÓN FALLA:
- Revisar logs de PostgreSQL
- Verificar que los IDs son válidos
- Verificar permisos de la función

SI LA FUNCIÓN FUNCIONA PERO LA API NO:
- Revisar logs de la API
- Verificar autenticación del usuario
- Verificar que la API está llamando a la función
' as instrucciones;
