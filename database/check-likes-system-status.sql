-- Script para verificar el estado del sistema de likes
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

-- 2. Verificar triggers
SELECT 
    'Verificación de triggers' as check_type,
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name IS NOT NULL THEN '✅ Trigger activo'
        ELSE '❌ Trigger no encontrado'
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'favorito' 
    AND event_object_schema = 'public'
    AND trigger_name LIKE '%likes%';

-- 3. Verificar función de actualización
SELECT 
    'Verificación de función' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_product_likes_count' 
            AND routine_schema = 'public'
        ) THEN '✅ Función existe'
        ELSE '❌ Función NO existe'
    END as status;

-- 4. Mostrar algunos productos con sus likes actuales
SELECT 
    'Productos con likes' as info,
    producto_id,
    titulo,
    total_likes,
    fecha_actualizacion
FROM public.producto 
WHERE total_likes IS NOT NULL
ORDER BY total_likes DESC
LIMIT 10;

-- 5. Contar favoritos reales vs contadores
SELECT 
    'Verificación de sincronización' as check_type,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes,
    MAX(total_likes) as max_likes
FROM public.producto 
WHERE total_likes IS NOT NULL;

-- 6. Mostrar favoritos existentes
SELECT 
    'Favoritos en la base de datos' as info,
    COUNT(*) as total_favoritos,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_favoritos
FROM public.favorito;
