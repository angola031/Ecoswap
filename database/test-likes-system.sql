-- Script de prueba para verificar el sistema de likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- PASO 1: Verificar que el sistema está instalado correctamente
SELECT 
    'Verificación de instalación' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'producto' 
            AND column_name = 'total_likes' 
            AND table_schema = 'public'
        ) THEN '✅ Campo total_likes existe'
        ELSE '❌ Campo total_likes NO existe'
    END as campo_total_likes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE event_object_table = 'favorito' 
            AND trigger_name LIKE '%likes%'
        ) THEN '✅ Triggers de likes existen'
        ELSE '❌ Triggers de likes NO existen'
    END as triggers_likes,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'update_product_likes_count' 
            AND routine_schema = 'public'
        ) THEN '✅ Función update_product_likes_count existe'
        ELSE '❌ Función update_product_likes_count NO existe'
    END as funcion_likes;

-- PASO 2: Mostrar triggers existentes en la tabla favorito
SELECT 
    'Triggers en tabla favorito' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'favorito' 
    AND event_object_schema = 'public'
ORDER BY trigger_name;

-- PASO 3: Verificar estado actual de sincronización
SELECT 
    'Estado de sincronización' as reporte,
    COUNT(*) as total_productos,
    SUM(total_likes) as total_likes_sistema,
    COUNT(*) FILTER (WHERE total_likes > 0) as productos_con_likes,
    MAX(total_likes) as max_likes_producto
FROM public.producto;

-- PASO 4: Verificar productos desincronizados (si los hay)
WITH productos_desincronizados AS (
    SELECT 
        p.producto_id,
        p.titulo,
        p.total_likes as contador_sistema,
        COUNT(f.favorito_id) as favoritos_reales,
        (p.total_likes - COUNT(f.favorito_id)) as diferencia
    FROM public.producto p
    LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
    GROUP BY p.producto_id, p.titulo, p.total_likes
    HAVING p.total_likes != COUNT(f.favorito_id)
)
SELECT 
    'Productos desincronizados' as tipo,
    COUNT(*) as cantidad,
    SUM(ABS(diferencia)) as total_desincronizacion
FROM productos_desincronizados;

-- PASO 5: Mostrar algunos productos para verificar
SELECT 
    'Productos de muestra' as muestra,
    p.producto_id,
    p.titulo,
    p.total_likes as contador_sistema,
    COUNT(f.favorito_id) as favoritos_reales,
    CASE 
        WHEN p.total_likes = COUNT(f.favorito_id) THEN '✅ Sincronizado'
        ELSE '❌ Desincronizado'
    END as estado
FROM public.producto p
LEFT JOIN public.favorito f ON p.producto_id = f.producto_id
GROUP BY p.producto_id, p.titulo, p.total_likes
ORDER BY p.total_likes DESC
LIMIT 10;

-- PASO 6: Mostrar favoritos existentes
SELECT 
    'Favoritos existentes' as info,
    COUNT(*) as total_favoritos,
    COUNT(DISTINCT usuario_id) as usuarios_unicos,
    COUNT(DISTINCT producto_id) as productos_favoritos
FROM public.favorito;

-- PASO 7: Estadísticas de favoritos por producto
SELECT 
    'Top productos con más favoritos' as ranking,
    f.producto_id,
    p.titulo,
    COUNT(f.favorito_id) as favoritos_reales,
    p.total_likes as contador_sistema
FROM public.favorito f
JOIN public.producto p ON f.producto_id = p.producto_id
GROUP BY f.producto_id, p.titulo, p.total_likes
ORDER BY COUNT(f.favorito_id) DESC
LIMIT 10;

-- PASO 8: Prueba de inserción de favorito (simulación)
-- NOTA: Esto solo simula, no inserta realmente
SELECT 
    'Simulación de inserción' as test,
    'Para probar: INSERT INTO public.favorito (usuario_id, producto_id) VALUES (1, 1);' as instruccion,
    'Luego verificar que el contador se actualiza automáticamente' as resultado_esperado;

-- PASO 9: Prueba de eliminación de favorito (simulación)
SELECT 
    'Simulación de eliminación' as test,
    'Para probar: DELETE FROM public.favorito WHERE usuario_id = 1 AND producto_id = 1;' as instruccion,
    'Luego verificar que el contador se actualiza automáticamente' as resultado_esperado;

-- PASO 10: Verificar políticas RLS en tabla favorito
SELECT 
    'Políticas RLS en favorito' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'favorito' 
    AND schemaname = 'public'
ORDER BY policyname;
