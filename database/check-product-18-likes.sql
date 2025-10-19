-- Verificar específicamente el producto 18 y su sistema de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Verificar si el campo total_likes existe
SELECT 
    'Verificación del campo total_likes' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'producto' 
            AND column_name = 'total_likes' 
            AND table_schema = 'public'
        ) THEN '✅ Campo total_likes existe'
        ELSE '❌ Campo total_likes NO existe'
    END as status;

-- 2. Verificar el producto 18 específicamente
SELECT 
    'Producto 18 - Estado actual' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion,
    estado_publicacion,
    estado_validacion
FROM public.producto 
WHERE producto_id = 18;

-- 3. Verificar si hay favoritos para el producto 18
SELECT 
    'Favoritos para producto 18' as info,
    COUNT(*) as total_favoritos,
    usuario_id,
    fecha_agregado
FROM public.favorito 
WHERE producto_id = 18
GROUP BY usuario_id, fecha_agregado;

-- 4. Verificar triggers en la tabla favorito
SELECT 
    'Triggers en tabla favorito' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'favorito' 
    AND event_object_schema = 'public';

-- 5. Verificar función de actualización
SELECT 
    'Función de actualización' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_product_likes_count' 
            AND routine_schema = 'public'
        ) THEN '✅ Función existe'
        ELSE '❌ Función NO existe'
    END as status;

-- 6. Estadísticas generales del sistema
SELECT 
    'Estadísticas generales' as info,
    COUNT(*) as total_productos,
    COUNT(*) FILTER (WHERE total_likes IS NOT NULL) as productos_con_campo,
    SUM(total_likes) as total_likes_sistema,
    (SELECT COUNT(*) FROM public.favorito) as total_favoritos_reales
FROM public.producto;
