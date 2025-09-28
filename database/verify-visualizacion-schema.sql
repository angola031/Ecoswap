-- Script para verificar el esquema de visualizacion_producto
-- Basado en el esquema proporcionado por el usuario

-- PASO 1: Verificar que la tabla existe con la estructura correcta
SELECT '=== VERIFICANDO ESTRUCTURA DE visualizacion_producto ===' as info;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'visualizacion_producto' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASO 2: Verificar restricciones
SELECT '=== VERIFICANDO RESTRICCIONES ===' as info;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'visualizacion_producto'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- PASO 3: Verificar que la función register_product_view existe
SELECT '=== VERIFICANDO FUNCIÓN register_product_view ===' as info;

SELECT 
    routine_name, 
    routine_type,
    data_type,
    security_type,
    definer_rights
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'register_product_view';

-- PASO 4: Verificar datos de prueba
SELECT '=== DATOS DE PRUEBA ===' as info;

-- Usuarios disponibles
SELECT 
    'USUARIOS DISPONIBLES' as tipo,
    COUNT(*) as cantidad
FROM public.usuario 
WHERE auth_user_id IS NOT NULL;

-- Productos disponibles
SELECT 
    'PRODUCTOS DISPONIBLES' as tipo,
    COUNT(*) as cantidad
FROM public.producto 
WHERE estado_publicacion = 'activo';

-- Visualizaciones existentes
SELECT 
    'VISUALIZACIONES EXISTENTES' as tipo,
    COUNT(*) as cantidad
FROM public.visualizacion_producto;

-- PASO 5: Obtener datos específicos para prueba
SELECT '=== DATOS ESPECÍFICOS PARA PRUEBA ===' as info;

-- Primer usuario
SELECT 
    'USUARIO DE PRUEBA' as tipo,
    user_id,
    nombre,
    apellido,
    auth_user_id
FROM public.usuario 
WHERE auth_user_id IS NOT NULL
ORDER BY user_id
LIMIT 1;

-- Primer producto
SELECT 
    'PRODUCTO DE PRUEBA' as tipo,
    producto_id,
    titulo,
    visualizaciones,
    estado_publicacion
FROM public.producto 
WHERE estado_publicacion = 'activo'
ORDER BY producto_id
LIMIT 1;

-- PASO 6: Verificar estado actual
SELECT '=== ESTADO ACTUAL ===' as info;

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

-- PASO 7: Prueba manual de la función
SELECT '=== PRUEBA MANUAL DE LA FUNCIÓN ===' as info;

SELECT '
INSTRUCCIONES PARA PRUEBA MANUAL:

1. Copiar los IDs del usuario y producto obtenidos arriba
2. Ejecutar esta consulta (reemplazar USER_ID y PRODUCTO_ID):

   SELECT register_product_view(USER_ID, PRODUCTO_ID) as resultado;

3. Si la función no existe, ejecutar:
   database/implement-product-views-system.sql

4. Verificar que se insertó:
   SELECT * FROM public.visualizacion_producto 
   WHERE usuario_id = USER_ID AND producto_id = PRODUCTO_ID;

5. Verificar que se incrementó el contador:
   SELECT producto_id, titulo, visualizaciones 
   FROM public.producto 
   WHERE producto_id = PRODUCTO_ID;
' as instrucciones;
