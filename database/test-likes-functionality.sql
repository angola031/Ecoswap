-- Script de prueba para verificar la funcionalidad de likes
-- Ejecutar después de aplicar el script add-total-likes-to-producto.sql

-- PASO 1: Verificar que el campo total_likes existe
SELECT '=== VERIFICANDO CAMPO TOTAL_LIKES ===' as info;

SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producto' 
    AND table_schema = 'public' 
    AND column_name = 'total_likes';

-- PASO 2: Verificar que el trigger existe
SELECT '=== VERIFICANDO TRIGGER ===' as info;

SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_product_likes';

-- PASO 3: Verificar que la función existe
SELECT '=== VERIFICANDO FUNCIÓN ===' as info;

SELECT 
    routine_name, 
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'update_product_likes_count'
    AND routine_schema = 'public';

-- PASO 4: Mostrar algunos productos con sus contadores
SELECT '=== PRODUCTOS CON CONTADORES DE LIKES ===' as info;

SELECT 
    p.producto_id,
    p.titulo,
    p.total_likes as likes_en_producto,
    COUNT(f.favorito_id) as likes_reales_en_favorito,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado_sincronizacion
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
ORDER BY p.total_likes DESC
LIMIT 10;

-- PASO 5: Mostrar usuarios que más likes han dado
SELECT '=== USUARIOS MÁS ACTIVOS EN LIKES ===' as info;

SELECT 
    u.user_id,
    u.nombre,
    u.apellido,
    u.email,
    COUNT(f.favorito_id) as total_likes_dados
FROM public.usuario u
JOIN public.favorito f ON u.user_id = f.usuario_id
GROUP BY u.user_id, u.nombre, u.apellido, u.email
ORDER BY total_likes_dados DESC
LIMIT 10;

-- PASO 6: Mostrar productos más populares
SELECT '=== PRODUCTOS MÁS POPULARES ===' as info;

SELECT 
    p.producto_id,
    p.titulo,
    p.total_likes,
    p.visualizaciones,
    u.nombre || ' ' || u.apellido as propietario
FROM public.producto p
JOIN public.usuario u ON p.user_id = u.user_id
WHERE p.estado_publicacion = 'activo'
ORDER BY p.total_likes DESC, p.visualizaciones DESC
LIMIT 10;

-- PASO 7: Prueba manual del trigger (simular like)
SELECT '=== INSTRUCCIONES PARA PRUEBA MANUAL ===' as info;

SELECT '
Para probar el trigger manualmente:

1. INSERTAR un like:
   INSERT INTO public.favorito (usuario_id, producto_id) 
   VALUES (1, 1);

2. VERIFICAR que el contador se incrementó:
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = 1;

3. ELIMINAR el like:
   DELETE FROM public.favorito 
   WHERE usuario_id = 1 AND producto_id = 1;

4. VERIFICAR que el contador se decrementó:
   SELECT producto_id, titulo, total_likes 
   FROM public.producto 
   WHERE producto_id = 1;
' as instrucciones_prueba;
